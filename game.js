// Initialize game when page loads
window.addEventListener('load', init);

// Game constants
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 700;
const GOAL_WIDTH = 400;
const GOAL_HEIGHT = 200;
const GOAL_DEPTH = 100; // 3D depth
const BALL_RADIUS = 12;
const GOALKEEPER_WIDTH = 50;
const GOALKEEPER_HEIGHT = 80;
const POWER_CHARGE_SPEED = 2;
const MAX_POWER = 100;
const CURVE_SENSITIVITY = 0.3;

// Game state
let app;
let gameState = 'ready'; // 'ready', 'aiming', 'shooting', 'scored', 'missed'
let playerScore = 0;
let robotScore = 0;
let currentRound = 1;
let maxRounds = 5;

// Game objects
let ball;
let goalkeeper;
let goalTargets = []; // Clickable target positions in goal
let selectedTarget = null;
let powerLevel = 0;
let isCharging = false;
let startMousePos = { x: 0, y: 0 };
let currentMousePos = { x: 0, y: 0 };
let aimingCircle; // Circle that shows where you're aiming
let curveBall; // Small ball inside the circle for curve control
let isAiming = false; // Track if we're in aiming mode
let targetAimPos = { x: 0, y: 0 }; // Where user wants to aim
let curveAmount = { x: 0, y: 0 }; // How much curve based on curve ball position
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
        backgroundColor: 0x4a7c59, // Grass green
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
    
    // Update initial UI
    updateUI();
}

function createScene() {
    // Create stadium background
    createStadium();
    
    // Create 3D perspective goal
    create3DGoal();
    
    // Create goal targets
    createGoalTargets();
    
    // Create ball
    createBall();
    
    // Create realistic goalkeeper
    createRealisticGoalkeeper();
    
    // Create aiming elements
    aimingLine = new PIXI.Graphics();
    app.stage.addChild(aimingLine);
    
    aimingCircle = new PIXI.Graphics();
    app.stage.addChild(aimingCircle);
    
    curveBall = new PIXI.Graphics();
    curveBall.beginFill(0xffff00);
    curveBall.drawCircle(0, 0, 6);
    curveBall.endFill();
    curveBall.visible = false;
    app.stage.addChild(curveBall);
    
    // Add stadium atmosphere
    addStadiumEffects();
}

function createStadium() {
    // Stadium background
    const stadium = new PIXI.Graphics();
    
    // Sky gradient
    stadium.beginFill(0x87ceeb);
    stadium.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT / 3);
    stadium.endFill();
    
    // Stadium stands (perspective)
    stadium.beginFill(0x333333);
    stadium.moveTo(0, GAME_HEIGHT / 3);
    stadium.lineTo(GAME_WIDTH, GAME_HEIGHT / 3);
    stadium.lineTo(GAME_WIDTH - 100, GAME_HEIGHT / 2);
    stadium.lineTo(100, GAME_HEIGHT / 2);
    stadium.closePath();
    stadium.endFill();
    
    // Crowd silhouettes
    for (let i = 0; i < 50; i++) {
        const person = new PIXI.Graphics();
        person.beginFill(0x222222);
        person.drawRect(0, 0, 3, 8);
        person.endFill();
        person.x = 100 + (i * (GAME_WIDTH - 200) / 50);
        person.y = GAME_HEIGHT / 3 + Math.random() * 20;
        stadium.addChild(person);
    }
    
    // Grass field with perspective
    const field = new PIXI.Graphics();
    field.beginFill(0x228b22);
    field.drawRect(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);
    field.endFill();
    
    // Field lines with perspective
    field.lineStyle(2, 0xffffff, 0.8);
    
    // Goal area (3D perspective)
    const goalAreaPoints = [
        { x: GAME_WIDTH / 2 - 120, y: GAME_HEIGHT / 2 + 80 },
        { x: GAME_WIDTH / 2 + 120, y: GAME_HEIGHT / 2 + 80 },
        { x: GAME_WIDTH / 2 + 80, y: GAME_HEIGHT / 2 + 20 },
        { x: GAME_WIDTH / 2 - 80, y: GAME_HEIGHT / 2 + 20 }
    ];
    
    field.moveTo(goalAreaPoints[0].x, goalAreaPoints[0].y);
    for (let i = 1; i < goalAreaPoints.length; i++) {
        field.lineTo(goalAreaPoints[i].x, goalAreaPoints[i].y);
    }
    field.closePath();
    
    // Penalty spot
    field.beginFill(0xffffff);
    field.drawCircle(GAME_WIDTH / 2, GAME_HEIGHT - 80, 3);
    field.endFill();
    
    app.stage.addChild(stadium);
    app.stage.addChild(field);
}

function create3DGoal() {
    const goal = new PIXI.Container();
    
    // Goal frame with 3D perspective
    const frame = new PIXI.Graphics();
    
    // Left post
    frame.beginFill(0xffffff);
    frame.moveTo(GAME_WIDTH / 2 - GOAL_WIDTH / 2, GAME_HEIGHT / 2 + 20);
    frame.lineTo(GAME_WIDTH / 2 - GOAL_WIDTH / 2, GAME_HEIGHT / 2 + 20 + GOAL_HEIGHT);
    frame.lineTo(GAME_WIDTH / 2 - GOAL_WIDTH / 2 + 8, GAME_HEIGHT / 2 + 20 + GOAL_HEIGHT);
    frame.lineTo(GAME_WIDTH / 2 - GOAL_WIDTH / 2 + 8, GAME_HEIGHT / 2 + 20);
    frame.closePath();
    frame.endFill();
    
    // Right post
    frame.beginFill(0xffffff);
    frame.moveTo(GAME_WIDTH / 2 + GOAL_WIDTH / 2, GAME_HEIGHT / 2 + 20);
    frame.lineTo(GAME_WIDTH / 2 + GOAL_WIDTH / 2, GAME_HEIGHT / 2 + 20 + GOAL_HEIGHT);
    frame.lineTo(GAME_WIDTH / 2 + GOAL_WIDTH / 2 - 8, GAME_HEIGHT / 2 + 20 + GOAL_HEIGHT);
    frame.lineTo(GAME_WIDTH / 2 + GOAL_WIDTH / 2 - 8, GAME_HEIGHT / 2 + 20);
    frame.closePath();
    frame.endFill();
    
    // Crossbar
    frame.beginFill(0xffffff);
    frame.drawRect(GAME_WIDTH / 2 - GOAL_WIDTH / 2, GAME_HEIGHT / 2 + 20, GOAL_WIDTH, 8);
    frame.endFill();
    
    // Goal net with 3D perspective
    const net = new PIXI.Graphics();
    net.lineStyle(1, 0xffffff, 0.4);
    
    // Vertical net lines
    for (let i = 0; i <= 20; i++) {
        const x = GAME_WIDTH / 2 - GOAL_WIDTH / 2 + (i * GOAL_WIDTH / 20);
        net.moveTo(x, GAME_HEIGHT / 2 + 28);
        net.lineTo(x, GAME_HEIGHT / 2 + 28 + GOAL_HEIGHT - 8);
    }
    
    // Horizontal net lines
    for (let i = 0; i <= 10; i++) {
        const y = GAME_HEIGHT / 2 + 28 + (i * (GOAL_HEIGHT - 8) / 10);
        net.moveTo(GAME_WIDTH / 2 - GOAL_WIDTH / 2, y);
        net.lineTo(GAME_WIDTH / 2 + GOAL_WIDTH / 2, y);
    }
    
    goal.addChild(frame);
    goal.addChild(net);
    app.stage.addChild(goal);
}

function createGoalTargets() {
    const targetPositions = [
        // Top row
        { x: GAME_WIDTH / 2 - GOAL_WIDTH / 3, y: GAME_HEIGHT / 2 + 60, id: 'top-left' },
        { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 + 60, id: 'top-center' },
        { x: GAME_WIDTH / 2 + GOAL_WIDTH / 3, y: GAME_HEIGHT / 2 + 60, id: 'top-right' },
        
        // Bottom row
        { x: GAME_WIDTH / 2 - GOAL_WIDTH / 3, y: GAME_HEIGHT / 2 + 160, id: 'bottom-left' },
        { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 + 160, id: 'bottom-center' },
        { x: GAME_WIDTH / 2 + GOAL_WIDTH / 3, y: GAME_HEIGHT / 2 + 160, id: 'bottom-right' }
    ];
    
    targetPositions.forEach(pos => {
        const target = new PIXI.Graphics();
        target.beginFill(0xffff00, 0.3);
        target.lineStyle(3, 0xffff00, 0.8);
        target.drawCircle(0, 0, 25);
        target.endFill();
        
        target.beginFill(0xff0000, 0.5);
        target.drawCircle(0, 0, 8);
        target.endFill();
        
        target.x = pos.x;
        target.y = pos.y;
        target.interactive = true;
        target.buttonMode = true;
        target.targetId = pos.id;
        target.goalX = pos.x;
        target.goalY = pos.y;
        
        target.on('pointerdown', onTargetClick);
        target.on('pointerover', onTargetHover);
        target.on('pointerout', onTargetOut);
        
        goalTargets.push(target);
        app.stage.addChild(target);
    });
}

function createBall() {
    ball = new PIXI.Graphics();
    
    // Main ball
    ball.beginFill(0xffffff);
    ball.drawCircle(0, 0, BALL_RADIUS);
    ball.endFill();
    
    // Soccer ball pattern
    ball.lineStyle(2, 0x000000, 1);
    ball.drawCircle(0, 0, BALL_RADIUS);
    
    // Pentagon pattern
    ball.beginFill(0x000000);
    for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const x = Math.cos(angle) * 4;
        const y = Math.sin(angle) * 4;
        if (i === 0) ball.moveTo(x, y);
        else ball.lineTo(x, y);
    }
    ball.closePath();
    ball.endFill();
    
    resetBallPosition();
    app.stage.addChild(ball);
}

function createRealisticGoalkeeper() {
    goalkeeper = new PIXI.Container();
    
    // Goalkeeper body
    const body = new PIXI.Graphics();
    body.beginFill(0x228b22); // Green jersey
    body.drawRoundedRect(-GOALKEEPER_WIDTH / 2, -GOALKEEPER_HEIGHT / 2, GOALKEEPER_WIDTH, GOALKEEPER_HEIGHT * 0.6, 5);
    body.endFill();
    
    // Goalkeeper head
    const head = new PIXI.Graphics();
    head.beginFill(0xfdbcb4); // Skin color
    head.drawCircle(0, -GOALKEEPER_HEIGHT / 2 - 15, 15);
    head.endFill();
    
    // Goalkeeper gloves
    const leftGlove = new PIXI.Graphics();
    leftGlove.beginFill(0xffffff);
    leftGlove.drawCircle(-GOALKEEPER_WIDTH / 2 - 10, -10, 8);
    leftGlove.endFill();
    
    const rightGlove = new PIXI.Graphics();
    rightGlove.beginFill(0xffffff);
    rightGlove.drawCircle(GOALKEEPER_WIDTH / 2 + 10, -10, 8);
    rightGlove.endFill();
    
    // Goalkeeper legs
    const leftLeg = new PIXI.Graphics();
    leftLeg.beginFill(0x000000);
    leftLeg.drawRect(-GOALKEEPER_WIDTH / 4 - 5, GOALKEEPER_HEIGHT / 2 * 0.6, 10, 20);
    leftLeg.endFill();
    
    const rightLeg = new PIXI.Graphics();
    rightLeg.beginFill(0x000000);
    rightLeg.drawRect(GOALKEEPER_WIDTH / 4 - 5, GOALKEEPER_HEIGHT / 2 * 0.6, 10, 20);
    rightLeg.endFill();
    
    goalkeeper.addChild(body, head, leftGlove, rightGlove, leftLeg, rightLeg);
    goalkeeper.x = GAME_WIDTH / 2;
    goalkeeper.y = GAME_HEIGHT / 2 + 120;
    
    app.stage.addChild(goalkeeper);
}

function addStadiumEffects() {
    // Stadium lights
    for (let i = 0; i < 4; i++) {
        const light = new PIXI.Graphics();
        light.beginFill(0xffff99, 0.2);
        light.drawCircle(0, 0, 30);
        light.endFill();
        light.x = (i + 1) * (GAME_WIDTH / 5);
        light.y = GAME_HEIGHT / 4;
        app.stage.addChild(light);
    }
    
    // Floating particles for atmosphere
    for (let i = 0; i < 10; i++) {
        createAtmosphereParticle();
    }
}

function createAtmosphereParticle() {
    const particle = new PIXI.Graphics();
    particle.beginFill(0xffffff, 0.1);
    particle.drawCircle(0, 0, Math.random() * 2 + 1);
    particle.endFill();
    
    particle.x = Math.random() * GAME_WIDTH;
    particle.y = Math.random() * GAME_HEIGHT;
    particle.vx = (Math.random() - 0.5) * 0.2;
    particle.vy = (Math.random() - 0.5) * 0.2;
    particle.alpha = Math.random() * 0.3 + 0.1;
    
    particles.push(particle);
    app.stage.addChild(particle);
}

function onTargetClick(event) {
    if (gameState !== 'ready') return;
    
    selectedTarget = event.target;
    targetAimPos.x = selectedTarget.goalX;
    targetAimPos.y = selectedTarget.goalY;
    
    // Highlight selected target
    goalTargets.forEach(target => {
        target.clear();
        if (target === selectedTarget) {
            target.beginFill(0x00ff00, 0.5);
            target.lineStyle(3, 0x00ff00, 1);
            target.drawCircle(0, 0, 25);
            target.endFill();
            target.beginFill(0xff0000, 0.8);
            target.drawCircle(0, 0, 8);
            target.endFill();
        } else {
            target.beginFill(0xffff00, 0.3);
            target.lineStyle(3, 0xffff00, 0.8);
            target.drawCircle(0, 0, 25);
            target.endFill();
            target.beginFill(0xff0000, 0.5);
            target.drawCircle(0, 0, 8);
            target.endFill();
        }
    });
    
    // Start aiming mode
    gameState = 'aiming';
    isCharging = true;
    powerLevel = 0;
    powerMeter.classList.remove('hidden');
    
    // Show aiming line
    drawAimingLine();
}

function onTargetHover(event) {
    if (gameState !== 'ready') return;
    
    const target = event.target;
    target.clear();
    target.beginFill(0x00ff00, 0.5);
    target.lineStyle(3, 0x00ff00, 0.8);
    target.drawCircle(0, 0, 28);
    target.endFill();
    target.beginFill(0xff0000, 0.7);
    target.drawCircle(0, 0, 10);
    target.endFill();
}

function onTargetOut(event) {
    if (gameState !== 'ready') return;
    
    const target = event.target;
    if (target !== selectedTarget) {
        target.clear();
        target.beginFill(0xffff00, 0.3);
        target.lineStyle(3, 0xffff00, 0.8);
        target.drawCircle(0, 0, 25);
        target.endFill();
        target.beginFill(0xff0000, 0.5);
        target.drawCircle(0, 0, 8);
        target.endFill();
    }
}

function resetBallPosition() {
    ball.x = GAME_WIDTH / 2;
    ball.y = GAME_HEIGHT - 80;
    ball.vx = 0;
    ball.vy = 0;
    ball.gravity = 0;
    ball.curveX = 0;
    ball.curveY = 0;
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
    if (gameState !== 'aiming') return;
    
    const rect = app.view.getBoundingClientRect();
    startMousePos.x = event.clientX - rect.left;
    startMousePos.y = event.clientY - rect.top;
    currentMousePos.x = startMousePos.x;
    currentMousePos.y = startMousePos.y;
    
    isAiming = true;
    curveBall.visible = true;
    curveAmount.x = 0;
    curveAmount.y = 0;
    
    drawAimingLine();
}

function onMouseMove(event) {
    if (!isAiming || gameState !== 'aiming') return;
    
    const rect = app.view.getBoundingClientRect();
    currentMousePos.x = event.clientX - rect.left;
    currentMousePos.y = event.clientY - rect.top;
    
    // Calculate curve based on mouse position relative to ball
    const maxRadius = 40;
    const dx = currentMousePos.x - ball.x;
    const dy = currentMousePos.y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= maxRadius) {
        curveAmount.x = dx / maxRadius;
        curveAmount.y = dy / maxRadius;
    } else {
        curveAmount.x = (dx / distance) * (maxRadius / maxRadius);
        curveAmount.y = (dy / distance) * (maxRadius / maxRadius);
    }
    
    // Update curve ball position
    curveBall.x = ball.x + curveAmount.x * maxRadius;
    curveBall.y = ball.y + curveAmount.y * maxRadius;
    
    drawAimingLine();
}

function onMouseUp(event) {
    if (!isAiming || gameState !== 'aiming') return;
    
    isCharging = false;
    isAiming = false;
    powerMeter.classList.add('hidden');
    
    // Hide aiming elements
    curveBall.visible = false;
    aimingCircle.clear();
    aimingLine.clear();
    
    if (powerLevel > 10) {
        shootBall();
    } else {
        gameState = 'ready';
        // Reset target selection
        selectedTarget = null;
        goalTargets.forEach(target => {
            target.clear();
            target.beginFill(0xffff00, 0.3);
            target.lineStyle(3, 0xffff00, 0.8);
            target.drawCircle(0, 0, 25);
            target.endFill();
            target.beginFill(0xff0000, 0.5);
            target.drawCircle(0, 0, 8);
            target.endFill();
        });
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

function drawAimingLine() {
    aimingLine.clear();
    aimingCircle.clear();
    
    if (gameState !== 'aiming') return;
    
    // Draw line from ball to target
    aimingLine.lineStyle(3, 0x00ffff, 0.8);
    aimingLine.moveTo(ball.x, ball.y);
    aimingLine.lineTo(targetAimPos.x, targetAimPos.y);
    
    // Draw power indicator circle around ball
    const powerRadius = Math.min(powerLevel * 0.5, 50);
    aimingLine.lineStyle(2, 0xffff00, 0.6);
    aimingLine.drawCircle(ball.x, ball.y, powerRadius);
    
    // Draw aiming circle at ball position if in aiming mode
    if (isAiming) {
        aimingCircle.lineStyle(3, 0xffffff, 0.8);
        aimingCircle.drawCircle(ball.x, ball.y, 40);
        
        // Draw curve indicator
        if (Math.abs(curveAmount.x) > 0.1 || Math.abs(curveAmount.y) > 0.1) {
            const curveStrength = Math.sqrt(curveAmount.x * curveAmount.x + curveAmount.y * curveAmount.y);
            const curveColor = curveStrength > 0.5 ? 0xff4444 : 0x44ff44;
            aimingCircle.lineStyle(2, curveColor, 0.8);
            aimingCircle.drawCircle(ball.x, ball.y, 45);
        }
    }
}

function shootBall() {
    gameState = 'shooting';
    aimingLine.clear();
    aimingCircle.clear();
    
    // Calculate direction to target
    const dx = targetAimPos.x - ball.x;
    const dy = targetAimPos.y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate ball velocity based on power and direction
    const power = Math.min(powerLevel / MAX_POWER, 1);
    const baseSpeed = 12 + power * 8;
    
    // Calculate trajectory to target
    ball.vx = (dx / distance) * baseSpeed;
    ball.vy = (dy / distance) * baseSpeed;
    
    // Apply curve based on curve ball position
    ball.curveX = curveAmount.x * 0.3;
    ball.curveY = curveAmount.y * 0.2;
    ball.gravity = 0.1;
    
    // Move goalkeeper
    moveGoalkeeper();
    
    // Add shooting effects
    createShootEffect();
    
    // Reset target selection
    selectedTarget = null;
    goalTargets.forEach(target => {
        target.clear();
        target.beginFill(0xffff00, 0.3);
        target.lineStyle(3, 0xffff00, 0.8);
        target.drawCircle(0, 0, 25);
        target.endFill();
        target.beginFill(0xff0000, 0.5);
        target.drawCircle(0, 0, 8);
        target.endFill();
    });
}

function moveGoalkeeper() {
    // AI: goalkeeper moves towards predicted ball position
    const predictedX = ball.x + ball.vx * 10;
    const goalCenterX = GAME_WIDTH / 2;
    const maxMoveDistance = GOAL_WIDTH / 2 - 40;
    
    let targetX = goalCenterX + Math.max(-maxMoveDistance, Math.min(maxMoveDistance, predictedX - goalCenterX));
    
    // Add some randomness to make it not perfect
    const randomOffset = (Math.random() - 0.5) * 30;
    goalkeeper.targetX = targetX + randomOffset;
    
    // Set animation speed
    goalkeeper.moveSpeed = 4 + Math.random() * 2;
}

function createShootEffect() {
    // Create particle burst at ball position
    for (let i = 0; i < 15; i++) {
        const particle = new PIXI.Graphics();
        particle.beginFill(0xffffff, 0.8);
        particle.drawCircle(0, 0, 3);
        particle.endFill();
        
        particle.x = ball.x;
        particle.y = ball.y;
        particle.vx = (Math.random() - 0.5) * 8;
        particle.vy = (Math.random() - 0.5) * 8;
        particle.life = 40;
        particle.maxLife = 40;
        
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
    if (isCharging && gameState === 'aiming') {
        powerLevel += POWER_CHARGE_SPEED;
        if (powerLevel >= MAX_POWER) {
            powerLevel = MAX_POWER;
        }
        
        const percentage = (powerLevel / MAX_POWER) * 100;
        powerFill.style.width = percentage + '%';
        
        // Redraw aiming line to update power indicator
        drawAimingLine();
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
    ball.vx += ball.curveX;
    ball.vy += ball.curveY;
    
    // Air resistance
    ball.vx *= 0.995;
    ball.vy *= 0.995;
    
    // Add trail effect
    ballTrail.push({ x: ball.x, y: ball.y, alpha: 1 });
    if (ballTrail.length > 8) {
        ballTrail.shift();
    }
    
    // Draw trail
    const trailGraphics = new PIXI.Graphics();
    for (let i = 0; i < ballTrail.length; i++) {
        const trail = ballTrail[i];
        const alpha = (i / ballTrail.length) * 0.6;
        trailGraphics.beginFill(0xffffff, alpha);
        trailGraphics.drawCircle(trail.x, trail.y, BALL_RADIUS * (i / ballTrail.length));
        trailGraphics.endFill();
    }
    
    // Remove old trail
    const oldTrail = app.stage.getChildByName('ballTrail');
    if (oldTrail) {
        app.stage.removeChild(oldTrail);
    }
    
    trailGraphics.name = 'ballTrail';
    app.stage.addChildAt(trailGraphics, 2);
}

function updateGoalkeeper() {
    if (goalkeeper.targetX !== undefined) {
        const dx = goalkeeper.targetX - goalkeeper.x;
        if (Math.abs(dx) > 3) {
            goalkeeper.x += Math.sign(dx) * goalkeeper.moveSpeed;
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
            // Atmosphere particles
            if (particle.x < 0 || particle.x > GAME_WIDTH) particle.vx *= -1;
            if (particle.y < 0 || particle.y > GAME_HEIGHT) particle.vy *= -1;
        }
    });
}

function checkCollisions() {
    if (gameState !== 'shooting') return;
    
    // Check if ball goes out of bounds
    if (ball.x < -50 || ball.x > GAME_WIDTH + 50 || ball.y > GAME_HEIGHT + 50) {
        miss();
        return;
    }
    
    // Check goal collision (3D goal area)
    const goalLeft = GAME_WIDTH / 2 - GOAL_WIDTH / 2;
    const goalRight = GAME_WIDTH / 2 + GOAL_WIDTH / 2;
    const goalTop = GAME_HEIGHT / 2 + 28;
    const goalBottom = GAME_HEIGHT / 2 + 28 + GOAL_HEIGHT - 8;
    
    if (ball.x >= goalLeft && ball.x <= goalRight && ball.y >= goalTop && ball.y <= goalBottom) {
        // Check if goalkeeper saves it
        const distanceToGoalkeeper = Math.sqrt(
            Math.pow(ball.x - goalkeeper.x, 2) + Math.pow(ball.y - goalkeeper.y, 2)
        );
        
        if (distanceToGoalkeeper < 35) {
            save();
        } else {
            score();
        }
        return;
    }
    
    // Check if ball passes behind the goal (missed)
    if (ball.y < GAME_HEIGHT / 2 + 20) {
        miss();
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
        particle.beginFill(0xffd700, 0.8);
        particle.drawCircle(0, 0, 4);
        particle.endFill();
        
        particle.x = targetAimPos.x;
        particle.y = targetAimPos.y;
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
    
    // Reset for next round
    gameState = 'ready';
    resetBallPosition();
    powerLevel = 0;
    
    // Reset goalkeeper position
    goalkeeper.x = GAME_WIDTH / 2;
    goalkeeper.targetX = undefined;
    
    updateUI();
}

function endGame() {
    gameState = 'gameOver';
    // Game over logic here
    alert(`Game Over! Final Score: ${playerScore}/${maxRounds}`);
    
    // Reset game
    playerScore = 0;
    robotScore = 0;
    currentRound = 1;
    gameState = 'ready';
    resetBallPosition();
    updateUI();
}

function updateUI() {
    // Update score display
    const playerScoreElement = document.getElementById('player-score');
    const roundDisplayElement = document.getElementById('round-display');
    
    if (playerScoreElement) {
        playerScoreElement.textContent = playerScore;
    }
    
    if (roundDisplayElement) {
        roundDisplayElement.textContent = `${currentRound}/${maxRounds}`;
    }
}

function shootBall() {
    gameState = 'shooting';
    aimingLine.clear();
    
    // Calculate direction to target
    const dx = targetAimPos.x - ball.x;
    const dy = targetAimPos.y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate ball velocity based on power and direction
    const power = Math.min(powerLevel / MAX_POWER, 1);
    const baseSpeed = 8 + power * 12;
    
    // For new perspective: shoot upward toward goal
    ball.vx = (dx / distance) * baseSpeed * 0.5; // Horizontal component (left/right)
    ball.vy = -(baseSpeed + power * 8); // Vertical component (always upward)
    
    // Apply curve based on curve ball position (Magnus effect)
    ball.curveX = curveAmount.x * 0.4; // Horizontal curve
    ball.curveY = curveAmount.y * 0.2; // Vertical curve
    ball.gravity = 0.15;
    
    // Move goalkeeper
    moveGoalkeeper();
    
    // Add shooting sound effect (visual feedback)
    createShootEffect();
}

function moveGoalkeeper() {
    // Simple AI: goalkeeper moves towards predicted ball position
    const predictedX = ball.x + ball.vx * 20;
    const targetX = Math.max(goalLeft + 30, Math.min(goalRight - 30, predictedX));
    
    // Random factor to make it not perfect
    const randomOffset = (Math.random() - 0.5) * 60;
    goalkeeper.targetX = targetX + randomOffset;
    
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
    ball.vx += ball.curveX;
    ball.vy += ball.curveY;
    
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
    if (goalkeeper.targetX !== undefined) {
        const dx = goalkeeper.targetX - goalkeeper.x;
        if (Math.abs(dx) > 2) {
            goalkeeper.x += Math.sign(dx) * goalkeeper.moveSpeed;
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
    if (ball.x < -50 || ball.x > GAME_WIDTH + 50 || ball.y > GAME_HEIGHT + 50) {
        miss();
        return;
    }
    
    // Check goal collision
    if (ball.x >= goalLeft && ball.x <= goalRight && ball.y >= goalTop && ball.y <= goalBottom) {
        // Check if goalkeeper saves it
        const distanceToGoalkeeper = Math.sqrt(
            Math.pow(ball.x - goalkeeper.x, 2) + Math.pow(ball.y - goalkeeper.y, 2)
        );
        
        if (distanceToGoalkeeper < 40) {
            save();
        } else {
            score();
        }
    }
    
    // Check if ball passes the goal line (missed)
    if (ball.y < 0) {
        miss();
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