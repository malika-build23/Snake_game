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

    setJoined(true);
  }

  if (!joined) {
    return (
      <div
        style={{
          height: "100vh",
          background: "#111",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h1
          style={{
            color: "#ffffff",
            fontSize: "64px",
            marginBottom: "20px",
            textShadow: "0 0 20px rgba(0,255,136,0.5)",
          }}
        >
          🐍 Multiplayer Snake
        </h1>

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

  return <GameCanvas playerName={playerName.trim()} />;
}

export default App;
