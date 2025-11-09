(function(){
  const clientId = "c_" + Math.random().toString(36).substring(2, 8);
  let currentRoomId = localStorage.getItem("lastRoomId") || "default";
  let socket = null;
  
  function connectToRoom(roomId) {
    if (socket) socket.disconnect();
    currentRoomId = roomId;
    localStorage.setItem("lastRoomId", roomId);
    // Reset canvas state
    if (window.CanvasApp && window.CanvasApp.clear) {
      window.CanvasApp.clear();
    }
    socket = SocketClient.connect({ roomId, clientId, name: "Guest" });
    updateRoomStatus();
  }
  
  function updateRoomStatus() {
    const roomStatusEl = document.getElementById("roomStatus");
    if (roomStatusEl) roomStatusEl.textContent = `Room: ${currentRoomId}`;
  }
  
  connectToRoom(currentRoomId);

  window.app = window.app || {};
  window.app.onAssign = (msg) => {
    CanvasApp.init({ clientId: msg.clientId, color: msg.color });
    document.getElementById("status").textContent = "Connected as " + msg.clientId;
    const statusDot = document.querySelector(".status-dot");
    if (statusDot) statusDot.style.background = "#3ddc97";

    // Initialize tool settings from UI
    const toolEl = document.getElementById("tool");
    const colorEl = document.getElementById("color");
    const widthEl = document.getElementById("width");
    const widthValEl = document.getElementById("widthValue");

    if (toolEl) CanvasApp.setTool(toolEl.value);
    if (colorEl) CanvasApp.setColor(colorEl.value);
    if (widthEl) {
      const w = parseInt(widthEl.value, 10);
      CanvasApp.setWidth(w);
      if (widthValEl) widthValEl.textContent = String(w);
    }
  };

  window.app.onPresence = (msg) => {
    const users = document.getElementById("users");
    users.innerHTML = "";
    msg.clients.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c.name || c.clientId;
      li.style.color = c.color;
      users.appendChild(li);
    });
  };

  document.getElementById("undo").addEventListener("click", () => SocketClient.send("undo", {}));
  const redoBtn = document.getElementById("redo");
  if (redoBtn) redoBtn.addEventListener("click", () => SocketClient.send("redo", {}));

  // Wire toolbar controls
  const toolEl = document.getElementById("tool");
  const colorEl = document.getElementById("color");
  const widthEl = document.getElementById("width");
  const widthValEl = document.getElementById("widthValue");

  if (toolEl) toolEl.addEventListener("change", (e) => CanvasApp.setTool(e.target.value));
  if (colorEl) colorEl.addEventListener("input", (e) => CanvasApp.setColor(e.target.value));
  if (widthEl) widthEl.addEventListener("input", (e) => {
    const w = parseInt(e.target.value, 10);
    CanvasApp.setWidth(w);
    if (widthValEl) widthValEl.textContent = String(w);
  });

  // Room system
  const roomInput = document.getElementById("roomInput");
  const joinRoomBtn = document.getElementById("joinRoom");
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener("click", () => {
      const roomId = roomInput?.value?.trim() || "default";
      connectToRoom(roomId);
      if (roomInput) roomInput.value = "";
    });
  }
  if (roomInput) {
    roomInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const roomId = roomInput.value.trim() || "default";
        connectToRoom(roomId);
        roomInput.value = "";
      }
    });
  }
  updateRoomStatus();

  // Drawing persistence
  const saveBtn = document.getElementById("save");
  const loadBtn = document.getElementById("load");
  const loadFileInput = document.getElementById("loadFile");
  
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const data = CanvasApp.exportDrawing();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drawing-${currentRoomId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  
  if (loadBtn && loadFileInput) {
    loadBtn.addEventListener("click", () => loadFileInput.click());
    loadFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          CanvasApp.importDrawing(data);
        } catch (err) {
          alert("Failed to load drawing: " + err.message);
        }
      };
      reader.readAsText(file);
    });
  }
})();