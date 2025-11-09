const SocketClient = (() => {
    let socket = null;
  
    function connect({ url = location.origin, roomId = "default", clientId = null, name = null } = {}) {
      if (socket) socket.disconnect();
      socket = io(url);
      socket.on("connect", () => console.log("socket connected:", socket.id));
  
      const handlers = [
        "assign", "room_state", "stroke_begin", "stroke_point",
        "op_committed", "op_toggled", "cursor", "presence"
      ];
      handlers.forEach(ev => socket.on(ev, msg => window.app && window.app[`on${ev.replace(/(^|_)([a-z])/g, (_,__,c)=>c.toUpperCase())}`]?.(msg)));
  
      socket.emit("join", { roomId, clientId, name });
      return socket;
    }
  
    function send(type, payload) {
      if (socket) socket.emit(type, payload);
    }
  
    return { connect, send };
  })();
  