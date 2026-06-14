import { io } from "socket.io-client";

// Development
const SERVER_URL = "http://localhost:3000";

// Production example:
// const SERVER_URL = "https://snake-game-1pvr.onrender.com";

const socket = io(SERVER_URL, {
    autoConnect: false,
});

export default socket;