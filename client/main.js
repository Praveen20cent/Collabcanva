(function(){
    const clientId = "c_" + Math.random().toString(36).substring(2, 8);
    const socket = SocketClient.connect({ roomId: "default", clientId, name: "Guest" });
  
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
  })();
  