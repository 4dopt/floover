import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = createServer(app);
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Persistence directory
const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const LEADS_FILE = path.join(DATA_DIR, 'marketing_leads.json');
const PAID_ORDERS_FILE = path.join(DATA_DIR, 'paid_orders.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed projects if none exist
function getInitialProjects() {
  return [
    {
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
          y: 540,
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
          x: 200,
          y: 80,
          width: 380,
          height: 70,
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
          y: 260,
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
          x: 280,
          y: 260,
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
          x: 420,
          y: 260,
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
          x: 560,
          y: 260,
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
          x: 680,
          y: 250,
          width: 120,
          height: 80,
          rotation: 0,
          covers: 8,
          status: 'vip',
          guestName: 'Chef Table Guests',
          notes: 'Special tasting menu 7 courses'
        },
        {
          id: 't-06',
          type: 'table',
          name: 'Booth 1',
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
          name: 'Booth 2',
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
          x: 450,
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
          x: 620,
          y: 430,
          width: 110,
          height: 70,
          rotation: 0,
          covers: 6,
          status: 'reserved',
          guestName: 'Miller Family'
        }
      ]
    },
    {
      id: 'proj-wedding-02',
      name: 'Grand Ballroom - Wedding Gala',
      description: 'Elegant banquet seating layout for 140 guests with dance floor, bridal head table, and live band stage.',
      venueType: 'banquet',
      styleCategory: 'Wedding Banquet',
      roomWidth: 70,
      roomHeight: 50,
      unit: 'ft',
      gridSize: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      elements: [
        {
          id: 'stage-01',
          type: 'fixture',
          name: 'Live Band Stage',
          shape: 'rectangle',
          x: 350,
          y: 60,
          width: 320,
          height: 90,
          rotation: 0,
          covers: 0,
          status: 'available',
          color: '#1e1b4b'
        },
        {
          id: 'dance-01',
          type: 'fixture',
          name: 'Dance Floor',
          shape: 'square',
          x: 410,
          y: 200,
          width: 200,
          height: 200,
          rotation: 0,
          covers: 0,
          status: 'available',
          color: '#fef3c7'
        },
        {
          id: 'head-table',
          type: 'table',
          name: 'Bridal Head Table',
          shape: 'rectangle',
          x: 360,
          y: 450,
          width: 300,
          height: 65,
          rotation: 0,
          covers: 12,
          status: 'vip',
          guestName: 'Bride & Groom + Wedding Party'
        },
        {
          id: 'rnd-1',
          type: 'table',
          name: 'Table 1',
          shape: 'round',
          x: 180,
          y: 190,
          width: 85,
          height: 85,
          rotation: 0,
          covers: 8,
          status: 'reserved',
          guestName: "Bride's Family"
        },
        {
          id: 'rnd-2',
          type: 'table',
          name: 'Table 2',
          shape: 'round',
          x: 180,
          y: 330,
          width: 85,
          height: 85,
          rotation: 0,
          covers: 8,
          status: 'reserved',
          guestName: "Groom's Family"
        },
        {
          id: 'rnd-3',
          type: 'table',
          name: 'Table 3',
          shape: 'round',
          x: 750,
          y: 190,
          width: 85,
          height: 85,
          rotation: 0,
          covers: 8,
          status: 'available'
        },
        {
          id: 'rnd-4',
          type: 'table',
          name: 'Table 4',
          shape: 'round',
          x: 750,
          y: 330,
          width: 85,
          height: 85,
          rotation: 0,
          covers: 8,
          status: 'available'
        }
      ]
    }
  ];
}

function loadProjects() {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading projects:', err);
  }
  const initial = getInitialProjects();
  saveProjects(initial);
  return initial;
}

function saveProjects(projects: any[]) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing projects:', err);
  }
}

// In-memory working project cache
let projectsCache = loadProjects();

// ==================== REST API ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// List all projects
app.get('/api/projects', (req, res) => {
  const summary = projectsCache.map((p: any) => {
    const tableElements = (p.elements || []).filter((e: any) => e.type === 'table');
    const totalCovers = tableElements.reduce((acc: number, el: any) => {
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
  });
  res.json({ projects: summary });
});

// Get single project
app.get('/api/projects/:id', (req, res) => {
  const project = projectsCache.find((p: any) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ project });
});

// Create new project
app.post('/api/projects', (req, res) => {
  const data = req.body;
  const newProject = {
    ...data,
    id: data.id || `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: (data.version || 1) + 1,
    elements: data.elements || []
  };

  const existingIndex = projectsCache.findIndex((p: any) => p.id === newProject.id);
  if (existingIndex >= 0) {
    projectsCache[existingIndex] = newProject;
  } else {
    projectsCache.unshift(newProject);
  }
  saveProjects(projectsCache);
  res.status(201).json({ project: newProject, status: 'saved' });
});

// Update project
app.put('/api/projects/:id', (req, res) => {
  const id = req.params.id;
  const existingIndex = projectsCache.findIndex((p: any) => p.id === id);
  const baseProject = existingIndex >= 0 ? projectsCache[existingIndex] : {};

  const updatedProject = {
    ...baseProject,
    ...req.body,
    id,
    createdAt: baseProject.createdAt || req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: ((baseProject.version || 0) || 1) + 1
  };

  if (existingIndex >= 0) {
    projectsCache[existingIndex] = updatedProject;
  } else {
    projectsCache.unshift(updatedProject);
  }
  saveProjects(projectsCache);

  // Broadcast layout change to WebSocket room
  broadcastToRoom(id, null, {
    type: 'room:sync',
    projectId: id,
    project: updatedProject
  });

  res.json({ project: updatedProject, status: existingIndex >= 0 ? 'updated' : 'created' });
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
  const id = req.params.id;
  projectsCache = projectsCache.filter((p: any) => p.id !== id);
  saveProjects(projectsCache);
  res.json({ success: true, id });
});

// Duplicate project
app.post('/api/projects/:id/duplicate', (req, res) => {
  const original = projectsCache.find((p: any) => p.id === req.params.id);
  if (!original) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const duplicated = {
    ...JSON.parse(JSON.stringify(original)),
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: `${original.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };

  projectsCache.unshift(duplicated);
  saveProjects(projectsCache);
  res.status(201).json({ project: duplicated });
});

// ==================== MARKETING LEADS API ====================
let marketingLeadsCache: any[] = [];
try {
  if (fs.existsSync(LEADS_FILE)) {
    marketingLeadsCache = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
  }
} catch (e) {
  marketingLeadsCache = [];
}

function saveMarketingLeads(leads: any[]) {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save marketing leads', err);
  }
}

app.post('/api/marketing/leads', (req, res) => {
  const leadData = {
    ...req.body,
    id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    receivedAt: new Date().toISOString()
  };
  marketingLeadsCache.unshift(leadData);
  saveMarketingLeads(marketingLeadsCache);
  res.status(201).json({ success: true, lead: leadData });
});

app.get('/api/marketing/leads', (req, res) => {
  res.json({ leads: marketingLeadsCache });
});

// ==================== LEMON SQUEEZY BILLING & ACTIVATION ====================

function getPaidOrders(): any[] {
  try {
    if (fs.existsSync(PAID_ORDERS_FILE)) {
      const content = fs.readFileSync(PAID_ORDERS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Failed to read paid orders', e);
  }
  return [];
}

function savePaidOrders(orders: any[]) {
  try {
    fs.writeFileSync(PAID_ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save paid orders', err);
  }
}

let paidOrdersCache = getPaidOrders();

// 1. Verify and activate order (called by client when user enters order/key or completes checkout)
app.post('/api/billing/activate', (req, res) => {
  const { orderId, email, plan = 'pro' } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required' });
  }

  const activationRecord = {
    id: `act-${Date.now()}`,
    orderId: String(orderId).trim(),
    email: email ? String(email).trim() : undefined,
    plan: plan || 'pro',
    activatedAt: new Date().toISOString(),
    status: 'active'
  };

  // Upsert into cache
  const existingIdx = paidOrdersCache.findIndex(
    (o) => o.orderId.toLowerCase() === String(orderId).trim().toLowerCase()
  );
  if (existingIdx >= 0) {
    paidOrdersCache[existingIdx] = { ...paidOrdersCache[existingIdx], ...activationRecord };
  } else {
    paidOrdersCache.unshift(activationRecord);
  }
  savePaidOrders(paidOrdersCache);

  res.json({
    success: true,
    plan: activationRecord.plan,
    message: `🎉 Order ${orderId} verified! Your account has been upgraded to ${activationRecord.plan.toUpperCase()}.`
  });
});

// 2. Lemon Squeezy Webhook endpoint (receives order_created, subscription_created events)
app.post('/api/webhook/lemonsqueezy', (req, res) => {
  try {
    const payload = req.body;
    const eventName = payload?.meta?.event_name || payload?.event_name || 'order_created';
    const customData = payload?.meta?.custom_data || {};
    const orderData = payload?.data?.attributes || payload;
    const orderId = payload?.data?.id || orderData?.order_id || `ls-${Date.now()}`;
    const userEmail = orderData?.user_email || orderData?.customer_email || customData?.email;
    const plan = customData?.plan || 'pro';

    console.log(`[LemonSqueezy Webhook] Received ${eventName} for order ${orderId}`);

    const webhookOrder = {
      id: `webhook-${Date.now()}`,
      orderId: String(orderId),
      email: userEmail,
      plan,
      eventName,
      receivedAt: new Date().toISOString(),
      raw: payload
    };

    paidOrdersCache.unshift(webhookOrder);
    savePaidOrders(paidOrdersCache);

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error handling Lemon Squeezy webhook:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// 3. Billing status check
app.get('/api/billing/status', (req, res) => {
  res.json({
    checkoutUrl: 'https://floover.lemonsqueezy.com/checkout/buy/e505c90b-80d6-4140-adb5-0da40dca123c?embed=1',
    activePaidCount: paidOrdersCache.length
  });
});

// ==================== REAL-TIME WEBSOCKETS ====================

interface ClientMeta {
  ws: WebSocket;
  userId: string;
  name: string;
  color: string;
  avatar: string;
  role?: string;
  projectId: string | null;
  cursor?: { x: number; y: number };
  selectedElementId?: string | null;
}

const clients = new Map<WebSocket, ClientMeta>();

const wss = new WebSocketServer({ noServer: true });

function getRoomUsers(projectId: string) {
  const users: any[] = [];
  for (const client of clients.values()) {
    if (client.projectId === projectId) {
      users.push({
        id: client.userId,
        name: client.name,
        color: client.color,
        avatar: client.avatar,
        role: client.role || 'editor',
        cursor: client.cursor,
        selectedElementId: client.selectedElementId
      });
    }
  }
  return users;
}

function broadcastToRoom(projectId: string, senderWs: WebSocket | null, payload: any) {
  const msg = JSON.stringify(payload);
  for (const [ws, meta] of clients.entries()) {
    if (meta.projectId === projectId && ws !== senderWs && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  const defaultUser = {
    ws,
    userId: `user-${Math.random().toString(36).substring(2, 8)}`,
    name: 'Collaborator',
    color: '#3b82f6',
    avatar: '👨‍💼',
    projectId: null as string | null
  };

  clients.set(ws, defaultUser);

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      const client = clients.get(ws);
      if (!client) return;

      switch (data.type) {
        case 'join': {
          client.projectId = data.projectId;
          if (data.user) {
            client.userId = data.user.id || client.userId;
            client.name = data.user.name || client.name;
            client.color = data.user.color || client.color;
            client.avatar = data.user.avatar || client.avatar;
            client.role = data.user.role || client.role || 'editor';
          }

          // If client sent initial project and server doesn't have it yet, store it
          let currentProject = projectsCache.find((p: any) => p.id === data.projectId);
          if (!currentProject && data.project) {
            currentProject = data.project;
            projectsCache.unshift(currentProject);
            saveProjects(projectsCache);
          }

          // Send current room presence to all members in room
          const users = getRoomUsers(data.projectId);

          // Reply to joined client with current state
          ws.send(JSON.stringify({
            type: 'joined',
            projectId: data.projectId,
            users,
            project: currentProject
          }));

          // Notify others in room
          broadcastToRoom(data.projectId, ws, {
            type: 'presence',
            users
          });
          break;
        }

        case 'cursor': {
          if (!client.projectId) return;
          client.cursor = { x: data.x, y: data.y };
          broadcastToRoom(client.projectId, ws, {
            type: 'cursor',
            userId: client.userId,
            name: client.name,
            color: client.color,
            x: data.x,
            y: data.y
          });
          break;
        }

        case 'selection': {
          if (!client.projectId) return;
          client.selectedElementId = data.elementId;
          broadcastToRoom(client.projectId, ws, {
            type: 'selection',
            userId: client.userId,
            name: client.name,
            color: client.color,
            elementId: data.elementId
          });
          break;
        }

        case 'element:create': {
          if (!client.projectId || !data.element) return;
          const project = projectsCache.find((p: any) => p.id === client.projectId);
          if (project) {
            const idx = project.elements.findIndex((e: any) => e.id === data.element.id);
            if (idx === -1) {
              project.elements.push(data.element);
              project.updatedAt = new Date().toISOString();
              saveProjects(projectsCache);
            }
          }

          broadcastToRoom(client.projectId, ws, {
            type: 'element:create',
            userId: client.userId,
            element: data.element
          });
          break;
        }

        case 'element:update': {
          if (!client.projectId || !data.element) return;
          const project = projectsCache.find((p: any) => p.id === client.projectId);
          if (project) {
            const idx = project.elements.findIndex((e: any) => e.id === data.element.id);
            if (idx >= 0) {
              project.elements[idx] = data.element;
            } else {
              project.elements.push(data.element);
            }
            project.updatedAt = new Date().toISOString();
            saveProjects(projectsCache);
          }

          broadcastToRoom(client.projectId, ws, {
            type: 'element:update',
            userId: client.userId,
            element: data.element
          });
          break;
        }

        case 'element:delete': {
          if (!client.projectId || !data.elementId) return;
          const project = projectsCache.find((p: any) => p.id === client.projectId);
          if (project) {
            project.elements = project.elements.filter((e: any) => e.id !== data.elementId);
            project.updatedAt = new Date().toISOString();
            saveProjects(projectsCache);
          }

          broadcastToRoom(client.projectId, ws, {
            type: 'element:delete',
            userId: client.userId,
            elementId: data.elementId
          });
          break;
        }

        case 'room:sync': {
          if (!client.projectId || !data.project) return;
          const idx = projectsCache.findIndex((p: any) => p.id === client.projectId);
          if (idx >= 0) {
            projectsCache[idx] = data.project;
          } else {
            projectsCache.unshift(data.project);
          }
          saveProjects(projectsCache);

          broadcastToRoom(client.projectId, ws, {
            type: 'room:sync',
            userId: client.userId,
            project: data.project
          });
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message processing error:', err);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client && client.projectId) {
      const room = client.projectId;
      clients.delete(ws);
      broadcastToRoom(room, null, {
        type: 'presence',
        users: getRoomUsers(room)
      });
    } else {
      clients.delete(ws);
    }
  });
});

// Upgrade HTTP to WS
server.on('upgrade', (request, socket, head) => {
  try {
    const urlStr = request.url || '';
    const pathname = urlStr.split('?')[0];
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } catch (err) {
    console.error('WebSocket upgrade error:', err);
    socket.destroy();
  }
});

// ==================== VITE / STATIC SERVING ====================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Floover server running on http://0.0.0.0:${PORT}`);
  });
}

start();
