const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const PORT = process.env.PORT || 3000;

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

const players = {};
const foods = [];

/* ---------------- FOOD ---------------- */

for (let i = 0; i < 100; i++) {
    foods.push(createFood());
}

function createFood() {
    return {
        id:
            Date.now() +
            Math.random() +
            Math.random(),

        x: Math.random() * WORLD_WIDTH,

        y: Math.random() * WORLD_HEIGHT,
    };
}

/* ---------------- PLAYER ---------------- */

function createPlayer(id, name) {
    const player = {
        id,
        name: name || "Player",
        x: WORLD_WIDTH / 2 + Math.random() * 300 - 150,
        y: WORLD_HEIGHT / 2 + Math.random() * 300 - 150,

        score: 0,

        color: `hsl(${Math.random() * 360
            },70%,50%)`,

        body: [],
    };

    for (let i = 0; i < 20; i++) {
        player.body.push({
            x: player.x - i * 15,
            y: player.y,
        });
    }

    return player;
}

function respawnPlayer(player) {
    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT / 2;

    player.score = 0;

    player.body = [];

    for (let i = 0; i < 20; i++) {
        player.body.push({
            x: player.x - i * 15,
            y: player.y,
        });
    }
}

function getLeaderboard() {
    return Object.values(players)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((player) => ({
            name: player.name,
            score: player.score,
        }));
}

/* ---------------- SOCKET ---------------- */

io.on("connection", (socket) => {

    console.log("Connected:", socket.id);

    socket.on("join", (name) => {

        players[socket.id] = createPlayer(
            socket.id,
            name
        );

        socket.emit("init", {
            id: socket.id,
            foods,
            players,
            leaderboard: getLeaderboard(),
        });

        io.emit("playersUpdate", players);

        io.emit(
            "leaderboardUpdate",
            getLeaderboard()
        );
    });

    socket.on("move", (data) => {

        const player = players[socket.id];

        if (!player) return;

        player.x = data.x;
        player.y = data.y;
        player.body = data.body;

        io.emit(
            "playersUpdate",
            players
        );
    });

    socket.on("eatFood", (foodId) => {

        const player = players[socket.id];

        if (!player) return;

        const index = foods.findIndex(
            food => food.id === foodId
        );

        if (index === -1) return;

        foods.splice(index, 1);

        foods.push(createFood());

        player.score++;

        io.emit(
            "foodsUpdate",
            foods
        );

        io.emit(
            "leaderboardUpdate",
            getLeaderboard()
        );
    });

    socket.on("died", () => {

        const player = players[socket.id];

        if (!player) return;

        respawnPlayer(player);

        io.emit(
            "playersUpdate",
            players
        );

        io.emit(
            "leaderboardUpdate",
            getLeaderboard()
        );
    });

    socket.on("disconnect", () => {

        console.log(
            "Disconnected:",
            socket.id
        );

        delete players[socket.id];

        io.emit(
            "playersUpdate",
            players
        );

        io.emit(
            "leaderboardUpdate",
            getLeaderboard()
        );
    });
});

/* ---------------- COLLISION ---------------- */

setInterval(() => {

    const ids = Object.keys(players);

    for (let i = 0; i < ids.length; i++) {

        const playerA = players[ids[i]];

        if (!playerA) continue;

        for (let j = 0; j < ids.length; j++) {

            if (i === j) continue;

            const playerB =
                players[ids[j]];

            if (!playerB) continue;

            for (
                let k = 5;
                k < playerB.body.length;
                k++
            ) {

                const segment =
                    playerB.body[k];

                const distance =
                    Math.hypot(
                        playerA.x -
                        segment.x,

                        playerA.y -
                        segment.y
                    );

                if (distance < 15) {

                    respawnPlayer(playerA);

                    io.emit(
                        "playersUpdate",
                        players
                    );

                    io.emit(
                        "leaderboardUpdate",
                        getLeaderboard()
                    );

                    break;
                }
            }
        }
    }

}, 100);

/* ---------------- ROUTE ---------------- */

app.get("/", (req, res) => {
    res.send("Snake Server Running");
});

/* ---------------- START ---------------- */

server.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});