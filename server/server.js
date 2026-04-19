const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const wss  = new WebSocket.Server({ port: PORT });

// rooms: Map of roomCode → { players: Map of id → { ws, snapshot, name, isHost } }
const rooms = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusable chars
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (rooms.has(code));
  return code;
}

function broadcast(room, message, excludeId = null) {
  const data = JSON.stringify(message);
  for (const [id, p] of room.players) {
    if (id !== excludeId && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(data);
    }
  }
}

function broadcastAll(room, message) {
  broadcast(room, message, null);
}

function getRoomOf(playerId) {
  for (const [code, room] of rooms) {
    if (room.players.has(playerId)) return { code, room };
  }
  return null;
}

function playerLeft(playerId) {
  const result = getRoomOf(playerId);
  if (!result) return;
  const { code, room } = result;

  const p = room.players.get(playerId);
  room.players.delete(playerId);

  broadcast(room, {
    type: "playerLeft",
    id: playerId,
    name: p?.name || "Unknown"
  });

  // If room is empty, delete it
  if (room.players.size === 0) {
    rooms.delete(code);
    console.log(`Room ${code} closed`);
    return;
  }

  // If host left, assign new host
  if (p?.isHost) {
    const newHost = room.players.values().next().value;
    if (newHost) {
      newHost.isHost = true;
      newHost.ws.send(JSON.stringify({ type: "youAreHost" }));
      broadcast(room, { type: "newHost", id: newHost.id }, newHost.id);
    }
  }

  // Send updated player list to remaining players
  broadcastAll(room, {
    type: "playerList",
    players: getPlayerList(room)
  });
}

function getPlayerList(room) {
  return Array.from(room.players.entries()).map(([id, p]) => ({
    id,
    name: p.name,
    isHost: p.isHost
  }));
}

wss.on("connection", ws => {
  let myId = null;

  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw); }
    catch { return; }

    switch (msg.type) {

      case "create": {
        const code = generateRoomCode();
        const room = { players: new Map() };
        rooms.set(code, room);

        myId = msg.id;
        room.players.set(myId, { ws, name: msg.name, isHost: true, snapshot: null });

        ws.send(JSON.stringify({
          type: "created",
          code,
          players: getPlayerList(room)
        }));

        console.log(`Room ${code} created by ${msg.name}`);
        break;
      }

      case "join": {
        const code = msg.code?.toUpperCase();
        const room = rooms.get(code);

        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found." }));
          return;
        }
        if (room.players.size >= 4) {
          ws.send(JSON.stringify({ type: "error", message: "Room is full." }));
          return;
        }

        myId = msg.id;
        room.players.set(myId, { ws, name: msg.name, isHost: false, snapshot: null });

        ws.send(JSON.stringify({
          type: "joined",
          code,
          players: getPlayerList(room)
        }));

        broadcast(room, {
          type: "playerJoined",
          id: myId,
          name: msg.name,
          players: getPlayerList(room)
        }, myId);

        console.log(`${msg.name} joined room ${code}`);
        break;
      }

      case "playerUpdate": {
        const result = getRoomOf(myId);
        if (!result) return;
        const { room } = result;

        const p = room.players.get(myId);
        if (p) p.snapshot = msg.snapshot;

        broadcast(room, {
          type: "playerUpdate",
          id: myId,
          snapshot: msg.snapshot
        }, myId);
        break;
      }

      case "startGame": {
        const result = getRoomOf(myId);
        if (!result) return;
        const { room } = result;

        const p = room.players.get(myId);
        if (!p?.isHost) return; // only host can start

        broadcastAll(room, {
          type: "gameStarted",
          level: msg.level
        });
        break;
      }

      case "chat": {
        const result = getRoomOf(myId);
        if (!result) return;
        const { room } = result;

        const p = room.players.get(myId);
        broadcast(room, {
          type: "chat",
          id: myId,
          name: p?.name || "Unknown",
          text: msg.text
        }, myId);
        break;
      }
    }
  });

  ws.on("close", () => {
    if (myId) playerLeft(myId);
  });

  ws.on("error", () => {
    if (myId) playerLeft(myId);
  });
});

console.log(`Server running on port ${PORT}`);