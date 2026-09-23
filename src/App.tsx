import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Dashboard } from './components/Dashboard';
import { TemplatesModal } from './components/TemplatesModal';
import { CollaborationModal } from './components/CollaborationModal';
import { ExportModal } from './components/ExportModal';
import { NewPlanModal } from './components/NewPlanModal';
import { LandingPage } from './components/LandingPage';
import { MarketingQuestionnaireModal } from './components/MarketingQuestionnaireModal';
import { PricingPage } from './components/PricingPage';
import { FloorPlan, FloorElement, FurniturePreset, RoomTemplate, ProjectSummary, PricingPlanId } from './types';
import { useRealtime } from './hooks/useRealtime';
import { FURNITURE_PRESETS } from './data/furniturePresets';
import { ROOM_TEMPLATES } from './data/roomTemplates';
import { PlanTierId, CollaboratorRole } from './types/entitlements';
import {
  getStoredPlanTier,
  setStoredPlanTier,
  getStoredCollabRole,
  setStoredCollabRole
} from './utils/entitlements';
import { RoleAndTierSimulator } from './components/RoleAndTierSimulator';
import { MobileDesignerBar } from './components/MobileDesignerBar';
import {
  getLocalProjects,
  saveLocalProject,
  deleteLocalProject,
  getLocalProjectById,
  floorPlanToSummary,
  mergeProjectSummaries,
  getDeletedProjectIds
} from './utils/projectStorage';

// Initial starter project
const DEFAULT_FLOOR_PLAN: FloorPlan = {
  id: 'proj-bistro-01',
  name: 'Le Bistro Parisien - Main Dining',
  description: 'Chic urban French bistro with banquettes, 4-tops, and cocktail bar area.',
  venueType: 'restaurant',
  styleCategory: 'Casual Bistro',
  roomWidth: 45,
  roomHeight: 35,
  unit: 'ft',
  gridSize: 20,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1,
  elements: [
    {
      id: 'el-entrance',
      type: 'architectural',
      name: 'Main Entrance',
      shape: 'rectangle',
      x: 40,
      y: 620,
      width: 100,
      height: 24,
      rotation: 0,
      covers: 0,
      status: 'available',
      color: '#334155'
    },
    {
      id: 'el-host',
      type: 'fixture',
      name: 'Host Stand',
      shape: 'square',
      x: 70,
      y: 530,
      width: 44,
      height: 44,
      rotation: 0,
      covers: 0,
      status: 'available',
      color: '#475569'
    },
    {
      id: 'el-bar',
      type: 'fixture',
      name: 'Cocktail Bar Counter',
      shape: 'rectangle',
      x: 220,
      y: 80,
      width: 360,
      height: 60,
      rotation: 0,
      covers: 8,
      status: 'available',
      color: '#1e293b'
    },
    {
      id: 't-01',
      type: 'table',
      name: 'Table 1',
      shape: 'round',
      x: 140,
      y: 250,
      width: 70,
      height: 70,
      rotation: 0,
      covers: 4,
      status: 'reserved',
      guestName: 'Claire Dupont',
      notes: 'Window preference, anniversary'
    },
    {
      id: 't-02',
      type: 'table',
      name: 'Table 2',
      shape: 'round',
      x: 270,
      y: 250,
      width: 70,
      height: 70,
      rotation: 0,
      covers: 4,
      status: 'occupied',
      guestName: 'Smith Party (4)'
    },
    {
      id: 't-03',
      type: 'table',
      name: 'Table 3',
      shape: 'round',
      x: 400,
      y: 250,
      width: 70,
      height: 70,
      rotation: 0,
      covers: 4,
      status: 'available'
    },
    {
      id: 't-04',
      type: 'table',
      name: 'Table 4',
      shape: 'square',
      x: 540,
      y: 250,
      width: 64,
      height: 64,
      rotation: 0,
      covers: 2,
      status: 'available'
    },
    {
      id: 't-05',
      type: 'table',
      name: 'Table 5 (VIP)',
      shape: 'oval',
      x: 690,
      y: 240,
      width: 120,
      height: 80,
      rotation: 0,
      covers: 8,
      status: 'vip',
      guestName: 'Chef Tasting Table'
    },
    {
      id: 't-06',
      type: 'table',
      name: 'Booth A',
      shape: 'booth',
      x: 140,
      y: 430,
      width: 90,
      height: 70,
      rotation: 0,
      covers: 6,
      status: 'available'
    },
    {
      id: 't-07',
      type: 'table',
      name: 'Booth B',
      shape: 'booth',
      x: 280,
      y: 430,
      width: 90,
      height: 70,
      rotation: 0,
      covers: 6,
      status: 'available'
    },
    {
      id: 't-08',
      type: 'table',
      name: 'Table 8',
      shape: 'rectangle',
      x: 440,
      y: 430,
      width: 110,
      height: 70,
      rotation: 0,
      covers: 6,
      status: 'available'
    },
    {
      id: 't-09',
      type: 'table',
      name: 'Table 9',
      shape: 'rectangle',
      x: 600,
      y: 430,
      width: 110,
      height: 70,
      rotation: 0,
      covers: 6,
      status: 'reserved'
    }
  ]
};

export default function App() {
  const [activeView, setActiveView] = useState<'landing' | 'editor' | 'dashboard' | 'templates' | 'pricing'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // If URL contains any live collaboration or project params, land DIRECTLY in the designer canvas
      if (params.get('project') || params.get('role') || params.get('element') || params.get('view') === 'editor') {
        return 'editor';
      }
      const view = params.get('view');
      if (view === 'dashboard' || view === 'templates' || view === 'pricing') {
        return view;
      }
    }
    return 'landing';
  });
  const [userPlan, setUserPlan] = useState<PlanTierId>(() => getStoredPlanTier());
  const [userRole, setUserRole] = useState<CollaboratorRole>(() => getStoredCollabRole());
  const [tempEditorOverride, setTempEditorOverride] = useState(false);

  useEffect(() => {
    const handleTierChange = (e: any) => {
      if (e.detail?.tier) setUserPlan(e.detail.tier);
    };
    const handleRoleChange = (e: any) => {
      if (e.detail?.role) setUserRole(e.detail.role);
    };
    window.addEventListener('floordone:tier-changed', handleTierChange);
    window.addEventListener('floordone:role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('floordone:tier-changed', handleTierChange);
      window.removeEventListener('floordone:role-changed', handleRoleChange);
    };
  }, []);

  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [floorPlan, setFloorPlan] = useState<FloorPlan>(DEFAULT_FLOOR_PLAN);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<FloorPlan[]>([DEFAULT_FLOOR_PLAN]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Canvas View options
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Projects list
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');

  // Modals
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [sharedLinkBanner, setSharedLinkBanner] = useState<{
    role: CollaboratorRole;
    elementId?: string | null;
  } | null>(null);

  // Check URL query on mount (e.g. ?project=xyz&role=commenter&element=t-02)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projId = params.get('project');
    const viewParam = params.get('view');
    const roleParam = params.get('role') as CollaboratorRole | null;
    const elementParam = params.get('element');

    if (roleParam && ['owner', 'editor', 'commenter', 'viewer'].includes(roleParam)) {
      setUserRole(roleParam);
      setStoredCollabRole(roleParam);
      setSharedLinkBanner({
        role: roleParam,
        elementId: elementParam || null
      });
    }

    if (elementParam) {
      setSelectedElementId(elementParam);
    }

    // Always navigate to editor immediately if a project or collaboration param is present
    if (projId) {
      setActiveView('editor');
      loadProjectById(projId, elementParam);
    } else if (roleParam || elementParam || viewParam === 'editor') {
      setActiveView('editor');
    } else if (viewParam === 'dashboard' || viewParam === 'templates' || viewParam === 'pricing') {
      setActiveView(viewParam);
    }
  }, []);

  // Seed default floor plan to local storage on initial mount if empty
  useEffect(() => {
    const local = getLocalProjects();
    if (local.length === 0) {
      saveLocalProject(DEFAULT_FLOOR_PLAN);
    }
  }, []);

  // Fetch projects list from server and local storage merged
  const fetchProjects = useCallback(async () => {
    const localSummaries = getLocalProjects().map(floorPlanToSummary);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        const remote = data.projects || [];
        setProjects(mergeProjectSummaries(remote, localSummaries));
        return;
      }
    } catch (err) {
      console.warn('Could not fetch remote projects list, using local storage:', err);
    }
    setProjects(mergeProjectSummaries([], localSummaries));
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Push to history
  const recordHistory = useCallback((newPlan: FloorPlan) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newPlan];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Save project to cloud backend & local storage
  const saveProjectToCloud = useCallback(async (planToSave = floorPlan) => {
    setIsSaving(true);
    setSyncStatus('saving');

    // 1. Immediately persist to localStorage for instant, guaranteed offline preservation
    saveLocalProject(planToSave);

    // 2. Persist to server API
    try {
      const res = await fetch(`/api/projects/${planToSave.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planToSave)
      });
      if (res.ok) {
        setSyncStatus('synced');
      } else {
        // Try creating if not found
        const createRes = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planToSave)
        });
        setSyncStatus(createRes.ok ? 'synced' : 'synced');
      }
    } catch (err) {
      console.warn('Backend server offline; project safely saved in local storage:', err);
      setSyncStatus('offline');
    } finally {
      setIsSaving(false);
      fetchProjects();
    }
  }, [floorPlan, fetchProjects]);

  // Load project by ID (checks server first, then local storage)
  const loadProjectById = async (id: string, targetElementId?: string | null) => {
    let loadedPlan: FloorPlan | null = null;
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          loadedPlan = data.project;
        }
      }
    } catch (err) {
      console.warn('Network issue fetching project, checking local storage:', err);
    }

    if (!loadedPlan) {
      loadedPlan = getLocalProjectById(id);
    }

    if (loadedPlan) {
      setFloorPlan(loadedPlan);
      if (targetElementId) {
        setSelectedElementId(targetElementId);
      }
      setHistory([loadedPlan]);
      setHistoryIndex(0);
      setActiveView('editor');

      // Update URL without full page reload, preserving view=editor
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'editor');
      url.searchParams.set('project', id);
      window.history.replaceState({}, '', url.toString());
    } else {
      setActiveView('editor');
    }
  };

  // Real-time hook for live collaboration
  const {
    currentUser,
    updateCurrentUser,
    collaborators,
    connectionStatus,
    isSimulatedActive,
    setIsSimulatedActive,
    sendCursor,
    sendSelection,
    sendElementUpdate,
    sendElementCreate,
    sendElementDelete,
    sendRoomSync
  } = useRealtime({
    projectId: floorPlan.id,
    floorPlan,
    userRole,
    onRemoteElementUpdate: (element) => {
      setFloorPlan((prev) => {
        const idx = prev.elements.findIndex((e) => e.id === element.id);
        const newElements = [...prev.elements];
        if (idx >= 0) {
          newElements[idx] = element;
        } else {
          newElements.push(element);
        }
        return { ...prev, elements: newElements };
      });
    },
    onRemoteElementCreate: (element) => {
      setFloorPlan((prev) => {
        if (prev.elements.some((e) => e.id === element.id)) return prev;
        return { ...prev, elements: [...prev.elements, element] };
      });
    },
    onRemoteElementDelete: (elementId) => {
      setFloorPlan((prev) => ({
        ...prev,
        elements: prev.elements.filter((e) => e.id !== elementId)
      }));
      if (selectedElementId === elementId) {
        setSelectedElementId(null);
      }
    },
    onRemoteRoomSync: (remoteProject) => {
      setFloorPlan(remoteProject);
    }
  });

  // Select element with realtime notification
  const handleSelectElement = (id: string | null) => {
    setSelectedElementId(id);
    sendSelection(id);
  };

  // Update FloorPlan metadata (room dimensions, unit, name)
  const handleUpdateFloorPlan = (updates: Partial<FloorPlan>) => {
    const updated = {
      ...floorPlan,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setFloorPlan(updated);
    recordHistory(updated);
    sendRoomSync(updated);
  };

  // Update a single element
  const handleUpdateElement = (updatedElement: FloorElement) => {
    const newElements = floorPlan.elements.map((e) =>
      e.id === updatedElement.id ? updatedElement : e
    );
    const updatedPlan = {
      ...floorPlan,
      elements: newElements,
      updatedAt: new Date().toISOString()
    };
    setFloorPlan(updatedPlan);
    sendElementUpdate(updatedElement);
  };

  // Add a new element from furniture preset
  const handleAddPresetElement = (preset: FurniturePreset) => {
    // Determine default position near room center
    const x = Math.round((floorPlan.roomWidth * 20) / 2 - preset.defaultWidth / 2);
    const y = Math.round((floorPlan.roomHeight * 20) / 2 - preset.defaultHeight / 2);

    const newElement: FloorElement = {
      id: `elem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: preset.type,
      name: preset.name.replace(/\s*\(.*?\)\s*/g, ''), // cleaner short name
      shape: preset.shape,
      x,
      y,
      width: preset.defaultWidth,
      height: preset.defaultHeight,
      rotation: 0,
      covers: preset.defaultCovers,
      status: 'available',
      color: preset.defaultColor,
      subtype: preset.subtype,
      category: preset.category
    };

    const updatedPlan = {
      ...floorPlan,
      elements: [...floorPlan.elements, newElement],
      updatedAt: new Date().toISOString()
    };

    setFloorPlan(updatedPlan);
    setSelectedElementId(newElement.id);
    recordHistory(updatedPlan);
    sendElementCreate(newElement);
    setActiveView('editor');
  };

  // Drop element from drag-and-drop onto canvas
  const handleDropNewElement = (presetId: string, x: number, y: number) => {
    const preset = FURNITURE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const newElement: FloorElement = {
      id: `elem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: preset.type,
      name: preset.name.replace(/\s*\(.*?\)\s*/g, ''),
      shape: preset.shape,
      x: Math.max(10, x - preset.defaultWidth / 2),
      y: Math.max(10, y - preset.defaultHeight / 2),
      width: preset.defaultWidth,
      height: preset.defaultHeight,
      rotation: 0,
      covers: preset.defaultCovers,
      status: 'available',
      color: preset.defaultColor,
      subtype: preset.subtype,
      category: preset.category
    };

    const updatedPlan = {
      ...floorPlan,
      elements: [...floorPlan.elements, newElement],
      updatedAt: new Date().toISOString()
    };

    setFloorPlan(updatedPlan);
    setSelectedElementId(newElement.id);
    recordHistory(updatedPlan);
    sendElementCreate(newElement);
  };

  // Duplicate an element
  const handleDuplicateElement = (id: string) => {
    const original = floorPlan.elements.find((e) => e.id === id);
    if (!original) return;

    const duplicated: FloorElement = {
      ...JSON.parse(JSON.stringify(original)),
      id: `elem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${original.name} (Copy)`,
      x: original.x + 25,
      y: original.y + 25,
      locked: false
    };

    const updatedPlan = {
      ...floorPlan,
      elements: [...floorPlan.elements, duplicated],
      updatedAt: new Date().toISOString()
    };

    setFloorPlan(updatedPlan);
    setSelectedElementId(duplicated.id);
    recordHistory(updatedPlan);
    sendElementCreate(duplicated);
  };

  // Delete an element
  const handleDeleteElement = (id: string) => {
    const updatedPlan = {
      ...floorPlan,
      elements: floorPlan.elements.filter((e) => e.id !== id),
      updatedAt: new Date().toISOString()
    };
    setFloorPlan(updatedPlan);
    setSelectedElementId(null);
    recordHistory(updatedPlan);
    sendElementDelete(id);
  };

  // Apply a room template
  const handleApplyTemplate = (template: RoomTemplate) => {
    const newPlan: FloorPlan = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: template.name,
      description: template.description,
      venueType: template.venueType as any,
      styleCategory: template.style,
      roomWidth: template.dimensions.width,
      roomHeight: template.dimensions.height,
      unit: template.dimensions.unit,
      gridSize: 20,
      elements: JSON.parse(JSON.stringify(template.elements)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    setFloorPlan(newPlan);
    setSelectedElementId(null);
    setHistory([newPlan]);
    setHistoryIndex(0);
    setActiveView('editor');
    saveProjectToCloud(newPlan);

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'editor');
    url.searchParams.set('project', newPlan.id);
    window.history.pushState({}, '', url.toString());
  };

  // Create new project (Blank room)
  const handleCreateProject = (
    name: string,
    venueType: string,
    width: number,
    height: number,
    unit: 'ft' | 'm' = 'ft'
  ) => {
    const newPlan: FloorPlan = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'Blank Floor Plan',
      description: `${venueType.toUpperCase()} custom blank floor plan`,
      venueType: venueType as any,
      roomWidth: width,
      roomHeight: height,
      unit,
      gridSize: 20,
      elements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    setFloorPlan(newPlan);
    setSelectedElementId(null);
    setHistory([newPlan]);
    setHistoryIndex(0);
    setActiveView('editor');
    saveProjectToCloud(newPlan);

    const url = new URL(window.location.href);
    url.searchParams.set('view', 'editor');
    url.searchParams.set('project', newPlan.id);
    window.history.pushState({}, '', url.toString());
  };

  // Handle Questionnaire Flow
  const handleGetStartedFromLanding = () => {
    setIsQuestionnaireOpen(true);
  };

  const handleQuestionnaireComplete = (recommendedTemplateId?: string) => {
    setIsQuestionnaireOpen(false);
    if (recommendedTemplateId) {
      const tmpl = ROOM_TEMPLATES.find((t) => t.id === recommendedTemplateId);
      if (tmpl) {
        handleApplyTemplate(tmpl);
        return;
      }
    }
    setActiveView('editor');
  };

  // Duplicate a project
  const handleDuplicateProject = async (id: string) => {
    let duplicatedOnServer = false;
    try {
      const res = await fetch(`/api/projects/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        duplicatedOnServer = true;
      }
    } catch (err) {
      console.warn('Server duplicate error, falling back to local copy:', err);
    }

    if (!duplicatedOnServer) {
      const source = getLocalProjectById(id) || (floorPlan.id === id ? floorPlan : null);
      if (source) {
        const copy: FloorPlan = {
          ...source,
          id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: `${source.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        };
        saveLocalProject(copy);
      }
    }
    fetchProjects();
  };

  // Delete a project
  const handleDeleteProject = async (id: string) => {
    // 1. Optimistically update UI so the project card disappears immediately
    setProjects((prev) => prev.filter((p) => p.id !== id));

    // 2. Remove from local storage & record in deleted tombstone list
    deleteLocalProject(id);

    // 3. Remove from backend API
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Server delete error (locally deleted):', err);
    }

    // 4. Refresh projects list
    fetchProjects();

    // 5. If current active floorPlan is the deleted one, switch to another or clean layout
    if (floorPlan.id === id) {
      const remaining = getLocalProjects().filter((p) => p.id !== id);
      if (remaining.length > 0) {
        setFloorPlan(remaining[0]);
      } else {
        const freshPlan: FloorPlan = {
          id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: 'New Floor Plan',
          venueType: 'restaurant',
          roomWidth: 40,
          roomHeight: 30,
          unit: 'ft',
          gridSize: 20,
          elements: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        };
        setFloorPlan(freshPlan);
      }
    }
  };

  // Rename a project
  const handleRenameProject = (newName: string) => {
    const updated = {
      ...floorPlan,
      name: newName,
      updatedAt: new Date().toISOString()
    };
    setFloorPlan(updated);
    recordHistory(updated);
    saveProjectToCloud(updated);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevPlan = history[historyIndex - 1];
      setHistoryIndex((i) => i - 1);
      setFloorPlan(prevPlan);
      sendRoomSync(prevPlan);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextPlan = history[historyIndex + 1];
      setHistoryIndex((i) => i + 1);
      setFloorPlan(nextPlan);
      sendRoomSync(nextPlan);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        handleDeleteElement(selectedElementId);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedElementId) {
        e.preventDefault();
        handleDuplicateElement(selectedElementId);
      } else if (e.key === 'Escape') {
        handleSelectElement(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, historyIndex, history]);

  // Debounced auto-save to cloud (only when actively in editor view)
  const saveTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (activeView !== 'editor') return;
    const deletedIds = getDeletedProjectIds();
    if (deletedIds.includes(floorPlan.id)) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      saveProjectToCloud(floorPlan);
    }, 2500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [floorPlan, activeView]);

  // Landing Page View
  if (activeView === 'landing') {
    return (
      <div id="floordone-landing-container" className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
        <LandingPage
          onGetStarted={handleGetStartedFromLanding}
          onOpenEditor={(templateId) => {
            if (templateId) {
              const tmpl = ROOM_TEMPLATES.find((t) => t.id === templateId);
              if (tmpl) {
                handleApplyTemplate(tmpl);
                return;
              }
            }
            setActiveView('editor');
          }}
          onOpenDashboard={() => setActiveView('dashboard')}
          onOpenTemplates={() => setActiveView('templates')}
          onOpenPricing={() => setActiveView('pricing')}
        />

        <MarketingQuestionnaireModal
          isOpen={isQuestionnaireOpen}
          onClose={() => setIsQuestionnaireOpen(false)}
          onComplete={handleQuestionnaireComplete}
        />
      </div>
    );
  }

  return (
    <div id="app-root-container" className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden font-sans">
      {/* 1. Designer Header Bar (ONLY displayed inside the actual floor designer) */}
      {activeView === 'editor' && (
        <>
          {/* Figma-Style Live Link Joining Notification Banner */}
          {sharedLinkBanner && (
            <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-700 z-30 shadow-md">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-blue-400">
                  Figma Live Link:
                </span>
                <span>
                  You joined &quot;{floorPlan.name}&quot; with permission{' '}
                  <strong className="text-white bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/40">
                    {sharedLinkBanner.role === 'commenter'
                      ? '💬 Client Reviewer (Can comment)'
                      : sharedLinkBanner.role === 'viewer'
                      ? '👁️ Guest (Can view)'
                      : '✏️ Co-Editor (Can edit)'}
                  </strong>
                </span>
                <span className="text-slate-400 hidden lg:inline">
                  {sharedLinkBanner.role === 'commenter'
                    ? '• Pin comments on tables & inspect in 3D walkthrough'
                    : sharedLinkBanner.role === 'viewer'
                    ? '• Read-only 2D/3D floor inspection'
                    : '• Live co-design and real-time syncing enabled'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsCollaborationOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition text-[11px] cursor-pointer"
                >
                  Share Link
                </button>
                <button
                  onClick={() => setSharedLinkBanner(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition cursor-pointer"
                  title="Dismiss banner"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <Navbar
            activeView={activeView}
            setActiveView={setActiveView}
            floorPlan={floorPlan}
            onNewProject={() => setIsNewPlanModalOpen(true)}
            onSaveProject={() => saveProjectToCloud(floorPlan)}
            onRenameProject={handleRenameProject}
            isSaving={isSaving}
            syncStatus={syncStatus}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            snapToGrid={snapToGrid}
            setSnapToGrid={setSnapToGrid}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            collaborators={collaborators}
            currentUser={currentUser}
            userPlan={userPlan}
            onOpenCollaboration={() => setIsCollaborationOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
          />
        </>
      )}

      {/* 2. Main Content Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeView === 'editor' && (
          <>
            {/* Left Sidebar (Desktop / Tablet collapsible drawer, hidden on mobile) */}
            <Sidebar
              floorPlan={floorPlan}
              onUpdateFloorPlan={handleUpdateFloorPlan}
              selectedElementId={selectedElementId}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              onAddPresetElement={handleAddPresetElement}
              onApplyTemplate={handleApplyTemplate}
              onStartBlank={() => setIsNewPlanModalOpen(true)}
            />

            {/* Interactive SVG Floor Plan Canvas */}
            <Canvas
              floorPlan={floorPlan}
              onUpdateFloorPlan={handleUpdateFloorPlan}
              selectedElementId={selectedElementId}
              onSelectElement={handleSelectElement}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              onDropNewElement={handleDropNewElement}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              collaborators={collaborators}
              onCursorMove={sendCursor}
              onOpenTemplates={() => setActiveView('templates')}
              currentPlan={userPlan}
              collabRole={userRole}
              onUpgradePlan={(tier) => {
                setUserPlan(tier);
                setStoredPlanTier(tier);
              }}
              onOpenPricing={() => setActiveView('pricing')}
            />

            {/* Mobile Designer Canva-style Bottom Bar & Sheets (hidden on md+ screens) */}
            <MobileDesignerBar
              floorPlan={floorPlan}
              onUpdateFloorPlan={handleUpdateFloorPlan}
              selectedElementId={selectedElementId}
              onSelectElement={handleSelectElement}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              onAddPresetElement={handleAddPresetElement}
              onApplyTemplate={handleApplyTemplate}
              showGrid={showGrid}
              setShowGrid={setShowGrid}
              snapToGrid={snapToGrid}
              setSnapToGrid={setSnapToGrid}
            />
          </>
        )}

        {/* Projects Dashboard View */}
        {activeView === 'dashboard' && (
          <Dashboard
            projects={projects}
            onOpenProject={loadProjectById}
            onCreateProject={handleCreateProject}
            onDuplicateProject={handleDuplicateProject}
            onDeleteProject={handleDeleteProject}
            onRefreshProjects={fetchProjects}
            isSyncing={isSaving}
            onOpenTemplates={() => setActiveView('templates')}
            onBackToEditor={() => setActiveView('editor')}
            onOpenPricing={() => setActiveView('pricing')}
            onSaveCurrentPlan={() => saveProjectToCloud(floorPlan)}
          />
        )}

        {/* Templates Explorer View */}
        {activeView === 'templates' && (
          <TemplatesModal
            onSelectTemplate={handleApplyTemplate}
            onStartBlank={(name, venueType, width, height, unit) => handleCreateProject(name, venueType, width, height, unit)}
            onBackToEditor={() => setActiveView('editor')}
          />
        )}

        {/* Pricing View */}
        {activeView === 'pricing' && (
          <div className="flex-1 overflow-y-auto w-full bg-slate-50">
            <PricingPage
              onBackToEditor={() => setActiveView('editor')}
              onOpenTemplates={() => setActiveView('templates')}
              onOpenDashboard={() => setActiveView('dashboard')}
              currentPlan={userPlan}
              onSelectPlan={(plan) => {
                setUserPlan(plan);
                setStoredPlanTier(plan);
              }}
            />
          </div>
        )}
      </main>

      {/* 3. Real-Time Team Collaboration & Figma-Style Share Dialog */}
      <CollaborationModal
        isOpen={isCollaborationOpen}
        onClose={() => setIsCollaborationOpen(false)}
        currentUser={currentUser}
        onUpdateCurrentUser={updateCurrentUser}
        collaborators={collaborators}
        connectionStatus={connectionStatus}
        projectId={floorPlan.id}
        projectName={floorPlan.name}
        selectedElement={floorPlan.elements.find((e) => e.id === selectedElementId) || null}
        elements={floorPlan.elements}
        isSimulatedActive={isSimulatedActive}
        onToggleSimulated={setIsSimulatedActive}
        activeRole={userRole}
        onChangeActiveRole={(role) => {
          setUserRole(role);
          setStoredCollabRole(role);
        }}
      />

      {/* 4. Export PDF / PNG / JSON Dialog */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        floorPlan={floorPlan}
        currentPlan={userPlan}
        onUpgradePlan={(tier) => {
          setUserPlan(tier);
          setStoredPlanTier(tier);
        }}
        onOpenPricing={() => setActiveView('pricing')}
      />

      {/* 5. New Floor Plan (Blank or Template) Dialog */}
      <NewPlanModal
        isOpen={isNewPlanModalOpen}
        onClose={() => setIsNewPlanModalOpen(false)}
        onStartBlank={(name, venueType, width, height, unit) => {
          handleCreateProject(name, venueType, width, height, unit);
          setIsNewPlanModalOpen(false);
        }}
        onOpenTemplates={() => {
          setIsNewPlanModalOpen(false);
          setActiveView('templates');
        }}
      />

      {/* 6. Marketing Questionnaire Dialog */}
      <MarketingQuestionnaireModal
        isOpen={isQuestionnaireOpen}
        onClose={() => setIsQuestionnaireOpen(false)}
        onComplete={handleQuestionnaireComplete}
      />

      {/* 7. Product Tier & Role Permission Simulator Widget */}
      <RoleAndTierSimulator
        currentPlan={userPlan}
        onChangePlan={(newPlan) => {
          setUserPlan(newPlan);
          setStoredPlanTier(newPlan);
        }}
        currentRole={userRole}
        onChangeRole={(newRole) => {
          setUserRole(newRole);
          setStoredCollabRole(newRole);
        }}
        tempEditorOverride={tempEditorOverride}
        onToggleTempEditorOverride={setTempEditorOverride}
      />
    </div>
  );
}
