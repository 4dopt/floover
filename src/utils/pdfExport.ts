import jsPDF from 'jspdf';
import { FloorPlan, FloorElement } from '../types';
import { getEffectiveCovers } from './chairLayout';

export interface ExportPdfOptions {
  includeManifest?: boolean;
  includeStats?: boolean;
  paperSize?: 'a4' | 'letter';
  orientation?: 'landscape' | 'portrait';
}

/**
 * Renders the floor plan SVG directly onto an HTML Canvas at high DPI.
 * This completely avoids html2canvas and bypasses modern CSS "oklab" color parsing errors.
 */
export async function renderFloorPlanToCanvas(
  containerOrSvg: HTMLElement | SVGSVGElement | null,
  floorPlan: FloorPlan,
  scale: number = 2
): Promise<HTMLCanvasElement> {
  let svgElement: SVGSVGElement | null = null;

  if (containerOrSvg instanceof SVGSVGElement) {
    svgElement = containerOrSvg;
  } else if (containerOrSvg) {
    svgElement = containerOrSvg.querySelector('svg#floor-plan-svg') || containerOrSvg.querySelector('svg');
  }

  if (!svgElement) {
    const el = document.getElementById('floor-plan-svg');
    if (el instanceof SVGSVGElement) {
      svgElement = el;
    }
  }

  if (!svgElement) {
    throw new Error('Floor plan canvas element not found. Please ensure the floor plan editor is visible.');
  }

  // Clone SVG so we don't modify the live interactive DOM
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // 1. Remove collaborator cursors
  const cursors = clone.querySelectorAll('[class*="collab-cursor"], [class*="z-50"]');
  cursors.forEach((c) => c.remove());

  // 2. Remove selection outlines, rotation handles, and bounding boxes
  const dashedElements = clone.querySelectorAll('[stroke-dasharray]');
  dashedElements.forEach((el) => {
    const parent = el.parentElement;
    if (parent && parent.tagName.toLowerCase() === 'g') {
      parent.remove();
    } else {
      el.remove();
    }
  });

  const rotateKnobs = clone.querySelectorAll('circle[r="6"]');
  rotateKnobs.forEach((k) => k.remove());

  // 3. Set exact room pixel dimensions
  const scaleRatio = 20;
  const roomWidthPx = floorPlan.roomWidth * scaleRatio;
  const roomHeightPx = floorPlan.roomHeight * scaleRatio;

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `0 0 ${roomWidthPx} ${roomHeightPx}`);
  clone.setAttribute('width', `${roomWidthPx}`);
  clone.setAttribute('height', `${roomHeightPx}`);
  clone.style.backgroundColor = '#ffffff';

  // 4. Ensure white background rect is present at base
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('x', '0');
  bgRect.setAttribute('y', '0');
  bgRect.setAttribute('width', `${roomWidthPx}`);
  bgRect.setAttribute('height', `${roomHeightPx}`);
  bgRect.setAttribute('fill', '#ffffff');
  clone.insertBefore(bgRect, clone.firstChild);

  // 5. Serialize clean SVG
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);

  // Ensure xmlns is present
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Use UTF-8 Data URI - works reliably without origin taint or external stylesheet parsing
  const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(roomWidthPx * scale);
      canvas.height = Math.round(roomHeightPx * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to obtain canvas 2D context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Pure white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };

    img.onerror = (err) => {
      console.error('Error rasterizing floor plan SVG:', err);
      reject(new Error('Could not render floor plan vector into image format.'));
    };

    img.src = dataUrl;
  });
}

export async function exportFloorPlanToPdf(
  containerElement: HTMLElement | SVGSVGElement | null,
  floorPlan: FloorPlan,
  options: ExportPdfOptions = {}
): Promise<void> {
  const {
    includeManifest = true,
    includeStats = true,
    orientation = 'landscape'
  } = options;

  // Render clean high-res canvas (2x DPI) directly from SVG without html2canvas
  const canvas = await renderFloorPlanToCanvas(containerElement, floorPlan, 2);
  const imgData = canvas.toDataURL('image/png');

  // Create jsPDF instance
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, 22, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text(floorPlan.name.toUpperCase(), margin, 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(203, 213, 225); // slate-300
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  pdf.text(
    `Venue: ${floorPlan.venueType.toUpperCase()} | Room: ${floorPlan.roomWidth}x${floorPlan.roomHeight} ${floorPlan.unit} | Date: ${dateStr}`,
    margin,
    18
  );

  // Calculate statistics using effective covers (accounting for removed corner/edge chairs)
  const tableElements = floorPlan.elements.filter((e) => e.type === 'table');
  const totalCovers = tableElements.reduce((sum, e) => sum + getEffectiveCovers(e.covers, e.removedChairs), 0);
  const reservedCovers = tableElements
    .filter((e) => e.status === 'reserved' || e.status === 'occupied')
    .reduce((sum, e) => sum + getEffectiveCovers(e.covers, e.removedChairs), 0);
  const availableCovers = tableElements
    .filter((e) => e.status === 'available')
    .reduce((sum, e) => sum + getEffectiveCovers(e.covers, e.removedChairs), 0);
  const vipCovers = tableElements
    .filter((e) => e.status === 'vip')
    .reduce((sum, e) => sum + getEffectiveCovers(e.covers, e.removedChairs), 0);

  let currentY = 28;

  // Stats badge bar
  if (includeStats) {
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'FD');

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);

    const statColWidth = (pageWidth - margin * 2) / 5;
    pdf.text(`TOTAL TABLES: ${tableElements.length}`, margin + 6, currentY + 9);
    pdf.text(`TOTAL COVERS: ${totalCovers}`, margin + statColWidth + 6, currentY + 9);

    pdf.setTextColor(16, 185, 129); // emerald
    pdf.text(`AVAILABLE: ${availableCovers}`, margin + statColWidth * 2 + 6, currentY + 9);

    pdf.setTextColor(217, 119, 6); // amber
    pdf.text(`RESERVED: ${reservedCovers}`, margin + statColWidth * 3 + 6, currentY + 9);

    pdf.setTextColor(147, 51, 234); // purple
    pdf.text(`VIP: ${vipCovers}`, margin + statColWidth * 4 + 6, currentY + 9);

    currentY += 18;
  }

  // Draw Floor Plan Image
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - currentY - (includeManifest ? 14 : 10);

  // Maintain aspect ratio of the captured canvas
  const canvasRatio = canvas.width / canvas.height;
  let imgWidth = availableWidth;
  let imgHeight = availableWidth / canvasRatio;

  if (imgHeight > availableHeight) {
    imgHeight = availableHeight;
    imgWidth = imgHeight * canvasRatio;
  }

  const imgX = margin + (availableWidth - imgWidth) / 2;
  pdf.addImage(imgData, 'PNG', imgX, currentY, imgWidth, imgHeight);

  // Footer on Page 1
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Generated with Floover • AI Studio', margin, pageHeight - 6);
  pdf.text(`Page 1 of ${includeManifest ? '2' : '1'}`, pageWidth - margin - 20, pageHeight - 6);

  // Page 2: Table Manifest & Seating Schedule
  if (includeManifest && tableElements.length > 0) {
    pdf.addPage('a4', orientation);

    // Header
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 18, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${floorPlan.name.toUpperCase()} — SEATING MANIFEST & TABLE SCHEDULE`, margin, 12);

    let tableY = 28;

    // Table Header
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, tableY, pageWidth - margin * 2, 8, 'F');
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, tableY + 8, pageWidth - margin, tableY + 8);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 65, 85);

    const cols = [
      { name: 'TABLE', x: margin + 4, width: 35 },
      { name: 'SHAPE', x: margin + 40, width: 30 },
      { name: 'COVERS', x: margin + 70, width: 25 },
      { name: 'STATUS', x: margin + 95, width: 35 },
      { name: 'GUEST / PARTY NAME', x: margin + 130, width: 65 },
      { name: 'SPECIAL NOTES', x: margin + 195, width: 75 }
    ];

    cols.forEach((col) => {
      pdf.text(col.name, col.x, tableY + 5.5);
    });

    tableY += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    tableElements.forEach((tbl, idx) => {
      if (tableY > pageHeight - 16) {
        pdf.addPage('a4', orientation);
        tableY = 20;
      }

      // Alternating row colors
      if (idx % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, tableY - 1.5, pageWidth - margin * 2, 7, 'F');
      }

      pdf.setTextColor(15, 23, 42);
      pdf.text(tbl.name, cols[0].x, tableY + 3.5);
      pdf.text(tbl.shape.toUpperCase(), cols[1].x, tableY + 3.5);
      const effectiveSeats = getEffectiveCovers(tbl.covers, tbl.removedChairs);
      const seatsText = effectiveSeats !== tbl.covers ? `${effectiveSeats} (${tbl.covers}) seats` : `${tbl.covers} seats`;
      pdf.text(seatsText, cols[2].x, tableY + 3.5);

      // Status color tag
      if (tbl.status === 'vip') {
        pdf.setTextColor(147, 51, 234);
      } else if (tbl.status === 'reserved' || tbl.status === 'occupied') {
        pdf.setTextColor(217, 119, 6);
      } else {
        pdf.setTextColor(16, 185, 129);
      }
      pdf.text(tbl.status.toUpperCase(), cols[3].x, tableY + 3.5);

      pdf.setTextColor(51, 65, 85);
      pdf.text(tbl.guestName || '—', cols[4].x, tableY + 3.5);
      pdf.text(tbl.notes || '—', cols[5].x, tableY + 3.5);

      tableY += 7;
    });

    // Manifest Footer
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Generated with Floover • AI Studio', margin, pageHeight - 6);
    pdf.text('Page 2 of 2', pageWidth - margin - 20, pageHeight - 6);
  }

  // Save the PDF
  const filename = `${floorPlan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-floorplan.pdf`;
  pdf.save(filename);
}

export async function exportFloorPlanToPng(
  containerElement: HTMLElement | SVGSVGElement | null,
  filename: string,
  floorPlan?: FloorPlan
): Promise<void> {
  // If floorPlan is not provided, build a minimal dimension object
  const plan = floorPlan || ({
    roomWidth: 45,
    roomHeight: 35
  } as FloorPlan);

  const canvas = await renderFloorPlanToCanvas(containerElement, plan, 2);
  const link = document.createElement('a');
  link.download = `${filename.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
