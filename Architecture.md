<img width="1228" height="655" alt="image" src="https://github.com/user-attachments/assets/593bbfd5-d150-4a52-a11f-3379a2cb74b8" />

# 🏗️ Syncsketch — System Architecture

This document describes the **architecture**, **data flow**, and **design strategies** of *SyncSketch*, a real-time collaborative drawing application built with **Node.js**, **Express.js**, and **Socket.IO**.

The system is designed for **low-latency**, **real-time communication**, and **consistent shared state** across multiple users drawing simultaneously on a shared canvas.

---

## 🎯 Overview

Syncsketch enables multiple users to:
- Draw or erase strokes in real time.
- See updates from all connected users instantly.
- Perform global Undo/Redo actions.
- Track cursor positions of active users.

All communication occurs over **WebSockets**, ensuring full-duplex, event-driven data flow between clients and the server.

---


### **Step-by-Step Flow**

1. **User starts drawing:**  
   - The client captures mouse/touch events and emits them as `draw` messages to the server via WebSocket.

2. **Server receives drawing data:**  
   - The server immediately broadcasts the data to all other connected clients except the sender.

3. **Other clients render stroke:**  
   - Each receiving client renders the stroke locally on its canvas using the provided coordinates, color, and tool type.

4. **Undo/Redo updates:**  
   - When undo/redo occurs, the server broadcasts a corresponding event that removes or restores specific strokes on every client.

This ensures all users maintain the **same canvas state** in near real time.

---

## 💬 **WebSocket Protocol**

### **Events Sent from Client → Server**

| Event | Payload | Description |
|--------|----------|-------------|
| `startDraw` | `{x, y, color, tool}` | Indicates drawing began |
| `draw` | `{x, y, color, tool}` | Sends real-time drawing coordinates |
| `stopDraw` | `{}` | Signals end of a stroke |
| `undoRequest` | `{userId}` | Requests global Undo |
| `redoRequest` | `{userId}` | Requests global Redo |
| `cursorMove` | `{x, y}` | Updates user cursor position |
| `join` | `{username}` | Notifies the server a new user joined |

---

### **Events Sent from Server → Clients**

| Event | Payload | Description |
|--------|----------|-------------|
| `draw` | `{x, y, color, tool}` | Broadcasts drawing updates to all clients |
| `undoAction` | `{strokeId}` | Removes last stroke from all canvases |
| `redoAction` | `{stroke}` | Reapplies last undone stroke |
| `userListUpdate` | `{users}` | Broadcasts active user list |
| `cursorUpdate` | `{userId, x, y}` | Updates user cursor position |
| `syncCanvas` | `{undoStack}` | Sends full canvas state to new/reconnected users |

---

## ↩️ **Undo/Redo Strategy**

### **1. Global State Management**

The server maintains two synchronized stacks shared among all users:

| Stack | Description |
|--------|-------------|
| **Undo Stack** | Stores all completed strokes (chronologically). |
| **Redo Stack** | Stores undone strokes for potential reapplication. |

Every drawing session is synchronized across all clients based on these two stacks.

---

### **2. Undo Flow**
1. A user triggers Undo → client emits `undoRequest`.
2. Server removes the latest stroke from the Undo Stack.
3. The removed stroke is pushed into the Redo Stack.
4. Server broadcasts `undoAction` → all clients remove that stroke from their canvas.

### **3. Redo Flow**
1. A user triggers Redo → client emits `redoRequest`.
2. Server pops a stroke from the Redo Stack.
3. The stroke is pushed back into the Undo Stack.
4. Server broadcasts `redoAction` → all clients re-render the stroke.

---

### **4. Synchronization Rules**
- **Server is authoritative.** Clients do not locally undo or redo without server confirmation.
- **Event ordering** is guaranteed by Socket.IO’s FIFO delivery.
- **New users** receive the entire `Undo Stack` to reconstruct the full canvas.

---

### **5. Example**
| Time | Action | Undo Stack | Redo Stack |
|------|---------|-------------|------------|
| t1 | User A draws Stroke 1 | [S1] | [] |
| t2 | User B draws Stroke 2 | [S1, S2] | [] |
| t3 | User A triggers Undo | [S1] | [S2] |
| t4 | User B triggers Redo | [S1, S2] | [] |

---

## ⚙️ **Performance Decisions**

### **1. Event Throttling**
- Mouse move events are throttled (~every 10–15ms).
- Reduces WebSocket overhead while maintaining visual smoothness.

### **2. Local Rendering Buffer**
- Strokes render immediately on the sender’s canvas before network acknowledgment.
- Provides instant feedback to users.

### **3. Batched Updates**
- Instead of sending every pixel, batches of points are sent per stroke.
- Improves performance for rapid movements.

### **4. Optimized Broadcasting**
- The sender’s socket is excluded from broadcasts using:
  ```js
  socket.broadcast.emit("draw", data);
Prevents redundant re-rendering for the same user.

### 5. Memory Efficiency
Old or idle session data can be purged after defined inactivity periods.

Canvas snapshots may be periodically saved for recovery.

### ⚔️ Conflict Resolution
1. Simultaneous Drawing
Each stroke is timestamped and identified by a unique strokeId.

The canvas merges all strokes in temporal order, not by priority.

Visual conflicts (overlaps) are resolved naturally by layer order.

2. Concurrent Undo Requests
Undo/Redo operations are serialized by the server.

Each request is processed sequentially in order of arrival.

3. Late Joiners
When a new user joins, the server sends the entire canvas state (undoStack).

The new user’s view syncs immediately to the current shared state.

4. Network Delays
Strokes contain timestamps → delayed events are still rendered in correct sequence.

If a client disconnects mid-stroke, incomplete data is ignored.

5. Disconnections
If a user disconnects, their cursor and session are removed from the active list.

On reconnection, the server restores their view using the latest canvas state.
