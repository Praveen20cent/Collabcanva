(function () {
  const backCanvas = document.getElementById("backCanvas");
  const topCanvas = document.getElementById("topCanvas");
  const backCtx = backCanvas.getContext("2d");
  const topCtx = topCanvas.getContext("2d");

  const state = {
    drawing: false,
    clientId: null,
    currentStroke: null,
    color: "#000000",
    width: 4,
    tool: "brush",
    opMap: new Map(),
    remoteStrokes: {}, // active strokes from other users
    myColor: "#000000",
    remoteCursors: {},
    shapeStart: null, // for shape drawing
    currentShape: null
  };

  // --- Resize handling ---
  function resize() {
    const rect = topCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width * dpr;
    const height = rect.height * dpr;

    backCanvas.width = topCanvas.width = width;
    backCanvas.height = topCanvas.height = height;

    backCanvas.style.width = rect.width + "px";
    backCanvas.style.height = rect.height + "px";
    topCanvas.style.width = rect.width + "px";
    topCanvas.style.height = rect.height + "px";

    backCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    topCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    redrawAll();
  }

  window.addEventListener("resize", resize);

  // --- Core draw helper ---
  function drawStroke(ctx, points, opts) {
    if (points.length < 2 && opts.tool !== "rectangle" && opts.tool !== "circle") return;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = opts.width;
    ctx.strokeStyle = opts.color;

    // Eraser logic
    if (opts.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }

    // Shape drawing
    if (opts.tool === "rectangle" && points.length >= 2) {
      const [x1, y1] = points[0];
      const [x2, y2] = points[points.length - 1];
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);
      ctx.strokeRect(x, y, w, h);
    } else if (opts.tool === "circle" && points.length >= 2) {
      const [x1, y1] = points[0];
      const [x2, y2] = points[points.length - 1];
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      ctx.beginPath();
      ctx.arc(x1, y1, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Regular stroke
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- Local drawing ---
  function startStroke(x, y) {
    state.drawing = true;
    const strokeId = "s_" + Math.random().toString(36).slice(2, 9);
    state.currentStroke = {
      strokeId,
      points: [[x, y]],
      color: state.color,
      width: state.width,
      tool: state.tool
    };

    SocketClient.send("stroke_begin", {
      clientId: state.clientId,
      strokeId,
      color: state.color,
      width: state.width,
      tool: state.tool
    });
  }

  function moveStroke(x, y) {
    if (!state.drawing || !state.currentStroke) return;
    const stroke = state.currentStroke;
    stroke.points.push([x, y]);

    // Draw live stroke on top layer
    topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
    drawStroke(topCtx, stroke.points, stroke);

    SocketClient.send("stroke_point", {
      clientId: state.clientId,
      strokeId: stroke.strokeId,
      points: [[x, y]]
    });
  }

  function endStroke() {
    if (!state.drawing) return;
    const stroke = state.currentStroke;
    state.drawing = false;
    state.currentStroke = null;

    // Commit stroke to back canvas
    drawStroke(backCtx, stroke.points, stroke);
    topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);

    SocketClient.send("stroke_end", {
      clientId: state.clientId,
      payload: stroke
    });
  }

  // --- Remote updates ---
  function onRemoteStrokeBegin(msg) {
    const { strokeId, color, width, tool } = msg;
    state.remoteStrokes[strokeId] = { points: [], color, width, tool };
  }

  function onRemoteStrokePoint(msg) {
    const { strokeId, points } = msg;
    const s = state.remoteStrokes[strokeId];
    if (!s) return;
    s.points.push(...points);
    topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
    Object.values(state.remoteStrokes).forEach((r) => {
      drawStroke(topCtx, r.points, r);
    });
  }

  function onOpCommitted(msg) {
    const { op } = msg;
    state.opMap.set(op.opId, op);
    if (op.type === "stroke" && op.active) {
      drawStroke(backCtx, op.payload.points, op.payload);
    }
    // cleanup remote buffer
    if (op.payload?.strokeId) delete state.remoteStrokes[op.payload.strokeId];
    topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
  }

  function onOpToggled(msg) {
    const { toggleOp } = msg;
    const target = state.opMap.get(toggleOp.targetOpId);
    if (target) target.active = !target.active;
    redrawAll();
  }

  function onRoomState(data) {
    data.activeOps.forEach((op) => state.opMap.set(op.opId, op));
    redrawAll();
  }

  function ensureCursorEl(clientId) {
    const layer = document.getElementById("cursorsLayer");
    if (!layer) return null;
    let el = layer.querySelector(`[data-client="${clientId}"]`);
    if (!el) {
      el = document.createElement("div");
      el.className = "cursor";
      el.dataset.client = clientId;
      el.innerHTML = '<div class="dot"></div><div class="label"></div>';
      layer.appendChild(el);
    }
    return el;
  }

  function onRemoteCursor(msg) {
    const { clientId, x, y, drawing, color, name, hidden } = msg;
    const el = ensureCursorEl(clientId);
    if (!el) return;
    if (hidden) { el.style.display = "none"; return; }
    el.style.display = "flex";
    el.style.left = x + "px";
    el.style.top = y + "px";
    const dot = el.querySelector(".dot");
    const label = el.querySelector(".label");
    if (dot) {
      dot.style.background = color || "#cccccc";
      dot.style.width = drawing ? "14px" : "10px";
      dot.style.height = drawing ? "14px" : "10px";
    }
    if (label) label.textContent = name || clientId;
  }

  // --- Redraw everything ---
  function redrawAll() {
    backCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);
    // Ensure a solid white drawing background
    backCtx.save();
    backCtx.globalCompositeOperation = "source-over";
    backCtx.fillStyle = "#ffffff";
    backCtx.fillRect(0, 0, backCanvas.width, backCanvas.height);
    backCtx.restore();
    const activeOps = Array.from(state.opMap.values()).filter(
      (o) => o.type === "stroke" && o.active
    );
    activeOps.forEach((op) =>
      drawStroke(backCtx, op.payload.points, op.payload)
    );
  }

  // --- Bind events ---
  window.CanvasApp = {
    init({ clientId, color }) {
      state.clientId = clientId;
      if (color) state.myColor = color;
      resize();

      let isDown = false;

      topCanvas.addEventListener("pointerdown", (e) => {
        isDown = true;
        if (state.tool === "rectangle" || state.tool === "circle") {
          state.shapeStart = [e.offsetX, e.offsetY];
          startStroke(e.offsetX, e.offsetY);
        } else {
          startStroke(e.offsetX, e.offsetY);
        }
      });

      topCanvas.addEventListener("pointermove", (e) => {
        if (isDown) {
          if (state.tool === "rectangle" || state.tool === "circle") {
            // For shapes, only keep start and current point
            if (state.currentStroke && state.shapeStart) {
              state.currentStroke.points = [state.shapeStart, [e.offsetX, e.offsetY]];
              topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
              drawStroke(topCtx, state.currentStroke.points, state.currentStroke);
            }
          } else {
            moveStroke(e.offsetX, e.offsetY);
          }
        }
        // broadcast cursor position
        SocketClient.send("cursor", {
          clientId: state.clientId,
          x: e.offsetX,
          y: e.offsetY,
          drawing: isDown,
          color: state.myColor
        });
      });

      topCanvas.addEventListener("pointerup", (e) => {
        isDown = false;
        if (state.tool === "rectangle" || state.tool === "circle") {
          state.shapeStart = null;
        }
        endStroke();
        SocketClient.send("cursor", { clientId: state.clientId, hidden: true });
      });

      topCanvas.addEventListener("pointerleave", () => {
        SocketClient.send("cursor", { clientId: state.clientId, hidden: true });
      });

      // link socket events
      window.app = window.app || {};
      window.app.onRemoteStrokeBegin = onRemoteStrokeBegin;
      window.app.onRemoteStrokePoint = onRemoteStrokePoint;
      window.app.onOpCommitted = onOpCommitted;
      window.app.onOpToggled = onOpToggled;
      window.app.onRoomState = onRoomState;
      window.app.onCursor = onRemoteCursor;
    },

    setTool(t) {
      state.tool = t;
    },
    setColor(c) {
      state.color = c;
    },
    setWidth(w) {
      state.width = w;
    },
    undo() {
      SocketClient.send("undo", {});
    },
    
    clear() {
      state.opMap.clear();
      state.remoteStrokes = {};
      redrawAll();
    },
    
    exportDrawing() {
      const activeOps = Array.from(state.opMap.values())
        .filter(o => o.type === "stroke" && o.active)
        .map(op => ({
          type: op.type,
          payload: op.payload,
          opId: op.opId,
          ts: op.ts
        }));
      return {
        version: "1.0",
        roomId: "exported",
        timestamp: Date.now(),
        operations: activeOps
      };
    },
    
    importDrawing(data) {
      if (!data || !data.operations) {
        console.error("Invalid drawing data");
        return;
      }
      // Clear current state
      state.opMap.clear();
      // Add imported operations
      data.operations.forEach(op => {
        op.active = true;
        state.opMap.set(op.opId, op);
      });
      // Redraw canvas
      redrawAll();
      // Optionally send to server (if in a room)
      if (state.clientId) {
        data.operations.forEach(op => {
          if (op.type === "stroke") {
            SocketClient.send("stroke_end", {
              clientId: state.clientId,
              payload: op.payload
            });
          }
        });
      }
    }
  };
})();