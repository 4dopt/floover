import { FloorPlan, ProjectSummary } from '../types';

const LOCAL_STORAGE_PROJECTS_KEY = 'floordone_saved_projects_v2';
const LOCAL_STORAGE_ACTIVE_PROJECT_KEY = 'floordone_active_project_id';
const LOCAL_STORAGE_DELETED_PROJECTS_KEY = 'floordone_deleted_project_ids_v2';

/**
 * Get IDs of explicitly deleted projects so they are never accidentally restored
 */
export function getDeletedProjectIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Mark a project ID as deleted
 */
export function recordDeletedProjectId(id: string): void {
  try {
    const deleted = getDeletedProjectIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(LOCAL_STORAGE_DELETED_PROJECTS_KEY, JSON.stringify(deleted));
    }
  } catch (err) {
    console.error('Failed to record deleted project ID:', err);
  }
}

/**
 * Unmark a project ID if explicitly created or saved fresh
 */
export function unmarkDeletedProjectId(id: string): void {
  try {
    const deleted = getDeletedProjectIds().filter((d) => d !== id);
    localStorage.setItem(LOCAL_STORAGE_DELETED_PROJECTS_KEY, JSON.stringify(deleted));
  } catch (err) {
    console.error('Failed to unmark deleted project ID:', err);
  }
}

/**
 * Get all projects saved in browser localStorage
 */
export function getLocalProjects(): FloorPlan[] {
  try {
    const deletedIds = new Set(getDeletedProjectIds());
    const raw = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    return list.filter((p) => !deletedIds.has(p.id));
  } catch (err) {
    console.warn('Failed to parse local projects from localStorage:', err);
    return [];
  }
}

/**
 * Save or update a project in browser localStorage
 */
export function saveLocalProject(project: FloorPlan): void {
  try {
    unmarkDeletedProjectId(project.id);
    const projects = getLocalProjects();
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
      version: (project.version || 1) + 1
    };

    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = updatedProject;
    } else {
      projects.unshift(updatedProject);
    }

    localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROJECT_KEY, project.id);
  } catch (err) {
    console.error('Failed to save project to localStorage:', err);
  }
}

/**
 * Delete a project from browser localStorage
 */
export function deleteLocalProject(projectId: string): void {
  try {
    recordDeletedProjectId(projectId);
    const projects = getLocalProjects().filter((p) => p.id !== projectId);
    localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    if (localStorage.getItem(LOCAL_STORAGE_ACTIVE_PROJECT_KEY) === projectId) {
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_PROJECT_KEY);
    }
  } catch (err) {
    console.error('Failed to delete project from localStorage:', err);
  }
}

/**
 * Load a single project by ID from localStorage
 */
export function getLocalProjectById(projectId: string): FloorPlan | null {
  const projects = getLocalProjects();
  return projects.find((p) => p.id === projectId) || null;
}

/**
 * Convert a full FloorPlan to a lightweight ProjectSummary
 */
export function floorPlanToSummary(p: FloorPlan): ProjectSummary {
  const tableElements = (p.elements || []).filter((e) => e.type === 'table');
  const totalCovers = tableElements.reduce((acc: number, el) => {
    const base = Number(el.covers) || 0;
    const removed = Array.isArray(el.removedChairs) ? el.removedChairs.length : 0;
    return acc + Math.max(0, base - removed);
  }, 0);

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    venueType: p.venueType,
    styleCategory: p.styleCategory,
    roomWidth: p.roomWidth,
    roomHeight: p.roomHeight,
    unit: p.unit,
    tableCount: tableElements.length,
    totalCovers,
    elementCount: (p.elements || []).length,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    version: p.version || 1
  };
}

/**
 * Merge remote projects from /api/projects with localStorage projects,
 * ensuring no saved project is ever lost.
 */
export function mergeProjectSummaries(
  remoteList: ProjectSummary[],
  localList: (FloorPlan | ProjectSummary)[]
): ProjectSummary[] {
  const deletedIds = new Set(getDeletedProjectIds());
  const map = new Map<string, ProjectSummary>();

  // Add remote summaries (excluding any marked as deleted)
  for (const rem of remoteList) {
    if (!deletedIds.has(rem.id)) {
      map.set(rem.id, rem);
    }
  }

  // Overlay or add local summaries (prefer latest updatedAt, excluding deleted)
  for (const item of localList) {
    if (deletedIds.has(item.id)) continue;
    const localSummary: ProjectSummary = 'elements' in item ? floorPlanToSummary(item) : item;
    const existing = map.get(localSummary.id);
    if (!existing) {
      map.set(localSummary.id, localSummary);
    } else {
      const remoteTime = new Date(existing.updatedAt).getTime();
      const localTime = new Date(localSummary.updatedAt).getTime();
      if (localTime > remoteTime) {
        map.set(localSummary.id, localSummary);
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
