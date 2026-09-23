import { useEffect, useRef, useState, useCallback } from 'react';
import { Collaborator, FloorElement, FloorPlan } from '../types';

interface UseRealtimeProps {
  projectId: string;
  floorPlan: FloorPlan;
  userRole?: 'owner' | 'editor' | 'commenter' | 'viewer';
  onRemoteElementUpdate: (element: FloorElement) => void;
  onRemoteElementCreate: (element: FloorElement) => void;
  onRemoteElementDelete: (elementId: string) => void;
  onRemoteRoomSync: (project: FloorPlan) => void;
}

const AVATAR_OPTIONS = ['👨‍🍳', '👩‍💼', '🤵', '🥂', '📋', '🎨', '💼', '👩‍💻', '👨‍💼'];
const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#ef4444', // red
  '#6366f1', // indigo
];

function getSessionUserId(): string {
  try {
    let id = sessionStorage.getItem('fp_session_user_id');
    if (!id) {
      id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      sessionStorage.setItem('fp_session_user_id', id);
    }
    return id;
  } catch {
    return `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  }
}

function getSessionColor(): string {
  try {
    let col = sessionStorage.getItem('fp_session_color');
    if (!col) {
      col = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
      sessionStorage.setItem('fp_session_color', col);
    }
    return col;
  } catch {
    return COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
  }
}

function getSessionAvatar(): string {
  try {
    let av = sessionStorage.getItem('fp_session_avatar');
    if (!av) {
      av = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
      sessionStorage.setItem('fp_session_avatar', av);
    }
    return av;
  } catch {
    return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
  }
}

export function useRealtime({
  projectId,
  floorPlan,
  userRole = 'editor',
  onRemoteElementUpdate,
  onRemoteElementCreate,
  onRemoteElementDelete,
  onRemoteRoomSync
}: UseRealtimeProps) {
  const [currentUser, setCurrentUser] = useState<Collaborator>(() => {
    const id = getSessionUserId();
    const savedName = localStorage.getItem('fp_user_name');
    const name = savedName ? `${savedName} (${id.slice(-4)})` : `Designer (${id.slice(-4)})`;
    const color = getSessionColor();
    const avatar = getSessionAvatar();

    return {
      id,
      name,
      color,
      avatar,
      role: userRole
    };
  });

  // Keep role in sync with active userRole prop
  useEffect(() => {
    setCurrentUser((prev) => {
      if (prev.role === userRole) return prev;
      const updated = { ...prev, role: userRole };
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'join',
          projectId,
          user: updated,
          project: floorPlan
        }));
      }
      return updated;
    });
  }, [userRole, projectId, floorPlan]);

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isSimulatedActive, setIsSimulatedActive] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const lastCursorSendRef = useRef<number>(0);

  // Update user profile
  const updateCurrentUser = (updates: Partial<Collaborator>) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      if (updates.name) localStorage.setItem('fp_user_name', updates.name);
      if (updates.color) {
        try { sessionStorage.setItem('fp_session_color', updates.color); } catch {}
      }
      if (updates.avatar) {
        try { sessionStorage.setItem('fp_session_avatar', updates.avatar); } catch {}
      }
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'join',
          projectId,
          user: updated,
          project: floorPlan
        }));
      }
      return updated;
    });
  };

  // Connect WebSocket
  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!projectId) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      setConnectionStatus('connecting');
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setConnectionStatus('connected');
        // Send join packet with initial project if present
        ws.send(JSON.stringify({
          type: 'join',
          projectId,
          user: currentUser,
          project: floorPlan
        }));
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'joined': {
              const remoteUsers = (msg.users || []).filter((u: Collaborator) => u.id !== currentUser.id);
              setCollaborators(remoteUsers);
              if (msg.project && floorPlan.elements.length === 0 && (msg.project.elements || []).length > 0) {
                onRemoteRoomSync(msg.project);
              }
              break;
            }

            case 'presence': {
              const remoteUsers = (msg.users || []).filter((u: Collaborator) => u.id !== currentUser.id);
              setCollaborators(remoteUsers);
              break;
            }

            case 'cursor': {
              if (msg.userId === currentUser.id) return;
              setCollaborators((prev) => {
                const existing = prev.find((c) => c.id === msg.userId);
                if (existing) {
                  return prev.map((c) =>
                    c.id === msg.userId ? { ...c, cursor: { x: msg.x, y: msg.y } } : c
                  );
                }
                return [
                  ...prev,
                  {
                    id: msg.userId,
                    name: msg.name || 'Collaborator',
                    color: msg.color || '#3b82f6',
                    avatar: '👤',
                    role: 'editor',
                    cursor: { x: msg.x, y: msg.y }
                  }
                ];
              });
              break;
            }

            case 'selection': {
              if (msg.userId === currentUser.id) return;
              setCollaborators((prev) => {
                const existing = prev.find((c) => c.id === msg.userId);
                if (existing) {
                  return prev.map((c) =>
                    c.id === msg.userId ? { ...c, selectedElementId: msg.elementId } : c
                  );
                }
                return [
                  ...prev,
                  {
                    id: msg.userId,
                    name: msg.name || 'Collaborator',
                    color: msg.color || '#3b82f6',
                    avatar: '👤',
                    role: 'editor',
                    selectedElementId: msg.elementId
                  }
                ];
              });
              break;
            }

            case 'element:update': {
              if (msg.element) {
                onRemoteElementUpdate(msg.element);
              }
              break;
            }

            case 'element:create': {
              if (msg.element) {
                onRemoteElementCreate(msg.element);
              }
              break;
            }

            case 'element:delete': {
              if (msg.elementId) {
                onRemoteElementDelete(msg.elementId);
              }
              break;
            }

            case 'room:sync': {
              if (msg.project) {
                onRemoteRoomSync(msg.project);
              }
              break;
            }
          }
        } catch (e) {
          console.error('WebSocket receive error:', e);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setConnectionStatus('disconnected');
        // Auto-reconnect after 3s
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [projectId]);

  // Send helpers
  const sendCursor = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastCursorSendRef.current < 40) return; // throttle 25fps
    lastCursorSendRef.current = now;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'cursor',
        projectId,
        x,
        y
      }));
    }
  }, [projectId]);

  const sendSelection = useCallback((elementId: string | null) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'selection',
        projectId,
        elementId
      }));
    }
  }, [projectId]);

  const sendElementUpdate = useCallback((element: FloorElement) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'element:update',
        projectId,
        element
      }));
    }
  }, [projectId]);

  const sendElementCreate = useCallback((element: FloorElement) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'element:create',
        projectId,
        element
      }));
    }
  }, [projectId]);

  const sendElementDelete = useCallback((elementId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'element:delete',
        projectId,
        elementId
      }));
    }
  }, [projectId]);

  const sendRoomSync = useCallback((project: FloorPlan) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'room:sync',
        projectId,
        project
      }));
    }
  }, [projectId]);

  // Simulated Team Members for instant interactive evaluation
  useEffect(() => {
    if (!isSimulatedActive) return;

    // Add 2 simulated collaborators
    const bot1: Collaborator = {
      id: 'sim-bot-1',
      name: 'Sarah (Event Lead)',
      color: '#ec4899',
      avatar: '👩‍💼',
      role: 'editor',
      cursor: { x: 300, y: 220 },
      selectedElementId: null
    };
    const bot2: Collaborator = {
      id: 'sim-bot-2',
      name: 'Chef Marc',
      color: '#10b981',
      avatar: '👨‍🍳',
      role: 'commenter',
      cursor: { x: 500, y: 350 },
      selectedElementId: null
    };

    setCollaborators((prev) => [...prev.filter((c) => !c.id.startsWith('sim-bot-')), bot1, bot2]);

    const interval = setInterval(() => {
      setCollaborators((prev) =>
        prev.map((c) => {
          if (c.id === 'sim-bot-1') {
            const newX = Math.max(100, Math.min(750, (c.cursor?.x || 300) + (Math.random() - 0.5) * 60));
            const newY = Math.max(80, Math.min(500, (c.cursor?.y || 220) + (Math.random() - 0.5) * 50));
            return {
              ...c,
              cursor: { x: newX, y: newY },
              selectedElementId: Math.random() > 0.6 ? floorPlan.elements[Math.floor(Math.random() * floorPlan.elements.length)]?.id : null
            };
          }
          if (c.id === 'sim-bot-2') {
            const newX = Math.max(100, Math.min(750, (c.cursor?.x || 500) + (Math.random() - 0.5) * 50));
            const newY = Math.max(80, Math.min(500, (c.cursor?.y || 350) + (Math.random() - 0.5) * 40));
            return {
              ...c,
              cursor: { x: newX, y: newY }
            };
          }
          return c;
        })
      );
    }, 1600);

    return () => {
      clearInterval(interval);
      setCollaborators((prev) => prev.filter((c) => !c.id.startsWith('sim-bot-')));
    };
  }, [isSimulatedActive, floorPlan.elements]);

  return {
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
  };
}
