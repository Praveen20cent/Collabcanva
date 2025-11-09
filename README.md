# 🎨 CollabCanva — Real-Time Collaborative Drawing App

**CollabCanva** is a real-time collaborative drawing application that allows multiple users to draw, erase, and perform undo/redo operations together on a shared canvas.  
It is built using **Node.js**, **Express.js**, and **Socket.IO**, enabling low-latency communication and smooth synchronization between all connected users.

The project demonstrates real-time WebSocket communication, canvas rendering, and shared state management across multiple clients.

---

## ⚙️ Setup Instructions

Follow the steps below to run this project locally on your machine:

### Step 1: Clone the Repository
```bash
git clone https://github.com/Praveen20cent/Collabcanva.git
cd Collabcanva
Step 2: Install Dependencies
bash
Copy code
npm install
Step 3: Start the Server
bash
Copy code
npm start
By default, the application will start on:
👉 http://localhost:3000

You can also try the hosted version here:
🌍 Live App: https://syncsketch-66qw.onrender.com

🧪 How to Test with Multiple Users
To test collaboration features:

Open multiple browser tabs or different devices pointing to either:

Local version → http://localhost:3000

Deployed version → https://syncsketch-66qw.onrender.com

In one tab, start drawing on the canvas using your mouse.

The drawing will instantly appear on all other connected tabs or devices.

Try the following actions:

🎨 Draw with different brush colors.

🧽 Use the eraser to remove drawn lines.

↩️ Use undo and redo buttons to revert or restore changes.

👥 Draw from two tabs simultaneously and watch the real-time synchronization.

This confirms that WebSocket-based event broadcasting and multi-user updates are working correctly.

💡 Features
✏️ Real-time collaborative drawing

🎨 Customizable brush colors

🧽 Eraser tool for removing strokes

↩️ Undo/Redo functionality (global)

👥 Multi-user real-time synchronization

⚡ Built on WebSocket protocol using Socket.IO

📁 Project Structure
php
Copy code
Collabcanva/
│
├── public/
│   ├── index.html          # Main drawing UI
│   ├── style.css           # Canvas and layout styling
│   └── script.js           # Client-side drawing and socket handling
│
├── server.js               # Node.js + Socket.IO server logic
├── package.json            # Dependencies and npm scripts
├── README.md               # Documentation
└── ARCHITECTURE.md         # System architecture details
🧰 Technologies Used
Component	Technology
Frontend	HTML, CSS, JavaScript (Canvas API)
Backend	Node.js, Express.js
Communication	Socket.IO (WebSockets)
Deployment	Render
Version Control	Git + GitHub

🐞 Known Limitations / Bugs
Issue	Description
⏳ Eraser Lag	On slower internet connections, the eraser may appear slightly delayed for other users.
🔁 Global Undo/Redo	Undo and redo affect the global canvas, not per user.
📏 Canvas Resizing	Resizing or refreshing the browser clears the current drawing.
⚡ Performance Drops	Slight lag may occur if many users draw continuously at the same time.
🚫 No Authentication	Currently, there’s no login system — any user can join and draw.

⏱️ Time Spent on the Project
Task	Time Taken
Project setup (Node.js + Socket.IO configuration)	2 hours
Canvas drawing implementation	3 hours
Undo/Redo and eraser logic	2 hours
Multi-user synchronization testing	1 hour
Documentation and deployment	1 hour
Total Time Spent	≈ 9 hours

🧑‍💻 Author
Praveen K
🔗 GitHub Profile
🌐 Live Application on Render

🪪 License
This project is licensed under the MIT License.
You may freely use, modify, and distribute it for personal or educational purposes.

✅ Summary
This project showcases:

Real-time collaborative event handling using Socket.IO

Canvas state management across multiple clients

Undo/Redo functionality using stroke history

Clean and modular code structure using Express and vanilla JS

Live deployment on Render for easy accessibility

🧩 Run Command
To install and start the project in one step:

bash
Copy code
npm install && npm start
Then open your browser at http://localhost:3000

⭐ If you liked this project or found it useful, please give it a star on GitHub!

yaml
Copy code

---

This version is **ready for direct submission** — no placeholders, no missing details, just clean, Markdown-rich formatting that looks great on GitHub.  

Would you like me to add a **tiny “project overview paragraph”** at the top (2–3 lines, like an intro for your report submiss
