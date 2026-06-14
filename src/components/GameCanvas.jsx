import { useEffect, useRef } from "react";
import socket from "../hooks/useSocket";

function GameCanvas({ playerName }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        /* ================= WORLD ================= */

        const WORLD_WIDTH = 3000;
        const WORLD_HEIGHT = 3000;

        /* ================= LOCAL PLAYER ================= */

        const snake = {
            id: null,
            name: "",
            color: "#00ff88",
            x: WORLD_WIDTH / 2,
            y: WORLD_HEIGHT / 2,
            speed: 3,
            grow: 0,
            score: 0,
            body: [],
        };

        /* ================= OTHER PLAYERS ================= */

        const players = {};

        /* ================= FOODS ================= */

        const foods = [];

        /* ================= LEADERBOARD ================= */

        let leaderboard = [];

        /* ================= GAME STATE ================= */

        let isGameOver = false;
        let animationId;
        let respawnTimeout;

        /* ================= MOUSE ================= */

        const mouse = {
            x: canvas.width / 2,
            y: canvas.height / 2,
        };

        function handleMouse(e) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        }

        canvas.addEventListener("mousemove", handleMouse);

        /* ================= RESIZE ================= */

        function handleResize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        window.addEventListener("resize", handleResize);

        /* ================= RESPAWN ================= */

        function respawnSnake() {
            snake.x = WORLD_WIDTH / 2;
            snake.y = WORLD_HEIGHT / 2;

            snake.grow = 0;
            snake.score = 0;

            snake.body = [];

            for (let i = 0; i < 20; i++) {
                snake.body.push({
                    x: snake.x - i * 15,
                    y: snake.y,
                });
            }

            isGameOver = false;

            socket.emit("died");
        }

        /* ================= SOCKET EVENTS ================= */

        socket.connect();
        socket.emit("join", playerName);

        socket.on("init", (data) => {
            snake.id = data.id;

            leaderboard = data.leaderboard || [];

            foods.length = 0;
            foods.push(...data.foods);

            Object.assign(players, data.players);

            const me = players[snake.id];
            

            if (me) {
                snake.name = me.name;
                snake.color = me.color;

                snake.x = me.x;
                snake.y = me.y;
                snake.score = me.score || 0;

                snake.body = [...me.body];
            }
        });

        socket.on("playersUpdate", (serverPlayers) => {
            Object.keys(players).forEach((id) => {
                delete players[id];
            });

            Object.assign(players, serverPlayers);

            const me = players[snake.id];

            if (me) {
                snake.score = me.score || 0;
            }
        });

        socket.on("foodsUpdate", (serverFoods) => {
            foods.length = 0;

            foods.push(...serverFoods);
        });

        socket.on(
            "leaderboardUpdate",
            (serverLeaderboard) => {
                leaderboard = serverLeaderboard;
            }
        );
        /* ================= UPDATE ================= */

        function update() {

            if (isGameOver) return;

            /* ---------- Movement ---------- */

            const targetX =
                snake.x +
                (mouse.x - canvas.width / 2);

            const targetY =
                snake.y +
                (mouse.y - canvas.height / 2);

            const dx = targetX - snake.x;
            const dy = targetY - snake.y;

            const angle = Math.atan2(dy, dx);

            snake.x += Math.cos(angle) * snake.speed;
            snake.y += Math.sin(angle) * snake.speed;

            /* ---------- Keep inside world ---------- */

            snake.x = Math.max(
                0,
                Math.min(WORLD_WIDTH, snake.x)
            );

            snake.y = Math.max(
                0,
                Math.min(WORLD_HEIGHT, snake.y)
            );

            /* ---------- Update body ---------- */

            snake.body.unshift({
                x: snake.x,
                y: snake.y,
            });

            if (snake.grow > 0) {
                snake.grow--;
            } else {
                snake.body.pop();
            }

            /* ---------- Shared Food ---------- */

            for (
                let i = foods.length - 1;
                i >= 0;
                i--
            ) {

                const food = foods[i];

                const distance = Math.hypot(
                    snake.x - food.x,
                    snake.y - food.y
                );

                if (distance < 25) {

                    snake.grow += 5;
                    snake.score++;

                    socket.emit(
                        "eatFood",
                        food.id
                    );

                    break;
                }
            }

            /* ---------- Self Collision ---------- */

            for (
                let i = 10;
                i < snake.body.length;
                i++
            ) {

                const segment = snake.body[i];

                const distance = Math.hypot(
                    snake.x - segment.x,
                    snake.y - segment.y
                );

                if (distance < 15) {

                    isGameOver = true;

                    respawnTimeout =
                        setTimeout(() => {
                            respawnSnake();
                        }, 2000);

                    return;
                }
            }

            /* ---------- Snake vs Snake ---------- */

            for (const id in players) {

                if (id === snake.id) continue;

                const player = players[id];

                if (
                    !player ||
                    !player.body
                ) continue;

                for (
                    let i = 5;
                    i < player.body.length;
                    i++
                ) {

                    const segment =
                        player.body[i];

                    const distance =
                        Math.hypot(
                            snake.x - segment.x,
                            snake.y - segment.y
                        );

                    if (distance < 15) {

                        isGameOver = true;

                        respawnTimeout =
                            setTimeout(() => {
                                respawnSnake();
                            }, 2000);

                        return;
                    }
                }
            }

            /* ---------- Send movement ---------- */

            socket.emit("move", {
                x: snake.x,
                y: snake.y,
                body: snake.body,
            });
        }        
        /* ================= DRAW ================= */

        function draw() {

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            /* ---------- Camera ---------- */

            ctx.save();

            ctx.translate(
                canvas.width / 2 - snake.x,
                canvas.height / 2 - snake.y
            );

            /* ---------- World Border ---------- */

            ctx.strokeStyle = "#444";
            ctx.lineWidth = 5;

            ctx.strokeRect(
                0,
                0,
                WORLD_WIDTH,
                WORLD_HEIGHT
            );

            /* ---------- Grid ---------- */

            ctx.strokeStyle = "#1f1f1f";
            ctx.lineWidth = 1;

            for (
                let x = 0;
                x <= WORLD_WIDTH;
                x += 100
            ) {
                ctx.beginPath();

                ctx.moveTo(x, 0);

                ctx.lineTo(
                    x,
                    WORLD_HEIGHT
                );

                ctx.stroke();
            }

            for (
                let y = 0;
                y <= WORLD_HEIGHT;
                y += 100
            ) {
                ctx.beginPath();

                ctx.moveTo(0, y);

                ctx.lineTo(
                    WORLD_WIDTH,
                    y
                );

                ctx.stroke();
            }

            /* ---------- Shared Food ---------- */

            foods.forEach((food) => {

                ctx.beginPath();

                ctx.arc(
                    food.x,
                    food.y,
                    6,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle = "orange";

                ctx.fill();

            });

            /* ---------- Other Players ---------- */

            Object.values(players).forEach(
                (player) => {

                    if (
                        player.id === snake.id
                    ) {
                        return;
                    }

                    if (
                        !player.body
                    ) {
                        return;
                    }

                    /* Snake Body */

                    player.body.forEach(
                        (
                            segment,
                            index
                        ) => {

                            ctx.beginPath();

                            ctx.arc(
                                segment.x,
                                segment.y,
                                index === 0
                                    ? 20
                                    : 15,
                                0,
                                Math.PI * 2
                            );

                            ctx.fillStyle =
                                player.color ||
                                "blue";

                            ctx.fill();

                        }
                    );

                    /* Name */

                    ctx.fillStyle =
                        "white";

                    ctx.font =
                        "18px Arial";

                    ctx.textAlign =
                        "center";

                    ctx.fillText(
                        player.name ||
                        "Player",
                        player.x,
                        player.y - 35
                    );

                }
            );

            /* ---------- Local Snake ---------- */

            snake.body.forEach(
                (
                    segment,
                    index
                ) => {

                    ctx.beginPath();

                    ctx.arc(
                        segment.x,
                        segment.y,
                        index === 0
                            ? 20
                            : 15,
                        0,
                        Math.PI * 2
                    );

                    ctx.fillStyle = snake.color;

                    ctx.fill();

                }
            );

            /* ---------- Local Name ---------- */

            ctx.fillStyle =
                "white";

            ctx.font =
                "18px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                snake.name,
                snake.x,
                snake.y - 35
            );

            /* ---------- Eyes ---------- */

            if (
                snake.body.length > 0
            ) {

                const head =
                    snake.body[0];

                ctx.fillStyle =
                    "black";

                ctx.beginPath();

                ctx.arc(
                    head.x - 6,
                    head.y - 4,
                    2,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                ctx.beginPath();

                ctx.arc(
                    head.x + 6,
                    head.y - 4,
                    2,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }

            ctx.restore();
        }
        /* ================= UI ================= */

        function drawUI() {

            /* Score */

            ctx.fillStyle = "white";

            ctx.font = "24px Arial";

            ctx.textAlign = "left";

            ctx.fillText(
                `Score: ${snake.score}`,
                20,
                40
            );

            ctx.fillText(
                `Length: ${snake.body.length}`,
                20,
                80
            );

            /* Leaderboard */

            ctx.fillStyle = "white";

            ctx.font = "28px Arial";

            ctx.fillText(
                "Leaderboard",
                canvas.width - 220,
                40
            );

            ctx.font = "20px Arial";

            leaderboard.forEach(
                (player, index) => {

                    ctx.fillText(
                        `${index + 1}. ${player.name} - ${player.score}`,
                        canvas.width - 220,
                        80 + index * 30
                    );

                }
            );

            /* Game Over */

            if (isGameOver) {

                ctx.fillStyle =
                    "rgba(0,0,0,0.5)";

                ctx.fillRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                ctx.fillStyle =
                    "red";

                ctx.font =
                    "60px Arial";

                ctx.textAlign =
                    "center";

                ctx.fillText(
                    "GAME OVER",
                    canvas.width / 2,
                    canvas.height / 2
                );

                ctx.font =
                    "28px Arial";

                ctx.fillStyle =
                    "white";

                ctx.fillText(
                    "Respawning...",
                    canvas.width / 2,
                    canvas.height / 2 + 50
                );
            }

            ctx.textAlign = "left";
        }

        /* ================= GAME LOOP ================= */

        function gameLoop() {

            update();

            draw();

            drawUI();

            animationId =
                requestAnimationFrame(
                    gameLoop
                );
        }

        gameLoop();

        /* ================= CLEANUP ================= */

        return () => {

            cancelAnimationFrame(
                animationId
            );

            clearTimeout(
                respawnTimeout
            );

            canvas.removeEventListener(
                "mousemove",
                handleMouse
            );

            window.removeEventListener(
                "resize",
                handleResize
            );

            socket.off("init");

            socket.off(
                "playersUpdate"
            );

            socket.off(
                "foodsUpdate"
            );

            socket.off(
                "leaderboardUpdate"
            );
        };

    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: "block",
                background: "#111",
                cursor: "crosshair",
            }}
        />
    );
}

export default GameCanvas;
