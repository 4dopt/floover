import jsPDF from 'jspdf';
import { FloorPlan, FloorElement } from '../types';
import { getEffectiveCovers } from './chairLayout';

export interface ExportPdfOptions {
  includeManifest?: boolean;
  includeStats?: boolean;
  paperSize?: 'a4' | 'letter';
  orientation?: 'landscape' | 'portrait';
  dpiQuality?: 'standard' | 'high' | 'ultra'; // standard: 2x (150 DPI), high: 3.5x (300 DPI), ultra: 5x (450 DPI)
  includeTitleBlock?: boolean;
  includeCompass?: boolean;
  includeLegend?: boolean;
}

/**
 * Renders the floor plan SVG directly onto an HTML Canvas at ultra-high DPI.
 * Bypasses html2canvas completely to avoid CSS oklab errors, and renders native vector
 * geometry at 300-500 DPI for crystal-clear HD printing and retina displays.
 */
export async function renderFloorPlanToCanvas(
  containerOrSvg: HTMLElement | SVGSVGElement | null,
  floorPlan: FloorPlan,
  scale: number = 3.5
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

  // Clone SVG so we don't mutate the live interactive DOM
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // 1. Remove collaborator cursors and live presence overlays
  const cursors = clone.querySelectorAll('[class*="collab-cursor"], [class*="z-50"]');
  cursors.forEach((c) => c.remove());

  // 2. Remove interactive selection outlines, rotation stems, and knobs
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

  // 3. Remove resize controls and guidelines
  const resizeControls = clone.querySelector('#floor-canvas-resize-controls');
  if (resizeControls) resizeControls.remove();

  // 4. Calculate exact pixel dimensions and target high-DPI raster resolution
  const scaleRatio = 20;
  const roomWidthPx = floorPlan.roomWidth * scaleRatio;
  const roomHeightPx = floorPlan.roomHeight * scaleRatio;
  const targetWidth = Math.max(1200, Math.round(roomWidthPx * scale));
  const targetHeight = Math.max(900, Math.round(roomHeightPx * scale));

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `0 0 ${roomWidthPx} ${roomHeightPx}`);
  // Setting width/height to targetWidth/targetHeight forces the browser's vector rasterizer
  // to render natively at 300+ DPI rather than upscaling an 800px image!
  clone.setAttribute('width', `${targetWidth}`);
  clone.setAttribute('height', `${targetHeight}`);
  clone.style.backgroundColor = '#ffffff';

  // 5. Ensure defs exists and embed typography styles for razor-sharp text rendering
  let defs = clone.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    clone.insertBefore(defs, clone.firstChild);
  }

  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = `
    text {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      text-rendering: geometricPrecision;
      -webkit-font-smoothing: antialiased;
      shape-rendering: geometricPrecision;
    }
  `;
  defs.appendChild(styleEl);

  // 6. Ensure solid pure-white background rect at base
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('x', '0');
  bgRect.setAttribute('y', '0');
  bgRect.setAttribute('width', `${roomWidthPx}`);
  bgRect.setAttribute('height', `${roomHeightPx}`);
  bgRect.setAttribute('fill', '#ffffff');
  clone.insertBefore(bgRect, clone.firstChild);

  // 7. Serialize clean SVG to Blob URL
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);

  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(blobUrl);
        reject(new Error('Failed to obtain canvas 2D context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Pure white base
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Draw SVG at high DPI
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      URL.revokeObjectURL(blobUrl);
      resolve(canvas);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(blobUrl);
      console.error('Error rasterizing floor plan SVG:', err);
      reject(new Error('Could not render floor plan vector into image format.'));
    };

    img.src = blobUrl;
  });
}

/**
 * Generates an executive, high-definition architectural PDF floor plan and seating manifest.
 */
export async function exportFloorPlanToPdf(
  containerElement: HTMLElement | SVGSVGElement | null,
  floorPlan: FloorPlan,
  options: ExportPdfOptions = {}
): Promise<void> {
  const {
    includeManifest = true,
    includeStats = true,
    paperSize = 'a4',
    orientation = 'landscape',
    dpiQuality = 'high',
    includeTitleBlock = true,
    includeCompass = true,
    includeLegend = true
  } = options;

  // DPI Multiplier: Standard = 2x (~150 DPI), High = 3.5x (~300 DPI), Ultra = 5x (~450 DPI)
  const scale = dpiQuality === 'ultra' ? 5.0 : dpiQuality === 'high' ? 3.5 : 2.0;

  // Render high-res canvas directly from SVG
  const canvas = await renderFloorPlanToCanvas(containerElement, floorPlan, scale);
  const imgData = canvas.toDataURL('image/png');

  // Paper dimensions in mm
  const format = paperSize === 'letter' ? 'letter' : 'a4';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;

  // ----------------------------------------------------
  // PAGE 1: ARCHITECTURAL FLOOR PLAN & BLUEPRINT
  // ----------------------------------------------------

  // 1. Double Architectural Border (CAD Blueprint style)
  pdf.setDrawColor(15, 23, 42); // slate-900
  pdf.setLineWidth(0.6);
  pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  pdf.setDrawColor(203, 213, 225); // slate-300
  pdf.setLineWidth(0.2);
  pdf.rect(margin + 1.2, margin + 1.2, pageWidth - (margin + 1.2) * 2, pageHeight - (margin + 1.2) * 2);

  // Corner CAD Crosshairs
  const crosshairLen = 2.5;
  const drawCornerCrosshair = (cx: number, cy: number) => {
    pdf.setDrawColor(100, 116, 139);
    pdf.setLineWidth(0.25);
    pdf.line(cx - crosshairLen, cy, cx + crosshairLen, cy);
    pdf.line(cx, cy - crosshairLen, cx, cy + crosshairLen);
  };
  drawCornerCrosshair(margin + 1.2, margin + 1.2);
  drawCornerCrosshair(pageWidth - margin - 1.2, margin + 1.2);
  drawCornerCrosshair(margin + 1.2, pageHeight - margin - 1.2);
  drawCornerCrosshair(pageWidth - margin - 1.2, pageHeight - margin - 1.2);

  // 2. Executive Header Banner
  const headerHeight = 17;
  const headerY = margin + 1.2;
  const headerWidth = pageWidth - (margin + 1.2) * 2;
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(margin + 1.2, headerY, headerWidth, headerHeight, 'F');

  // Vector Brand Badge
  pdf.setFillColor(30, 41, 59); // slate-800
  pdf.setDrawColor(79, 70, 229); // indigo-600
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin + 4, headerY + 2.5, 12, 12, 1.5, 1.5, 'FD');

  // Mini Floordone diamond logo in vector
  pdf.setFillColor(129, 140, 248); // indigo-400
  pdf.triangle(margin + 10, headerY + 4, margin + 6.5, headerY + 8.5, margin + 13.5, headerY + 8.5, 'F');
  pdf.setFillColor(251, 191, 36); // amber-400
  pdf.circle(margin + 10, headerY + 8.5, 1.3, 'F');

  // Header Typography
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(245, 158, 11); // amber-500
  pdf.text('FLOORDONE ARCHITECTURAL SYSTEM • SHEET A-101', margin + 19, headerY + 5.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  const truncatedPlanName = floorPlan.name.length > 45 ? `${floorPlan.name.slice(0, 42)}...` : floorPlan.name;
  pdf.text(truncatedPlanName.toUpperCase(), margin + 19, headerY + 10.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(203, 213, 225); // slate-300
  const roomArea = floorPlan.roomWidth * floorPlan.roomHeight;
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  pdf.text(
    `VENUE: ${floorPlan.venueType.toUpperCase()}  |  DIMENSIONS: ${floorPlan.roomWidth} × ${floorPlan.roomHeight} ${floorPlan.unit.toUpperCase()} (${roomArea.toLocaleString()} SQ ${floorPlan.unit.toUpperCase()})  |  SCALE: 1:20`,
    margin + 19,
    headerY + 14.5
  );

  // Right Header Status Pill
  const pillW = 42;
  const pillH = 6;
  const pillX = pageWidth - margin - 1.2 - pillW - 3;
  const pillY = headerY + 4;
  pdf.setFillColor(6, 78, 59); // emerald-900
  pdf.setDrawColor(5, 150, 105); // emerald-600
  pdf.setLineWidth(0.2);
  pdf.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(52, 211, 153); // emerald-400
  pdf.text('● APPROVED FOR SERVICE', pillX + 3.5, pillY + 4.2);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text(`${formattedDate} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, pillX, pillY + 10.5);

  // Calculate Seating Stats
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

  let currentY = headerY + headerHeight + 2.5;

  // 3. Stats & Capacity Summary Cards Bar
  if (includeStats) {
    const statsBarHeight = 11;
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin + 2, currentY, pageWidth - (margin + 2) * 2, statsBarHeight, 1.5, 1.5, 'FD');

    const statColCount = 5;
    const statColW = (pageWidth - (margin + 2) * 2) / statColCount;

    const statsData = [
      { label: 'TOTAL TABLES', val: `${tableElements.length}`, color: [15, 23, 42] },
      { label: 'CAPACITY COVERS', val: `${totalCovers} seats`, color: [79, 70, 229] },
      { label: 'AVAILABLE', val: `${availableCovers} seats`, color: [16, 185, 129] },
      { label: 'RESERVED / OCCUPIED', val: `${reservedCovers} seats`, color: [217, 119, 6] },
      { label: 'VIP DINING', val: `${vipCovers} seats`, color: [147, 51, 234] }
    ];

    statsData.forEach((stat, i) => {
      const colX = margin + 2 + i * statColW;
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text(stat.label, colX + 4, currentY + 4.2);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
      pdf.text(stat.val, colX + 4, currentY + 8.8);

      if (i < statColCount - 1) {
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.2);
        pdf.line(colX + statColW, currentY + 2, colX + statColW, currentY + statsBarHeight - 2);
      }
    });

    currentY += statsBarHeight + 2.5;
  }

  // 4. Floor Plan Viewport Area
  const bottomMarginSpace = 20; // Room for Title block & Legend
  const availableCanvasW = pageWidth - (margin + 3) * 2;
  const availableCanvasH = pageHeight - currentY - bottomMarginSpace;

  const canvasRatio = canvas.width / canvas.height;
  let imgWidth = availableCanvasW;
  let imgHeight = availableCanvasW / canvasRatio;

  if (imgHeight > availableCanvasH) {
    imgHeight = availableCanvasH;
    imgWidth = imgHeight * canvasRatio;
  }

  const imgX = margin + 3 + (availableCanvasW - imgWidth) / 2;
  const imgY = currentY + (availableCanvasH - imgHeight) / 2;

  // Subtle border around floor plan canvas
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.rect(imgX - 0.5, imgY - 0.5, imgWidth + 1, imgHeight + 1);

  // Embed the high-resolution raster image (300-500 DPI)
  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight, undefined, 'FAST');

  // Compass Rose (North Arrow) in bottom-left of plan
  if (includeCompass) {
    const compassX = imgX + 7;
    const compassY = imgY + 7;

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.2);
    pdf.circle(compassX, compassY, 4, 'FD');

    // North Pointer
    pdf.setFillColor(15, 23, 42);
    pdf.triangle(compassX, compassY - 3.2, compassX - 1.2, compassY + 1, compassX, compassY, 'F');
    pdf.setFillColor(203, 213, 225);
    pdf.triangle(compassX, compassY - 3.2, compassX + 1.2, compassY + 1, compassX, compassY, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('N', compassX - 0.9, compassY - 4.2);
  }

  // 5. Architectural Title Block & Stamp (Bottom Right)
  const titleBlockW = 75;
  const titleBlockH = 14;
  const titleBlockX = pageWidth - margin - 2 - titleBlockW;
  const titleBlockY = pageHeight - margin - 2 - titleBlockH;

  if (includeTitleBlock) {
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.3);
    pdf.rect(titleBlockX, titleBlockY, titleBlockW, titleBlockH, 'FD');

    // Internal dividers
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.2);
    pdf.line(titleBlockX, titleBlockY + 7, titleBlockX + titleBlockW, titleBlockY + 7);
    pdf.line(titleBlockX + 38, titleBlockY, titleBlockX + 38, titleBlockY + titleBlockH);

    // Cell 1: Project
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('PROJECT NAME', titleBlockX + 2, titleBlockY + 2.8);
    pdf.setFontSize(6.5);
    pdf.setTextColor(15, 23, 42);
    const shortName = floorPlan.name.length > 20 ? `${floorPlan.name.slice(0, 18)}...` : floorPlan.name;
    pdf.text(shortName.toUpperCase(), titleBlockX + 2, titleBlockY + 5.6);

    // Cell 2: Drawing No / Rev
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('DRAWING / SHEET', titleBlockX + 40, titleBlockY + 2.8);
    pdf.setFontSize(6.5);
    pdf.setTextColor(79, 70, 229);
    pdf.text(`FL-101 • REV 1.4`, titleBlockX + 40, titleBlockY + 5.6);

    // Cell 3: Scale & Res
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('SCALE / QUALITY', titleBlockX + 2, titleBlockY + 9.8);
    pdf.setFontSize(6);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`1:20 • ${dpiQuality.toUpperCase()} HD (300+ DPI)`, titleBlockX + 2, titleBlockY + 12.6);

    // Cell 4: Authorization
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('AUTHORIZED SIGNATURE', titleBlockX + 40, titleBlockY + 9.8);
    pdf.setFontSize(6);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`MAÎTRE D' / GM SIGN-OFF`, titleBlockX + 40, titleBlockY + 12.6);
  }

  // 6. Architectural Legend (Bottom Left)
  if (includeLegend) {
    const legendX = margin + 3;
    const legendY = pageHeight - margin - 15;

    pdf.setFontSize(5.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('ARCHITECTURAL LEGEND & STATUS KEY:', legendX, legendY);

    const legendItems = [
      { label: 'Available Table', color: [16, 185, 129] },
      { label: 'Reserved / Occupied', color: [217, 119, 6] },
      { label: 'VIP Table', color: [147, 51, 234] },
      { label: 'Drywall / Glass Partition', color: [30, 41, 59] },
      { label: 'Patio Deck / Terrace', color: [180, 83, 9] },
      { label: 'Botanical Plant', color: [22, 163, 74] }
    ];

    let legOffset = 0;
    legendItems.forEach((item) => {
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.circle(legendX + legOffset + 1.2, legendY + 4, 1.2, 'F');
      pdf.setFontSize(5.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 65, 85);
      pdf.text(item.label, legendX + legOffset + 3.5, legendY + 4.5);
      legOffset += pdf.getTextWidth(item.label) + 6.5;
    });
  }

  // Page 1 Footer stamp
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text('CONFIDENTIAL & PROPRIETARY • GENERATED WITH FLOORDONE STUDIO • ULTRA-HD 300+ DPI PRINT', margin + 3, pageHeight - margin - 2);
  pdf.text(`SHEET 1 OF ${includeManifest ? '2' : '1'}`, titleBlockX - 18, pageHeight - margin - 2);

  // ----------------------------------------------------
  // PAGE 2: SEATING MANIFEST & MAÎTRE D' SCHEDULE
  // ----------------------------------------------------
  if (includeManifest && tableElements.length > 0) {
    pdf.addPage(format, orientation);

    // Architectural Double Border
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.6);
    pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.2);
    pdf.rect(margin + 1.2, margin + 1.2, pageWidth - (margin + 1.2) * 2, pageHeight - (margin + 1.2) * 2);

    drawCornerCrosshair(margin + 1.2, margin + 1.2);
    drawCornerCrosshair(pageWidth - margin - 1.2, margin + 1.2);
    drawCornerCrosshair(margin + 1.2, pageHeight - margin - 1.2);
    drawCornerCrosshair(pageWidth - margin - 1.2, pageHeight - margin - 1.2);

    // Page 2 Header Banner
    const p2HeaderY = margin + 1.2;
    pdf.setFillColor(15, 23, 42);
    pdf.rect(margin + 1.2, p2HeaderY, headerWidth, 16, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(245, 158, 11);
    pdf.text('FLOORDONE ARCHITECTURAL SYSTEM • SHEET A-102', margin + 4, p2HeaderY + 5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${floorPlan.name.toUpperCase()} — SEATING MANIFEST & RUN SHEET`, margin + 4, p2HeaderY + 10.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(203, 213, 225);
    pdf.text(
      `SERVICE RUN SHEET FOR MAÎTRE D', HOST STAND & KITCHEN CAPTAIN  |  TOTAL COVERS: ${totalCovers}  |  DATE: ${formattedDate}`,
      margin + 4,
      p2HeaderY + 14
    );

    let tableY = p2HeaderY + 20;

    // Table Columns configuration
    const tableLeft = margin + 3;
    const tableRight = pageWidth - margin - 3;
    const tableTotalW = tableRight - tableLeft;

    const cols = [
      { name: 'TABLE #', x: tableLeft + 2, width: 32 },
      { name: 'SHAPE & SPECS', x: tableLeft + 35, width: 32 },
      { name: 'SEATS', x: tableLeft + 68, width: 26 },
      { name: 'SERVICE STATUS', x: tableLeft + 95, width: 34 },
      { name: 'GUEST / PARTY NAME', x: tableLeft + 130, width: 68 },
      { name: 'SPECIAL NOTES / DIETARY / ALLOCATIONS', x: tableLeft + 199, width: tableTotalW - 199 }
    ];

    // Table Header Row
    pdf.setFillColor(30, 41, 59); // slate-800
    pdf.rect(tableLeft, tableY, tableTotalW, 7, 'F');

    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(248, 250, 252);

    cols.forEach((col) => {
      pdf.text(col.name, col.x, tableY + 4.8);
    });

    tableY += 7;

    // Table Rows
    const rowHeight = 6.2;
    tableElements.forEach((tbl, idx) => {
      // Check for bottom margin overflow
      if (tableY > pageHeight - margin - 22) {
        pdf.addPage(format, orientation);
        // Add borders to extra page
        pdf.setDrawColor(15, 23, 42);
        pdf.setLineWidth(0.6);
        pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
        tableY = margin + 10;

        // Repeat table header
        pdf.setFillColor(30, 41, 59);
        pdf.rect(tableLeft, tableY, tableTotalW, 7, 'F');
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(248, 250, 252);
        cols.forEach((col) => {
          pdf.text(col.name, col.x, tableY + 4.8);
        });
        tableY += 7;
      }

      // Alternating row background
      if (idx % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(tableLeft, tableY, tableTotalW, rowHeight, 'F');
      }

      // Row bottom divider
      pdf.setDrawColor(241, 245, 249);
      pdf.setLineWidth(0.2);
      pdf.line(tableLeft, tableY + rowHeight, tableRight, tableY + rowHeight);

      // 1. Table Name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(15, 23, 42);
      pdf.text(tbl.name, cols[0].x, tableY + 4.2);

      // 2. Shape
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(tbl.shape.toUpperCase(), cols[1].x, tableY + 4.2);

      // 3. Seats (Effective / Original)
      const effectiveSeats = getEffectiveCovers(tbl.covers, tbl.removedChairs);
      const seatsText = effectiveSeats !== tbl.covers ? `${effectiveSeats} (${tbl.covers}) seats` : `${tbl.covers} seats`;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(15, 23, 42);
      pdf.text(seatsText, cols[2].x, tableY + 4.2);

      // 4. Status Pill
      let pillBg: [number, number, number] = [236, 253, 245]; // green
      let pillFg: [number, number, number] = [5, 150, 105];
      if (tbl.status === 'vip') {
        pillBg = [250, 245, 255];
        pillFg = [126, 34, 206];
      } else if (tbl.status === 'reserved' || tbl.status === 'occupied') {
        pillBg = [254, 243, 199];
        pillFg = [180, 83, 9];
      } else if (tbl.status === 'blocked') {
        pillBg = [241, 245, 249];
        pillFg = [100, 116, 139];
      }

      pdf.setFillColor(pillBg[0], pillBg[1], pillBg[2]);
      pdf.roundedRect(cols[3].x, tableY + 1.2, 28, 4.2, 1, 1, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.5);
      pdf.setTextColor(pillFg[0], pillFg[1], pillFg[2]);
      pdf.text(tbl.status.toUpperCase(), cols[3].x + 2, tableY + 3.9);

      // 5. Guest / Party Name
      pdf.setFont('helvetica', tbl.guestName ? 'bold' : 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(tbl.guestName ? 15 : 148, tbl.guestName ? 23 : 163, tbl.guestName ? 42 : 184);
      pdf.text(tbl.guestName || '—', cols[4].x, tableY + 4.2);

      // 6. Notes
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      const noteStr = tbl.notes ? (tbl.notes.length > 50 ? `${tbl.notes.slice(0, 48)}...` : tbl.notes) : '—';
      pdf.text(noteStr, cols[5].x, tableY + 4.2);

      tableY += rowHeight;
    });

    // Sign-Off Block at Bottom of Manifest
    const signOffY = pageHeight - margin - 15;
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.line(tableLeft, signOffY, tableRight, signOffY);

    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text("MAÎTRE D' SIGNATURE: ____________________________", tableLeft + 2, signOffY + 5);
    pdf.text("GENERAL MANAGER: ____________________________", tableLeft + 90, signOffY + 5);
    pdf.text("SERVICE BRIEFING COMPLETED:  [  ] YES    [  ] NO", tableLeft + 180, signOffY + 5);

    // Page 2 Footer
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text('CONFIDENTIAL & PROPRIETARY • GENERATED WITH FLOORDONE STUDIO • ULTRA-HD 300+ DPI PRINT', margin + 3, pageHeight - margin - 2);
    pdf.text('SHEET 2 OF 2', pageWidth - margin - 25, pageHeight - margin - 2);
  }

  // Save the PDF with a clean sanitized filename
  const sanitizedFilename = `${floorPlan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-floorplan.pdf`;
  pdf.save(sanitizedFilename);
}

/**
 * Exports high-resolution PNG image directly from floor plan vector canvas.
 */
export async function exportFloorPlanToPng(
  containerElement: HTMLElement | SVGSVGElement | null,
  filename: string,
  floorPlan?: FloorPlan,
  scale: number = 3.5
): Promise<void> {
  const plan = floorPlan || ({
    roomWidth: 45,
    roomHeight: 35
  } as FloorPlan);

  const canvas = await renderFloorPlanToCanvas(containerElement, plan, scale);
  const link = document.createElement('a');
  link.download = `${filename.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-hd.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
