// game.js - Full Version (Part 1 of 5)

// ==================== GLOBAL CONSTANTS ====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const FPS = 60;

const PADDLE_HEIGHT = 20;
let PADDLE_WIDTH = 100;
const BALL_RADIUS = 10;
const POWERUP_SIZE = 20;
const BRICK_ROWS = 5;
const BRICK_COLUMNS = 10;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 30;
const BRICK_PADDING = 5;

const themes = {
    standard: {
        background: "#0a0a2a",
        paddle: "#0095DD",
        ball: "#ffffff",
        brick: "#FF5555",
        text: "#ffffff"
    },
    neon: {
        background: "#000000",
        paddle: "#39ff14",
        ball: "#ff00ff",
        brick: "#ff8800",
        text: "#ffffff"
    },
    retro: {
        background: "#221",
        paddle: "#88f",
        ball: "#ffa",
        brick: "#f55",
        text: "#fff8dc"
    }
};

let currentTheme = "standard";

// ==================== DOM ELEMENTS ====================
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const levelDisplay = document.getElementById("level-display");
const comboDisplay = document.getElementById("combo-display");
const fpsDisplay = document.getElementById("fps");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over");
const levelCompleteScreen = document.getElementById("level-complete");
const highScoresScreen = document.getElementById("high-scores");
const pauseIndicator = document.getElementById("pause-indicator");
const flash = document.getElementById("screen-flash");
const menuBtn = document.getElementById("menu-btn");
const gameMenu = document.getElementById("game-menu");
const mobileControls = document.getElementById("mobile-controls");

// ==================== GAME STATE ====================
let paddleX, paddleY;
let balls = [];
let bricks = [];
let powerUps = [];
let score = 0;
let lives = 3;
let level = 1;
let combo = 0;
let maxCombo = 0;
let comboTimer = 0;
let bricksHit = 0;
let paddleHits = 0;
let gameStarted = false;
let gamePaused = false;
let debugMode = false;
let lastFrameTime = 0;
let fps = 0;
let starField = [];

const highScoresKey = "brickBreakerHighScores";

// ==================== SETUP ====================
function initGame() {
    applyTheme(currentTheme);
    createStars();
    resetPaddle();
    resetBall();
    createBricks();
    balls = [Object.assign({}, createBall())];
    updateHUD();
}

// ==================== BALL & PADDLE ====================
function resetPaddle() {
    PADDLE_WIDTH = 100;
    paddleX = (canvas.width - PADDLE_WIDTH) / 2;
    paddleY = canvas.height - PADDLE_HEIGHT - 10;
}

function createBall() {
    return {
        x: canvas.width / 2,
        y: paddleY - BALL_RADIUS,
        speedX: 4 * (Math.random() > 0.5 ? 1 : -1),
        speedY: -4,
        radius: BALL_RADIUS,
        fireball: false
    };
}

function resetBall() {
    balls = [createBall()];
}

// ==================== BRICKS ====================
function createBricks() {
    bricks = [];
    for (let c = 0; c < BRICK_COLUMNS; c++) {
        bricks[c] = [];
        for (let r = 0; r < BRICK_ROWS; r++) {
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: 1,
                color: themes[currentTheme].brick
            };
        }
    }
}
// ==================== DRAWING ====================
function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.fireball ? "#ff3333" : themes[currentTheme].ball;
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillStyle = themes[currentTheme].paddle;
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < BRICK_COLUMNS; c++) {
        for (let r = 0; r < BRICK_ROWS; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                let brickX = c * (BRICK_WIDTH + BRICK_PADDING) + 30;
                let brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + 60;
                b.x = brickX;
                b.y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
                ctx.fillStyle = b.color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// ==================== COLLISIONS ====================
function collisionDetection() {
    for (let i = 0; i < balls.length; i++) {
        let ball = balls[i];
        for (let c = 0; c < BRICK_COLUMNS; c++) {
            for (let r = 0; r < BRICK_ROWS; r++) {
                let b = bricks[c][r];
                if (b.status === 1) {
                    if (
                        ball.x > b.x &&
                        ball.x < b.x + BRICK_WIDTH &&
                        ball.y > b.y &&
                        ball.y < b.y + BRICK_HEIGHT
                    ) {
                        if (!ball.fireball) ball.speedY = -ball.speedY;
                        b.status = 0;
                        score += 10;
                        bricksHit++;
                        combo++;
                        comboTimer = 60;
                        if (combo > maxCombo) maxCombo = combo;

                        if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;
                        if (comboDisplay) {
                            comboDisplay.textContent = `Combo x${combo}`;
                            comboDisplay.style.opacity = 1;
                        }

                        // Particle/flash effect
                        screenFlash();

                        if (bricksHit >= BRICK_COLUMNS * BRICK_ROWS) {
                            setTimeout(() => levelComplete(), 500);
                        }

                        // Random power-up drop
                        if (Math.random() < 0.1) {
                            spawnPowerUp(b.x + BRICK_WIDTH / 2, b.y + BRICK_HEIGHT / 2);
                        }
                    }
                }
            }
        }
    }
}

function screenFlash() {
    flash.style.opacity = 1;
    setTimeout(() => (flash.style.opacity = 0), 100);
}

// ==================== POWER-UPS ====================
function spawnPowerUp(x, y) {
    const types = ["fireball", "widen", "slow", "multiball"];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUps.push({
        x,
        y,
        type,
        active: true
    });
}

function drawPowerUps() {
    powerUps.forEach(p => {
        if (p.active) {
            ctx.beginPath();
            ctx.rect(p.x, p.y, POWERUP_SIZE, POWERUP_SIZE);
            ctx.fillStyle = "#ffff00";
            ctx.fill();
            ctx.closePath();
        }
    });
}

function updatePowerUps() {
    powerUps.forEach(p => {
        if (!p.active) return;
        p.y += 2;
        if (
            p.y + POWERUP_SIZE >= paddleY &&
            p.y <= paddleY + PADDLE_HEIGHT &&
            p.x + POWERUP_SIZE >= paddleX &&
            p.x <= paddleX + PADDLE_WIDTH
        ) {
            activatePowerUp(p.type);
            p.active = false;
        }
    });
}

function activatePowerUp(type) {
    switch (type) {
        case "fireball":
            balls.forEach(b => (b.fireball = true));
            setTimeout(() => balls.forEach(b => (b.fireball = false)), 8000);
            break;
        case "widen":
            PADDLE_WIDTH = 150;
            setTimeout(() => (PADDLE_WIDTH = 100), 8000);
            break;
        case "slow":
            balls.forEach(b => {
                b.speedX *= 0.6;
                b.speedY *= 0.6;
            });
            setTimeout(() =>
                balls.forEach(b => {
                    b.speedX *= 1.667;
                    b.speedY *= 1.667;
                }), 8000
            );
            break;
        case "multiball":
            const newBalls = balls.map(b => ({
                ...b,
                speedX: -b.speedX,
                speedY: -b.speedY
            }));
            balls.push(...newBalls);
            break;
    }
}
// ==================== GAME LOOP ====================
function draw() {
    if (!gameStarted || gamePaused) return;

    const now = performance.now();
    const delta = now - lastFrameTime;
    lastFrameTime = now;
    fps = Math.round(1000 / delta);
    fpsDisplay.textContent = `FPS: ${fps}`;

    // Clear canvas
    ctx.fillStyle = themes[currentTheme].background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    drawStars();

    // Elements
    drawBricks();
    drawPaddle();
    balls.forEach(drawBall);
    drawPowerUps();

    // Updates
    updateBalls();
    collisionDetection();
    updatePowerUps();

    // Combo Fade
    if (comboTimer > 0) {
        comboTimer--;
    } else {
        combo = 0;
        comboDisplay.style.opacity = 0;
    }

    requestAnimationFrame(draw);
}

function updateBalls() {
    for (let i = balls.length - 1; i >= 0; i--) {
        let ball = balls[i];
        ball.x += ball.speedX;
        ball.y += ball.speedY;

        // Wall collision
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.speedX = -ball.speedX;
        }
        if (ball.y - ball.radius < 0) {
            ball.speedY = -ball.speedY;
        }

        // Paddle collision
        if (
            ball.y + ball.radius >= paddleY &&
            ball.x > paddleX &&
            ball.x < paddleX + PADDLE_WIDTH
        ) {
            ball.speedY = -Math.abs(ball.speedY);
            paddleHits++;
        }

        // Bottom out
        if (ball.y - ball.radius > canvas.height) {
            balls.splice(i, 1);
        }
    }

    if (balls.length === 0) {
        lives--;
        if (lives <= 0) {
            gameOver();
            return;
        } else {
            resetPaddle();
            resetBall();
        }
        livesDisplay.textContent = `Lives: ${lives}`;
    }

    if (rightPressed) {
        paddleX += 7;
        if (paddleX + PADDLE_WIDTH > canvas.width) {
            paddleX = canvas.width - PADDLE_WIDTH;
        }
    } else if (leftPressed) {
        paddleX -= 7;
        if (paddleX < 0) {
            paddleX = 0;
        }
    }
}

// ==================== STARS ====================
function createStars() {
    for (let i = 0; i < 100; i++) {
        starField.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5,
            alpha: Math.random()
        });
    }
}

function drawStars() {
    starField.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
        ctx.fill();
        ctx.closePath();
    });
}

// ==================== PAUSE & MENU ====================
function togglePause() {
    gamePaused = !gamePaused;
    pauseIndicator.style.display = gamePaused ? "block" : "none";
    if (!gamePaused) requestAnimationFrame(draw);
}

menuBtn.addEventListener("click", () => {
    gameMenu.style.display = gameMenu.style.display === "block" ? "none" : "block";
});

document.getElementById("toggle-sound").addEventListener("click", () => {
    // Toggle sound logic placeholder
});
document.getElementById("toggle-music").addEventListener("click", () => {
    // Toggle music logic placeholder
});
document.getElementById("toggle-fullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement) {
        canvas.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});
document.getElementById("restart-from-menu").addEventListener("click", () => {
    gameMenu.style.display = "none";
    startGame();
});
// ==================== GAME START / PROGRESSION ====================
function startGame() {
    gameStarted = true;
    gamePaused = false;
    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    levelCompleteScreen.style.display = "none";
    highScoresScreen.style.display = "none";
    combo = 0;
    maxCombo = 0;
    comboTimer = 0;
    bricksHit = 0;
    paddleHits = 0;
    score = 0;
    lives = 3;
    level = 1;
    updateHUD();
    initGame();
    requestAnimationFrame(draw);
}

function levelComplete() {
    gameStarted = false;
    levelCompleteScreen.style.display = "flex";
    document.getElementById("level-score").textContent = `Score: ${score}`;
    document.getElementById("level-stats").innerHTML =
        `Level ${level} Complete!<br>Bricks Destroyed: ${bricksHit}<br>Paddle Hits: ${paddleHits}`;
}

function nextLevel() {
    level++;
    bricksHit = 0;
    paddleHits = 0;
    combo = 0;
    comboTimer = 0;
    maxCombo = 0;
    balls = [createBall()];
    createBricks();
    updateHUD();
    levelCompleteScreen.style.display = "none";
    gameStarted = true;
    requestAnimationFrame(draw);
}

function gameOver() {
    gameStarted = false;
    gameOverScreen.style.display = "flex";
    document.getElementById("final-score").textContent = `Final Score: ${score}`;
    document.getElementById("game-stats").innerHTML =
        `Level Reached: ${level}<br>Bricks Hit: ${bricksHit}<br>Paddle Hits: ${paddleHits}<br>Max Combo: x${maxCombo}`;
    checkHighScore();
}

// ==================== HUD ====================
function updateHUD() {
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Lives: ${lives}`;
    levelDisplay.textContent = `Level ${level}`;
}

// ==================== THEMES ====================
document.getElementById("standard-theme").addEventListener("click", () => {
    switchTheme("standard");
});
document.getElementById("neon-theme").addEventListener("click", () => {
    switchTheme("neon");
});
document.getElementById("retro-theme").addEventListener("click", () => {
    switchTheme("retro");
});

function switchTheme(name) {
    currentTheme = name;
    document.querySelectorAll(".theme-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`${name}-theme`).classList.add("active");
    applyTheme(name);
}

function applyTheme(name) {
    document.body.style.backgroundColor = themes[name].background;
}

// ==================== INPUT ====================
let rightPressed = false;
let leftPressed = false;

document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") rightPressed = true;
    if (e.key === "ArrowLeft") leftPressed = true;
    if (e.key === "Escape") togglePause();
});
document.addEventListener("keyup", e => {
    if (e.key === "ArrowRight") rightPressed = false;
    if (e.key === "ArrowLeft") leftPressed = false;
});

// ==================== BUTTONS ====================
document.getElementById("start-button").addEventListener("click", startGame);
document.getElementById("restart-button").addEventListener("click", startGame);
document.getElementById("next-level-button").addEventListener("click", nextLevel);
document.getElementById("back-button").addEventListener("click", () => {
    highScoresScreen.style.display = "none";
    startScreen.style.display = "flex";
});
document.getElementById("high-scores-button").addEventListener("click", showHighScores);
document.getElementById("show-scores-button").addEventListener("click", showHighScores);
// ==================== HIGH SCORES ====================
function getHighScores() {
    return JSON.parse(localStorage.getItem(highScoresKey)) || [];
}

function saveHighScores(scores) {
    localStorage.setItem(highScoresKey, JSON.stringify(scores));
}

function checkHighScore() {
    const scores = getHighScores();
    const isHigh = scores.length < 10 || score > scores[scores.length - 1].score;
    if (isHigh) {
        document.getElementById("new-high-score").style.display = "block";
        document.getElementById("name-input").style.display = "inline-block";
        document.getElementById("save-score-button").style.display = "inline-block";
    }
}

document.getElementById("save-score-button").addEventListener("click", () => {
    const name = document.getElementById("name-input").value || "Player";
    const scores = getHighScores();
    scores.push({ name, score });
    scores.sort((a, b) => b.score - a.score);
    if (scores.length > 10) scores.length = 10;
    saveHighScores(scores);
    showHighScores();
});

function showHighScores() {
    const list = document.getElementById("scores-list");
    const scores = getHighScores();
    list.innerHTML = scores.map(s => `<p>${s.name}: ${s.score}</p>`).join("");
    highScoresScreen.style.display = "flex";
    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    levelCompleteScreen.style.display = "none";
}

// ==================== MOBILE CONTROLS ====================
const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");

leftBtn.addEventListener("touchstart", () => (leftPressed = true));
leftBtn.addEventListener("touchend", () => (leftPressed = false));
rightBtn.addEventListener("touchstart", () => (rightPressed = true));
rightBtn.addEventListener("touchend", () => (rightPressed = false));

if (/Mobi|Android/i.test(navigator.userAgent)) {
    mobileControls.style.display = "flex";
}

// ==================== DEBUG PANEL ====================
const debugPanel = document.getElementById("debug-panel");
document.addEventListener("keydown", e => {
    if (e.key === "d") {
        debugMode = !debugMode;
        debugPanel.style.display = debugMode ? "block" : "none";
    }
});

function updateDebugPanel() {
    if (!debugMode) return;
    debugPanel.innerHTML = `
        <strong>Debug Mode</strong><br>
        Balls: ${balls.length}<br>
        Bricks Hit: ${bricksHit}<br>
        Paddle Hits: ${paddleHits}<br>
        Combo: ${combo}<br>
        Max Combo: ${maxCombo}<br>
        FPS: ${fps}
    `;
}

// ==================== FINAL INIT ====================
updateHUD();
createStars();
requestAnimationFrame(draw);
