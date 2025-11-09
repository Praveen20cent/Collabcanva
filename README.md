# SyncSketch — Real-Time Collaborative Drawing App

**Syncsketch** is a real-time collaborative drawing application that enables multiple users to draw, erase, and perform undo/redo operations simultaneously on a shared digital canvas.  
It is built using **Node.js**, **Express.js**, and **WebSockets (Socket.IO)** to provide smooth synchronization and real-time collaboration between users.

This project demonstrates real-time event handling, canvas rendering, shared drawing states, and global undo/redo management across multiple clients.

---

## ⚙️ Setup Instructions

Follow these steps to run the project locally on your machine:

### 🧩 Step 1: Clone the Repository
```bash
git clone https://github.com/Praveen20cent/Collabcanva.git
cd Collabcanva

⚙️ Step 2: Install Dependencies
npm install

▶️ Step 3: Start the Server
npm start
```


By default, the application will run on:
👉 http://localhost:3000

Alternatively, you can view the deployed version here:
🌍 Live App: https://syncsketch-66qw.onrender.com

### 🧪 How to Test with Multiple Users

**To test collaboration features:**

Open multiple browser tabs or different devices pointing to:

Local version → http://localhost:3000

Deployed version → **https://syncsketch-66qw.onrender.com**

In one tab, start drawing — strokes will instantly appear on all other connected tabs.

**Try the following actions:**

🎨 Draw with different brush colors

🧽 Use the eraser to remove strokes

↩️ Use undo/redo buttons

👥 Draw from multiple tabs at the same time

**This confirms that WebSocket-based synchronization is functioning correctly.**

### 💡 Features

✏️ Real-time collaborative drawing

🧽 Eraser functionality for clearing strokes

↩️ Undo/Redo actions (global)

🎨 Custom brush color selection

👥 Multi-user synchronization

⚡ Low-latency WebSocket communication via Socket.IO

### 📂 Project Structure

<img width="855" height="591" alt="image" src="https://github.com/user-attachments/assets/629762f8-4f3f-4b1b-b721-13416efb0669" />


### 🧰 Technologies Used
| Component                   | Technology                         |
| --------------------------- | ---------------------------------- |
| **Frontend**                | HTML, CSS, JavaScript (Canvas API) |
| **Backend**                 | Node.js, Express.js                |
| **Real-Time Communication** | WebSockets via Socket.IO           |
| **Deployment**              | Render                             |
| **Version Control**         | Git + GitHub                       |
  
### 🐞 Known Limitations / Bugs
| Issue                    | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| ⏳ **Eraser Lag**         | The eraser may appear slightly delayed on slower networks.        |
| 🔁 **Global Undo/Redo**  | Undo/Redo actions apply globally for all users, not individually. |
| 📏 **Canvas Resizing**   | Resizing or refreshing the browser clears the current canvas.     |
| ⚡ **Performance Drops**  | Minor lag may occur when many users draw simultaneously.          |
| 🚫 **No Authentication** | Any user can join and draw; there is no login system.             |

### Task	Duration
| Task                                    | Duration      |
| --------------------------------------- | ------------- |
| 🏗️ Project setup (Node.js + Socket.IO) | 2 hours       |
| 🎨 Frontend canvas implementation       | 3 hours       |
| 🔁 Undo/Redo + Eraser functionality     | 2 hours       |
| 👥 Multi-user synchronization testing   | 1 hour        |
| 🧾 Documentation & deployment           | 1 hour        |
| **🕒 Total Time Spent**                 | **≈ 9 hours** |



### Architecture Diagram

<img width="1228" height="655" alt="image" src="https://github.com/user-attachments/assets/0744226b-afc6-40f7-a63f-7fc080c5baeb" />


### 🪪 License

This project is licensed under the MIT License.
You are free to use, modify, and distribute it for personal or educational purposes.
