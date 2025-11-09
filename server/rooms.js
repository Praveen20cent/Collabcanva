const { v4: uuidv4 } = require("uuid");

class Room {
  constructor(id) {
    this.id = id;
    this.clients = new Map();
    this.opLog = [];
    this.nextIndex = 0;
  }

  addClient(clientId, meta) {
    this.clients.set(clientId, meta);
  }

  removeClient(clientId) {
    this.clients.delete(clientId);
  }

  commitOp(op) {
    op.opId = op.opId || uuidv4();
    op.opIndex = this.nextIndex++;
    op.ts = Date.now();
    op.active = true;
    this.opLog.push(op);
    return op;
  }

  toggleOpActive(opId, active) {
    const op = this.opLog.find((o) => o.opId === opId);
    if (!op) return null;
    op.active = !!active;
    const toggleOp = {
      opId: uuidv4(),
      type: active ? "redo" : "undo",
      targetOpId: opId,
      ts: Date.now(),
      clientId: null,
      opIndex: this.nextIndex++
    };
    this.opLog.push(toggleOp);
    return toggleOp;
  }

  getFullActiveOps() {
    return this.opLog.filter((o) => o.type === "stroke" && o.active);
  }
}

const rooms = new Map();
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Room(roomId));
  return rooms.get(roomId);
}

module.exports = { getOrCreateRoom };
