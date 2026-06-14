# Multiplayer Snake Game 🐍

A real-time multiplayer snake game where players from all over the world can join, eat food to grow their snakes, and compete for the highest score on the global leaderboard. 

Built with React, HTML5 Canvas, and Socket.io!

## 🎮 Features
- **Real-Time Multiplayer:** Instant synchronization between all players using WebSockets (Socket.io).
- **Global Leaderboard:** Track the top 5 highest-scoring players in real time.
- **Smooth Canvas Rendering:** Efficient 60 FPS drawing using the HTML5 Canvas API.
- **Auto-Reconnect:** Gracefully handles server "sleep" states (like Render's free tier) and automatically joins you to the game once connected.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, HTML5 Canvas
- **Backend:** Node.js, Express, Socket.io
- **Deployment:** Vercel (Frontend) & Render (Backend)

---

## 🚀 How to Run Locally

### 1. Start the Backend Server
The backend handles the game logic, player coordinates, and food spawning.

```bash
cd server
npm install
npm start
```
*The server will run on `http://localhost:3000` by default.*

### 2. Start the Frontend App
The frontend is the React application where the game is actually played.

```bash
# In the root folder (Snake_game)
npm install
npm run dev
```

### 3. Connect the Frontend to Localhost
If you are testing locally, make sure your frontend is pointing to your local server instead of the live production server.
In `src/hooks/useSocket.jsx`:
```javascript
// Uncomment the localhost line and comment out the production line:
const SERVER_URL = "http://localhost:3000";
// const SERVER_URL = "https://snake-game-1-99x5.onrender.com/";
```

---

## 🕹️ How to Play
1. Enter your name and click **Join Game**.
2. Move your mouse to steer your snake.
3. Eat the orange dots (food) to grow longer and increase your score.
4. **Avoid other snakes and yourself!** If your head touches another snake's body or your own body, you will die and respawn.
