<<<<<<< HEAD
# 🚀 Futuristic Penalty Shootout Game

A thrilling penalty shootout game built with [PixiJS](https://pixijs.com/) featuring a futuristic cyberpunk theme, advanced ball physics, and challenging robot goalkeeper AI.

## 🎮 How to Play

### Game Controls
1. **Hold Mouse Down**: Start charging your shot power
2. **Drag Mouse**: Aim your shot - drag in curved patterns to add spin/curve
3. **Release Mouse**: Shoot the ball (power depends on how long you held down)

### Game Mechanics
- **Power System**: The longer you hold, the more powerful your shot
- **Advanced Curve Detection**: Drag your mouse in circular patterns to add realistic spin/curve to the ball
- **Magnus Effect**: Ball physics simulate real curve based on your drag pattern
- **Robot Goalkeeper**: An AI-powered robot goalkeeper that tries to save your shots
- **Scoring**: Best of 5 rounds - beat the robot to win!

## 🎯 Features

### Visual Effects
- **Futuristic Theme**: Cyberpunk-inspired design with neon colors and glowing effects
- **Particle Systems**: Ball trails, shooting effects, and celebration particles
- **Glow Effects**: Dynamic lighting on the ball and goalkeeper
- **Animated UI**: Smooth power meter and score display

### Gameplay Features
- **Realistic Physics**: Ball physics with gravity, air resistance, and curve
- **Smart AI**: Robot goalkeeper with predictive movement and reaction time
- **Progressive Difficulty**: Goalkeeper gets better as the game progresses
- **Mobile Support**: Touch controls for mobile devices

### Technical Features
- **Built with PixiJS**: High-performance 2D WebGL rendering
- **Responsive Design**: Works on desktop and mobile
- **Smooth Animations**: 60 FPS gameplay with optimized performance

## 🚀 How to Run

### Option 1: Direct File Opening
1. Download all files (`index.html`, `style.css`, `game.js`)
2. Open `index.html` in your web browser
3. Start playing!

### Option 2: Local Server (Recommended)
If you have Python installed:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -SimpleHTTPServer 8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Live Server (VS Code)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## 🎨 Game Theme

The game features a futuristic cyberpunk aesthetic with:
- **Neon Blue/Cyan**: Primary UI color (`#00ffff`)
- **Dark Gradient Background**: Space-like atmosphere
- **Orbitron Font**: Futuristic typography
- **Glowing Effects**: Dynamic lighting and particle systems
- **Robot Design**: Metallic goalkeeper with glowing red eyes

## 🎯 Game Rules

1. **5 Rounds**: Each game consists of 5 penalty shots
2. **Player vs Robot**: You shoot, robot tries to save
3. **Scoring**: 1 point for each goal scored
4. **Robot's Turn**: Robot automatically takes shots between rounds
5. **Winner**: Highest score after 5 rounds wins

## 🔧 Technical Requirements

- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge
- **WebGL Support**: Required for PixiJS rendering
- **Internet Connection**: For loading Google Fonts and PixiJS CDN

## 🎪 Game States

- **Ready**: Waiting for player input
- **Charging**: Player is holding mouse down to charge power
- **Shooting**: Ball is in motion
- **Scored**: Goal was scored
- **Missed**: Shot missed the goal
- **Saved**: Goalkeeper saved the shot

## 🌟 Tips for Success

1. **Power Control**: Don't always use maximum power - sometimes precision beats power
2. **Curve Shots**: Draw circular patterns while dragging to add spin - red ring = right curve, green ring = left curve
3. **Corner Shots**: Aim for the corners where the goalkeeper has less reach
4. **Timing**: Release at the right moment for optimal power
5. **Magnus Effect**: Curved drag patterns create realistic ball spin that affects trajectory
6. **Practice**: The goalkeeper AI learns, so mix up your strategy!

## 📱 Mobile Support

The game includes full touch support for mobile devices:
- Touch and hold to charge power
- Drag to aim and add curve
- Release to shoot

---

**Built with ❤️ using PixiJS**

Enjoy your futuristic penalty shootout experience! 🚀⚽ 

<!-- Load PixiJS v7.2.4 from jsDelivr CDN -->
<script src="https://cdn.jsdelivr.net/npm/pixi.js@7.2.4/dist/pixi.min.js"></script>
<script>
  console.log('PIXI global in HTML:', typeof PIXI);
</script>
<script src="game.js"></script> 
=======
 
>>>>>>> 6abc2af (Initial commit with workflow and all game files)
