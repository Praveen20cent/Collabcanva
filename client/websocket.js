const SocketClient = (() => {
    let socket = null;
    let latencyInterval = null;
    let currentLatency = null;
  
    function connect({ url = location.origin, roomId = "default", clientId = null, name = null } = {}) {
      if (socket) socket.disconnect();
      if (latencyInterval) clearInterval(latencyInterval);
      
      socket = io(url);
      socket.on("connect", () => {
        console.log("socket connected:", socket.id);
        startLatencyMeasurement();
      });
  
      const handlers = [
        "assign", "room_state", "stroke_begin", "stroke_point",
        "op_committed", "op_toggled", "cursor", "presence"
      ];
      handlers.forEach(ev => socket.on(ev, msg => window.app && window.app[`on${ev.replace(/(^|_)([a-z])/g, (_,__,c)=>c.toUpperCase())}`]?.(msg)));
  
      socket.on("pong", (msg) => {
        const latency = Date.now() - msg.timestamp;
        currentLatency = latency;
        updateLatencyDisplay(latency);
      });
  
      socket.on("disconnect", () => {
        if (latencyInterval) clearInterval(latencyInterval);
        updateLatencyDisplay(null);
      });
  
      socket.emit("join", { roomId, clientId, name });
      return socket;
    }
  
    function startLatencyMeasurement() {
      // Measure latency every 2 seconds
      latencyInterval = setInterval(() => {
        if (socket && socket.connected) {
          socket.emit("ping", { timestamp: Date.now() });
        }
      }, 2000);
      // Send initial ping
      if (socket && socket.connected) {
        socket.emit("ping", { timestamp: Date.now() });
      }
    }
  
    function updateLatencyDisplay(latency) {
      const el = document.getElementById("latency");
      if (!el) return;
      
      if (latency === null) {
        el.textContent = "— ms";
        el.className = "latency-display";
        return;
      }
      
      el.textContent = `${latency} ms`;
      
      // Color coding: good < 50ms, warning < 150ms, bad >= 150ms
      el.className = "latency-display";
      if (latency < 50) {
        el.classList.add("good");
      } else if (latency < 150) {
        el.classList.add("warning");
      } else {
        el.classList.add("bad");
      }
    }
  
    function send(type, payload) {
      if (socket) socket.emit(type, payload);
    }
  
    function getLatency() {
      return currentLatency;
    }
  
    return { connect, send, getLatency };
  })();
  