const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('resetButton');
const statusDisplay = document.getElementById('status');

// Disable right-click
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Adjust canvas size for mobile responsiveness
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let isDrawing = false;
let lines = [];
let balls = [
    { x: 150, y: 500, vx: 0, vy: 0, radius: 15, color: 'red' },
    { x: 650, y: 500, vx: 0, vy: 0, radius: 15, color: 'blue' },
];
const gravity = 2; // Gravity strength for balls and lines
const friction = 0.90; // Friction for balls
const lineFriction = 3; // Friction when sliding along the line

// Load background music and winning sound
const backgroundMusic = new Audio('music.mp3');
backgroundMusic.loop = true; // Set the music to loop
backgroundMusic.volume = 0.5; // Set the volume (0.0 to 1.0)

const winningSound = new Audio('wining.mp3'); // Replace with your winning sound file
winningSound.volume = 1.0; // Set the winning sound volume

// Load background image from your link
const backgroundImage = new Image();
backgroundImage.src = 'https://i.ibb.co/N1cHNCW/Background-image.png'; // Your background image URL
backgroundImage.onload = function () {
    // Start the game once the image is loaded
    backgroundMusic.play().catch(error => {
        console.log("Error playing music:", error);
    });
    resetGame();
};

function resetGame() {
    lines = [];
    balls = [
        { x: 150, y: 500, vx: 0, vy: 0, radius: 15, color: 'red' },
        { x: 650, y: 500, vx: 0, vy: 0, radius: 15, color: 'blue' },
    ];
    collisionEffect = null; // Reset collision effect
    statusDisplay.textContent = 'Draw lines to make the balls touch!';

    // Reset the music if needed (you can skip this if you don't want to restart the music on reset)
    backgroundMusic.currentTime = 0; // Restart music from the beginning
    backgroundMusic.play().catch(error => {
        console.log("Error playing music:", error);
    });

    drawGame();
}

// Mouse event handlers (for desktop)
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only respond to left mouse button
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lines.push({ points: [{ x, y }], isComplete: false, vy: 0 });
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lines[lines.length - 1].points.push({ x, y });
});

canvas.addEventListener('mouseup', () => {
    if (isDrawing) {
        isDrawing = false;
        lines[lines.length - 1].isComplete = true;
    }
});

// Touch event handlers (for mobile)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    if (e.touches.length !== 1) return; // Only handle single touch
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    lines.push({ points: [{ x, y }], isComplete: false, vy: 0 });
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    lines[lines.length - 1].points.push({ x, y });
});

canvas.addEventListener('touchend', () => {
    if (isDrawing) {
        isDrawing = false;
        lines[lines.length - 1].isComplete = true;
    }
});

// Handle touch cancel (e.g., if the touch is interrupted)
canvas.addEventListener('touchcancel', () => {
    if (isDrawing) {
        isDrawing = false;
        lines[lines.length - 1].isComplete = true;
    }
});

resetButton.addEventListener('click', resetGame);

function distanceToLineSegment(px, py, ax, ay, bx, by) {
    const lineLengthSquared = (bx - ax) ** 2 + (by - ay) ** 2;
    if (lineLengthSquared === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
    const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lineLengthSquared));
    const projectionX = ax + t * (bx - ax);
    const projectionY = ay + t * (by - ay);
    return { distance: Math.sqrt((px - projectionX) ** 2 + (py - projectionY) ** 2), t, projectionX, projectionY };
}

function detectCollision(ball, line) {
    for (let i = 0; i < line.length - 1; i++) {
        const start = line[i];
        const end = line[i + 1];
        const collision = distanceToLineSegment(ball.x, ball.y, start.x, start.y, end.x, end.y);

        if (collision.distance < ball.radius) {
            const overlap = ball.radius - collision.distance;
            const normal = { x: (ball.x - collision.projectionX) / collision.distance, y: (ball.y - collision.projectionY) / collision.distance };
            ball.x += normal.x * overlap;
            ball.y += normal.y * overlap;

            const lineVector = { x: end.x - start.x, y: end.y - start.y };
            const lineLength = Math.sqrt(lineVector.x ** 2 + lineVector.y ** 2);
            const unitLineVector = { x: lineVector.x / lineLength, y: lineVector.y / lineLength };

            const velocityAlongLine = ball.vx * unitLineVector.x + ball.vy * unitLineVector.y;
            ball.vx = unitLineVector.x * velocityAlongLine * lineFriction;
            ball.vy = unitLineVector.y * velocityAlongLine * lineFriction;

            return true;
        }
    }
    return false;
}

function detectBallCollision() {
    const dx = balls[0].x - balls[1].x;
    const dy = balls[0].y - balls[1].y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < balls[0].radius + balls[1].radius) {
        statusDisplay.textContent = 'You Win! The balls touched!';
        // Stop background music and play winning sound
        backgroundMusic.pause();
        winningSound.play();
        return true;
    }
    return false;
}

function updatePhysics() {
    balls.forEach((ball) => {
        ball.vy += gravity; // Apply gravity
        ball.vx *= friction;
        ball.vy *= friction;

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
            ball.vx = -ball.vx;
            ball.x = Math.max(ball.radius, Math.min(ball.x, canvas.width - ball.radius));
        }
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
            ball.vy = -ball.vy;
            ball.y = Math.max(ball.radius, Math.min(ball.y, canvas.height - ball.radius));
        }

        lines.forEach((line) => detectCollision(ball, line.points));
    });

    lines.forEach((line) => {
        if (line.isComplete) {
            line.vy += gravity; // Apply gravity to lines
            line.points.forEach((point) => (point.y += line.vy));
            line.vy *= friction;
        }
    });
}

function drawGame() {
    // Draw the background image
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    lines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        line.points.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.stroke();
    });

    balls.forEach((ball) => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
    });

    updatePhysics();

    if (!detectBallCollision()) {
        requestAnimationFrame(drawGame);
    }
}

resetGame();
