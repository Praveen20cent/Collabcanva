const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { getOrCreateRoom } = require("./rooms");
const drawingState = require("./drawing-state");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const CLIENT_COLORS = ["#e91e63", "#2196f3", "#4caf50", "#ff9800", "#9c27b0", "#607d8b"];

app.use(express.static(path.join(__dirname, "..", "client")));

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("join", (payload) => {
    const { roomId = "default", clientId = uuidv4(), name = "Anonymous" } = payload || {};
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.clientId = clientId;

    const room = getOrCreateRoom(roomId);
    const color = CLIENT_COLORS[room.clients.size % CLIENT_COLORS.length];
    room.addClient(clientId, { socketId: socket.id, color, name });

    socket.emit("assign", { clientId, color });
    const activeOps = room.getFullActiveOps();
    socket.emit("room_state", { activeOps });
    io.to(roomId).emit("presence", {
      clients: Array.from(room.clients.entries()).map(([id, meta]) => ({ clientId: id, ...meta }))
    });
  });

  socket.on("stroke_begin", (msg) => socket.to(socket.data.roomId).emit("stroke_begin", msg));

  socket.on("stroke_point", (msg) => socket.to(socket.data.roomId).emit("stroke_point", msg));

  socket.on("stroke_end", (msg) => {
    const room = getOrCreateRoom(socket.data.roomId);
    const op = room.commitOp({ type: "stroke", clientId: msg.clientId, payload: msg.payload });
    io.to(room.id).emit("op_committed", { op });
    if (drawingState.shouldSnapshot(room)) console.log("snapshot desired for room", room.id);
  });

  socket.on("undo", (msg) => {
    const room = getOrCreateRoom(socket.data.roomId);
    const { targetOpId } = msg || {};
    let toggleOp = null;
    if (targetOpId) toggleOp = room.toggleOpActive(targetOpId, false);
    else {
      const lastStroke = [...room.opLog].reverse().find((o) => o.type === "stroke" && o.active);
      if (lastStroke) toggleOp = room.toggleOpActive(lastStroke.opId, false);
    }
    if (toggleOp) io.to(room.id).emit("op_toggled", { toggleOp });
  });

  // Redo: reactivate the most recent inactive stroke (global) or a specific target
  socket.on("redo", (msg) => {
    const room = getOrCreateRoom(socket.data.roomId);
    const { targetOpId } = msg || {};
    let toggleOp = null;
    if (targetOpId) toggleOp = room.toggleOpActive(targetOpId, true);
    else {
      const lastInactive = [...room.opLog].reverse().find((o) => o.type === "stroke" && !o.active);
      if (lastInactive) toggleOp = room.toggleOpActive(lastInactive.opId, true);
    }
    if (toggleOp) io.to(room.id).emit("op_toggled", { toggleOp });
  });

  socket.on("cursor", (msg) => socket.to(socket.data.roomId).emit("cursor", msg));

  socket.on("ping", (msg) => {
    socket.emit("pong", { timestamp: msg.timestamp });
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);
    const roomId = socket.data.roomId;
    const clientId = socket.data.clientId;
    if (!roomId) return;
    const room = getOrCreateRoom(roomId);
    room.removeClient(clientId);
    io.to(roomId).emit("presence", {
      clients: Array.from(room.clients.entries()).map(([id, meta]) => ({ clientId: id, ...meta }))
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server listening on http://localhost:" + PORT));

// Serve static frontend files (for production build)
const clientPath = path.join(__dirname, "..", "client");
app.use(express.static(clientPath));

// Serve index.html for any unmatched routes
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

