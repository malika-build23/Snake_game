import { useState } from "react";
import GameCanvas from "./components/GameCanvas";
import socket from "./hooks/useSocket";

function App() {
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);

  function handleJoin() {
    const trimmedName = playerName.trim();

    if (!trimmedName) {
      alert("Please enter your name");
      return;
    }

    socket.connect();

    socket.emit("join", trimmedName);

    setJoined(true);
  }

  if (!joined) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#111",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h1>🐍 Multiplayer Snake</h1>

        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          maxLength={15}
          onChange={(e) =>
            setPlayerName(e.target.value)
          }
          style={{
            padding: "12px",
            fontSize: "18px",
            width: "250px",
            borderRadius: "8px",
            border: "none",
          }}
        />

        <button
          onClick={handleJoin}
          style={{
            padding: "12px 24px",
            fontSize: "18px",
            cursor: "pointer",
            borderRadius: "8px",
            border: "none",
          }}
        >
          Join Game
        </button>
      </div>
    );
  }

  return <GameCanvas />;
}

export default App;