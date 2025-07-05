console.log("PIXI is", typeof PIXI);
if (typeof PIXI !== "undefined") {
  const app = new PIXI.Application({ width: 400, height: 300, backgroundColor: 0x1099bb });
  document.body.appendChild(app.view);
  const graphics = new PIXI.Graphics();
  graphics.beginFill(0xde3249);
  graphics.drawRect(50, 50, 100, 100);
  graphics.endFill();
  app.stage.addChild(graphics);
}

// Game constants
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 700;
const GOAL_WIDTH = 200;
const GOAL_HEIGHT = 120;
const BALL_RADIUS = 12;
const GOALKEEPER_WIDTH = 40;
const GOALKEEPER_HEIGHT = 60;
const POWER_CHARGE_SPEED = 2;
const MAX_POWER = 100;
const CURVE_SENSITIVITY = 0.3;

// Game state
let app;
let gameState = 'ready'; // 'ready', 'charging', 'shooting', 'scored', 'missed'
let playerScore = 0;
let robotScore = 0;
let currentRound = 1;
let maxRounds = 5;

// Game objects
let ball;
let goalkeeper;
let goalLeft, goalRight, goalTop, goalBottom;
let powerLevel = 0;
let isCharging = false;
let startMousePos = { x: 0, y: 0 };
let currentMousePos = { x: 0, y: 0 };
let dragPath = []; // Track the drag path for curve detection
let aimingLine;
let ballTrail = [];
let particles = [];

// UI elements
let powerMeter;
let powerFill;

// Initialize the game
function init() {
    // Create PixiJS application
    app = new PIXI.Application({
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: 0x001122,
        antialias: true
    });

    // Add canvas to DOM
    const canvas = document.getElementById('game-canvas');
    canvas.replaceWith(app.view);
    app.view.id = 'game-canvas';

    // Get UI elements
    powerMeter = document.getElementById('power-meter-container');
    powerFill = document.getElementById('power-fill');

    // Create game scene
    createScene();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start game loop
    app.ticker.add(gameLoop);
}

function createScene() {
    // Create field background
    const field = new PIXI.Graphics();
    field.beginFill(0x0a4a0a);
    field.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    field.endFill();
    
    // Add field lines
    field.lineStyle(3, 0x00ffff, 0.8);
    field.moveTo(0, GAME_HEIGHT / 2);
    field.lineTo(GAME_WIDTH, GAME_HEIGHT / 2);
    
    // Penalty area
    field.drawRect(GAME_WIDTH - 250, GAME_HEIGHT / 2 - 100, 200, 200);
    
    // Center circle
    field.drawCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 80);
    
    // Goal area
    field.drawRect(GAME_WIDTH - 100, GAME_HEIGHT / 2 - 60, 80, 120);
    
    app.stage.addChild(field);

    // Create goal posts
    createGoalPosts();
    
    // Create ball
    createBall();
    
    // Create goalkeeper
    createGoalkeeper();
    
    // Create aiming line
    aimingLine = new PIXI.Graphics();
    app.stage.addChild(aimingLine);
    
    // Add futuristic effects
    addFuturisticEffects();
}

function createGoalPosts() {
    const goalContainer = new PIXI.Container();
    
    // Goal posts
    const leftPost = new PIXI.Graphics();
    leftPost.beginFill(0xffffff);
    leftPost.drawRect(GAME_WIDTH - 20, GAME_HEIGHT / 2 - GOAL_HEIGHT / 2, 8, GOAL_HEIGHT);
    leftPost.endFill();
    
    const rightPost = new PIXI.Graphics();
    rightPost.beginFill(0xffffff);
    rightPost.drawRect(GAME_WIDTH - 20, GAME_HEIGHT / 2 + GOAL_HEIGHT / 2 - 8, 8, 8);
    rightPost.endFill();
    
    // Crossbar
    const crossbar = new PIXI.Graphics();
    crossbar.beginFill(0xffffff);
    crossbar.drawRect(GAME_WIDTH - 20, GAME_HEIGHT / 2 - GOAL_HEIGHT / 2, 8, 8);
    crossbar.endFill();
    
    goalContainer.addChild(leftPost, rightPost, crossbar);
    app.stage.addChild(goalContainer);
    
    // Goal boundaries for collision detection
    goalLeft = GAME_WIDTH - 20;
    goalRight = GAME_WIDTH;
    goalTop = GAME_HEIGHT / 2 - GOAL_HEIGHT / 2;
    goalBottom = GAME_HEIGHT / 2 + GOAL_HEIGHT / 2;
}

function createBall() {
    ball = new PIXI.Graphics();
    ball.beginFill(0xffffff);
    ball.drawCircle(0, 0, BALL_RADIUS);
    ball.endFill();
    
    resetBallPosition();
    app.stage.addChild(ball);
}

function createGoalkeeper() {
    goalkeeper = new PIXI.Container();
    
    // Robot body
    const body = new PIXI.Graphics();
    body.beginFill(0x333333);
    body.drawRoundedRect(-GOALKEEPER_WIDTH / 2, -GOALKEEPER_HEIGHT / 2, GOALKEEPER_WIDTH, GOALKEEPER_HEIGHT, 5);
    body.endFill();
    
    // Robot head
    const head = new PIXI.Graphics();
    head.beginFill(0x555555);
    head.drawCircle(0, -GOALKEEPER_HEIGHT / 2 - 10, 12);
    head.endFill();
    
    // Robot eyes (glowing)
    const leftEye = new PIXI.Graphics();
    leftEye.beginFill(0xff0000);
    leftEye.drawCircle(-6, -GOALKEEPER_HEIGHT / 2 - 10, 3);
    leftEye.endFill();
    
    const rightEye = new PIXI.Graphics();
    rightEye.beginFill(0xff0000);
    rightEye.drawCircle(6, -GOALKEEPER_HEIGHT / 2 - 10, 3);
    rightEye.endFill();
    
    goalkeeper.addChild(body, head, leftEye, rightEye);
    goalkeeper.x = GAME_WIDTH - 60;
    goalkeeper.y = GAME_HEIGHT / 2;
    
    app.stage.addChild(goalkeeper);
}

function addFuturisticEffects() {
    // Add background particles
    for (let i = 0; i < 20; i++) {
        createBackgroundParticle();
    }
}

function createBackgroundParticle() {
    const particle = new PIXI.Graphics();
    particle.beginFill(0x00ffff, 0.1);
    particle.drawCircle(0, 0, Math.random() * 3 + 1);
    particle.endFill();
    
    particle.x = Math.random() * GAME_WIDTH;
    particle.y = Math.random() * GAME_HEIGHT;
    particle.vx = (Math.random() - 0.5) * 0.5;
    particle.vy = (Math.random() - 0.5) * 0.5;
    particle.alpha = Math.random() * 0.5 + 0.1;
    
    particles.push(particle);
    app.stage.addChild(particle);
}

function resetBallPosition() {
    ball.x = GAME_WIDTH / 2 - 200;
    ball.y = GAME_HEIGHT / 2;
    ball.vx = 0;
    ball.vy = 0;
    ball.gravity = 0;
    ball.curve = 0;
    ballTrail = [];
}

function setupEventListeners() {
    app.view.addEventListener('mousedown', onMouseDown);
    app.view.addEventListener('mousemove', onMouseMove);
    app.view.addEventListener('mouseup', onMouseUp);
    app.view.addEventListener('touchstart', onTouchStart);
    app.view.addEventListener('touchmove', onTouchMove);
    app.view.addEventListener('touchend', onTouchEnd);
}

function onMouseDown(event) {
    if (gameState !== 'ready') return;
    
    const rect = app.view.getBoundingClientRect();
    startMousePos.x = event.clientX - rect.left;
    startMousePos.y = event.clientY - rect.top;
    currentMousePos.x = startMousePos.x;
    currentMousePos.y = startMousePos.y;
    
    // Initialize drag path tracking
    dragPath = [{ x: startMousePos.x, y: startMousePos.y, time: Date.now() }];
    
    isCharging = true;
    gameState = 'charging';
    powerLevel = 0;
    powerMeter.classList.remove('hidden');
}

function onMouseMove(event) {
    if (!isCharging) return;
    
    const rect = app.view.getBoundingClientRect();
    currentMousePos.x = event.clientX - rect.left;
    currentMousePos.y = event.clientY - rect.top;
    
    // Track drag path for curve detection
    dragPath.push({ x: currentMousePos.x, y: currentMousePos.y, time: Date.now() });
    
    // Keep only recent path points (last 20 points)
    if (dragPath.length > 20) {
        dragPath.shift();
    }
    
    drawAimingLine();
}

function onMouseUp(event) {
    if (!isCharging) return;
    
    isCharging = false;
    powerMeter.classList.add('hidden');
    
    if (powerLevel > 10) {
        shootBall();
    } else {
        gameState = 'ready';
    }
}

// Touch events for mobile
function onTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const mockEvent = { clientX: touch.clientX, clientY: touch.clientY };
    onMouseDown(mockEvent);
}

function onTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const mockEvent = { clientX: touch.clientX, clientY: touch.clientY };
    onMouseMove(mockEvent);
}

function onTouchEnd(event) {
    event.preventDefault();
    onMouseUp(event);
}

function detectCurvature() {
    if (dragPath.length < 5) return 0;
    
    let totalCurvature = 0;
    let validPoints = 0;
    
    // Calculate curvature by examining angle changes along the path
    for (let i = 2; i < dragPath.length; i++) {
        const p1 = dragPath[i - 2];
        const p2 = dragPath[i - 1];
        const p3 = dragPath[i];
        
        // Calculate vectors
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        
        // Calculate angle change (cross product gives curvature direction)
        const cross = v1.x * v2.y - v1.y * v2.x;
        const dot = v1.x * v2.x + v1.y * v2.y;
        
        if (Math.abs(cross) > 0.1) { // Only count significant curves
            totalCurvature += cross;
            validPoints++;
        }
    }
    
    // Return normalized curvature (-1 to 1, where negative = left curve, positive = right curve)
    return validPoints > 0 ? Math.max(-1, Math.min(1, totalCurvature / (validPoints * 100))) : 0;
}

function drawAimingLine() {
    aimingLine.clear();
    
    if (!isCharging) return;
    
    const dx = currentMousePos.x - startMousePos.x;
    const dy = currentMousePos.y - startMousePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 10) {
        aimingLine.lineStyle(3, 0x00ffff, 0.8);
        aimingLine.moveTo(ball.x, ball.y);
        
        // Get curvature from drag pattern
        const curvature = detectCurvature();
        
        // Draw curved line to show trajectory
        const curveAmount = distance * CURVE_SENSITIVITY + curvature * 100;
        const midX = ball.x + dx * 0.5;
        const midY = ball.y + dy * 0.5 - curveAmount;
        
        // Draw quadratic curve
        aimingLine.quadraticCurveTo(midX, midY, ball.x + dx, ball.y + dy);
        
        // Draw power indicator circle
        const powerRadius = Math.min(distance * 0.3, 50);
        aimingLine.lineStyle(2, 0xffff00, 0.6);
        aimingLine.drawCircle(ball.x, ball.y, powerRadius);
        
        // Draw curve indicator
        if (Math.abs(curvature) > 0.1) {
            const curveColor = curvature > 0 ? 0xff4444 : 0x44ff44;
            aimingLine.lineStyle(2, curveColor, 0.8);
            aimingLine.drawCircle(ball.x, ball.y, powerRadius + 10);
        }
    }
}

function shootBall() {
    gameState = 'shooting';
    aimingLine.clear();
    
    const dx = currentMousePos.x - startMousePos.x;
    const dy = currentMousePos.y - startMousePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate ball velocity based on power and direction
    const power = Math.min(powerLevel / MAX_POWER, 1);
    const baseSpeed = 8 + power * 12;
    
    ball.vx = (dx / distance) * baseSpeed;
    ball.vy = (dy / distance) * baseSpeed;
    
    // Apply curve based on detected drag pattern (Magnus effect)
    const curvature = detectCurvature();
    ball.curve = curvature * 0.3; // More realistic curve based on actual drag pattern
    ball.gravity = 0.15;
    
    // Move goalkeeper
    moveGoalkeeper();
    
    // Add shooting sound effect (visual feedback)
    createShootEffect();
}

function moveGoalkeeper() {
    // Simple AI: goalkeeper moves towards predicted ball position
    const predictedY = ball.y + ball.vy * 20;
    const targetY = Math.max(goalTop + 30, Math.min(goalBottom - 30, predictedY));
    
    // Random factor to make it not perfect
    const randomOffset = (Math.random() - 0.5) * 60;
    goalkeeper.targetY = targetY + randomOffset;
    
    // Animate goalkeeper movement
    const moveSpeed = 3 + Math.random() * 2;
    goalkeeper.moveSpeed = moveSpeed;
}

function createShootEffect() {
    // Create particle burst at ball position
    for (let i = 0; i < 10; i++) {
        const particle = new PIXI.Graphics();
        particle.beginFill(0x00ffff, 0.8);
        particle.drawCircle(0, 0, 2);
        particle.endFill();
        
        particle.x = ball.x;
        particle.y = ball.y;
        particle.vx = (Math.random() - 0.5) * 10;
        particle.vy = (Math.random() - 0.5) * 10;
        particle.life = 30;
        particle.maxLife = 30;
        
        particles.push(particle);
        app.stage.addChild(particle);
    }
}

function gameLoop() {
    updatePowerMeter();
    updateBall();
    updateGoalkeeper();
    updateParticles();
    checkCollisions();
    updateUI();
}

function updatePowerMeter() {
    if (isCharging) {
        powerLevel += POWER_CHARGE_SPEED;
        if (powerLevel >= MAX_POWER) {
            powerLevel = MAX_POWER;
        }
        
        const percentage = (powerLevel / MAX_POWER) * 100;
        powerFill.style.width = percentage + '%';
    }
}

function updateBall() {
    if (gameState !== 'shooting') return;
    
    // Update ball position
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // Apply gravity
    ball.vy += ball.gravity;
    
    // Apply curve
    ball.vx += ball.curve;
    
    // Air resistance
    ball.vx *= 0.99;
    ball.vy *= 0.995;
    
    // Add trail effect
    ballTrail.push({ x: ball.x, y: ball.y, alpha: 1 });
    if (ballTrail.length > 10) {
        ballTrail.shift();
    }
    
    // Draw trail
    const trailGraphics = new PIXI.Graphics();
    for (let i = 0; i < ballTrail.length; i++) {
        const trail = ballTrail[i];
        const alpha = (i / ballTrail.length) * 0.5;
        trailGraphics.beginFill(0x00ffff, alpha);
        trailGraphics.drawCircle(trail.x, trail.y, BALL_RADIUS * (i / ballTrail.length));
        trailGraphics.endFill();
    }
    
    if (app.stage.children.includes(trailGraphics)) {
        app.stage.removeChild(trailGraphics);
    }
    app.stage.addChildAt(trailGraphics, 1);
}

function updateGoalkeeper() {
    if (goalkeeper.targetY !== undefined) {
        const dy = goalkeeper.targetY - goalkeeper.y;
        if (Math.abs(dy) > 2) {
            goalkeeper.y += Math.sign(dy) * goalkeeper.moveSpeed;
        }
    }
}

function updateParticles() {
    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.life !== undefined) {
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                app.stage.removeChild(particle);
                particles.splice(index, 1);
            }
        } else {
            // Background particles
            if (particle.x < 0 || particle.x > GAME_WIDTH) particle.vx *= -1;
            if (particle.y < 0 || particle.y > GAME_HEIGHT) particle.vy *= -1;
        }
    });
}

function checkCollisions() {
    if (gameState !== 'shooting') return;
    
    // Check if ball goes out of bounds
    if (ball.x < 0 || ball.x > GAME_WIDTH || ball.y < 0 || ball.y > GAME_HEIGHT) {
        miss();
        return;
    }
    
    // Check goal collision
    if (ball.x >= goalLeft && ball.x <= goalRight && ball.y >= goalTop && ball.y <= goalBottom) {
        // Check if goalkeeper saves it
        const distanceToGoalkeeper = Math.sqrt(
            Math.pow(ball.x - goalkeeper.x, 2) + Math.pow(ball.y - goalkeeper.y, 2)
        );
        
        if (distanceToGoalkeeper < 30) {
            save();
        } else {
            score();
        }
    }
}

function score() {
    gameState = 'scored';
    playerScore++;
    createScoreEffect();
    setTimeout(() => {
        nextRound();
    }, 2000);
}

function miss() {
    gameState = 'missed';
    setTimeout(() => {
        nextRound();
    }, 1000);
}

function save() {
    gameState = 'saved';
    setTimeout(() => {
        nextRound();
    }, 1500);
}

function createScoreEffect() {
    // Create celebration particles
    for (let i = 0; i < 30; i++) {
        const particle = new PIXI.Graphics();
        particle.beginFill(0x00ff00, 0.8);
        particle.drawCircle(0, 0, 3);
        particle.endFill();
        
        particle.x = ball.x;
        particle.y = ball.y;
        particle.vx = (Math.random() - 0.5) * 15;
        particle.vy = (Math.random() - 0.5) * 15;
        particle.life = 60;
        particle.maxLife = 60;
        
        particles.push(particle);
        app.stage.addChild(particle);
    }
}

function nextRound() {
    currentRound++;
    
    if (currentRound > maxRounds) {
        endGame();
        return;
    }
    
    // Robot's turn (simple simulation)
    if (Math.random() < 0.3) {
        robotScore++;
    }
    
    resetBallPosition();
    gameState = 'ready';
}

function endGame() {
    gameState = 'ended';
    
    const result = playerScore > robotScore ? 'YOU WIN!' : 
                  playerScore < robotScore ? 'ROBOT WINS!' : 'DRAW!';
    
    // Reset for new game
    setTimeout(() => {
        playerScore = 0;
        robotScore = 0;
        currentRound = 1;
        resetBallPosition();
        gameState = 'ready';
    }, 3000);
}

function updateUI() {
    document.getElementById('player-score').textContent = playerScore;
    document.getElementById('robot-score').textContent = robotScore;
}

// Initialize game when page loads
window.addEventListener('load', init); 