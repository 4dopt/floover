import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Eye,
  Camera,
  Sun,
  Moon,
  Sparkles,
  Download,
  X,
  Layers,
  Maximize2,
  Minimize2,
  Compass,
  Tag,
  Play,
  Pause,
  Utensils,
  Palette,
  Focus,
  Check,
  Footprints,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Zap,
  Plus,
  Minus,
  Target,
  Lock,
  Code,
  Crosshair,
  Building2
} from 'lucide-react';
import { FloorPlan, FloorElement, Point2D, TableStatus } from '../types';
import { getEffectiveBoundaryPoints } from '../utils/roomGeometry';
import { getChairPositions } from '../utils/chairLayout';
import { getElementSubtype } from './ArchitecturalElementRenderer';
import { PlanTierId, FeatureKey } from '../types/entitlements';
import { canAccessFeature, getStoredPlanTier, setStoredPlanTier } from '../utils/entitlements';
import { PaywallModal } from './PaywallModal';
import { Embed3DModal } from './Embed3DModal';
import { FloordoneLogo } from './FloordoneLogo';

// Helper to test if a 3D coordinate is safely within the room floor boundary
function isInsideRoom(
  x: number,
  z: number,
  boundaryPoints: Point2D[],
  margin = 1.4
): boolean {
  if (!boundaryPoints || boundaryPoints.length < 3) return true;

  // Bounding box pre-check with margin
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of boundaryPoints) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minZ) minZ = p.y;
    if (p.y > maxZ) maxZ = p.y;
  }
  if (x < minX + margin || x > maxX - margin || z < minZ + margin || z > maxZ - margin) {
    return false;
  }

  // Point in polygon test (ray casting algorithm)
  let inside = false;
  for (let i = 0, j = boundaryPoints.length - 1; i < boundaryPoints.length; j = i++) {
    const xi = boundaryPoints[i].x, zi = boundaryPoints[i].y;
    const xj = boundaryPoints[j].x, zj = boundaryPoints[j].y;
    const intersect = ((zi > z) !== (zj > z)) && (x < ((xj - xi) * (z - zi)) / (zj - zi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

interface Canvas3DProps {
  floorPlan: FloorPlan;
  onClose3D: () => void;
  onSelectElement?: (id: string | null) => void;
  selectedElementId?: string | null;
  currentPlan?: PlanTierId;
  onUpgradePlan?: (tier: PlanTierId) => void;
  onOpenPricing?: () => void;
}

type CameraPreset = 'isometric' | 'topdown' | 'walkthrough' | 'front';
type LightingPreset = 'banquet' | 'daylight' | 'studio' | 'evening';
type WallMode = 'full' | 'cutaway' | 'low';
type FloorTexturePreset = 'parquet' | 'marble' | 'walnut';

export const Canvas3D: React.FC<Canvas3DProps> = ({
  floorPlan,
  onClose3D,
  onSelectElement,
  selectedElementId,
  currentPlan: initialCurrentPlan,
  onUpgradePlan,
  onOpenPricing
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active Plan Tier State (reactive to global simulator or storage)
  const [activePlan, setActivePlan] = useState<PlanTierId>(() => {
    return initialCurrentPlan || getStoredPlanTier();
  });

  useEffect(() => {
    if (initialCurrentPlan) {
      setActivePlan(initialCurrentPlan);
    }
  }, [initialCurrentPlan]);

  useEffect(() => {
    const handleTierChange = (e: any) => {
      if (e.detail?.tier) {
        setActivePlan(e.detail.tier);
      }
    };
    window.addEventListener('floordone:tier-changed', handleTierChange);
    return () => window.removeEventListener('floordone:tier-changed', handleTierChange);
  }, []);

  // Paywall & Feature Gating Modal State
  const [paywallFeature, setPaywallFeature] = useState<FeatureKey | null>(null);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  // Sightline Tool State (Venue Feature)
  const [isSightlineMode, setIsSightlineMode] = useState(false);
  const [sightlineTableId, setSightlineTableId] = useState<string | null>(null);

  // Visual Atmosphere & Rendering State
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('banquet');
  const [wallMode, setWallMode] = useState<WallMode>('cutaway');
  const [floorTexture, setFloorTexture] = useState<FloorTexturePreset>('parquet');
  const [showTableware, setShowTableware] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedElement3D, setSelectedElement3D] = useState<FloorElement | null>(null);

  // Walkthrough First-Person Mode State & Refs
  const isWalkthrough = cameraPreset === 'walkthrough';
  const isWalkthroughRef = useRef(false);
  isWalkthroughRef.current = isWalkthrough;

  const [isSprint, setIsSprint] = useState(false);
  const isSprintRef = useRef(false);
  isSprintRef.current = isSprint;

  const walkthroughYawRef = useRef(0);
  const walkthroughPitchRef = useRef(0);
  const keysPressedRef = useRef<{ [code: string]: boolean }>({});
  const lastPointerPosRef = useRef({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const virtualMoveRef = useRef({ forward: 0, right: 0, turn: 0 });
  const hasInitializedCameraRef = useRef(false);

  // Unit conversion: 20px in 2D floor plan = 1 foot (1.0 Three.js world unit)
  const scale = 1 / 20;

  // Boundary points of the room
  const boundaryPoints = useMemo(() => getEffectiveBoundaryPoints(floorPlan), [floorPlan]);

  // Persistent Camera & Navigation State (preserves view across renders)
  const savedCameraPosRef = useRef<THREE.Vector3 | null>(null);
  const savedControlsTargetRef = useRef<THREE.Vector3 | null>(null);
  const isOrbitingRef = useRef(false);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const pointerDownTimeRef = useRef(0);
  const boundaryPointsRef = useRef(boundaryPoints);
  boundaryPointsRef.current = boundaryPoints;

  // Virtual D-pad handlers for touch/mouse walking
  const handleVirtualNavDown = (action: 'forward' | 'backward' | 'left' | 'right' | 'turnLeft' | 'turnRight') => {
    if (action === 'forward') virtualMoveRef.current.forward = 1;
    if (action === 'backward') virtualMoveRef.current.forward = -1;
    if (action === 'left') virtualMoveRef.current.right = -1;
    if (action === 'right') virtualMoveRef.current.right = 1;
    if (action === 'turnLeft') virtualMoveRef.current.turn = 1;
    if (action === 'turnRight') virtualMoveRef.current.turn = -1;
  };

  const handleVirtualNavUp = () => {
    virtualMoveRef.current = { forward: 0, right: 0, turn: 0 };
  };

  // References for Three.js instance
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wallGroupRef = useRef<THREE.Group | null>(null);
  const floorMeshRef = useRef<THREE.Mesh | null>(null);
  const elementsGroupRef = useRef<THREE.Group | null>(null);
  const labelsGroupRef = useRef<THREE.Group | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const selectionHaloRef = useRef<THREE.Mesh | null>(null);
  const interactiveMeshesRef = useRef<Map<THREE.Object3D, FloorElement>>(new Map());

  // Center of room in 3D world units
  const roomCenterX = (floorPlan.roomWidth || 40) / 2;
  const roomCenterZ = (floorPlan.roomHeight || 30) / 2;

  // Wall heights based on wallMode
  const wallHeight = wallMode === 'full' ? 10 : wallMode === 'cutaway' ? 3.8 : 0.8;

  // Track selected element from props or internal click
  useEffect(() => {
    if (selectedElementId) {
      const match = floorPlan.elements.find((el) => el.id === selectedElementId);
      setSelectedElement3D(match || null);
    } else {
      setSelectedElement3D(null);
    }
  }, [selectedElementId, floorPlan.elements]);

  // Update selection halo in 3D scene
  useEffect(() => {
    if (!sceneRef.current) return;

    if (selectionHaloRef.current) {
      sceneRef.current.remove(selectionHaloRef.current);
      selectionHaloRef.current.geometry.dispose();
      (selectionHaloRef.current.material as THREE.Material).dispose();
      selectionHaloRef.current = null;
    }

    if (selectedElement3D) {
      const posX = (selectedElement3D.x + selectedElement3D.width / 2) * scale;
      const posZ = (selectedElement3D.y + selectedElement3D.height / 2) * scale;
      const maxDim = Math.max(selectedElement3D.width, selectedElement3D.height) * scale;
      const radius = maxDim / 2 + 0.6;

      const ringGeo = new THREE.RingGeometry(radius, radius + 0.25, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x6366f1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(posX, 0.08, posZ);
      sceneRef.current.add(ring);
      selectionHaloRef.current = ring;
    }
  }, [selectedElement3D, scale]);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = getSceneBackgroundColor(lightingPreset);
    scene.fog = new THREE.FogExp2(
      lightingPreset === 'banquet' ? 0x090d16 : lightingPreset === 'daylight' ? 0xf1f5f9 : 0x0f172a,
      0.0035
    );
    sceneRef.current = scene;

    // 2. Camera with preserved position across re-renders
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 1000);
    cameraRef.current = camera;

    if (savedCameraPosRef.current) {
      camera.position.copy(savedCameraPosRef.current);
    } else {
      camera.position.set(roomCenterX + 36, 38, roomCenterZ + 44);
    }

    // 3. WebGL Renderer with High-End Tone Mapping & Soft Shadows
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = lightingPreset === 'daylight' ? 1.05 : 1.25;
    rendererRef.current = renderer;

    // 4. OrbitControls for Overview/Isometric Modes with Damped, Glitch-Free Zooming & Rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    if (savedControlsTargetRef.current) {
      controls.target.copy(savedControlsTargetRef.current);
    } else {
      controls.target.set(roomCenterX, 0, roomCenterZ);
      camera.lookAt(roomCenterX, 0, roomCenterZ);
    }
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true; // Natural parallel panning without dipping through floor
    controls.zoomSpeed = 1.0;
    controls.rotateSpeed = 0.85;
    controls.panSpeed = 0.85;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent dipping beneath floor plane
    controls.minPolarAngle = 0.03; // Prevent flipping at vertical zenith
    controls.minDistance = 1.5; // Smooth close inspection of place settings
    controls.maxDistance = 400; // Unobstructed birds-eye overview
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 0.9;
    controls.enabled = !isWalkthroughRef.current;
    controlsRef.current = controls;

    // Track user rotation/zoom interactions so view never snaps back
    controls.addEventListener('start', () => {
      isOrbitingRef.current = true;
    });

    controls.addEventListener('end', () => {
      // Debounce window so pointerup/click handler knows an orbit just occurred
      setTimeout(() => {
        isOrbitingRef.current = false;
      }, 120);
    });

    controls.addEventListener('change', () => {
      if (cameraRef.current && controlsRef.current) {
        savedCameraPosRef.current = cameraRef.current.position.clone();
        savedControlsTargetRef.current = controlsRef.current.target.clone();
      }
    });

    // 5. Lighting
    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;
    updateLighting(lightsGroup, lightingPreset, roomCenterX, roomCenterZ);

    // 6. Floor Mesh with Procedural Materials
    const floorMesh = createFloorMesh(scene, boundaryPoints, floorTexture, lightingPreset);
    floorMeshRef.current = floorMesh;

    // 7. Perimeter Walls with Moldings and Trim
    const wallGroup = new THREE.Group();
    scene.add(wallGroup);
    wallGroupRef.current = wallGroup;
    createWallMeshes(wallGroup, boundaryPoints, wallHeight, lightingPreset);

    // 8. 3D Elements (Tables, Linens, Tableware, Chairs, Fixtures)
    const elementsGroup = new THREE.Group();
    scene.add(elementsGroup);
    elementsGroupRef.current = elementsGroup;
    interactiveMeshesRef.current.clear();
    createFurnitureMeshes(
      elementsGroup,
      floorPlan.elements,
      scale,
      lightingPreset,
      showTableware,
      interactiveMeshesRef.current
    );

    // 9. Floating 3D Table Badges
    const labelsGroup = new THREE.Group();
    scene.add(labelsGroup);
    labelsGroupRef.current = labelsGroup;
    createTableLabels(labelsGroup, floorPlan.elements, scale, showLabels);

    // 10. Raycasting & Precision Pointer Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent | PointerEvent) => {
      if (!canvasRef.current || !cameraRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const interactiveObjects: THREE.Object3D[] = Array.from(interactiveMeshesRef.current.keys());
      const intersects = raycaster.intersectObjects(interactiveObjects, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && !interactiveMeshesRef.current.has(hitObj)) {
          hitObj = hitObj.parent;
        }
        if (hitObj) {
          const el = interactiveMeshesRef.current.get(hitObj);
          if (el) {
            setSelectedElement3D(el);
            onSelectElement?.(el.id);
            return;
          }
        }
      }
      // Clicked outside elements
      setSelectedElement3D(null);
      onSelectElement?.(null);
    };

    const domElem = renderer.domElement;

    // Pointer event handlers that distinguish rotation drag from clicks
    const handlePointerDown = (e: PointerEvent) => {
      isPointerDownRef.current = true;
      isDraggingRef.current = false;
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
      pointerDownTimeRef.current = Date.now();
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

      if (isWalkthroughRef.current) {
        try {
          (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
        } catch {}
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return;

      const dx = e.clientX - lastPointerPosRef.current.x;
      const dy = e.clientY - lastPointerPosRef.current.y;
      const totalDist = Math.hypot(
        e.clientX - pointerDownPosRef.current.x,
        e.clientY - pointerDownPosRef.current.y
      );

      if (totalDist > 5) {
        isDraggingRef.current = true;
      }

      // In Walkthrough Mode: First-Person 360° Mouse Look
      if (isWalkthroughRef.current && cameraRef.current) {
        walkthroughYawRef.current -= dx * 0.0035;
        walkthroughPitchRef.current = Math.max(
          -1.35,
          Math.min(1.35, walkthroughPitchRef.current - dy * 0.003)
        );
        cameraRef.current.quaternion.setFromEuler(
          new THREE.Euler(walkthroughPitchRef.current, walkthroughYawRef.current, 0, 'YXZ')
        );
      }

      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isWalkthroughRef.current) {
        try {
          (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);
        } catch {}
      }

      const totalDist = Math.hypot(
        e.clientX - pointerDownPosRef.current.x,
        e.clientY - pointerDownPosRef.current.y
      );
      const elapsed = Date.now() - pointerDownTimeRef.current;

      // Only fire click selection if the user genuinely tapped without dragging or orbiting
      if (
        !isDraggingRef.current &&
        totalDist <= 5 &&
        !isOrbitingRef.current &&
        !isWalkthroughRef.current &&
        elapsed < 400
      ) {
        handleCanvasClick(e);
      }

      isPointerDownRef.current = false;
      isDraggingRef.current = false;
    };

    // Smooth mouse wheel walking in Walkthrough Mode
    const handleWheel = (e: WheelEvent) => {
      if (isWalkthroughRef.current && cameraRef.current) {
        e.preventDefault();
        const moveStep = e.deltaY < 0 ? 1.2 : -1.2;
        const yaw = walkthroughYawRef.current;
        const fx = -Math.sin(yaw);
        const fz = -Math.cos(yaw);
        const nextX = cameraRef.current.position.x + fx * moveStep;
        const nextZ = cameraRef.current.position.z + fz * moveStep;
        if (isInsideRoom(nextX, nextZ, boundaryPointsRef.current, 1.2)) {
          cameraRef.current.position.x = nextX;
          cameraRef.current.position.z = nextZ;
        }
      }
    };

    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });

    // Keyboard handlers for Walkthrough navigation (WASD / Arrow keys)
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      keysPressedRef.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 11. Animation Render Loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (isWalkthroughRef.current && cameraRef.current) {
        // --- Walkthrough First-Person Movement Engine ---
        const cam = cameraRef.current;
        const keys = keysPressedRef.current;
        const vMove = virtualMoveRef.current;

        // Turn left/right with virtual controls
        if (vMove.turn !== 0) {
          walkthroughYawRef.current += vMove.turn * 0.04;
          cam.quaternion.setFromEuler(
            new THREE.Euler(walkthroughPitchRef.current, walkthroughYawRef.current, 0, 'YXZ')
          );
        }

        const isShift = keys.ShiftLeft || keys.ShiftRight || isSprintRef.current;
        const speed = isShift ? 0.35 : 0.18;

        let moveForward = vMove.forward;
        let moveRight = vMove.right;

        if (keys.KeyW || keys.ArrowUp) moveForward += 1;
        if (keys.KeyS || keys.ArrowDown) moveForward -= 1;
        if (keys.KeyA || keys.ArrowLeft) moveRight -= 1;
        if (keys.KeyD || keys.ArrowRight) moveRight += 1;

        if (moveForward !== 0 || moveRight !== 0) {
          const yaw = walkthroughYawRef.current;
          const forwardVecX = -Math.sin(yaw);
          const forwardVecZ = -Math.cos(yaw);
          const rightVecX = Math.cos(yaw);
          const rightVecZ = -Math.sin(yaw);

          const dx = (forwardVecX * moveForward + rightVecX * moveRight) * speed;
          const dz = (forwardVecZ * moveForward + rightVecZ * moveRight) * speed;

          const nextX = cam.position.x + dx;
          const nextZ = cam.position.z + dz;

          // Boundary Collision with wall sliding
          if (isInsideRoom(nextX, nextZ, boundaryPoints, 1.2)) {
            cam.position.x = nextX;
            cam.position.z = nextZ;
          } else if (isInsideRoom(nextX, cam.position.z, boundaryPoints, 1.2)) {
            cam.position.x = nextX;
          } else if (isInsideRoom(cam.position.x, nextZ, boundaryPoints, 1.2)) {
            cam.position.z = nextZ;
          }
        }

        // Lock stable human eye level
        cam.position.y = 5.6;
      } else {
        // Normal OrbitControls update
        controls.update();
      }

      // Orient label sprites toward camera
      if (labelsGroupRef.current && showLabels) {
        labelsGroupRef.current.children.forEach((child) => {
          child.quaternion.copy(camera.quaternion);
        });
      }

      // Subtle pulse on selection halo
      if (selectionHaloRef.current) {
        const time = Date.now() * 0.003;
        const s = 1 + Math.sin(time) * 0.03;
        selectionHaloRef.current.scale.set(s, s, s);
      }

      renderer.render(scene, camera);
    };
    animate();

    // 12. Handle container resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      domElem.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domElem.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
    };
  }, [floorPlan.id]);

  // Update wall heights dynamically without resetting camera
  useEffect(() => {
    if (!wallGroupRef.current || !sceneRef.current) return;
    while (wallGroupRef.current.children.length > 0) {
      const obj = wallGroupRef.current.children[0];
      wallGroupRef.current.remove(obj);
    }
    createWallMeshes(wallGroupRef.current, boundaryPoints, wallHeight, lightingPreset);
  }, [wallMode, boundaryPoints, wallHeight, lightingPreset]);

  // Update lighting preset dynamically
  useEffect(() => {
    if (!lightsGroupRef.current || !sceneRef.current || !rendererRef.current) return;
    updateLighting(lightsGroupRef.current, lightingPreset, roomCenterX, roomCenterZ);

    if (sceneRef.current) {
      sceneRef.current.background = getSceneBackgroundColor(lightingPreset);
      sceneRef.current.fog = new THREE.FogExp2(
        lightingPreset === 'banquet' ? 0x090d16 : lightingPreset === 'daylight' ? 0xf1f5f9 : 0x0f172a,
        0.0035
      );
    }

    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = lightingPreset === 'daylight' ? 1.05 : 1.25;
    }
  }, [lightingPreset, roomCenterX, roomCenterZ]);

  // Update floor texture dynamically without resetting camera
  useEffect(() => {
    if (!sceneRef.current || !floorMeshRef.current) return;
    sceneRef.current.remove(floorMeshRef.current);
    floorMeshRef.current.geometry.dispose();
    const newFloor = createFloorMesh(sceneRef.current, boundaryPoints, floorTexture, lightingPreset);
    floorMeshRef.current = newFloor;
  }, [floorTexture, boundaryPoints, lightingPreset]);

  // Update furniture meshes when tableware toggle changes
  useEffect(() => {
    if (!elementsGroupRef.current) return;
    while (elementsGroupRef.current.children.length > 0) {
      elementsGroupRef.current.remove(elementsGroupRef.current.children[0]);
    }
    interactiveMeshesRef.current.clear();
    createFurnitureMeshes(
      elementsGroupRef.current,
      floorPlan.elements,
      scale,
      lightingPreset,
      showTableware,
      interactiveMeshesRef.current
    );
  }, [showTableware, lightingPreset, floorPlan.elements]);

  // Update auto rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);

  // Update table labels dynamically
  useEffect(() => {
    if (!labelsGroupRef.current) return;
    while (labelsGroupRef.current.children.length > 0) {
      labelsGroupRef.current.remove(labelsGroupRef.current.children[0]);
    }
    createTableLabels(labelsGroupRef.current, floorPlan.elements, scale, showLabels);
  }, [showLabels, floorPlan.elements, scale]);

  // Toggle OrbitControls when entering/exiting Walkthrough mode
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !isWalkthrough;
    }
  }, [isWalkthrough]);

  // Set camera to preset angles
  const applyCameraPreset = (preset: CameraPreset) => {
    if (!cameraRef.current) return;

    if (preset === 'walkthrough') {
      if (!canAccessFeature(activePlan, 'FULL_3D_WALKTHROUGH').allowed) {
        setPaywallFeature('FULL_3D_WALKTHROUGH');
        return;
      }
    }

    setCameraPreset(preset);

    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (preset === 'walkthrough') {
      if (ctrl) {
        ctrl.enabled = false;
      }
      // Position camera inside the room near entrance / perimeter at stable human eye level (5.6 ft)
      let minX = 0, maxX = floorPlan.roomWidth || 40, minZ = 0, maxZ = floorPlan.roomHeight || 30;
      if (boundaryPoints.length >= 3) {
        minX = Math.min(...boundaryPoints.map((p) => p.x));
        maxX = Math.max(...boundaryPoints.map((p) => p.x));
        minZ = Math.min(...boundaryPoints.map((p) => p.y));
        maxZ = Math.max(...boundaryPoints.map((p) => p.y));
      }
      const startX = Math.max(minX + 4, Math.min(maxX - 4, roomCenterX));
      const startZ = Math.max(minZ + 4, maxZ - 5);
      cam.position.set(startX, 5.6, startZ);

      // Orient horizontal yaw to look naturally toward the center of the hall
      const lookDx = roomCenterX - startX;
      const lookDz = roomCenterZ - startZ;
      walkthroughYawRef.current = Math.atan2(-lookDx, -lookDz);
      walkthroughPitchRef.current = 0;
      cam.quaternion.setFromEuler(
        new THREE.Euler(walkthroughPitchRef.current, walkthroughYawRef.current, 0, 'YXZ')
      );
    } else {
      if (ctrl) {
        ctrl.enabled = true;
        switch (preset) {
          case 'isometric':
            cam.position.set(roomCenterX + 36, 38, roomCenterZ + 44);
            ctrl.target.set(roomCenterX, 0, roomCenterZ);
            break;
          case 'topdown':
            cam.position.set(roomCenterX, 72, roomCenterZ + 0.1);
            ctrl.target.set(roomCenterX, 0, roomCenterZ);
            break;
          case 'front':
            cam.position.set(roomCenterX, 22, roomCenterZ + Math.max(roomCenterX, roomCenterZ) * 2.1);
            ctrl.target.set(roomCenterX, 2, roomCenterZ);
            break;
        }
        ctrl.update();
        savedCameraPosRef.current = cam.position.clone();
        savedControlsTargetRef.current = ctrl.target.clone();
      }
    }
  };

  // Focus camera directly onto selected element in 3D
  const focusOnElement = (el: FloorElement) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const targetX = (el.x + el.width / 2) * scale;
    const targetZ = (el.y + el.height / 2) * scale;

    controlsRef.current.target.set(targetX, 1.5, targetZ);
    cameraRef.current.position.set(targetX + 12, 14, targetZ + 15);
    controlsRef.current.update();
    savedCameraPosRef.current = cameraRef.current.position.clone();
    savedControlsTargetRef.current = controlsRef.current.target.clone();
  };

  // Smooth Zoom In handler
  const handleZoomIn = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    const offset = new THREE.Vector3().subVectors(cam.position, ctrl.target);
    const currentDist = offset.length();
    const targetDist = Math.max(ctrl.minDistance, currentDist * 0.78);
    offset.setLength(targetDist);
    cam.position.copy(ctrl.target).add(offset);
    ctrl.update();
    savedCameraPosRef.current = cam.position.clone();
  };

  // Smooth Zoom Out handler
  const handleZoomOut = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    const offset = new THREE.Vector3().subVectors(cam.position, ctrl.target);
    const currentDist = offset.length();
    const targetDist = Math.min(ctrl.maxDistance, currentDist * 1.25);
    offset.setLength(targetDist);
    cam.position.copy(ctrl.target).add(offset);
    ctrl.update();
    savedCameraPosRef.current = cam.position.clone();
  };

  // Recenter view on venue center without resetting rotation angle
  const handleRecenter = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    const offset = new THREE.Vector3().subVectors(cam.position, ctrl.target);
    ctrl.target.set(roomCenterX, 0, roomCenterZ);
    cam.position.copy(ctrl.target).add(offset);
    ctrl.update();
    savedCameraPosRef.current = cam.position.clone();
    savedControlsTargetRef.current = ctrl.target.clone();
  };

  // Reset to standard perspective view
  const handleResetView = () => {
    applyCameraPreset('isometric');
  };

  // Download high-resolution PNG render
  const handleExportSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsExporting(true);

    try {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${floorPlan.name.toLowerCase().replace(/\s+/g, '-')}-3d-photoreal-render.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Error exporting 3D snapshot:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Focus camera at eye-level from a specific table toward room center/stage
  const handleSelectSightlineTable = (tableId: string) => {
    setSightlineTableId(tableId);
    const table = floorPlan.elements.find((e) => e.id === tableId);
    if (!table || !cameraRef.current) return;

    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    // Seated guest eye level: ~4.5 feet (1.37m)
    const tableCenterX = (table.x + table.width / 2) * scale;
    const tableCenterZ = (table.y + table.height / 2) * scale;

    cam.position.set(tableCenterX, 4.5, tableCenterZ);

    if (ctrl) {
      ctrl.enabled = true;
      ctrl.target.set(roomCenterX, 4.0, roomCenterZ);
      ctrl.update();
    }
  };

  return (
    <div
      ref={containerRef}
      id="canvas-3d-visualizer"
      className={`relative w-full h-full bg-slate-950 select-none overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Top Left: 3D Header Info Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 text-white shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black tracking-wider text-indigo-400 uppercase">
                Interactive 3D Walkthrough
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-slate-100">
              {floorPlan.name} • {floorPlan.roomWidth} × {floorPlan.roomHeight} {floorPlan.unit}
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-700 mx-0.5" />

        <div className="text-[11px] text-slate-400 hidden sm:block">
          <span className="text-slate-200 font-semibold">{floorPlan.elements.length}</span> fixtures •{' '}
          <span className="text-slate-200 font-semibold">{boundaryPoints.length}</span> walls
        </div>
      </div>

      {/* Top Right: Camera Angles, Showcase, Snapshot & Close */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Camera Angle Presets */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl">
          <button
            onClick={() => applyCameraPreset('isometric')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              cameraPreset === 'isometric'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Isometric 3D Perspective"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Isometric</span>
          </button>

          <button
            onClick={() => applyCameraPreset('topdown')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              cameraPreset === 'topdown'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Top-Down Plan View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Plan View</span>
          </button>

          <button
            onClick={() => applyCameraPreset('walkthrough')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              cameraPreset === 'walkthrough'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Eye-Level Walkthrough View"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Walkthrough</span>
          </button>

          <button
            onClick={() => applyCameraPreset('front')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              cameraPreset === 'front'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Front Entrance Angle"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Front</span>
          </button>
        </div>

        {/* Auto-Rotate Showcase Mode */}
        <button
          onClick={() => setIsAutoRotating((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-xl transition border ${
            isAutoRotating
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
              : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80'
          }`}
          title="Toggle Turntable Auto-Rotate Showcase"
        >
          {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">Showcase</span>
        </button>

        {/* Embed 3D View (Venue / Studio Feature) */}
        <button
          onClick={() => {
            if (canAccessFeature(activePlan, 'EMBEDDABLE_3D_IFRAME').allowed) {
              setIsEmbedModalOpen(true);
            } else {
              setPaywallFeature('EMBEDDABLE_3D_IFRAME');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 text-xs font-bold shadow-xl transition cursor-pointer"
          title="Get Embeddable 3D iFrame Code for Venue Websites (Venue / Studio)"
        >
          <Code className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Embed 3D</span>
          {!canAccessFeature(activePlan, 'EMBEDDABLE_3D_IFRAME').allowed && (
            <Lock className="w-3 h-3 text-amber-400 ml-0.5" />
          )}
        </button>

        {/* Capture High-Res 3D Snapshot */}
        <button
          onClick={handleExportSnapshot}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 text-xs font-bold shadow-xl transition cursor-pointer"
          title="Export Photorealistic 3D Render (PNG)"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Capture Render</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => setIsFullscreen((prev) => !prev)}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Exit 3D View */}
        <button
          onClick={onClose3D}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xl transition cursor-pointer"
          title="Return to 2D Floor Plan Editor"
        >
          <X className="w-4 h-4" />
          <span>Exit 3D</span>
        </button>
      </div>

      {/* Selected Table Inspector Card Popup in 3D */}
      {selectedElement3D && (
        <div
          id="inspector-card-3d"
          className="absolute top-20 right-4 z-20 w-72 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 p-3.5 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="font-bold text-sm text-slate-100">{selectedElement3D.name}</span>
            </div>
            <button
              onClick={() => setSelectedElement3D(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-2.5 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Category:</span>
              <span className="font-semibold text-slate-200 capitalize">{selectedElement3D.type}</span>
            </div>
            {selectedElement3D.type === 'table' && (
              <>
                <div className="flex justify-between text-slate-400">
                  <span>Guest Covers:</span>
                  <span className="font-bold text-indigo-400">{selectedElement3D.covers} seats</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Table Shape:</span>
                  <span className="font-semibold text-slate-200 capitalize">{selectedElement3D.shape}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Reservation Status:</span>
                  <span
                    className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                      selectedElement3D.status === 'vip'
                        ? 'bg-amber-500/20 text-amber-300'
                        : selectedElement3D.status === 'reserved'
                        ? 'bg-pink-500/20 text-pink-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {selectedElement3D.status || 'Available'}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Dimensions:</span>
              <span className="text-slate-300 font-mono">
                {Math.round(selectedElement3D.width * scale)} × {Math.round(selectedElement3D.height * scale)}{' '}
                {floorPlan.unit}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => focusOnElement(selectedElement3D)}
              className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Focus className="w-3.5 h-3.5" />
              <span>Zoom To Table</span>
            </button>
          </div>
        </div>
      )}

      {/* Walkthrough Interactive HUD Controls & Keyboard Guide */}
      {isWalkthrough && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-3 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-indigo-500/50 text-white shadow-2xl pointer-events-auto">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <Footprints className="w-4 h-4 text-indigo-400 animate-bounce" />
              <span>Walkthrough Mode</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700 font-bold text-indigo-300">
                W A S D
              </span>
              <span className="hidden sm:inline">or</span>
              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700 font-bold text-indigo-300 hidden sm:inline">
                Arrows
              </span>
              <span className="text-slate-400">to walk</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Drag to look 360°</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <button
              onClick={() => setIsSprint((prev) => !prev)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                isSprint
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title="Toggle Sprint Speed (or hold Shift)"
            >
              <Zap className="w-3 h-3" />
              <span>{isSprint ? 'Sprint 2×' : 'Walk 1×'}</span>
            </button>
            <button
              onClick={() => applyCameraPreset('isometric')}
              className="px-2.5 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition cursor-pointer"
              title="Exit Walkthrough and return to Isometric view"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* On-screen Virtual D-Pad for Touch and Click Navigation in Walkthrough Mode */}
      {isWalkthrough && (
        <div className="absolute bottom-24 right-4 z-20 flex flex-col items-center bg-slate-900/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-700/80 shadow-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Footprints className="w-3 h-3 text-indigo-400" />
            <span>Walk Controls</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 w-32">
            {/* Row 1: Turn Left, Forward, Turn Right */}
            <button
              onPointerDown={() => handleVirtualNavDown('turnLeft')}
              onPointerUp={handleVirtualNavUp}
              onPointerLeave={handleVirtualNavUp}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Turn View Left"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onPointerDown={() => handleVirtualNavDown('forward')}
              onPointerUp={handleVirtualNavUp}
              onPointerLeave={handleVirtualNavUp}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
              title="Walk Forward (W or Up)"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onPointerDown={() => handleVirtualNavDown('turnRight')}
              onPointerUp={handleVirtualNavUp}
              onPointerLeave={handleVirtualNavUp}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Turn View Right"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Row 2: Strafe Left, Backward, Strafe Right */}
            <button
              onPointerDown={() => handleVirtualNavDown('left')}
              onPointerUp={handleVirtualNavUp}
              onPointerLeave={handleVirtualNavUp}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Strafe Left (A or Left)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onPointerDown={() => handleVirtualNavDown('backward')}
              onPointerUp={handleVirtualNavUp}
              onPointerLeave={handleVirtualNavUp}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
              title="Walk Backward (S or Down)"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onPointerDown={() => handleVirtualNavDown('right')}
              onPointerUp={handleVirtualNavUp}
              onPointerLeave={handleVirtualNavUp}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Strafe Right (D or Right)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* On-Screen Precision Zoom & Viewport Dock (Overview / Orbit Modes) */}
      {!isWalkthrough && (
        <div className="absolute bottom-24 right-4 z-20 flex flex-col items-center bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl gap-1">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Zoom In (or scroll wheel up)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Zoom Out (or scroll wheel down)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-5 h-px bg-slate-700/80 my-0.5" />
          <button
            onClick={handleRecenter}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Recenter Camera on Venue"
          >
            <Target className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Reset to Isometric Perspective View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Floating Toolbar: Style, Lighting, Textures & Finishes */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-2.5 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 text-white shadow-2xl max-w-[95vw]">
        {/* Floor Material Texture Picker */}
        <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-semibold text-slate-400">Flooring:</span>
          <button
            onClick={() => setFloorTexture('parquet')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
              floorTexture === 'parquet'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Warm Oak Parquet Hardwood"
          >
            Oak Parquet
          </button>
          <button
            onClick={() => setFloorTexture('marble')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
              floorTexture === 'marble'
                ? 'bg-slate-200 text-slate-900 font-black shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Polished Italian Carrara Marble Tiles"
          >
            Marble Tile
          </button>
          <button
            onClick={() => setFloorTexture('walnut')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
              floorTexture === 'walnut'
                ? 'bg-amber-900 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Rich Dark Walnut Hardwood"
          >
            Dark Walnut
          </button>
        </div>

        {/* Wall Mode Switcher */}
        <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-semibold text-slate-400">Walls:</span>
          <button
            onClick={() => setWallMode('cutaway')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
              wallMode === 'cutaway'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Cutaway 3.8ft architectural walls for easy interior view"
          >
            Cutaway (3.8ft)
          </button>
          <button
            onClick={() => setWallMode('full')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
              wallMode === 'full'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Full 10ft ceiling height walls with moldings"
          >
            Full (10ft)
          </button>
          <button
            onClick={() => setWallMode('low')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
              wallMode === 'low'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Baseboard trim only"
          >
            Trim Only
          </button>
        </div>

        {/* Lighting Atmosphere Switcher */}
        <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold text-slate-400">Lighting:</span>
          <button
            onClick={() => {
              if (canAccessFeature(activePlan, 'LIGHTING_ENVIRONMENTS').allowed) {
                setLightingPreset('banquet');
              } else {
                setPaywallFeature('LIGHTING_ENVIRONMENTS');
              }
            }}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              lightingPreset === 'banquet'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Warm Golden Banquet Glow & Chandelier Reflections (Venue / Studio)"
          >
            <Moon className="w-3 h-3 text-amber-200" />
            <span>Banquet</span>
            {!canAccessFeature(activePlan, 'LIGHTING_ENVIRONMENTS').allowed && (
              <Lock className="w-2.5 h-2.5 text-amber-400" />
            )}
          </button>
          <button
            onClick={() => {
              if (canAccessFeature(activePlan, 'LIGHTING_ENVIRONMENTS').allowed) {
                setLightingPreset('daylight');
              } else {
                setPaywallFeature('LIGHTING_ENVIRONMENTS');
              }
            }}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              lightingPreset === 'daylight'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Bright Natural Daylight & Clear Soft Shadows (Venue / Studio)"
          >
            <Sun className="w-3 h-3 text-amber-200" />
            <span>Daylight</span>
            {!canAccessFeature(activePlan, 'LIGHTING_ENVIRONMENTS').allowed && (
              <Lock className="w-2.5 h-2.5 text-amber-400" />
            )}
          </button>
          <button
            onClick={() => setLightingPreset('studio')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              lightingPreset === 'studio'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Neutral Architectural Studio Lighting"
          >
            <span>Studio</span>
          </button>
        </div>

        {/* Guest Sightline Inspection Tool (Venue / Studio) */}
        <button
          onClick={() => {
            if (canAccessFeature(activePlan, '3D_EYE_LEVEL').allowed) {
              const nextMode = !isSightlineMode;
              setIsSightlineMode(nextMode);
              if (nextMode) {
                const firstTable = floorPlan.elements.find((e) => e.type === 'table');
                if (firstTable) {
                  handleSelectSightlineTable(firstTable.id);
                }
              } else {
                applyCameraPreset('isometric');
              }
            } else {
              setPaywallFeature('3D_EYE_LEVEL');
            }
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
            isSightlineMode
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Guest Eye-Level Sightline Tool: Test views to stage or head table from specific tables (Venue / Studio)"
        >
          <Crosshair className="w-3 h-3 text-emerald-400" />
          <span>Guest Sightlines</span>
          {!canAccessFeature(activePlan, '3D_EYE_LEVEL').allowed && (
            <Lock className="w-3 h-3 text-amber-400" />
          )}
        </button>

        {/* Tableware Setting Toggle */}
        <button
          onClick={() => setShowTableware((prev) => !prev)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
            showTableware
              ? 'bg-indigo-600/90 text-white border border-indigo-500 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Formal Dinnerware: Charger Plates, Wine Glasses & Centerpiece Votives"
        >
          <Utensils className="w-3 h-3 text-indigo-300" />
          <span>Table Settings</span>
        </button>

        {/* Table Badges Toggle */}
        <button
          onClick={() => setShowLabels((prev) => !prev)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
            showLabels
              ? 'bg-indigo-600/90 text-white border border-indigo-500 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle 3D Table Name and Seat Badges"
        >
          <Tag className="w-3 h-3 text-indigo-300" />
          <span>Badges</span>
        </button>
      </div>

      {/* Guest Eye-Level Sightline Tool HUD Overlay */}
      {isSightlineMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-emerald-500/50 shadow-2xl flex items-center gap-3 text-xs text-white animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">
              Guest Eye-Level Sightline
            </span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-2">
            <label className="text-slate-300 font-medium text-xs">Viewing From:</label>
            <select
              value={sightlineTableId || ''}
              onChange={(e) => handleSelectSightlineTable(e.target.value)}
              className="bg-slate-800 text-white font-bold text-xs rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
            >
              {floorPlan.elements
                .filter((e) => e.type === 'table')
                .map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name} ({table.covers} seats)
                  </option>
                ))}
            </select>
          </div>
          <div className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
            Focal Sightline: 100% Clear
          </div>
          <button
            onClick={() => {
              setIsSightlineMode(false);
              applyCameraPreset('isometric');
            }}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Exit Sightline Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3D Watermark (Free Tier Only) */}
      {!canAccessFeature(activePlan, 'REMOVE_3D_WATERMARK').allowed && (
        <div className="absolute bottom-16 right-4 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-xl select-none">
          <FloordoneLogo size="xs" showWordmark={true} theme="dark" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1.5 border-l border-slate-700/80">
            Free Preview
          </span>
          <button
            onClick={() => setPaywallFeature('REMOVE_3D_WATERMARK')}
            className="ml-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-[10px] shadow-xs transition cursor-pointer shrink-0"
          >
            Upgrade to Remove
          </button>
        </div>
      )}

      {/* Paywall Modal for Locked Features */}
      <PaywallModal
        isOpen={!!paywallFeature}
        onClose={() => setPaywallFeature(null)}
        featureKey={paywallFeature}
        currentPlan={activePlan}
        onUpgradeSuccess={(newPlan) => {
          setActivePlan(newPlan);
          setStoredPlanTier(newPlan);
          if (onUpgradePlan) onUpgradePlan(newPlan);
          setPaywallFeature(null);
        }}
        onOpenFullPricing={onOpenPricing}
      />

      {/* Embed 3D View Modal */}
      <Embed3DModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        projectId={floorPlan.id}
        projectName={floorPlan.name}
      />

      {/* Bottom Right: Quick Interaction Guide */}
      <div className="absolute bottom-4 right-4 z-20 hidden xl:flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/85 px-3 py-1.5 rounded-xl border border-slate-800/80 shadow-lg">
        <span>Click: Inspect</span>
        <span>•</span>
        <span>Left Drag: Orbit</span>
        <span>•</span>
        <span>Right Drag: Pan</span>
        <span>•</span>
        <span>Scroll / + -: Zoom</span>
      </div>
    </div>
  );
};

// =========================================================================
// Procedural High-Resolution Texture Generators (Pure Canvas API, 0 Latency)
// =========================================================================

function createParquetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base warm wood tone
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 1024, 1024);

  // Draw alternating parquet wood planks
  const plankW = 128;
  const plankH = 32;

  for (let y = 0; y < 1024; y += plankH) {
    const isOdd = Math.floor(y / plankH) % 2 === 1;
    const startX = isOdd ? -plankW / 2 : 0;

    for (let x = startX; x < 1024 + plankW; x += plankW) {
      // Vary wood tint subtly per plank
      const hueShift = (Math.sin(x * 0.05 + y * 0.07) * 12);
      const lightness = 38 + (Math.cos(x * 0.03 + y * 0.04) * 8);
      ctx.fillStyle = `hsl(32, 70%, ${lightness}%)`;
      ctx.fillRect(x + 1, y + 1, plankW - 2, plankH - 2);

      // Fine wood grain lines inside each plank
      ctx.strokeStyle = `rgba(120, 53, 15, 0.25)`;
      ctx.lineWidth = 1;
      for (let g = 3; g < plankH - 3; g += 5) {
        ctx.beginPath();
        ctx.moveTo(x + 2, y + g);
        ctx.lineTo(x + plankW - 2, y + g + (Math.sin(x + g) * 2));
        ctx.stroke();
      }

      // Plank bevel groove
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, plankW, plankH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function createMarbleTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // High-end white marble base
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1024, 1024);

  // Marble veining
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 14; i++) {
    ctx.strokeStyle = `rgba(148, 163, 184, ${0.12 + Math.random() * 0.18})`;
    ctx.beginPath();
    let cx = Math.random() * 1024;
    let cy = Math.random() * 1024;
    ctx.moveTo(cx, cy);

    for (let step = 0; step < 8; step++) {
      cx += (Math.random() - 0.3) * 160;
      cy += (Math.random() - 0.3) * 160;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // 128px tile grid with thin gray grout
  const tileSize = 256;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 1024; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function createDarkWalnutTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#27170e';
  ctx.fillRect(0, 0, 1024, 1024);

  const plankW = 160;
  const plankH = 40;

  for (let y = 0; y < 1024; y += plankH) {
    for (let x = 0; x < 1024; x += plankW) {
      const lightness = 16 + (Math.sin(x * 0.04 + y * 0.06) * 4);
      ctx.fillStyle = `hsl(24, 45%, ${lightness}%)`;
      ctx.fillRect(x + 1, y + 1, plankW - 2, plankH - 2);

      ctx.strokeStyle = '#180d07';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, plankW, plankH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.5, 3.5);
  return texture;
}

function createCheckeredDanceFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const size = 64;
  for (let y = 0; y < 512; y += size) {
    for (let x = 0; x < 512; x += size) {
      const isBlack = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0;
      ctx.fillStyle = isBlack ? '#0f172a' : '#ffffff';
      ctx.fillRect(x, y, size, size);

      // Subtle metallic border
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

let cachedRestroomSignTex: THREE.CanvasTexture | null = null;
function createRestroomSignTexture(): THREE.CanvasTexture {
  if (cachedRestroomSignTex) return cachedRestroomSignTex;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // High-contrast deep cyan/navy background with subtle gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 256);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(1, '#0369a1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Outer border & inner luminous highlight line
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 472, 216);

  // Restroom Icon & Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Crisp symbols (Men, Women, Accessibility)
  ctx.font = 'bold 64px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.fillText('🚻  ♿', 256, 80);

  // Bold high-contrast typography
  ctx.font = '900 46px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('RESTROOMS', 256, 155);

  // Subtitle
  ctx.fillStyle = '#bae6fd';
  ctx.font = '700 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('GUEST FACILITIES • ACCESSIBLE', 256, 204);

  const texture = new THREE.CanvasTexture(canvas);
  cachedRestroomSignTex = texture;
  return texture;
}

let cachedExitSignTex: THREE.CanvasTexture | null = null;
function createEmergencyExitSignTexture(): THREE.CanvasTexture {
  if (cachedExitSignTex) return cachedExitSignTex;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 180;
  const ctx = canvas.getContext('2d')!;

  // High-visibility illuminated green safety background
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#15803d');
  grad.addColorStop(0.5, '#16a34a');
  grad.addColorStop(1, '#15803d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 180);

  // White border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 164);

  // Exit Typography
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 64px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('EXIT ➔', 256, 75);

  ctx.fillStyle = '#bbf7d0';
  ctx.font = '700 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('EMERGENCY EGRESS ONLY', 256, 134);

  const texture = new THREE.CanvasTexture(canvas);
  cachedExitSignTex = texture;
  return texture;
}

let cachedDjConsoleTex: THREE.CanvasTexture | null = null;
function createDjConsoleTexture(): THREE.CanvasTexture {
  if (cachedDjConsoleTex) return cachedDjConsoleTex;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Obsidian console body
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 256);

  // Left & right turntable platters
  [120, 392].forEach((cx) => {
    ctx.beginPath();
    ctx.arc(cx, 128, 85, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let r = 70; r > 30; r -= 10) {
      ctx.beginPath();
      ctx.arc(cx, 128, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, 128, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, 128, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });

  // Center mixer channel strips & glowing VU meters
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(216, 20, 80, 216);
  ctx.strokeStyle = '#4338ca';
  ctx.lineWidth = 2;
  ctx.strokeRect(216, 20, 80, 216);

  const colors = ['#22c55e', '#22c55e', '#eab308', '#ef4444'];
  for (let ch = 0; ch < 2; ch++) {
    const x = 236 + ch * 24;
    for (let b = 0; b < 4; b++) {
      ctx.fillStyle = colors[b];
      ctx.fillRect(x, 40 + (3 - b) * 16, 16, 10);
    }
  }

  // Crossfader slider
  ctx.fillStyle = '#312e81';
  ctx.fillRect(230, 165, 52, 10);
  ctx.fillStyle = '#e0e7ff';
  ctx.fillRect(250, 158, 12, 24);

  const texture = new THREE.CanvasTexture(canvas);
  cachedDjConsoleTex = texture;
  return texture;
}

let cachedPosScreenTex: THREE.CanvasTexture | null = null;
function createPosScreenTexture(): THREE.CanvasTexture {
  if (cachedPosScreenTex) return cachedPosScreenTex;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#091e3a';
  ctx.fillRect(0, 0, 256, 256);

  // Header bar
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 256, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FLOORDONE POS', 12, 24);

  // Table grid blocks
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const isOccupied = (r + c) % 2 === 0;
      ctx.fillStyle = isOccupied ? '#16a34a' : '#2563eb';
      ctx.fillRect(16 + c * 76, 50 + r * 56, 68, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`T-${r * 3 + c + 1}`, 16 + c * 76 + 34, 76 + r * 56);
      ctx.font = '10px sans-serif';
      ctx.fillText(isOccupied ? 'ACTIVE' : 'OPEN', 16 + c * 76 + 34, 90 + r * 56);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  cachedPosScreenTex = texture;
  return texture;
}

let cachedWoodPlankDeckTex: THREE.CanvasTexture | null = null;
function createWoodPlankDeckTexture(): THREE.CanvasTexture {
  if (cachedWoodPlankDeckTex) return cachedWoodPlankDeckTex;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 512, 512);

  const plankW = 64;
  for (let x = 0; x < 512; x += plankW) {
    ctx.fillStyle = (x / plankW) % 2 === 0 ? '#d97706' : '#b45309';
    ctx.fillRect(x + 1, 0, plankW - 2, 512);

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 0, plankW, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  cachedWoodPlankDeckTex = texture;
  return texture;
}

// ==========================================
// Three.js Helper Functions for Scene Build
// ==========================================

function getSceneBackgroundColor(preset: LightingPreset): THREE.Color {
  switch (preset) {
    case 'banquet':
      return new THREE.Color(0x0a0e1a);
    case 'daylight':
      return new THREE.Color(0xf1f5f9);
    case 'studio':
      return new THREE.Color(0x0f172a);
    case 'evening':
      return new THREE.Color(0x0b0b18);
  }
}

function updateLighting(
  group: THREE.Group,
  preset: LightingPreset,
  roomCenterX: number,
  roomCenterZ: number
) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  if (preset === 'banquet') {
    // Warm, golden chandelier & romantic event evening glow
    const hemi = new THREE.HemisphereLight(0xffedd5, 0x1e293b, 0.9);
    group.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff7ed, 1.35);
    sun.position.set(roomCenterX + 35, 52, roomCenterZ + 40);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 180;
    const d = 60;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.025;
    group.add(sun);

    // Warm central chandelier illumination (smooth diffuse lighting, no heavy shadow passes)
    const chandelier = new THREE.PointLight(0xfbbf24, 2.2, 90, 1.2);
    chandelier.position.set(roomCenterX, 12, roomCenterZ);
    group.add(chandelier);

    // Soft warm secondary fill
    const fillLight = new THREE.PointLight(0xf97316, 1.0, 70);
    fillLight.position.set(roomCenterX - 18, 9, roomCenterZ - 12);
    group.add(fillLight);
  } else if (preset === 'daylight') {
    // Natural sunlit morning / afternoon
    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0xf8fafc, 1.15);
    group.add(hemi);

    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(roomCenterX + 40, 60, roomCenterZ + 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.025;
    const d = 65;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    group.add(sun);

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    group.add(ambient);
  } else if (preset === 'evening') {
    // Moody VIP lounge / evening gala
    const hemi = new THREE.HemisphereLight(0xc084fc, 0x0f172a, 0.75);
    group.add(hemi);

    const sun = new THREE.DirectionalLight(0xec4899, 1.1);
    sun.position.set(roomCenterX + 25, 45, roomCenterZ + 35);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.025;
    group.add(sun);

    const chandelier = new THREE.PointLight(0xa855f7, 2.0, 80);
    chandelier.position.set(roomCenterX, 10, roomCenterZ);
    group.add(chandelier);

    const amberAccent = new THREE.PointLight(0xf59e0b, 1.4, 60);
    amberAccent.position.set(roomCenterX - 15, 8, roomCenterZ + 15);
    group.add(amberAccent);
  } else {
    // Studio neutral clean architectural gallery
    const hemi = new THREE.HemisphereLight(0xffffff, 0x334155, 1.1);
    group.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(roomCenterX + 30, 48, roomCenterZ + 35);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.025;
    group.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.55);
    fillLight.position.set(roomCenterX - 30, 35, roomCenterZ - 30);
    group.add(fillLight);
  }
}

/**
 * Creates the extruded polygonal room floor with realistic procedural wood or marble.
 */
function createFloorMesh(
  scene: THREE.Scene,
  points: Point2D[],
  texturePreset: FloorTexturePreset,
  lightingPreset: LightingPreset
): THREE.Mesh {
  if (points.length < 3) return new THREE.Mesh();

  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].y);
  }
  shape.closePath();

  // Beveled floor geometry for clean edge thickness
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.3,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.1,
    bevelThickness: 0.1
  };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  let floorTexture: THREE.CanvasTexture;
  let roughness = 0.3;
  let metalness = 0.05;

  if (texturePreset === 'marble') {
    floorTexture = createMarbleTileTexture();
    roughness = 0.18;
    metalness = 0.1;
  } else if (texturePreset === 'walnut') {
    floorTexture = createDarkWalnutTexture();
    roughness = 0.32;
    metalness = 0.06;
  } else {
    floorTexture = createParquetTexture();
    roughness = 0.28;
    metalness = 0.08;
  }

  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness,
    metalness
  });

  const floorMesh = new THREE.Mesh(geometry, floorMaterial);
  floorMesh.rotation.x = Math.PI / 2;
  floorMesh.position.y = 0;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Surrounding ambient ground plate for depth
  const groundGeo = new THREE.PlaneGeometry(350, 350);
  const groundMat = new THREE.MeshStandardMaterial({
    color: lightingPreset === 'banquet' ? 0x050811 : lightingPreset === 'daylight' ? 0xe2e8f0 : 0x090d16,
    roughness: 0.95
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.6;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  return floorMesh;
}

/**
 * Builds perimeter 3D walls with architectural moldings, baseboards, and beveled top caps.
 */
function createWallMeshes(
  group: THREE.Group,
  points: Point2D[],
  height: number,
  preset: LightingPreset
) {
  const n = points.length;
  if (n < 2) return;

  const wallThickness = 0.75; // 9 inches

  // Crisp modern architectural wall color
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: preset === 'banquet' ? 0x334155 : preset === 'daylight' ? 0xf8fafc : 0x475569,
    roughness: 0.65,
    metalness: 0.05
  });

  // Baseboard trim material
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: preset === 'banquet' ? 0x1e293b : preset === 'daylight' ? 0xcbd5e1 : 0x1e293b,
    roughness: 0.4
  });

  // Cap top molding material
  const capMaterial = new THREE.MeshStandardMaterial({
    color: preset === 'banquet' ? 0xd97706 : preset === 'daylight' ? 0x94a3b8 : 0x64748b,
    roughness: 0.35,
    metalness: 0.1
  });

  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];

    const dx = p2.x - p1.x;
    const dz = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.1) continue;

    const angle = Math.atan2(dz, dx);
    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.y + p2.y) / 2;

    // Main Wall Block
    const wallGeo = new THREE.BoxGeometry(len, height, wallThickness);
    const wallMesh = new THREE.Mesh(wallGeo, wallMaterial);
    wallMesh.position.set(midX, height / 2, midZ);
    wallMesh.rotation.y = -angle;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    group.add(wallMesh);

    // Decorative Architectural Baseboard Skirting
    const trimGeo = new THREE.BoxGeometry(len, 0.45, wallThickness + 0.12);
    const trimMesh = new THREE.Mesh(trimGeo, trimMaterial);
    trimMesh.position.set(midX, 0.22, midZ);
    trimMesh.rotation.y = -angle;
    trimMesh.castShadow = true;
    group.add(trimMesh);

    // Polished Wall Cap on Top
    const capGeo = new THREE.BoxGeometry(len, 0.15, wallThickness + 0.16);
    const capMesh = new THREE.Mesh(capGeo, capMaterial);
    capMesh.position.set(midX, height + 0.075, midZ);
    capMesh.rotation.y = -angle;
    capMesh.castShadow = true;
    group.add(capMesh);
  }
}

/**
 * Builds realistic architectural restaurant booth banquette seating.
 * Includes fluted channel-tufted backrest, roll-top headrest, dark plinth base,
 * side privacy wing panels, and centered dining table with pedestal legs and tableware.
 */
function createLuxuryBooth3D(
  elGroup: THREE.Group,
  width3D: number,
  depth3D: number,
  preset: LightingPreset,
  woodTableMat: THREE.MeshStandardMaterial,
  metalLegMat: THREE.MeshStandardMaterial,
  interactiveMap: Map<THREE.Object3D, FloorElement>,
  el: FloorElement,
  showTableware: boolean,
  glassMat: THREE.Material,
  candleFlameMat: THREE.Material,
  goldMat: THREE.Material,
  whiteMat: THREE.Material
) {
  const tableHeight = 2.45;
  const isWide = width3D >= depth3D;

  // Dedicated Booth Materials
  const boothWoodFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1c130d, // Dark walnut / espresso frame
    roughness: 0.35,
    metalness: 0.06
  });

  const boothLeatherMat = new THREE.MeshStandardMaterial({
    color: preset === 'banquet' ? 0x831843 : preset === 'evening' ? 0x4c1d95 : 0x9a3412, // Rich Bordeaux velvet or Cognac saddle leather
    roughness: 0.46,
    metalness: 0.04
  });

  const boothBaseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Plinth kickplate
    roughness: 0.85
  });

  // Calculate dimensions based on booth orientation
  const benchLength = isWide ? width3D * 0.94 : depth3D * 0.94;
  const boothSpan = isWide ? depth3D : width3D;
  const benchDepth = Math.max(0.9, boothSpan * 0.28);
  const benchSeatHeight = 1.45;
  const benchTotalHeight = 3.6;

  // 1. Center Dining Table
  const tableW = isWide ? width3D * 0.82 : Math.max(1.2, width3D * 0.38);
  const tableD = isWide ? Math.max(1.2, depth3D * 0.38) : depth3D * 0.82;

  const tableTopGeo = new THREE.BoxGeometry(tableW, 0.12, tableD);
  const tableTopMesh = new THREE.Mesh(tableTopGeo, woodTableMat);
  tableTopMesh.position.y = tableHeight;
  tableTopMesh.castShadow = true;
  tableTopMesh.receiveShadow = true;
  elGroup.add(tableTopMesh);
  interactiveMap.set(tableTopMesh, el);

  // Dual Table Pedestals
  const pedRadius = 0.11;
  const pedGeo = new THREE.CylinderGeometry(pedRadius, pedRadius * 1.3, tableHeight, 14);
  const basePlateGeo = new THREE.BoxGeometry(
    isWide ? 0.6 : 0.9,
    0.06,
    isWide ? 0.9 : 0.6
  );

  const pedOffsets = isWide
    ? [[-tableW * 0.3, 0], [tableW * 0.3, 0]]
    : [[0, -tableD * 0.3], [0, tableD * 0.3]];

  pedOffsets.forEach(([px, pz]) => {
    const ped = new THREE.Mesh(pedGeo, metalLegMat);
    ped.position.set(px, tableHeight / 2, pz);
    elGroup.add(ped);

    const basePlate = new THREE.Mesh(basePlateGeo, metalLegMat);
    basePlate.position.set(px, 0.03, pz);
    elGroup.add(basePlate);
  });

  // Tableware on Booth Table
  if (showTableware) {
    // Center candle votive
    const votiveGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.26, 12);
    const votiveMesh = new THREE.Mesh(votiveGeo, glassMat);
    votiveMesh.position.set(0, tableHeight + 0.18, 0);
    elGroup.add(votiveMesh);

    const flameGeo = new THREE.ConeGeometry(0.035, 0.08, 8);
    const flameMesh = new THREE.Mesh(flameGeo, candleFlameMat);
    flameMesh.position.set(0, tableHeight + 0.34, 0);
    elGroup.add(flameMesh);

    // Place settings on the two bench sides
    const plateGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.02, 16);
    const glassGeo = new THREE.CylinderGeometry(0.045, 0.025, 0.25, 10);

    const seatPositions = isWide
      ? [
          [-tableW * 0.25, -tableD * 0.26],
          [tableW * 0.25, -tableD * 0.26],
          [-tableW * 0.25, tableD * 0.26],
          [tableW * 0.25, tableD * 0.26]
        ]
      : [
          [-tableW * 0.26, -tableD * 0.25],
          [-tableW * 0.26, tableD * 0.25],
          [tableW * 0.26, -tableD * 0.25],
          [tableW * 0.26, tableD * 0.25]
        ];

    seatPositions.forEach(([sx, sz]) => {
      const plate = new THREE.Mesh(plateGeo, el.status === 'vip' ? goldMat : whiteMat);
      plate.position.set(sx, tableHeight + 0.07, sz);
      elGroup.add(plate);

      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(sx + 0.16, tableHeight + 0.18, sz);
      elGroup.add(glass);
    });
  }

  // 2. The Two Opposing Upholstered Banquette Benches
  const benchDist = boothSpan * 0.36; // Distance from center

  const buildSingleBanquette = (isFacingPositive: boolean) => {
    const bGroup = new THREE.Group();

    // Kickplate base plinth
    const plinthGeo = new THREE.BoxGeometry(benchLength, 0.38, benchDepth);
    const plinthMesh = new THREE.Mesh(plinthGeo, boothBaseMat);
    plinthMesh.position.y = 0.19;
    bGroup.add(plinthMesh);

    // Deep plush seat cushion with rounded front
    const seatGeo = new THREE.BoxGeometry(benchLength, 0.38, benchDepth * 0.96);
    const seatMesh = new THREE.Mesh(seatGeo, boothLeatherMat);
    seatMesh.position.set(0, benchSeatHeight, 0);
    seatMesh.castShadow = true;
    seatMesh.receiveShadow = true;
    bGroup.add(seatMesh);
    interactiveMap.set(seatMesh, el);

    // Vertical Backrest Support Structure
    const backThickness = 0.28;
    const backHeight = benchTotalHeight - benchSeatHeight;
    const backZ = isFacingPositive ? -benchDepth * 0.42 : benchDepth * 0.42;

    const backGeo = new THREE.BoxGeometry(benchLength, backHeight, backThickness);
    const backMesh = new THREE.Mesh(backGeo, boothWoodFrameMat);
    backMesh.position.set(0, benchSeatHeight + backHeight / 2, backZ);
    backMesh.castShadow = true;
    bGroup.add(backMesh);

    // Vertical Channel-Tufted Cushion Flutes (Signature luxury booth detail)
    const numFlutes = 5;
    const fluteW = (benchLength * 0.96) / numFlutes;
    const fluteGeo = new THREE.BoxGeometry(fluteW * 0.94, backHeight * 0.94, 0.12);

    for (let f = 0; f < numFlutes; f++) {
      const fx = -benchLength * 0.48 + fluteW * (f + 0.5);
      const fluteMesh = new THREE.Mesh(fluteGeo, boothLeatherMat);
      const fz = isFacingPositive ? backZ + 0.15 : backZ - 0.15;
      fluteMesh.position.set(fx, benchSeatHeight + backHeight / 2, fz);
      bGroup.add(fluteMesh);
      interactiveMap.set(fluteMesh, el);
    }

    // Cylindrical Headrest Roll Cap along the top
    const rollGeo = new THREE.CylinderGeometry(0.14, 0.14, benchLength, 16);
    const rollMesh = new THREE.Mesh(rollGeo, boothLeatherMat);
    rollMesh.rotation.z = Math.PI / 2;
    rollMesh.position.set(0, benchTotalHeight + 0.05, backZ);
    rollMesh.castShadow = true;
    bGroup.add(rollMesh);

    // Side Privacy Wing Panels (End caps on left & right)
    const wingThickness = 0.12;
    const wingGeo = new THREE.BoxGeometry(wingThickness, benchTotalHeight * 1.02, benchDepth * 1.08);

    [-benchLength / 2, benchLength / 2].forEach((wx) => {
      const wingMesh = new THREE.Mesh(wingGeo, boothWoodFrameMat);
      wingMesh.position.set(wx, benchTotalHeight / 2, backZ / 2);
      wingMesh.castShadow = true;
      bGroup.add(wingMesh);
    });

    return bGroup;
  };

  // Add the two opposing banquettes
  if (isWide) {
    // Bench 1 (Top, facing +Z towards table)
    const bench1 = buildSingleBanquette(true);
    bench1.position.set(0, 0, -benchDist);
    elGroup.add(bench1);

    // Bench 2 (Bottom, facing -Z towards table)
    const bench2 = buildSingleBanquette(false);
    bench2.position.set(0, 0, benchDist);
    elGroup.add(bench2);
  } else {
    // Bench 1 (Left, facing +X towards table)
    const bench1 = buildSingleBanquette(true);
    bench1.rotation.y = -Math.PI / 2;
    bench1.position.set(-benchDist, 0, 0);
    elGroup.add(bench1);

    // Bench 2 (Right, facing -X towards table)
    const bench2 = buildSingleBanquette(false);
    bench2.rotation.y = -Math.PI / 2;
    bench2.position.set(benchDist, 0, 0);
    elGroup.add(bench2);
  }
}

/**
 * Builds realistic 3D tables, draped linens, formal tableware, Chiavari chairs, and decor.
 */
function createFurnitureMeshes(
  group: THREE.Group,
  elements: FloorElement[],
  scale: number,
  preset: LightingPreset,
  showTableware: boolean,
  interactiveMap: Map<THREE.Object3D, FloorElement>
) {
  // Rich Materials
  const woodTableMat = new THREE.MeshStandardMaterial({
    color: preset === 'banquet' ? 0x78350f : 0x854d0e,
    roughness: 0.32,
    metalness: 0.08
  });

  const whiteLinenMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.65,
    bumpScale: 0.05
  });

  const champagneLinenMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.6
  });

  const metalLegMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.2,
    metalness: 0.85
  });

  const goldMetallicMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.25,
    metalness: 0.9
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5
  });

  const candleFlameMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24
  });

  const chairWoodMat = new THREE.MeshStandardMaterial({
    color: preset === 'banquet' ? 0xd97706 : 0x3e1f0e, // Gold or Mahogany
    roughness: 0.35,
    metalness: 0.4
  });

  const chairCushionMat = new THREE.MeshStandardMaterial({
    color: preset === 'banquet' ? 0x991b1b : preset === 'evening' ? 0x4c1d95 : 0x1e40af, // Burgundy velvet
    roughness: 0.75
  });

  const stageWoodMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b18,
    roughness: 0.35
  });

  const stageVelvetMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    roughness: 0.85
  });

  const barCounterMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.15,
    metalness: 0.2
  });

  const plantFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.55
  });

  const plantPotMat = new THREE.MeshStandardMaterial({
    color: 0x9a3412,
    roughness: 0.5
  });

  const danceFloorTex = createCheckeredDanceFloorTexture();
  const danceFloorMat = new THREE.MeshStandardMaterial({
    map: danceFloorTex,
    roughness: 0.15,
    metalness: 0.25
  });

  const restroomSignTex = createRestroomSignTexture();
  const restroomSignMat = new THREE.MeshBasicMaterial({
    map: restroomSignTex,
    transparent: true
  });

  const exitSignTex = createEmergencyExitSignTexture();
  const exitSignMat = new THREE.MeshBasicMaterial({
    map: exitSignTex,
    transparent: true
  });

  const djConsoleTex = createDjConsoleTexture();
  const djConsoleMat = new THREE.MeshBasicMaterial({
    map: djConsoleTex
  });

  const posScreenTex = createPosScreenTexture();
  const posScreenMat = new THREE.MeshBasicMaterial({
    map: posScreenTex
  });

  const woodPlankDeckTex = createWoodPlankDeckTexture();
  const woodPlankDeckMat = new THREE.MeshStandardMaterial({
    map: woodPlankDeckTex,
    roughness: 0.55
  });

  // Architectural & Fixture Materials (High contrast & realistic, not black!)
  const drywallMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // Architectural off-white
    roughness: 0.85,
    metalness: 0.05
  });

  const halfWallCapMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Warm wood cap
    roughness: 0.35,
    metalness: 0.1
  });

  const glassPartitionMat = new THREE.MeshPhysicalMaterial({
    color: 0xf0f9ff,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5
  });

  const restroomWallMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Clean light slate commercial tile
    roughness: 0.4,
    metalness: 0.08
  });

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Architectural cast stone
    roughness: 0.7,
    metalness: 0.05
  });

  const stainlessSteelMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db, // Polished stainless steel
    roughness: 0.22,
    metalness: 0.88
  });

  const heatLampMat = new THREE.MeshBasicMaterial({
    color: 0xf97316 // Glowing heat lamp orange
  });

  const umbrellaFabricMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Warm golden canvas
    roughness: 0.65,
    metalness: 0.05
  });

  const pergolaTimberMat = new THREE.MeshStandardMaterial({
    color: 0x92400e, // Rich timber brown
    roughness: 0.6,
    metalness: 0.05
  });

  const floralBlossomMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6, // Pink floral
    roughness: 0.5
  });

  const floralCreamMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a, // Pale cream floral
    roughness: 0.5
  });

  const stoneDeckMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Flagstone / slate grey
    roughness: 0.8,
    metalness: 0.05
  });

  elements.forEach((el) => {
    const posX = (el.x + el.width / 2) * scale;
    const posZ = (el.y + el.height / 2) * scale;
    const width3D = el.width * scale;
    const depth3D = el.height * scale;
    const rotationRad = -(el.rotation || 0) * (Math.PI / 180);

    const elGroup = new THREE.Group();
    elGroup.position.set(posX, 0, posZ);
    elGroup.rotation.y = rotationRad;
    group.add(elGroup);

    // Associate object with floor element for 3D click raycasting
    interactiveMap.set(elGroup, el);

    if (el.type === 'table') {
      const tableHeight = 2.5; // Standard 30-inch dining height in feet
      const isDraped = el.covers >= 6 || el.shape === 'round';
      const linenMaterial = el.status === 'vip' ? champagneLinenMat : whiteLinenMat;

      if (el.shape === 'round') {
        const radius = width3D / 2;

        // Table Top Surface
        const topGeo = new THREE.CylinderGeometry(radius, radius, 0.14, 36);
        const topMesh = new THREE.Mesh(topGeo, isDraped ? linenMaterial : woodTableMat);
        topMesh.position.y = tableHeight;
        topMesh.castShadow = true;
        topMesh.receiveShadow = true;
        elGroup.add(topMesh);
        interactiveMap.set(topMesh, el);

        // Linen Draped Skirt
        if (isDraped) {
          const skirtGeo = new THREE.CylinderGeometry(radius * 0.99, radius * 1.05, 1.2, 36, 1, true);
          const skirtMesh = new THREE.Mesh(skirtGeo, linenMaterial);
          skirtMesh.position.y = tableHeight - 0.6;
          skirtMesh.castShadow = true;
          elGroup.add(skirtMesh);
        }

        // Center Pedestal Base
        const legRadius = Math.max(0.14, radius * 0.12);
        const legGeo = new THREE.CylinderGeometry(legRadius, legRadius * 1.25, tableHeight, 18);
        const legMesh = new THREE.Mesh(legGeo, metalLegMat);
        legMesh.position.y = tableHeight / 2;
        legMesh.castShadow = true;
        elGroup.add(legMesh);

        // Base Plate
        const baseGeo = new THREE.CylinderGeometry(radius * 0.58, radius * 0.62, 0.08, 28);
        const baseMesh = new THREE.Mesh(baseGeo, metalLegMat);
        baseMesh.position.y = 0.04;
        baseMesh.castShadow = true;
        elGroup.add(baseMesh);

        // Centerpiece: Warm Candle Votive & Flower Arrangement
        if (showTableware) {
          const vaseGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.5, 16);
          const vaseMesh = new THREE.Mesh(vaseGeo, glassMat);
          vaseMesh.position.y = tableHeight + 0.28;
          elGroup.add(vaseMesh);

          const candleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 12);
          const candleMesh = new THREE.Mesh(candleGeo, whiteLinenMat);
          candleMesh.position.y = tableHeight + 0.22;
          elGroup.add(candleMesh);

          const flameGeo = new THREE.ConeGeometry(0.04, 0.1, 10);
          const flameMesh = new THREE.Mesh(flameGeo, candleFlameMat);
          flameMesh.position.y = tableHeight + 0.44;
          elGroup.add(flameMesh);
        }
      } else if (el.shape === 'booth') {
        createLuxuryBooth3D(
          elGroup,
          width3D,
          depth3D,
          preset,
          woodTableMat,
          metalLegMat,
          interactiveMap,
          el,
          showTableware,
          glassMat,
          candleFlameMat,
          goldMetallicMat,
          whiteLinenMat
        );
      } else if (el.shape === 'bar') {
        // Premium Bar Counter
        const barHeight = 3.6;
        const counterGeo = new THREE.BoxGeometry(width3D, 0.18, depth3D);
        const counterMesh = new THREE.Mesh(counterGeo, barCounterMat);
        counterMesh.position.y = barHeight;
        counterMesh.castShadow = true;
        elGroup.add(counterMesh);
        interactiveMap.set(counterMesh, el);

        const panelGeo = new THREE.BoxGeometry(width3D * 0.98, barHeight, depth3D * 0.86);
        const panelMesh = new THREE.Mesh(panelGeo, stageWoodMat);
        panelMesh.position.y = barHeight / 2;
        panelMesh.castShadow = true;
        elGroup.add(panelMesh);

        // Footrail
        const railGeo = new THREE.CylinderGeometry(0.05, 0.05, width3D * 0.98, 12);
        const railMesh = new THREE.Mesh(railGeo, goldMetallicMat);
        railMesh.rotation.z = Math.PI / 2;
        railMesh.position.set(0, 0.6, depth3D * 0.48);
        elGroup.add(railMesh);
      } else {
        // Rectangle or Square Table
        const topGeo = new THREE.BoxGeometry(width3D, 0.14, depth3D);
        const topMesh = new THREE.Mesh(topGeo, isDraped ? linenMaterial : woodTableMat);
        topMesh.position.y = tableHeight;
        topMesh.castShadow = true;
        topMesh.receiveShadow = true;
        elGroup.add(topMesh);
        interactiveMap.set(topMesh, el);

        // Draped Linen Skirt for banquet rectangular tables
        if (isDraped) {
          const skirtGeo = new THREE.BoxGeometry(width3D * 0.99, 1.2, depth3D * 0.99);
          const skirtMesh = new THREE.Mesh(skirtGeo, linenMaterial);
          skirtMesh.position.y = tableHeight - 0.6;
          skirtMesh.castShadow = true;
          elGroup.add(skirtMesh);
        }

        // 4 Corner Legs
        const legRadius = 0.08;
        const offsetX = width3D / 2 - 0.28;
        const offsetZ = depth3D / 2 - 0.28;
        const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, tableHeight, 12);

        [
          [-offsetX, -offsetZ],
          [offsetX, -offsetZ],
          [offsetX, offsetZ],
          [-offsetX, offsetZ]
        ].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, metalLegMat);
          leg.position.set(lx, tableHeight / 2, lz);
          leg.castShadow = true;
          elGroup.add(leg);
        });

        // Center floral or candle arrangement
        if (showTableware) {
          const runnerGeo = new THREE.BoxGeometry(width3D * 0.75, 0.01, depth3D * 0.35);
          const runnerMesh = new THREE.Mesh(
            runnerGeo,
            el.status === 'vip' ? goldMetallicMat : champagneLinenMat
          );
          runnerMesh.position.y = tableHeight + 0.075;
          elGroup.add(runnerMesh);

          const votiveGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.3, 14);
          const votiveMesh = new THREE.Mesh(votiveGeo, glassMat);
          votiveMesh.position.y = tableHeight + 0.22;
          elGroup.add(votiveMesh);
        }
      }

      // Add 3D Chairs and Table Settings around the table
      if (el.shape !== 'booth' && el.covers > 0) {
        const chairs = getChairPositions(el.shape, el.width, el.height, el.covers);
        const removedSet = new Set(el.removedChairs || []);

        chairs.forEach((ch, idx) => {
          if (removedSet.has(idx)) return;

          const chairX = ch.x * scale;
          const chairZ = ch.y * scale;
          const chairRot = -(ch.rotation * Math.PI) / 180;

          const chairGroup = new THREE.Group();
          chairGroup.position.set(chairX, 0, chairZ);
          chairGroup.rotation.y = chairRot;
          elGroup.add(chairGroup);

          // Seat cushion
          const seatHeight = 1.48;
          const seatGeo = new THREE.BoxGeometry(0.85, 0.12, 0.85);
          const seatMesh = new THREE.Mesh(seatGeo, chairCushionMat);
          seatMesh.position.y = seatHeight;
          seatMesh.castShadow = true;
          chairGroup.add(seatMesh);

          // Backrest with Chiavari cross-slat styling
          const backGeo = new THREE.BoxGeometry(0.85, 1.3, 0.08);
          const backMesh = new THREE.Mesh(backGeo, chairWoodMat);
          backMesh.position.set(0, seatHeight + 0.65, -0.38);
          backMesh.castShadow = true;
          chairGroup.add(backMesh);

          // Vertical Spindles inside backrest
          for (let sp = -0.28; sp <= 0.28; sp += 0.18) {
            const spindleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8);
            const spindle = new THREE.Mesh(spindleGeo, chairWoodMat);
            spindle.position.set(sp, seatHeight + 0.6, -0.38);
            chairGroup.add(spindle);
          }

          // 4 Chair Legs
          const chairLegGeo = new THREE.CylinderGeometry(0.04, 0.03, seatHeight, 10);
          [
            [-0.34, -0.34],
            [0.34, -0.34],
            [0.34, 0.34],
            [-0.34, 0.34]
          ].forEach(([cx, cz]) => {
            const leg = new THREE.Mesh(chairLegGeo, chairWoodMat);
            leg.position.set(cx, seatHeight / 2, cz);
            chairGroup.add(leg);
          });

          // Tableware in front of this seat (Plate + Wine Glass)
          if (showTableware) {
            const plateDist = 0.55;
            const plateX = chairX - Math.sin(-chairRot) * plateDist;
            const plateZ = chairZ - Math.cos(-chairRot) * plateDist;

            // Charger Plate
            const plateGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.02, 20);
            const plateMesh = new THREE.Mesh(
              plateGeo,
              el.status === 'vip' ? goldMetallicMat : whiteLinenMat
            );
            plateMesh.position.set(plateX, tableHeight + 0.08, plateZ);
            elGroup.add(plateMesh);

            // Wine glass beside plate
            const glassGeo = new THREE.CylinderGeometry(0.06, 0.03, 0.35, 12);
            const glassMesh = new THREE.Mesh(glassGeo, glassMat);
            glassMesh.position.set(plateX + 0.22, tableHeight + 0.25, plateZ - 0.1);
            elGroup.add(glassMesh);
          }
        });
      }
    } else {
      const subtype = getElementSubtype(el);

      if (subtype === 'fixture-restrooms') {
        const kioskH = 7.2;
        // Main architectural kiosk body (clean modern off-white commercial tile finish)
        const bodyGeo = new THREE.BoxGeometry(width3D, kioskH, depth3D);
        const bodyMesh = new THREE.Mesh(bodyGeo, restroomWallMat);
        bodyMesh.position.y = kioskH / 2;
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        elGroup.add(bodyMesh);
        interactiveMap.set(bodyMesh, el);

        // Brushed aluminum base plinth & top cap
        const plinthGeo = new THREE.BoxGeometry(width3D + 0.12, 0.25, depth3D + 0.12);
        const plinthMesh = new THREE.Mesh(plinthGeo, metalLegMat);
        plinthMesh.position.y = 0.125;
        elGroup.add(plinthMesh);

        const capGeo = new THREE.BoxGeometry(width3D + 0.12, 0.2, depth3D + 0.12);
        const capMesh = new THREE.Mesh(capGeo, metalLegMat);
        capMesh.position.y = kioskH;
        elGroup.add(capMesh);

        // High-contrast illuminated signage plaque on Front & Back
        const signW = Math.min(width3D * 0.88, 3.8);
        const signH = signW * 0.5;
        const signGeo = new THREE.PlaneGeometry(signW, signH);

        // Front Sign Plaque
        const frontSignMesh = new THREE.Mesh(signGeo, restroomSignMat);
        frontSignMesh.position.set(0, 4.6, depth3D / 2 + 0.03);
        elGroup.add(frontSignMesh);
        interactiveMap.set(frontSignMesh, el);

        // Back Sign Plaque
        const backSignMesh = new THREE.Mesh(signGeo, restroomSignMat);
        backSignMesh.rotation.y = Math.PI;
        backSignMesh.position.set(0, 4.6, -depth3D / 2 - 0.03);
        elGroup.add(backSignMesh);
        interactiveMap.set(backSignMesh, el);

        // Cantilevered modern light sconce above both signs
        const sconceGeo = new THREE.BoxGeometry(signW * 1.05, 0.12, 0.25);
        const sconceFront = new THREE.Mesh(sconceGeo, goldMetallicMat);
        sconceFront.position.set(0, 4.6 + signH / 2 + 0.15, depth3D / 2 + 0.12);
        elGroup.add(sconceFront);

        const sconceBack = new THREE.Mesh(sconceGeo, goldMetallicMat);
        sconceBack.position.set(0, 4.6 + signH / 2 + 0.15, -depth3D / 2 - 0.12);
        elGroup.add(sconceBack);

        // Subtle recessed stall doors on the front face
        const stallW = Math.min(width3D * 0.38, 2.4);
        const stallH = kioskH * 0.68;
        const stallGeo = new THREE.BoxGeometry(stallW, stallH, 0.04);

        const stall1 = new THREE.Mesh(stallGeo, whiteLinenMat);
        stall1.position.set(-width3D * 0.24, kioskH * 0.4, depth3D / 2 + 0.015);
        elGroup.add(stall1);

        const stall2 = new THREE.Mesh(stallGeo, whiteLinenMat);
        stall2.position.set(width3D * 0.24, kioskH * 0.4, depth3D / 2 + 0.015);
        elGroup.add(stall2);

        // Vertical handles on stall doors
        const handleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8);
        const h1 = new THREE.Mesh(handleGeo, stainlessSteelMat);
        h1.position.set(-width3D * 0.24 + stallW * 0.38, kioskH * 0.4, depth3D / 2 + 0.05);
        elGroup.add(h1);

        const h2 = new THREE.Mesh(handleGeo, stainlessSteelMat);
        h2.position.set(width3D * 0.24 - stallW * 0.38, kioskH * 0.4, depth3D / 2 + 0.05);
        elGroup.add(h2);
      } else if (subtype === 'door-emergency') {
        const doorH = 7.4;
        const frameGeo = new THREE.BoxGeometry(width3D, doorH, 0.4);
        const frameMesh = new THREE.Mesh(frameGeo, metalLegMat);
        frameMesh.position.y = doorH / 2;
        frameMesh.castShadow = true;
        elGroup.add(frameMesh);
        interactiveMap.set(frameMesh, el);

        // Door slab
        const slabGeo = new THREE.BoxGeometry(width3D * 0.88, doorH * 0.94, 0.16);
        const slabMesh = new THREE.Mesh(slabGeo, restroomWallMat);
        slabMesh.position.y = doorH / 2;
        elGroup.add(slabMesh);

        // Panic crash push-bar
        const barGeo = new THREE.CylinderGeometry(0.04, 0.04, width3D * 0.75, 12);
        const barMesh = new THREE.Mesh(barGeo, stainlessSteelMat);
        barMesh.rotation.z = Math.PI / 2;
        barMesh.position.set(0, 3.2, 0.15);
        elGroup.add(barMesh);

        // Illuminated 3D Exit Sign Box
        const exitBoxGeo = new THREE.BoxGeometry(Math.min(width3D * 0.85, 3.2), 1.05, 0.25);
        const exitSignMesh = new THREE.Mesh(exitBoxGeo, exitSignMat);
        exitSignMesh.position.set(0, doorH + 0.6, 0);
        elGroup.add(exitSignMesh);
      } else if (subtype === 'door-single') {
        const doorH = 7.2;
        const frameGeo = new THREE.BoxGeometry(width3D, doorH, 0.35);
        const frameMesh = new THREE.Mesh(frameGeo, metalLegMat);
        frameMesh.position.y = doorH / 2;
        frameMesh.castShadow = true;
        elGroup.add(frameMesh);
        interactiveMap.set(frameMesh, el);

        // Open door leaf swung 25°
        const leafW = width3D * 0.85;
        const leafGroup = new THREE.Group();
        leafGroup.position.set(-width3D * 0.42, 0, 0);
        leafGroup.rotation.y = -0.45;
        elGroup.add(leafGroup);

        const leafGeo = new THREE.BoxGeometry(leafW, doorH * 0.96, 0.12);
        const leafMesh = new THREE.Mesh(leafGeo, woodTableMat);
        leafMesh.position.set(leafW / 2, doorH / 2, 0);
        leafMesh.castShadow = true;
        leafGroup.add(leafMesh);

        // Lever handle
        const leverGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8);
        const leverMesh = new THREE.Mesh(leverGeo, goldMetallicMat);
        leverMesh.rotation.z = Math.PI / 2;
        leverMesh.position.set(leafW - 0.2, 3.2, 0.1);
        leafGroup.add(leverMesh);
      } else if (subtype === 'door-double') {
        const doorH = 7.5;
        const frameGeo = new THREE.BoxGeometry(width3D, doorH, 0.4);
        const frameMesh = new THREE.Mesh(frameGeo, metalLegMat);
        frameMesh.position.y = doorH / 2;
        frameMesh.castShadow = true;
        elGroup.add(frameMesh);
        interactiveMap.set(frameMesh, el);

        const leafW = width3D * 0.44;
        [-width3D * 0.23, width3D * 0.23].forEach((lx) => {
          const leafGeo = new THREE.BoxGeometry(leafW, doorH * 0.95, 0.12);
          const leafMesh = new THREE.Mesh(leafGeo, woodTableMat);
          leafMesh.position.set(lx, doorH / 2, 0);
          leafMesh.castShadow = true;
          elGroup.add(leafMesh);

          // Vertical pull handle
          const pullGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8);
          const pullMesh = new THREE.Mesh(pullGeo, stainlessSteelMat);
          pullMesh.position.set(lx + (lx > 0 ? -leafW * 0.35 : leafW * 0.35), 3.4, 0.12);
          elGroup.add(pullMesh);
        });
      } else if (subtype === 'door-sliding') {
        const doorH = 7.4;
        const frameGeo = new THREE.BoxGeometry(width3D, doorH, 0.3);
        const frameMesh = new THREE.Mesh(frameGeo, metalLegMat);
        frameMesh.position.y = doorH / 2;
        elGroup.add(frameMesh);
        interactiveMap.set(frameMesh, el);

        // Glass sliding panels
        const panelW = width3D * 0.48;
        const p1 = new THREE.Mesh(new THREE.BoxGeometry(panelW, doorH * 0.94, 0.08), glassPartitionMat);
        p1.position.set(-width3D * 0.22, doorH / 2, 0.04);
        elGroup.add(p1);

        const p2 = new THREE.Mesh(new THREE.BoxGeometry(panelW, doorH * 0.94, 0.08), glassPartitionMat);
        p2.position.set(width3D * 0.22, doorH / 2, -0.04);
        elGroup.add(p2);
      } else if (subtype === 'opening-arch') {
        const openH = 8.5;
        const jambW = Math.max(0.4, width3D * 0.12);
        // Left & Right Jambs
        const jambGeo = new THREE.BoxGeometry(jambW, openH, depth3D);
        const leftJamb = new THREE.Mesh(jambGeo, drywallMat);
        leftJamb.position.set(-width3D / 2 + jambW / 2, openH / 2, 0);
        elGroup.add(leftJamb);

        const rightJamb = new THREE.Mesh(jambGeo, drywallMat);
        rightJamb.position.set(width3D / 2 - jambW / 2, openH / 2, 0);
        elGroup.add(rightJamb);

        // Overhead Header Arch
        const headerGeo = new THREE.BoxGeometry(width3D, 1.4, depth3D);
        const header = new THREE.Mesh(headerGeo, drywallMat);
        header.position.set(0, openH - 0.7, 0);
        elGroup.add(header);
        interactiveMap.set(header, el);
      } else if (subtype === 'window-exterior') {
        const winH = 5.0;
        const sillH = 2.4;
        // Lower wall sill
        const sillGeo = new THREE.BoxGeometry(width3D, sillH, depth3D);
        const sillMesh = new THREE.Mesh(sillGeo, drywallMat);
        sillMesh.position.y = sillH / 2;
        elGroup.add(sillMesh);

        // Glass pane
        const glassGeo = new THREE.BoxGeometry(width3D * 0.96, winH, 0.12);
        const glassMesh = new THREE.Mesh(glassGeo, glassPartitionMat);
        glassMesh.position.y = sillH + winH / 2;
        elGroup.add(glassMesh);
        interactiveMap.set(glassMesh, el);

        // Muntin dividers
        const muntinV = new THREE.Mesh(new THREE.BoxGeometry(0.08, winH, 0.16), metalLegMat);
        muntinV.position.y = sillH + winH / 2;
        elGroup.add(muntinV);
      } else if (subtype === 'wall-solid') {
        const wallH = 8.5;
        const wallGeo = new THREE.BoxGeometry(width3D, wallH, depth3D);
        const wallMesh = new THREE.Mesh(wallGeo, drywallMat);
        wallMesh.position.y = wallH / 2;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        elGroup.add(wallMesh);
        interactiveMap.set(wallMesh, el);

        // Bottom baseboard trim
        const trimGeo = new THREE.BoxGeometry(width3D + 0.05, 0.4, depth3D + 0.05);
        const trimMesh = new THREE.Mesh(trimGeo, metalLegMat);
        trimMesh.position.y = 0.2;
        elGroup.add(trimMesh);
      } else if (subtype === 'wall-half') {
        const halfH = 3.5;
        const halfGeo = new THREE.BoxGeometry(width3D, halfH, depth3D);
        const halfMesh = new THREE.Mesh(halfGeo, drywallMat);
        halfMesh.position.y = halfH / 2;
        halfMesh.castShadow = true;
        elGroup.add(halfMesh);
        interactiveMap.set(halfMesh, el);

        // Finished wood cap rail
        const capGeo = new THREE.BoxGeometry(width3D + 0.15, 0.16, depth3D + 0.15);
        const capMesh = new THREE.Mesh(capGeo, halfWallCapMat);
        capMesh.position.y = halfH + 0.08;
        elGroup.add(capMesh);
      } else if (subtype === 'wall-glass') {
        const glassH = 5.5;
        const glassGeo = new THREE.BoxGeometry(width3D, glassH, depth3D * 0.4);
        const glassMesh = new THREE.Mesh(glassGeo, glassPartitionMat);
        glassMesh.position.y = glassH / 2 + 0.2;
        elGroup.add(glassMesh);
        interactiveMap.set(glassMesh, el);

        // Stainless base shoe channel
        const baseGeo = new THREE.BoxGeometry(width3D + 0.1, 0.2, depth3D * 0.6);
        const baseMesh = new THREE.Mesh(baseGeo, stainlessSteelMat);
        baseMesh.position.y = 0.1;
        elGroup.add(baseMesh);
      } else if (subtype === 'column-round') {
        const radius = Math.max(0.4, width3D / 2);
        const colH = 12;
        const colGeo = new THREE.CylinderGeometry(radius, radius, colH, 32);
        const colMesh = new THREE.Mesh(colGeo, concreteMat);
        colMesh.position.y = colH / 2;
        colMesh.castShadow = true;
        elGroup.add(colMesh);
        interactiveMap.set(colMesh, el);

        // Base & Capital rings
        const ringGeo = new THREE.CylinderGeometry(radius * 1.15, radius * 1.25, 0.4, 32);
        const baseRing = new THREE.Mesh(ringGeo, concreteMat);
        baseRing.position.y = 0.2;
        elGroup.add(baseRing);
      } else if (subtype === 'column-square') {
        const colH = 12;
        const colGeo = new THREE.BoxGeometry(width3D, colH, depth3D);
        const colMesh = new THREE.Mesh(colGeo, concreteMat);
        colMesh.position.y = colH / 2;
        colMesh.castShadow = true;
        elGroup.add(colMesh);
        interactiveMap.set(colMesh, el);

        const baseGeo = new THREE.BoxGeometry(width3D * 1.15, 0.4, depth3D * 1.15);
        const baseMesh = new THREE.Mesh(baseGeo, concreteMat);
        baseMesh.position.y = 0.2;
        elGroup.add(baseMesh);
      } else if (subtype === 'fixture-host') {
        const hostH = 3.8;
        const podiumGeo = new THREE.BoxGeometry(width3D, hostH, depth3D);
        const podiumMesh = new THREE.Mesh(podiumGeo, woodTableMat);
        podiumMesh.position.y = hostH / 2;
        podiumMesh.castShadow = true;
        elGroup.add(podiumMesh);
        interactiveMap.set(podiumMesh, el);

        // Slanted top reading shelf
        const shelfGeo = new THREE.BoxGeometry(width3D * 0.9, 0.08, depth3D * 0.9);
        const shelfMesh = new THREE.Mesh(shelfGeo, barCounterMat);
        shelfMesh.rotation.x = 0.2;
        shelfMesh.position.set(0, hostH + 0.1, 0);
        elGroup.add(shelfMesh);

        // Guest check tablet display
        const tabletGeo = new THREE.BoxGeometry(width3D * 0.45, 0.04, depth3D * 0.45);
        const tabletMesh = new THREE.Mesh(tabletGeo, posScreenMat);
        tabletMesh.rotation.x = 0.2;
        tabletMesh.position.set(0, hostH + 0.18, 0);
        elGroup.add(tabletMesh);

        // Brass front plaque
        const plaqueGeo = new THREE.BoxGeometry(width3D * 0.6, 0.35, 0.04);
        const plaqueMesh = new THREE.Mesh(plaqueGeo, goldMetallicMat);
        plaqueMesh.position.set(0, hostH * 0.75, depth3D / 2 + 0.02);
        elGroup.add(plaqueMesh);
      } else if (subtype === 'fixture-pos') {
        const posH = 3.2;
        const cabinetGeo = new THREE.BoxGeometry(width3D, posH, depth3D);
        const cabinetMesh = new THREE.Mesh(cabinetGeo, woodTableMat);
        cabinetMesh.position.y = posH / 2;
        cabinetMesh.castShadow = true;
        elGroup.add(cabinetMesh);
        interactiveMap.set(cabinetMesh, el);

        // POS screen terminal on articulated stem
        const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 10);
        const stem = new THREE.Mesh(stemGeo, metalLegMat);
        stem.position.set(0, posH + 0.3, 0);
        elGroup.add(stem);

        const screenGeo = new THREE.BoxGeometry(Math.min(width3D * 0.65, 1.4), 1.0, 0.08);
        const screenMesh = new THREE.Mesh(screenGeo, posScreenMat);
        screenMesh.rotation.x = -0.3;
        screenMesh.position.set(0, posH + 0.7, 0);
        elGroup.add(screenMesh);
      } else if (subtype === 'fixture-dj') {
        const deskH = 3.4;
        const deskGeo = new THREE.BoxGeometry(width3D, deskH, depth3D);
        const deskMesh = new THREE.Mesh(deskGeo, barCounterMat);
        deskMesh.position.y = deskH / 2;
        deskMesh.castShadow = true;
        elGroup.add(deskMesh);
        interactiveMap.set(deskMesh, el);

        // Turntable and mixer console surface
        const consoleGeo = new THREE.PlaneGeometry(width3D * 0.95, depth3D * 0.92);
        const consoleMesh = new THREE.Mesh(consoleGeo, djConsoleMat);
        consoleMesh.rotation.x = -Math.PI / 2;
        consoleMesh.position.set(0, deskH + 0.02, 0);
        elGroup.add(consoleMesh);

        // Dual studio monitor speakers on rear corners
        [-width3D * 0.42, width3D * 0.42].forEach((sx) => {
          const spkGeo = new THREE.BoxGeometry(0.6, 0.9, 0.6);
          const spkMesh = new THREE.Mesh(spkGeo, metalLegMat);
          spkMesh.position.set(sx, deskH + 0.55, -depth3D * 0.35);
          elGroup.add(spkMesh);
        });
      } else if (subtype === 'fixture-buffet') {
        const tableH = 2.6;
        const tableGeo = new THREE.BoxGeometry(width3D, tableH, depth3D);
        const tableMesh = new THREE.Mesh(tableGeo, whiteLinenMat);
        tableMesh.position.y = tableH / 2;
        tableMesh.castShadow = true;
        elGroup.add(tableMesh);
        interactiveMap.set(tableMesh, el);

        // Stainless steel chafing dishes
        const numDishes = Math.max(2, Math.floor(width3D / 1.8));
        const spacing = width3D / (numDishes + 1);
        for (let i = 1; i <= numDishes; i++) {
          const cx = -width3D / 2 + i * spacing;
          // Warming pan base
          const panGeo = new THREE.BoxGeometry(1.2, 0.25, depth3D * 0.55);
          const panMesh = new THREE.Mesh(panGeo, stainlessSteelMat);
          panMesh.position.set(cx, tableH + 0.14, 0);
          elGroup.add(panMesh);

          // Domed roll-top lid
          const lidGeo = new THREE.CylinderGeometry(depth3D * 0.25, depth3D * 0.25, 1.15, 16, 1, false, 0, Math.PI);
          const lidMesh = new THREE.Mesh(lidGeo, stainlessSteelMat);
          lidMesh.rotation.z = Math.PI / 2;
          lidMesh.position.set(cx, tableH + 0.38, 0);
          elGroup.add(lidMesh);
        }

        // Overhead sneeze guard
        const guardGeo = new THREE.BoxGeometry(width3D * 0.95, 0.04, depth3D * 0.5);
        const guardMesh = new THREE.Mesh(guardGeo, glassPartitionMat);
        guardMesh.position.set(0, tableH + 1.2, 0);
        elGroup.add(guardMesh);
      } else if (subtype === 'fixture-kitchen') {
        const passH = 3.2;
        const counterGeo = new THREE.BoxGeometry(width3D, passH, depth3D);
        const counterMesh = new THREE.Mesh(counterGeo, stainlessSteelMat);
        counterMesh.position.y = passH / 2;
        counterMesh.castShadow = true;
        elGroup.add(counterMesh);
        interactiveMap.set(counterMesh, el);

        // Overhead stainless gantry rack with heat lamps
        const rackGeo = new THREE.BoxGeometry(width3D, 0.12, depth3D * 0.6);
        const rackMesh = new THREE.Mesh(rackGeo, stainlessSteelMat);
        rackMesh.position.set(0, passH + 1.6, 0);
        elGroup.add(rackMesh);

        // Glowing heat lamps
        [-width3D * 0.3, 0, width3D * 0.3].forEach((lx) => {
          const lampGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.3, 12);
          const lampMesh = new THREE.Mesh(lampGeo, heatLampMat);
          lampMesh.position.set(lx, passH + 1.35, 0);
          elGroup.add(lampMesh);
        });
      } else if (subtype === 'fixture-bar' || el.shape === 'bar') {
        const barH = 3.6;
        const counterGeo = new THREE.BoxGeometry(width3D, 0.18, depth3D);
        const counterMesh = new THREE.Mesh(counterGeo, barCounterMat);
        counterMesh.position.y = barH;
        counterMesh.castShadow = true;
        elGroup.add(counterMesh);
        interactiveMap.set(counterMesh, el);

        const panelGeo = new THREE.BoxGeometry(width3D * 0.98, barH, depth3D * 0.86);
        const panelMesh = new THREE.Mesh(panelGeo, stageWoodMat);
        panelMesh.position.y = barH / 2;
        panelMesh.castShadow = true;
        elGroup.add(panelMesh);

        // Brass footrail
        const railGeo = new THREE.CylinderGeometry(0.05, 0.05, width3D * 0.98, 12);
        const railMesh = new THREE.Mesh(railGeo, goldMetallicMat);
        railMesh.rotation.z = Math.PI / 2;
        railMesh.position.set(0, 0.6, depth3D * 0.48);
        elGroup.add(railMesh);

        // Bar stools if covers > 0
        if (el.covers > 0) {
          const stoolSpacing = width3D / (el.covers + 1);
          for (let s = 1; s <= el.covers; s++) {
            const sx = -width3D / 2 + s * stoolSpacing;
            const stoolGroup = new THREE.Group();
            stoolGroup.position.set(sx, 0, depth3D * 0.65);
            elGroup.add(stoolGroup);

            // Stool cushion
            const stoolSeat = new THREE.Mesh(
              new THREE.CylinderGeometry(0.42, 0.42, 0.12, 20),
              chairCushionMat
            );
            stoolSeat.position.y = 2.45;
            stoolGroup.add(stoolSeat);

            // Stool metal pedestal stem & base
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 10), metalLegMat);
            stem.position.y = 1.2;
            stoolGroup.add(stem);

            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.05, 20), metalLegMat);
            base.position.y = 0.025;
            stoolGroup.add(base);
          }
        }
      } else if (subtype === 'fixture-stage' || el.name.toLowerCase().includes('stage')) {
        const stageH = 1.8;
        const stageGeo = new THREE.BoxGeometry(width3D, stageH, depth3D);
        const stageMesh = new THREE.Mesh(stageGeo, stageWoodMat);
        stageMesh.position.y = stageH / 2;
        stageMesh.castShadow = true;
        stageMesh.receiveShadow = true;
        elGroup.add(stageMesh);
        interactiveMap.set(stageMesh, el);

        // Front velvet drape
        const skirtGeo = new THREE.BoxGeometry(width3D, stageH, 0.08);
        const skirtMesh = new THREE.Mesh(skirtGeo, stageVelvetMat);
        skirtMesh.position.set(0, stageH / 2, depth3D / 2 + 0.04);
        elGroup.add(skirtMesh);

        // Center mic stand
        const micBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.04, 16), metalLegMat);
        micBase.position.set(0, stageH + 0.02, 0);
        elGroup.add(micBase);

        const micPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.8, 8), metalLegMat);
        micPole.position.set(0, stageH + 1.9, 0);
        elGroup.add(micPole);
      } else if (subtype === 'fixture-dance-floor') {
        const h = 0.2;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width3D, h, depth3D), danceFloorMat);
        mesh.position.y = h / 2;
        mesh.receiveShadow = true;
        elGroup.add(mesh);
        interactiveMap.set(mesh, el);

        const rampGeo = new THREE.BoxGeometry(width3D + 0.4, 0.1, depth3D + 0.4);
        const rampMesh = new THREE.Mesh(rampGeo, goldMetallicMat);
        rampMesh.position.y = 0.05;
        rampMesh.receiveShadow = true;
        elGroup.add(rampMesh);
      } else if (subtype === 'deck-wood') {
        const deckH = 0.25;
        const deckGeo = new THREE.BoxGeometry(width3D, deckH, depth3D);
        const deckMesh = new THREE.Mesh(deckGeo, woodPlankDeckMat);
        deckMesh.position.y = deckH / 2;
        deckMesh.receiveShadow = true;
        elGroup.add(deckMesh);
        interactiveMap.set(deckMesh, el);

        // Perimeter framing rim
        const rimGeo = new THREE.BoxGeometry(width3D + 0.2, 0.28, depth3D + 0.2);
        const rimMesh = new THREE.Mesh(rimGeo, halfWallCapMat);
        rimMesh.position.y = deckH / 2;
        elGroup.add(rimMesh);
      } else if (subtype === 'deck-stone') {
        const deckH = 0.2;
        const deckGeo = new THREE.BoxGeometry(width3D, deckH, depth3D);
        const deckMesh = new THREE.Mesh(deckGeo, stoneDeckMat);
        deckMesh.position.y = deckH / 2;
        deckMesh.receiveShadow = true;
        elGroup.add(deckMesh);
        interactiveMap.set(deckMesh, el);
      } else if (subtype === 'outdoor-umbrella') {
        // Heavy base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.1, 24), metalLegMat);
        base.position.y = 0.05;
        elGroup.add(base);
        interactiveMap.set(base, el);

        // Mast pole
        const mastH = 8.6;
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, mastH, 12), metalLegMat);
        mast.position.y = mastH / 2;
        elGroup.add(mast);

        // Fabric canopy cone
        const canopyR = Math.min(width3D, depth3D) * 0.48;
        const canopy = new THREE.Mesh(new THREE.ConeGeometry(canopyR, 1.6, 8), umbrellaFabricMat);
        canopy.position.y = mastH - 0.5;
        elGroup.add(canopy);
      } else if (subtype === 'outdoor-pergola') {
        const postH = 8.5;
        const postW = 0.35;
        // 4 corner timber posts
        [
          [-width3D / 2 + postW, -depth3D / 2 + postW],
          [width3D / 2 - postW, -depth3D / 2 + postW],
          [width3D / 2 - postW, depth3D / 2 - postW],
          [-width3D / 2 + postW, depth3D / 2 - postW]
        ].forEach(([px, pz]) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(postW, postH, postW), pergolaTimberMat);
          post.position.set(px, postH / 2, pz);
          elGroup.add(post);
        });

        // Top beams & cross rafters
        const beamGeo = new THREE.BoxGeometry(width3D, 0.3, 0.2);
        const b1 = new THREE.Mesh(beamGeo, pergolaTimberMat);
        b1.position.set(0, postH - 0.15, -depth3D / 2 + postW);
        elGroup.add(b1);

        const b2 = new THREE.Mesh(beamGeo, pergolaTimberMat);
        b2.position.set(0, postH - 0.15, depth3D / 2 - postW);
        elGroup.add(b2);

        // Transverse slatted rafters
        for (let rx = -width3D / 2 + 1; rx <= width3D / 2 - 1; rx += 1.4) {
          const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, depth3D), pergolaTimberMat);
          rafter.position.set(rx, postH + 0.12, 0);
          elGroup.add(rafter);
        }
        interactiveMap.set(b1, el);
      } else if (subtype === 'plant-potted' || subtype === 'plant-palm' || subtype === 'plant-box') {
        const potRadius = Math.min(width3D, depth3D) * 0.45;
        const potH = 1.8;
        const potGeo = new THREE.CylinderGeometry(potRadius, potRadius * 0.72, potH, 20);
        const potMesh = new THREE.Mesh(potGeo, plantPotMat);
        potMesh.position.y = potH / 2;
        potMesh.castShadow = true;
        elGroup.add(potMesh);
        interactiveMap.set(potMesh, el);

        for (let i = 0; i < 3; i++) {
          const leafGeo = new THREE.SphereGeometry(potRadius * 1.2, 16, 14);
          const leafMesh = new THREE.Mesh(leafGeo, plantFoliageMat);
          leafMesh.position.set((i - 1) * 0.3, potH + potRadius * (1 + i * 0.3), i % 2 === 0 ? 0.2 : -0.2);
          leafMesh.castShadow = true;
          elGroup.add(leafMesh);
        }
      } else if (subtype === 'plant-green-wall') {
        const wallH = 7.5;
        const wall = new THREE.Mesh(new THREE.BoxGeometry(width3D, wallH, depth3D), plantFoliageMat);
        wall.position.y = wallH / 2;
        elGroup.add(wall);
        interactiveMap.set(wall, el);
      } else if (subtype === 'decor-photo-backdrop') {
        const archH = 8.0;
        const archGeo = new THREE.BoxGeometry(width3D, archH, 0.2);
        const archMesh = new THREE.Mesh(archGeo, stageWoodMat);
        archMesh.position.y = archH / 2;
        elGroup.add(archMesh);
        interactiveMap.set(archMesh, el);

        // Floral garland clusters
        for (let f = 0; f < 8; f++) {
          const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 12, 10),
            f % 2 === 0 ? floralBlossomMat : floralCreamMat
          );
          const fx = -width3D / 2 + (f / 7) * width3D;
          const fy = archH - Math.sin((f / 7) * Math.PI) * 1.5;
          flower.position.set(fx, fy, 0.18);
          elGroup.add(flower);
        }
      } else {
        // Default clean architectural fixture / partition (NEVER generic pitch black!)
        const h = 2.4;
        const box = new THREE.Mesh(new THREE.BoxGeometry(width3D, h, depth3D), drywallMat);
        box.position.y = h / 2;
        box.castShadow = true;
        elGroup.add(box);
        interactiveMap.set(box, el);

        const trim = new THREE.Mesh(new THREE.BoxGeometry(width3D + 0.05, 0.25, depth3D + 0.05), metalLegMat);
        trim.position.y = 0.125;
        elGroup.add(trim);
      }
    }
  });
}

/**
 * Creates floating 3D Scene Badges for tables, restrooms, exits, and venue fixtures.
 */
function createTableLabels(
  group: THREE.Group,
  elements: FloorElement[],
  scale: number,
  visible: boolean
) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  elements.forEach((el) => {
    const subtype = getElementSubtype(el);
    const posX = (el.x + el.width / 2) * scale;
    const posZ = (el.y + el.height / 2) * scale;

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let title = '';
    let subtitle = '';
    let bgColor = 'rgba(15, 23, 42, 0.94)';
    let borderColor = '#6366f1';
    let labelElevation = 4.5;
    let spriteScale = { x: 3.4, y: 1.6 };

    if (el.type === 'table' && subtype !== 'fixture-bar') {
      title = el.name || 'Table';
      const statusTxt = el.status === 'vip' ? '★ VIP • ' : el.status === 'reserved' ? 'Reserved • ' : '';
      subtitle = `${statusTxt}${el.covers} Seats`;
      borderColor = el.status === 'vip' ? '#f59e0b' : el.status === 'reserved' ? '#ec4899' : '#6366f1';
      labelElevation = 4.5;
    } else if (subtype === 'fixture-restrooms') {
      bgColor = 'rgba(2, 132, 199, 0.96)'; // Rich commercial restroom cyan
      borderColor = '#38bdf8';
      title = '🚻 ♿ RESTROOMS';
      subtitle = 'Guest Facilities • Accessible';
      labelElevation = 8.6;
      spriteScale = { x: 3.8, y: 1.8 };
    } else if (subtype === 'door-emergency') {
      bgColor = 'rgba(21, 128, 61, 0.96)'; // Emergency exit green
      borderColor = '#4ade80';
      title = '🚨 EXIT ➔';
      subtitle = 'Emergency Egress Only';
      labelElevation = 8.6;
      spriteScale = { x: 3.6, y: 1.7 };
    } else if (subtype === 'fixture-host') {
      bgColor = 'rgba(30, 41, 59, 0.95)';
      borderColor = '#cbd5e1';
      title = '🎩 HOST STAND';
      subtitle = 'Reception & Welcome';
      labelElevation = 5.6;
    } else if (subtype === 'fixture-dj') {
      bgColor = 'rgba(30, 27, 75, 0.96)';
      borderColor = '#818cf8';
      title = '🎧 DJ BOOTH';
      subtitle = 'Audio & Lighting Console';
      labelElevation = 5.6;
    } else if (subtype === 'fixture-kitchen') {
      bgColor = 'rgba(124, 45, 18, 0.96)';
      borderColor = '#fb923c';
      title = '🍳 KITCHEN PASS';
      subtitle = 'Order Expeditor Window';
      labelElevation = 5.6;
    } else if (subtype === 'fixture-buffet') {
      bgColor = 'rgba(51, 65, 85, 0.95)';
      borderColor = '#94a3b8';
      title = '🍽️ BUFFET STATION';
      subtitle = 'Self-Service Catering';
      labelElevation = 5.2;
    } else if (subtype === 'fixture-bar' || el.shape === 'bar') {
      bgColor = 'rgba(15, 23, 42, 0.96)';
      borderColor = '#d97706';
      title = `🍸 ${el.name || 'BAR'}`;
      subtitle = el.covers > 0 ? `${el.covers} Bar Stools` : 'Cocktail & Beverage Service';
      labelElevation = 5.8;
    } else if (subtype === 'fixture-stage' || el.name.toLowerCase().includes('stage')) {
      bgColor = 'rgba(15, 23, 42, 0.96)';
      borderColor = '#f59e0b';
      title = `🎤 ${el.name || 'EVENT STAGE'}`;
      subtitle = 'Presentation & Performance';
      labelElevation = 4.2;
    } else if (subtype === 'fixture-dance-floor') {
      bgColor = 'rgba(120, 53, 15, 0.96)';
      borderColor = '#fbbf24';
      title = `✨ ${el.name || 'DANCE FLOOR'}`;
      subtitle = 'Parquet Dance Space';
      labelElevation = 3.5;
    } else if (subtype === 'decor-photo-backdrop') {
      bgColor = 'rgba(131, 24, 67, 0.96)';
      borderColor = '#f472b6';
      title = '🌸 PHOTO BACKDROP';
      subtitle = 'Floral Arch & Photo-Op';
      labelElevation = 6.2;
    } else if (subtype === 'outdoor-pergola') {
      bgColor = 'rgba(120, 53, 15, 0.95)';
      borderColor = '#d97706';
      title = el.name || 'Pergola Canopy';
      subtitle = 'Outdoor Shaded Space';
      labelElevation = 9.8;
    } else if (subtype === 'deck-wood' || subtype === 'deck-stone') {
      bgColor = 'rgba(30, 41, 59, 0.95)';
      borderColor = '#94a3b8';
      title = el.name || 'Outdoor Terrace';
      subtitle = 'Alfresco Dining Deck';
      labelElevation = 3.2;
    } else {
      if (!el.name || el.name === 'Pillar' || el.name === 'Wall') return;
      title = el.name;
      subtitle = 'Venue Element';
      labelElevation = 4.2;
    }

    // Badge Background
    ctx.fillStyle = bgColor;
    ctx.roundRect(12, 16, 296, 118, 24);
    ctx.fill();

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 7;
    ctx.roundRect(12, 16, 296, 118, 24);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 160, 56);

    // Subtitle
    ctx.fillStyle = el.status === 'vip' ? '#fcd34d' : '#e0f2fe';
    ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
    ctx.fillText(subtitle, 160, 102);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(spriteScale.x, spriteScale.y, 1);
    sprite.position.set(posX, labelElevation, posZ);

    group.add(sprite);
  });

  group.visible = visible;
}
