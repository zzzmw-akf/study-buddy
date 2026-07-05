// Study Buddy Relay v3.0 — All-in-one HTTP + WebSocket server
// Serves frontend pages AND relays WebSocket messages in rooms.
// Use with ngrok/localtunnel to expose to internet — standard 443 port everywhere.
//
// Architecture:
//   HTTP:     /               → index.html
//   HTTP:     /student.html   → student page
//   HTTP:     /supervisor.html → supervisor page  
//   HTTP:     /health         → health check
//   WebSocket: /ws/ROOM_CODE  → join relay room
//
// Frontend uses location.host for WebSocket URL → same-origin, no CORS.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.env.PORT || '8080', 10);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// ── HTTP Server ──────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let filePath = url.pathname;

  // Health check
  if (filePath === '/health') {
    const stats = getRoomStats();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', ...stats, time: Date.now() }));
    return;
  }

  // Default to index.html
  if (filePath === '/') filePath = '/index.html';

  // Security: prevent directory traversal
  const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(PUBLIC_DIR, safePath);

  // Only serve files within PUBLIC_DIR
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Serve static file
  const ext = path.extname(fullPath).toLowerCase();
  const mimeType = MIME[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fall back to index.html for SPA-like routing
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data2);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

// ── WebSocket Relay ──────────────────────────────────────────
const wss = new WebSocketServer({ noServer: true });

// Room: roomId → Map<connId, { ws, id, joinedAt }>
const rooms = new Map();
let nextId = 0;
let totalConnections = 0;

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  // Only handle /ws/ROOM_CODE paths as WebSocket
  const match = pathname.match(/^\/ws\/(.+)$/);
  if (!match) {
    socket.destroy();
    return;
  }

  const roomId = match[1].toUpperCase();
  if (roomId.length < 3) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\nRoom code too short');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, roomId);
  });
});

wss.on('connection', (ws, req, roomId) => {
  const connId = ++nextId;
  totalConnections++;

  // Add to room
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  const room = rooms.get(roomId);
  room.set(connId, { ws, id: connId, joinedAt: Date.now() });

  const peerCount = room.size - 1;
  log(`+ Room ${roomId} #${connId} joined (peers: ${peerCount}, rooms: ${rooms.size})`);

  // Welcome message
  safeSend(ws, { type: 'welcome', room: roomId, peers: peerCount, connId });

  ws.on('message', (data) => {
    const msg = data.toString();
    let sent = 0;
    for (const [cid, client] of room) {
      if (cid !== connId && client.ws.readyState === 1) {
        try { client.ws.send(msg); sent++; } catch (e) {}
      }
    }
  });

  ws.on('close', () => handleDisconnect(roomId, connId));
  ws.on('error', () => handleDisconnect(roomId, connId));

  // Keepalive
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});

// Keepalive: ping all clients every 30s
setInterval(() => {
  for (const [roomId, room] of rooms) {
    for (const [connId, client] of room) {
      if (client.ws.isAlive === false) {
        log(`- Room ${roomId} #${connId} timed out`);
        try { client.ws.terminate(); } catch (e) {}
        room.delete(connId);
        continue;
      }
      client.ws.isAlive = false;
      try { client.ws.ping(); } catch (e) {}
    }
    if (room.size === 0) rooms.delete(roomId);
  }
}, 30000);

// ── Helpers ──────────────────────────────────────────────────

function handleDisconnect(roomId, connId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const client = room.get(connId);
  room.delete(connId);
  const remaining = room.size;
  const duration = client ? Math.round((Date.now() - client.joinedAt) / 1000) : 0;
  log(`- Room ${roomId} #${connId} left (${duration}s, remaining: ${remaining})`);
  if (remaining === 0) {
    rooms.delete(roomId);
    log(`  Room ${roomId} deleted (empty)`);
  }
}

function safeSend(ws, data) {
  try { if (ws.readyState === 1) ws.send(JSON.stringify(data)); } catch (e) {}
}

function getRoomStats() {
  let totalPeers = 0;
  for (const room of rooms.values()) totalPeers += room.size;
  return { rooms: rooms.size, peers: totalPeers, totalConnections, uptime: Math.floor(process.uptime()) };
}

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// ── Start ────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log('  Study Buddy Relay v3.0 — All-in-One');
  console.log(`  HTTP + WebSocket on port ${PORT}`);
  console.log(`  Serving files from: ${PUBLIC_DIR}`);
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('  Local access:');
  console.log(`    http://localhost:${PORT}/`);
  console.log('');
  console.log('  To expose to internet, run in another terminal:');
  console.log(`    ngrok http ${PORT}`);
  console.log('    or: npx localtunnel --port ' + PORT);
  console.log('');
  console.log('  Then share the public URL with your friend!');
  console.log('═══════════════════════════════════════════');
});
