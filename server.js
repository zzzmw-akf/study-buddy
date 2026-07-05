const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;

// MIME types
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// ---- HTTP Static File Server ----
const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  filePath = path.join(__dirname, 'public', filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
      res.end(data);
    }
  });
});

// ---- WebSocket Server ----
const wss = new WebSocketServer({ server, path: '/ws' });

// Room structure: roomCode -> { student: ws, supervisor: ws, lastStatus: {} }
const rooms = {};

wss.on('connection', (ws) => {
  let role = null;
  let roomCode = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch(e) { return; }

    switch (msg.type) {

      case 'join': {
        role = msg.role;
        roomCode = msg.room || randomCode();

        if (!rooms[roomCode]) {
          rooms[roomCode] = { student: null, supervisor: null, lastStatus: {} };
        }
        rooms[roomCode][role] = ws;

        send(ws, { type: 'joined', room: roomCode, role, lastStatus: rooms[roomCode].lastStatus });

        // Notify peer
        const peer = rooms[roomCode][role === 'student' ? 'supervisor' : 'student'];
        if (peer && peer.readyState === 1) {
          send(peer, { type: 'peer-online', role });
          // Send current status snapshot to the peer who just came online
          if (rooms[roomCode].lastStatus) {
            if (role === 'supervisor') {
              send(ws, { type: 'student-status', data: rooms[roomCode].lastStatus });
            }
            if (role === 'student' && rooms[roomCode].lastStatus) {
              send(peer, { type: 'student-status', data: rooms[roomCode].lastStatus });
            }
          }
        }
        break;
      }

      case 'status-update': {
        if (rooms[roomCode]) rooms[roomCode].lastStatus = msg.data;
        relay(roomCode, { type: 'student-status', data: msg.data }, 'supervisor');
        break;
      }

      case 'goal-complete': {
        relay(roomCode, { type: 'student-complete', data: msg.data }, 'supervisor');
        break;
      }

      case 'sos': {
        relay(roomCode, { type: 'student-sos' }, 'supervisor');
        break;
      }

      case 'sos-end': {
        relay(roomCode, { type: 'student-sos-end' }, 'supervisor');
        break;
      }

      case 'sos-cancel': {
        relay(roomCode, { type: 'student-sos-cancel' }, 'supervisor');
        break;
      }

      case 'encourage': {
        relay(roomCode, { type: 'encourage', data: { message: msg.message } }, 'student');
        break;
      }

      case 'ping': {
        send(ws, { type: 'pong' });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (roomCode && rooms[roomCode]) {
      const peer = rooms[roomCode][role === 'student' ? 'supervisor' : 'student'];
      if (peer && peer.readyState === 1) {
        send(peer, { type: 'peer-offline', role });
      }
      rooms[roomCode][role] = null;
      if (!rooms[roomCode].student && !rooms[roomCode].supervisor) {
        delete rooms[roomCode];
      }
    }
  });

  ws.on('error', () => {});
});

function send(ws, data) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

function relay(roomCode, data, targetRole) {
  const room = rooms[roomCode];
  if (room) send(room[targetRole], data);
}

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

server.listen(PORT, () => {
  console.log(`Study Buddy server running on port ${PORT}`);
});
