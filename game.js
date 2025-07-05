// Initialize game when page loads
window.addEventListener('load', init);

// Backup initialization if load event already passed
if (document.readyState === 'complete') {
    init();
}

// Game constants
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 700;
const GOAL_WIDTH = 500;
const GOAL_HEIGHT = 200;
const BALL_RADIUS = 15;
const GOALKEEPER_WIDTH = 60;
const GOALKEEPER_HEIGHT = 100;
const POWER_CHARGE_SPEED = 2;
const MAX_POWER = 100;

// Goal area boundaries for clicking anywhere - positioned higher for first-person view
const GOAL_AREA = {
    left: GAME_WIDTH / 2 - GOAL_WIDTH / 2,
    right: GAME_WIDTH / 2 + GOAL_WIDTH / 2,
    top: 150,
    bottom: 150 + GOAL_HEIGHT
};


// Game state
let app;
let gameState = 'aiming'; // 'aiming', 'shooting', 'scored', 'missed'
let playerScore = 0;
let robotScore = 0;
let currentRound = 1;
let maxRounds = 5;

// Game objects
let ball;
let goalkeeper;
let goalkeepersprite;
let ballSprite;
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
    try {
        console.log('Initializing game...');
        
        // Check if PIXI is available
        if (typeof PIXI === 'undefined') {
            console.error('PIXI is not loaded');
            return;
        }
        
        // Create PixiJS application
        app = new PIXI.Application({
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            backgroundColor: 0x32cd32, // Bright green to ensure visibility
            antialias: true
        });
        console.log('PIXI app created with size:', app.screen.width, 'x', app.screen.height);

        // Add canvas to DOM
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            console.log('Original canvas:', canvas, 'size:', canvas.width, 'x', canvas.height);
            canvas.replaceWith(app.view);
            app.view.id = 'game-canvas';
            console.log('Canvas replaced successfully');
            console.log('New canvas:', app.view, 'size:', app.view.width, 'x', app.view.height);
            console.log('Canvas style:', app.view.style.cssText);
            
            // Ensure canvas is visible
            app.view.style.display = 'block';
            app.view.style.visibility = 'visible';
            app.view.style.opacity = '1';
            console.log('Canvas visibility ensured');
        } else {
            console.error('Canvas element not found');
            document.body.appendChild(app.view);
        }

        // Get UI elements - with error checking
        powerMeter = document.getElementById('power-meter-container');
        powerFill = document.getElementById('power-fill');
        
        if (!powerMeter || !powerFill) {
            console.log('Warning: UI elements not found');
        }

        // Create a simple test to make sure PIXI is working
        const testGraphics = new PIXI.Graphics();
        testGraphics.beginFill(0xff0000); // Bright red
        testGraphics.drawRect(50, 50, 300, 200);
        testGraphics.endFill();
        
        // Add white border
        testGraphics.lineStyle(5, 0xffffff);
        testGraphics.drawRect(50, 50, 300, 200);
        
        app.stage.addChild(testGraphics);
        console.log('Test graphics added with bounds:', testGraphics.getBounds());
        
        // Force a render
        app.renderer.render(app.stage);
        console.log('Forced render completed');

        // Create game scene
        try {
            createScene();
            console.log('Scene created');
        } catch (sceneError) {
            console.error('Scene creation failed:', sceneError);
            // Create a simple fallback scene
            const fallbackText = new PIXI.Text('Game Loading...', {
                fontFamily: 'Arial',
                fontSize: 36,
                fill: 0xffffff
            });
            fallbackText.x = GAME_WIDTH / 2 - fallbackText.width / 2;
            fallbackText.y = GAME_HEIGHT / 2 - fallbackText.height / 2;
            app.stage.addChild(fallbackText);
            console.log('Fallback scene created');
        }
        
        // Setup event listeners
        setupEventListeners();
        console.log('Event listeners setup');
        
        // Start game loop
        app.ticker.add(gameLoop);
        console.log('Game loop started');
        
        // Update initial UI after a delay to ensure DOM is ready
        setTimeout(() => {
            updateUI();
        }, 500);
        
        console.log('Game initialized successfully');
        
        // Remove test graphics after 2 seconds
        setTimeout(() => {
            if (testGraphics.parent) {
                app.stage.removeChild(testGraphics);
                console.log('Test graphics removed');
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}

function createScene() {
    try {
        console.log('Creating scene...');
        
        // Create stadium background with first-person perspective
        createFirstPersonStadium();
        console.log('Stadium created');
        
        // Create first-person goal
        createFirstPersonGoal();
        console.log('Goal created');
        
        // Create realistic ball
        createRealisticBall();
        console.log('Ball created');
        
        // Create realistic goalkeeper sprite
        createGoalkeeperSprite();
        console.log('Goalkeeper created');
        
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
        console.log('Aiming elements created');
        
        // Add stadium atmosphere
        addStadiumEffects();
        console.log('Stadium effects added');
        
        console.log('Scene creation completed, stage children:', app.stage.children.length);
        
        // Force render after scene creation
        app.renderer.render(app.stage);
        console.log('Scene rendered');
        
    } catch (error) {
        console.error('Error creating scene:', error);
    }
}

function createFirstPersonStadium() {
    console.log('Creating first-person stadium with dimensions:', GAME_WIDTH, 'x', GAME_HEIGHT);
    
    // Sky background
    const sky = new PIXI.Graphics();
    sky.beginFill(0x87ceeb);
    sky.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.4);
    sky.endFill();
    app.stage.addChild(sky);
    
    // Stadium stands behind goal
    const stands = new PIXI.Graphics();
    stands.beginFill(0x444444);
    stands.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.4);
    stands.endFill();
    
    // Add crowd texture
    for (let i = 0; i < 200; i++) {
        const person = new PIXI.Graphics();
        const colors = [0x333333, 0x555555, 0x777777, 0x2c5530, 0x8b0000];
        person.beginFill(colors[Math.floor(Math.random() * colors.length)]);
        person.drawRect(0, 0, 2, 4);
        person.endFill();
        person.x = Math.random() * GAME_WIDTH;
        person.y = Math.random() * (GAME_HEIGHT * 0.4);
        stands.addChild(person);
    }
    app.stage.addChild(stands);
    
    // Grass field - realistic green
    const field = new PIXI.Graphics();
    field.beginFill(0x228b22);
    field.drawRect(0, GAME_HEIGHT * 0.4, GAME_WIDTH, GAME_HEIGHT * 0.6);
    field.endFill();
    
    // Add grass texture
    for (let i = 0; i < 100; i++) {
        const grass = new PIXI.Graphics();
        grass.beginFill(0x32cd32, 0.3);
        grass.drawRect(0, 0, Math.random() * 20 + 5, 2);
        grass.endFill();
        grass.x = Math.random() * GAME_WIDTH;
        grass.y = GAME_HEIGHT * 0.4 + Math.random() * (GAME_HEIGHT * 0.6);
        grass.rotation = Math.random() * Math.PI / 4;
        field.addChild(grass);
    }
    
    // Field markings
    field.lineStyle(4, 0xffffff, 0.9);
    
    // Goal area box (18-yard box)
    const boxWidth = 350;
    const boxHeight = 120;
    field.drawRect(GAME_WIDTH / 2 - boxWidth / 2, GOAL_AREA.top + GOAL_HEIGHT - 10, boxWidth, boxHeight);
    
    // Penalty spot
    field.beginFill(0xffffff);
    field.drawCircle(GAME_WIDTH / 2, GAME_HEIGHT - 70, 4);
    field.endFill();
    
    app.stage.addChild(field);
}

function createFirstPersonGoal() {
    const goal = new PIXI.Container();
    
    // Goal posts - larger and more prominent
    const frame = new PIXI.Graphics();
    
    // Left post with depth
    frame.beginFill(0xffffff);
    frame.drawRect(GOAL_AREA.left - 10, GOAL_AREA.top, 15, GOAL_HEIGHT);
    frame.endFill();
    
    // Right post with depth  
    frame.beginFill(0xffffff);
    frame.drawRect(GOAL_AREA.right - 5, GOAL_AREA.top, 15, GOAL_HEIGHT);
    frame.endFill();
    
    // Crossbar
    frame.beginFill(0xffffff);
    frame.drawRect(GOAL_AREA.left - 10, GOAL_AREA.top - 5, GOAL_WIDTH + 25, 15);
    frame.endFill();
    
    // Goal net - more detailed
    const net = new PIXI.Graphics();
    net.lineStyle(2, 0xffffff, 0.6);
    
    // Create realistic net pattern
    const netSpacing = 25;
    for (let x = GOAL_AREA.left; x <= GOAL_AREA.right; x += netSpacing) {
        for (let y = GOAL_AREA.top; y <= GOAL_AREA.bottom; y += netSpacing) {
            // Vertical lines
            net.moveTo(x, GOAL_AREA.top);
            net.lineTo(x, GOAL_AREA.bottom);
            // Horizontal lines
            net.moveTo(GOAL_AREA.left, y);
            net.lineTo(GOAL_AREA.right, y);
        }
    }
    
    // Goal mouth shadow/depth
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.3);
    shadow.drawRect(GOAL_AREA.left, GOAL_AREA.top, GOAL_WIDTH, GOAL_HEIGHT);
    shadow.endFill();
    
    goal.addChild(shadow);
    goal.addChild(net);
    goal.addChild(frame);
    
    // Make goal clickable for shooting anywhere
    const clickArea = new PIXI.Graphics();
    clickArea.beginFill(0x000000, 0); // Invisible but interactive
    clickArea.drawRect(GOAL_AREA.left, GOAL_AREA.top, GOAL_WIDTH, GOAL_HEIGHT);
    clickArea.endFill();
    clickArea.interactive = true;
    clickArea.buttonMode = true;
    clickArea.on('pointerdown', onGoalClick);
    
    // Debug: Add visible boundary for goal area (remove this later)
    const debugBorder = new PIXI.Graphics();
    debugBorder.lineStyle(2, 0xff00ff, 0.5); // Magenta border for debugging
    debugBorder.drawRect(GOAL_AREA.left, GOAL_AREA.top, GOAL_WIDTH, GOAL_HEIGHT);
    
    goal.addChild(clickArea);
    goal.addChild(debugBorder);
    app.stage.addChild(goal);
}

// Click handler for goal area - allows clicking anywhere in the goal
function onGoalClick(event) {
    if (gameState !== 'aiming') return;
    
    const clickPos = event.data.getLocalPosition(app.stage);
    console.log('Goal clicked at:', clickPos.x, clickPos.y);
    
    // Set target position based on where user clicked
    targetAimPos.x = clickPos.x;
    targetAimPos.y = clickPos.y;
    
    // Start aiming mode
    isAiming = true;
    startMousePos.x = clickPos.x;
    startMousePos.y = clickPos.y;
    
    // Create aiming circle
    if (aimingCircle) {
        app.stage.removeChild(aimingCircle);
    }
    
    aimingCircle = new PIXI.Graphics();
    aimingCircle.lineStyle(3, 0x00ff00, 0.8);
    aimingCircle.drawCircle(0, 0, 50);
    aimingCircle.x = ball.x;
    aimingCircle.y = ball.y;
    app.stage.addChild(aimingCircle);
    
    // Create curve ball
    if (curveBall) {
        app.stage.removeChild(curveBall);
    }
    
    curveBall = new PIXI.Graphics();
    curveBall.beginFill(0xffff00);
    curveBall.drawCircle(0, 0, 8);
    curveBall.endFill();
    curveBall.x = ball.x;
    curveBall.y = ball.y;
    app.stage.addChild(curveBall);
    
    // Start power charging
    isCharging = true;
    powerLevel = 0;
    
    console.log('Aiming mode started, target at:', targetAimPos);
}

function createRealisticBall() {
    // Create a more detailed soccer ball
    ball = new PIXI.Graphics();
    
    // Main white ball
    ball.beginFill(0xffffff);
    ball.drawCircle(0, 0, BALL_RADIUS);
    ball.endFill();
    
    // Black outer circle
    ball.lineStyle(2, 0x000000, 1);
    ball.drawCircle(0, 0, BALL_RADIUS);
    
    // Traditional soccer ball pentagons and hexagons pattern
    ball.beginFill(0x000000);
    
    // Central pentagon
    for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const x = Math.cos(angle) * 5;
        const y = Math.sin(angle) * 5;
        if (i === 0) ball.moveTo(x, y);
        else ball.lineTo(x, y);
    }
    ball.closePath();
    ball.endFill();
    
    // Add curved lines for 3D effect
    ball.lineStyle(1, 0x000000, 0.7);
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const startX = Math.cos(angle) * 8;
        const startY = Math.sin(angle) * 8;
        const endX = Math.cos(angle) * BALL_RADIUS;
        const endY = Math.sin(angle) * BALL_RADIUS;
        ball.moveTo(startX, startY);
        ball.lineTo(endX, endY);
    }
    
    // Add highlight for 3D effect
    const highlight = new PIXI.Graphics();
    highlight.beginFill(0xffffff, 0.3);
    highlight.drawCircle(-BALL_RADIUS * 0.3, -BALL_RADIUS * 0.3, BALL_RADIUS * 0.4);
    highlight.endFill();
    ball.addChild(highlight);
    
    resetBallPosition();
    app.stage.addChild(ball);
}

function createGoalkeeperSprite() {
    goalkeeper = new PIXI.Container();
    
    // Goalkeeper body - larger and more detailed
    const body = new PIXI.Graphics();
    body.beginFill(0x00a000); // Bright green jersey
    body.drawRoundedRect(-GOALKEEPER_WIDTH / 2, -GOALKEEPER_HEIGHT / 2, GOALKEEPER_WIDTH, GOALKEEPER_HEIGHT * 0.7, 8);
    body.endFill();
    
    // Add jersey details
    body.lineStyle(2, 0x006600);
    body.drawRoundedRect(-GOALKEEPER_WIDTH / 2, -GOALKEEPER_HEIGHT / 2, GOALKEEPER_WIDTH, GOALKEEPER_HEIGHT * 0.7, 8);
    
    // Jersey number
    const number = new PIXI.Text('1', {
        fontFamily: 'Arial Black',
        fontSize: 16,
        fill: 0xffffff,
        align: 'center'
    });
    number.x = -number.width / 2;
    number.y = -10;
    body.addChild(number);
    
    // Goalkeeper head with hair
    const head = new PIXI.Graphics();
    head.beginFill(0xfdbcb4); // Skin color
    head.drawCircle(0, -GOALKEEPER_HEIGHT / 2 - 20, 18);
    head.endFill();
    
    // Hair
    const hair = new PIXI.Graphics();
    hair.beginFill(0x8b4513);
    hair.drawCircle(0, -GOALKEEPER_HEIGHT / 2 - 25, 20);
    hair.endFill();
    
    // Eyes
    const leftEye = new PIXI.Graphics();
    leftEye.beginFill(0x000000);
    leftEye.drawCircle(-6, -GOALKEEPER_HEIGHT / 2 - 20, 2);
    leftEye.endFill();
    
    const rightEye = new PIXI.Graphics();
    rightEye.beginFill(0x000000);
    rightEye.drawCircle(6, -GOALKEEPER_HEIGHT / 2 - 20, 2);
    rightEye.endFill();
    
    // Goalkeeper gloves - larger and more prominent
    const leftGlove = new PIXI.Graphics();
    leftGlove.beginFill(0xffff00); // Yellow gloves
    leftGlove.drawCircle(-GOALKEEPER_WIDTH / 2 - 15, -20, 12);
    leftGlove.endFill();
    
    const rightGlove = new PIXI.Graphics();
    rightGlove.beginFill(0xffff00);
    rightGlove.drawCircle(GOALKEEPER_WIDTH / 2 + 15, -20, 12);
    rightGlove.endFill();
    
    // Arms
    const leftArm = new PIXI.Graphics();
    leftArm.beginFill(0x00a000);
    leftArm.drawRect(-GOALKEEPER_WIDTH / 2 - 8, -40, 15, 30);
    leftArm.endFill();
    
    const rightArm = new PIXI.Graphics();
    rightArm.beginFill(0x00a000);
    rightArm.drawRect(GOALKEEPER_WIDTH / 2 - 7, -40, 15, 30);
    rightArm.endFill();
    
    // Goalkeeper shorts
    const shorts = new PIXI.Graphics();
    shorts.beginFill(0x000000);
    shorts.drawRect(-GOALKEEPER_WIDTH / 2 + 5, GOALKEEPER_HEIGHT * 0.2, GOALKEEPER_WIDTH - 10, 25);
    shorts.endFill();
    
    // Legs with socks
    const leftLeg = new PIXI.Graphics();
    leftLeg.beginFill(0xfdbcb4);
    leftLeg.drawRect(-GOALKEEPER_WIDTH / 4 - 8, GOALKEEPER_HEIGHT * 0.45, 12, 25);
    leftLeg.endFill();
    leftLeg.beginFill(0x00a000); // Green socks
    leftLeg.drawRect(-GOALKEEPER_WIDTH / 4 - 8, GOALKEEPER_HEIGHT * 0.65, 12, 15);
    leftLeg.endFill();
    
    const rightLeg = new PIXI.Graphics();
    rightLeg.beginFill(0xfdbcb4);
    rightLeg.drawRect(GOALKEEPER_WIDTH / 4 - 4, GOALKEEPER_HEIGHT * 0.45, 12, 25);
    rightLeg.endFill();
    rightLeg.beginFill(0x00a000);
    rightLeg.drawRect(GOALKEEPER_WIDTH / 4 - 4, GOALKEEPER_HEIGHT * 0.65, 12, 15);
    rightLeg.endFill();
    
    goalkeeper.addChild(hair, head, leftEye, rightEye, body, leftArm, rightArm, leftGlove, rightGlove, shorts, leftLeg, rightLeg);
    goalkeeper.x = GAME_WIDTH / 2;
    goalkeeper.y = GOAL_AREA.top + GOAL_HEIGHT / 2;
    
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

// Target functions removed - now using click-anywhere system

function resetBallPosition() {
    ball.x = GAME_WIDTH / 2;
    ball.y = GAME_HEIGHT - 60; // Closer to bottom for first-person view
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
    // Scale mouse coordinates to match canvas resolution
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;
    
    console.log('Mouse click at:', mouseX, mouseY, 'Goal area:', GOAL_AREA);
    
    // Check if click is in goal area
    if (mouseX >= GOAL_AREA.left && mouseX <= GOAL_AREA.right && 
        mouseY >= GOAL_AREA.top && mouseY <= GOAL_AREA.bottom) {
        
        // Set target position where user clicked
        targetAimPos.x = mouseX;
        targetAimPos.y = mouseY;
        
        // Start aiming and charging
        isAiming = true;
        isCharging = true;
        powerLevel = 0;
        
        // Store initial click position for curve control circle center
        startMousePos.x = mouseX;
        startMousePos.y = mouseY;
        currentMousePos.x = mouseX;
        currentMousePos.y = mouseY;
        
        // Create aiming circle at click position (not ball position)
        if (aimingCircle) {
            app.stage.removeChild(aimingCircle);
        }
        
        aimingCircle = new PIXI.Graphics();
        aimingCircle.lineStyle(3, 0x00ff00, 0.8);
        aimingCircle.drawCircle(0, 0, 50); // Curve control circle
        aimingCircle.x = mouseX;
        aimingCircle.y = mouseY;
        app.stage.addChild(aimingCircle);
        
        // Create curve control ball
        if (curveBall) {
            app.stage.removeChild(curveBall);
        }
        
        curveBall = new PIXI.Graphics();
        curveBall.beginFill(0xffff00);
        curveBall.drawCircle(0, 0, 8);
        curveBall.endFill();
        curveBall.x = mouseX; // Start at click position
        curveBall.y = mouseY;
        app.stage.addChild(curveBall);
        
        curveAmount.x = 0;
        curveAmount.y = 0;
        
        // Show power meter
        const powerMeterContainer = document.getElementById('power-meter-container');
        if (powerMeterContainer) {
            powerMeterContainer.classList.remove('hidden');
        }
        
        console.log('Started aiming at goal position:', targetAimPos);
        console.log('Click detected in goal area. Goal boundaries:', GOAL_AREA);
        drawAimingLine();
    }
}

function onMouseMove(event) {
    if (!isAiming || gameState !== 'aiming') return;
    
    const rect = app.view.getBoundingClientRect();
    // Scale mouse coordinates to match canvas resolution
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    currentMousePos.x = (event.clientX - rect.left) * scaleX;
    currentMousePos.y = (event.clientY - rect.top) * scaleY;
    
    // Calculate curve based on mouse position relative to initial click position
    const maxRadius = 50;
    const dx = currentMousePos.x - startMousePos.x;
    const dy = currentMousePos.y - startMousePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Constrain movement to within the circle
    if (distance <= maxRadius) {
        curveAmount.x = dx / maxRadius;
        curveAmount.y = dy / maxRadius;
        
        // Update curve ball position
        if (curveBall) {
            curveBall.x = startMousePos.x + dx;
            curveBall.y = startMousePos.y + dy;
        }
    } else {
        // Constrain to circle edge
        const constrainedX = (dx / distance) * maxRadius;
        const constrainedY = (dy / distance) * maxRadius;
        
        curveAmount.x = constrainedX / maxRadius;
        curveAmount.y = constrainedY / maxRadius;
        
        if (curveBall) {
            curveBall.x = startMousePos.x + constrainedX;
            curveBall.y = startMousePos.y + constrainedY;
        }
    }
    
    // Update circle color based on curve strength
    const curveStrength = Math.sqrt(curveAmount.x * curveAmount.x + curveAmount.y * curveAmount.y);
    const circleColor = curveStrength > 0.5 ? 0xff4444 : 0x44ff44;
    
    if (aimingCircle) {
        aimingCircle.clear();
        aimingCircle.lineStyle(3, circleColor, 0.8);
        aimingCircle.drawCircle(0, 0, 50);
    }
    
    drawAimingLine();
}

function onMouseUp(event) {
    if (!isAiming || gameState !== 'aiming') return;
    
    isCharging = false;
    isAiming = false;
    
    // Hide power meter safely
    const powerMeterContainer = document.getElementById('power-meter-container');
    if (powerMeterContainer) {
        powerMeterContainer.classList.add('hidden');
    }
    
    // Clean up aiming elements
    if (curveBall) {
        app.stage.removeChild(curveBall);
        curveBall = null;
    }
    if (aimingCircle) {
        app.stage.removeChild(aimingCircle);
        aimingCircle = null;
    }
    if (aimingLine) {
        aimingLine.clear();
    }
    
    // Shoot if power is sufficient
    if (powerLevel > 15) {
        console.log('Shooting with power:', powerLevel, 'toward:', targetAimPos);
        shootBall();
    } else {
        console.log('Not enough power to shoot');
        gameState = 'aiming';
        // Reset for next attempt
        targetAimPos.x = 0;
        targetAimPos.y = 0;
        powerLevel = 0;
    }
}

// Touch events for mobile
function onTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const mockEvent = { 
        clientX: touch.clientX, 
        clientY: touch.clientY,
        preventDefault: () => {}
    };
    onMouseDown(mockEvent);
}

function onTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const mockEvent = { 
        clientX: touch.clientX, 
        clientY: touch.clientY,
        preventDefault: () => {}
    };
    onMouseMove(mockEvent);
}

function onTouchEnd(event) {
    event.preventDefault();
    onMouseUp(event);
}

function drawAimingLine() {
    if (aimingLine) aimingLine.clear();
    
    if (gameState !== 'aiming' || !isAiming) return;
    
    // Draw line from ball to target
    aimingLine.lineStyle(3, 0x00ffff, 0.8);
    aimingLine.moveTo(ball.x, ball.y);
    aimingLine.lineTo(targetAimPos.x, targetAimPos.y);
    
    // Draw power indicator as a growing line thickness
    const powerThickness = 2 + (powerLevel / MAX_POWER) * 8;
    aimingLine.lineStyle(powerThickness, 0xffff00, 0.6);
    aimingLine.moveTo(ball.x, ball.y);
    aimingLine.lineTo(targetAimPos.x, targetAimPos.y);
    
    // Draw target indicator at click position
    aimingLine.lineStyle(2, 0xff0000, 0.8);
    aimingLine.drawCircle(targetAimPos.x, targetAimPos.y, 10);
}

function shootBall() {
    gameState = 'shooting';
    if (aimingLine) aimingLine.clear();
    
    // Calculate direction to target
    const dx = targetAimPos.x - ball.x;
    const dy = targetAimPos.y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate ball velocity based on power and direction
    const power = Math.min(powerLevel / MAX_POWER, 1);
    const baseSpeed = 15 + power * 15; // Increased speed significantly
    
    // Calculate trajectory - ensure ball goes toward target
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    
    // For upward shots, reduce gravity effect by increasing initial velocity
    let speedMultiplier = 1;
    if (targetAimPos.y < ball.y) { // Shooting upward
        speedMultiplier = 1.5 + Math.abs(normalizedDy) * 0.8; // Extra boost for upward shots
    }
    
    const finalSpeed = baseSpeed * speedMultiplier;
    ball.vx = normalizedDx * finalSpeed;
    ball.vy = normalizedDy * finalSpeed;
    
    // Apply curve based on curve control
    ball.curveX = curveAmount.x * 0.15; // Horizontal curve
    ball.curveY = curveAmount.y * 0.1; // Vertical curve
    ball.gravity = 0.05; // Much reduced gravity for better trajectory
    
    // Move goalkeeper
    moveGoalkeeper();
    
    // Add shooting effects
    createShootEffect();
    
    console.log('Ball shot with velocity:', ball.vx, ball.vy, 'curve:', ball.curveX, ball.curveY);
    console.log('Target position:', targetAimPos, 'Ball position:', ball.x, ball.y);
    console.log('Direction vector:', normalizedDx, normalizedDy, 'Speed multiplier:', speedMultiplier);
    
    // Reset for next shot
    targetAimPos.x = 0;
    targetAimPos.y = 0;
    powerLevel = 0;
    curveAmount.x = 0;
    curveAmount.y = 0;
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
        
        // Update power fill safely
        const powerFill = document.getElementById('power-fill');
        if (powerFill) {
            const percentage = (powerLevel / MAX_POWER) * 100;
            powerFill.style.width = percentage + '%';
        }
        
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
    
    // Check if ball goes out of bounds (more generous bounds)
    if (ball.x < -100 || ball.x > GAME_WIDTH + 100 || ball.y > GAME_HEIGHT + 100) {
        miss();
        return;
    }
    
    // Check goal collision using new goal area constants
    if (ball.x >= GOAL_AREA.left && ball.x <= GOAL_AREA.right && 
        ball.y >= GOAL_AREA.top && ball.y <= GOAL_AREA.bottom) {
        // Check if goalkeeper saves it
        const distanceToGoalkeeper = Math.sqrt(
            Math.pow(ball.x - goalkeeper.x, 2) + Math.pow(ball.y - goalkeeper.y, 2)
        );
        
        if (distanceToGoalkeeper < 40) {
            save();
        } else {
            score();
        }
        return;
    }
    
    // Check if ball passes way behind the goal (missed) - more generous
    if (ball.y < 30) {
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
    
    // Clean up any remaining aiming elements
    if (curveBall) {
        app.stage.removeChild(curveBall);
        curveBall = null;
    }
    if (aimingCircle) {
        app.stage.removeChild(aimingCircle);
        aimingCircle = null;
    }
    if (aimingLine) {
        aimingLine.clear();
    }
    
    // Reset for next round
    gameState = 'aiming';
    resetBallPosition();
    powerLevel = 0;
    isAiming = false;
    isCharging = false;
    curveAmount.x = 0;
    curveAmount.y = 0;
    targetAimPos.x = 0;
    targetAimPos.y = 0;
    
    // Reset goalkeeper position
    goalkeeper.x = GAME_WIDTH / 2;
    goalkeeper.targetX = undefined;
    
    // Hide power meter
    const powerMeterContainer = document.getElementById('power-meter-container');
    if (powerMeterContainer) {
        powerMeterContainer.classList.add('hidden');
    }
    
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
    gameState = 'aiming';
    resetBallPosition();
    updateUI();
}

function updateUI() {
    // Only update UI if we're in a valid state
    if (typeof playerScore === 'undefined' || typeof currentRound === 'undefined' || typeof maxRounds === 'undefined') {
        return;
    }
    
    // Update score display - with complete error checking
    setTimeout(() => {
        try {
            const playerScoreElement = document.getElementById('player-score');
            const roundDisplayElement = document.getElementById('round-display');
            
            if (playerScoreElement) {
                playerScoreElement.textContent = String(playerScore);
            }
            
            if (roundDisplayElement) {
                roundDisplayElement.textContent = `${currentRound}/${maxRounds}`;
            }
        } catch (error) {
            // Silently handle UI errors - they're not critical to game function
        }
    }, 50);
}

// Duplicate functions removed

// Initialize game when page loads
window.addEventListener('load', init); 