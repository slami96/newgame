// Brick Breaker Game Script

window.addEventListener("load", function () {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const PADDLE_HEIGHT = 20;
    const BALL_RADIUS = 10;
    const BRICK_ROWS = 5;
    const BRICK_COLUMNS = 10;
    const BRICK_HEIGHT = 30;
    const BRICK_WIDTH = 75;
    const BRICK_PADDING = 5;

    let PADDLE_WIDTH = 100;
    let paddleX = (canvas.width - PADDLE_WIDTH) / 2;
    let ballX = canvas.width / 2;
    let ballY = canvas.height - PADDLE_HEIGHT - BALL_RADIUS - 10;
    let ballSpeedX = 4 * (Math.random() > 0.5 ? 1 : -1);
    let ballSpeedY = -4;

    let rightPressed = false;
    let leftPressed = false;

    let bricks = [];
    let score = 0;
    let lives = 3;
    let level = 1;
    let combo = 0;
    let maxCombo = 0;
    let comboTimer = 0;
    let paddleHits = 0;
    let bricksHit = 0;
    let totalBricks = 0;

    let balls = [{
        x: ballX,
        y: ballY,
        speedX: ballSpeedX,
        speedY: ballSpeedY,
        radius: BALL_RADIUS,
        fireball: false
    }];

    let gameStarted = false;
    let gamePaused = false;

    const scoreDisplay = document.getElementById("score");
    const livesDisplay = document.getElementById("lives");
    const levelDisplay = document.getElementById("level-display");
    const comboDisplay = document.getElementById("combo-display");
    const fpsDisplay = document.getElementById("fps");
    const startScreen = document.getElementById("start-screen");
    const gameOverScreen = document.getElementById("game-over");
    const finalScoreDisplay = document.getElementById("final-score");
    const levelCompleteScreen = document.getElementById("level-complete");
    const levelScoreDisplay = document.getElementById("level-score");
    const levelStatsDisplay = document.getElementById("level-stats");

    function createBricks() {
        bricks = [];
        totalBricks = 0;
        for (let c = 0; c < BRICK_COLUMNS; c++) {
            bricks[c] = [];
            for (let r = 0; r < BRICK_ROWS; r++) {
                bricks[c][r] = {
                    x: 0,
                    y: 0,
                    status: 1,
                    color: "#FF5555"
                };
                totalBricks++;
            }
        }
    }

    function drawBricks() {
        for (let c = 0; c < BRICK_COLUMNS; c++) {
            for (let r = 0; r < BRICK_ROWS; r++) {
                let b = bricks[c][r];
                if (b.status > 0) {
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

    function drawBall(ball) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.closePath();
    }

    function drawPaddle() {
        ctx.beginPath();
        ctx.rect(paddleX, canvas.height - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    }

    function collisionDetection() {
        for (let i = 0; i < balls.length; i++) {
            let ball = balls[i];
            for (let c = 0; c < BRICK_COLUMNS; c++) {
                for (let r = 0; r < BRICK_ROWS; r++) {
                    let b = bricks[c][r];
                    if (b.status > 0) {
                        if (
                            ball.x > b.x &&
                            ball.x < b.x + BRICK_WIDTH &&
                            ball.y > b.y &&
                            ball.y < b.y + BRICK_HEIGHT
                        ) {
                            ball.speedY = -ball.speedY;
                            b.status = 0;
                            score += 10;
                            bricksHit++;

                            if (scoreDisplay) {
                                scoreDisplay.textContent = `Score: ${score}`;
                            }

                            if (bricksHit === totalBricks) {
                                levelComplete();
                            }
                        }
                    }
                }
            }
        }
    }

    function draw() {
        if (!gameStarted || gamePaused) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawPaddle();

        for (let i = 0; i < balls.length; i++) {
            drawBall(balls[i]);
        }

        collisionDetection();

        for (let i = balls.length - 1; i >= 0; i--) {
            let ball = balls[i];
            ball.x += ball.speedX;
            ball.y += ball.speedY;

            if (ball.x + ball.speedX > canvas.width - ball.radius || ball.x + ball.speedX < ball.radius) {
                ball.speedX = -ball.speedX;
            }

            if (ball.y + ball.speedY < ball.radius) {
                ball.speedY = -ball.speedY;
            } else if (
                ball.y + ball.speedY > canvas.height - PADDLE_HEIGHT - ball.radius &&
                ball.x > paddleX &&
                ball.x < paddleX + PADDLE_WIDTH
            ) {
                ball.speedY = -ball.speedY;
                paddleHits++;
            } else if (ball.y + ball.speedY > canvas.height) {
                if (balls.length > 1) {
                    balls.splice(i, 1);
                } else {
                    lives--;
                    if (livesDisplay) livesDisplay.textContent = `Lives: ${lives}`;
                    if (lives <= 0) {
                        gameOver();
                        return;
                    } else {
                        ball.x = canvas.width / 2;
                        ball.y = canvas.height - PADDLE_HEIGHT - ball.radius - 10;
                        ball.speedX = 4 * (Math.random() > 0.5 ? 1 : -1);
                        ball.speedY = -4;
                        paddleX = (canvas.width - PADDLE_WIDTH) / 2;
                    }
                }
            }
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

        requestAnimationFrame(draw);
    }

    function startGame() {
        gameStarted = true;
        startScreen.style.display = "none";
        score = 0;
        lives = 3;
        level = 1;
        bricksHit = 0;
        paddleHits = 0;
        combo = 0;
        maxCombo = 0;
        comboTimer = 0;

        if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;
        if (livesDisplay) livesDisplay.textContent = `Lives: ${lives}`;
        if (levelDisplay) levelDisplay.textContent = `Level ${level}`;

        ballX = canvas.width / 2;
        ballY = canvas.height - PADDLE_HEIGHT - BALL_RADIUS - 10;
        ballSpeedX = 4 * (Math.random() > 0.5 ? 1 : -1);
        ballSpeedY = -4;
        paddleX = (canvas.width - PADDLE_WIDTH) / 2;

        balls = [{
            x: ballX,
            y: ballY,
            speedX: ballSpeedX,
            speedY: ballSpeedY,
            radius: BALL_RADIUS,
            fireball: false
        }];

        createBricks();
        requestAnimationFrame(draw);
    }

    function gameOver() {
        gameStarted = false;
        if (gameOverScreen) {
            gameOverScreen.style.display = "flex";
            if (finalScoreDisplay) finalScoreDisplay.textContent = `Final Score: ${score}`;
        } else {
            alert(`Game Over! Final Score: ${score}`);
        }
    }

    function levelComplete() {
        gameStarted = false;
        if (levelCompleteScreen) {
            levelCompleteScreen.style.display = "flex";
            if (levelScoreDisplay) levelScoreDisplay.textContent = `Score: ${score}`;
            if (levelStatsDisplay) levelStatsDisplay.innerHTML =
                `Level ${level} Complete!<br>Bricks Destroyed: ${bricksHit}<br>Paddle Hits: ${paddleHits}`;
        } else {
            alert(`Level ${level} Complete!`);
            nextLevel();
        }
    }

    function nextLevel() {
        levelCompleteScreen.style.display = "none";
        level++;
        bricksHit = 0;
        paddleHits = 0;

        if (levelDisplay) levelDisplay.textContent = `Level ${level}`;

        ballX = canvas.width / 2;
        ballY = canvas.height - PADDLE_HEIGHT - BALL_RADIUS - 10;

        let baseSpeed = 4 + (level - 1) * 0.5;
        ballSpeedX = baseSpeed * (Math.random() > 0.5 ? 1 : -1);
        ballSpeedY = -baseSpeed;
        paddleX = (canvas.width - PADDLE_WIDTH) / 2;

        balls = [{
            x: ballX,
            y: ballY,
            speedX: ballSpeedX,
            speedY: ballSpeedY,
            radius: BALL_RADIUS,
            fireball: false
        }];

        createBricks();
        gameStarted = true;
        requestAnimationFrame(draw);
    }

    // Event listeners
    document.addEventListener("keydown", function (e) {
        if (e.key === "Right" || e.key === "ArrowRight") {
            rightPressed = true;
        } else if (e.key === "Left" || e.key === "ArrowLeft") {
            leftPressed = true;
        }
    });

    document.addEventListener("keyup", function (e) {
        if (e.key === "Right" || e.key === "ArrowRight") {
            rightPressed = false;
        } else if (e.key === "Left" || e.key === "ArrowLeft") {
            leftPressed = false;
        }
    });

    document.getElementById("start-button").addEventListener("click", startGame);
    document.getElementById("restart-button").addEventListener("click", startGame);
    document.getElementById("next-level-button").addEventListener("click", nextLevel);
});
