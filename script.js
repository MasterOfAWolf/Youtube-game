// Simple Platformer V12
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const pixelToggle = document.getElementById("pixelToggle");
canvas.width = 800;
canvas.height = 400;
let pixelMode = false;

const TARGET_FPS = 60;
const FRAME_DURATION = 1000 / TARGET_FPS; // ~16.67ms per frame
let lastFrameTime = 0;
let deltaTime = 0;

const bgTile = new Image();
bgTile.src = "Assets/Tiles/Cobblestone BG.png";

const snailImg = new Image();
snailImg.src = "Assets/Sprites/snail-pixilart.png";

const playerImg = new Image();
playerImg.src = "Assets/Sprites/Player.png";

const snailFrames = [];

const snail1 = new Image();
snail1.src = "Assets/Sprites/Snail 1.png";

const snail2 = new Image();
snail2.src = "Assets/Sprites/Snail 2.png";

const snail3 = new Image();
snail3.src = "Assets/Sprites/Snail 3.png";

snailFrames.push(snail1, snail2, snail3, snail2);

const chairFrames = [];
for (let i = 0; i < 5; i++) {
  const img = new Image();
  img.src = `Assets/Sprites/pixil-frame-${i}.png`;
  chairFrames.push(img);
}

let wasOff = true; 
let lightingEnabled = true;
let lights = [];
let gameRunning = false;
let gamePaused = false;
let currentMap = 1;
let currentLevel = 1;
let lastTimestamp = 0;
let generatedTiles = [];
let enemies = [];
let walls = [];
let boxes = [];
let items = [];
let chairs = [];
let initialChairs = [];
let bats = [];
let ladders = [];
let spikes = [];
let bullets = [];
let timeElapsed = 0;
let gameLoopId = null;
let snowmen = [];
let ovens = [];
let potato = [];
let snowParticles = [];
let fireballs = [];
let icicles = [];
let yetis = [];
let snowballs = [];
let turrets = [];
let seesaws = [];
let potatoMessage = "";
let potatoMessageTimer = 0;
let potatoHUDLine = "";
let ambientLight = .67;

let cannonProjectiles = [];
let explosions = [];
let cannonAimAngle = 0;       // radians, updated every frame from mouse or joystick
let cannonCooldown = 0;       // prevents spray-firing
const CANNON_COOLDOWN_FRAMES = 18;

const attackBtn = document.getElementById("btnAttack");
// Joystick state (mobile aiming)
const joystick = {
  active: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  angle: 0,
  magnitude: 0
};

const potatoDeathLines = [
  "🥔 that was avoidable",
  "🥔 you dropped us",
  "🥔 again?",
  "🥔 gravity warned you",
  "🥔 I felt that",
  "🥔 unfortunate",
  "🥔 skill issue",
  "🥔 failure",
  "🥔 not lit",
  "🥔 do better",
  "🥔 death should not stop you",
  "🥔 ... ",
  "🥔 ?$@!%",
  "🥔 this is some rigidbody ahh gameplay",
  "🥔 we will pretend this did not happen"
];

const bakedPotatoDeathLines = [
  "🥔🔥 perfectly roasted… and dropped",
  "🥔🔥 crispy on the outside, dead inside",
  "🥔🔥 you burnt it",
  "🥔🔥 overcooked",
  "🥔🔥 we warned you",
  "🥔🔥 skill issue, but warmer",
  "🥔🔥 mashed by gravity",
  "🥔🔥 this is why we preheat"
];

let potatoState = "none";
// "none" | "raw" | "baked"

// === Level Initial State Storage ===
let initialBoxes = [];
let initialSnails = [];
let initialSuperSnails = [];
let initialWalls = [];
let initialSpikes = [];
let initialLadders = [];

const swordWidth = 70;  // new longer sword
const swordHeight = 10; // keep same height
const swordOffsetY = 8; // vertical offset from player

const MAP_WIDTH = 2800;
const MAP_HEIGHT = 2100;
const WALL_THICKNESS = 30;

// === MUSIC MODULE ===
const bgMusic = new Audio("Assets/Music/Dungeon%20Synth.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

function startMusic() {
  const toggle = document.getElementById("musicToggle");
  if (toggle && !toggle.checked) return;
  bgMusic.play().catch(() => {});
}

document.getElementById("musicToggle").addEventListener("change", function () {
  if (this.checked) {
    bgMusic.play().catch(() => {});
  } else {
    bgMusic.pause();
  }
});
// Map keys to buttons
const keyMap = {
  "ArrowLeft": "btnLeft",
  "a": "btnLeft",
  "ArrowRight": "btnRight",
  "d": "btnRight",
  "ArrowUp": "btnJump",
  "w": "btnJump",
  "r": "btnRestart",
  "Escape": "btnPause",
  "f": "btnAttack"
};

document.addEventListener("keydown", e => {
  const btnId = keyMap[e.key];
  if (btnId) {
    const btn = document.getElementById(btnId);
    btn.classList.add("pressed");
  }
});

document.addEventListener("keyup", e => {
  const btnId = keyMap[e.key];
  if (btnId) {
    const btn = document.getElementById(btnId);
    btn.classList.remove("pressed");
  }
});

// Get the toggle checkbox and touch controls container
const hideButtonsToggle = document.getElementById("hideButtonsToggle");
const touchControls = document.getElementById("touchControls");

// Listen for changes on the toggle
hideButtonsToggle.addEventListener("change", function() {
  if (this.checked) {
    // Hide buttons
    touchControls.style.display = "none";
  } else {
    // Show buttons
    touchControls.style.display = "flex"; // or "block" depending on your CSS
  }
});

// Optional: preserve setting across sessions using localStorage
if (localStorage.getItem("hideButtons") === "true") {
  hideButtonsToggle.checked = true;
  touchControls.style.display = "none";
}

hideButtonsToggle.addEventListener("change", function() {
  localStorage.setItem("hideButtons", this.checked);
});

let pixelScale = 1;

function applyPixelScale() {
  const wrapper = document.getElementById("game-wrapper");
  wrapper.style.transform = `scale(${pixelScale})`;
}

pixelToggle.addEventListener("change", () => {
  document.body.classList.toggle("pixelated", pixelToggle.checked);
  ctx.imageSmoothingEnabled = !pixelToggle.checked;
    pixelScale = enabled ? 3 : 1; // 👈 MAKE PIXELS BIGGER HERE
  applyPixelScale();
});

// === DEV MODE ===
let devMapView = false;
let mouse = {
  x: 0,
  y: 0,
  worldX: 0,
  worldY: 0
};

let devShowGrid = false;

let devScale = 1; // updated every draw

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function bindTouch(buttonId, key) {
  const btn = document.getElementById(buttonId);
  const TAP_WINDOW = 300; // ms between taps to count as double-tap
  let lastTap = 0;

  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    keys[key] = true;

    // Double-tap dash for left/right buttons
    if (key === "a" || key === "d") {
      const now = performance.now();
      if (now - lastTap < TAP_WINDOW) {
        player.facing = key === "d" ? 1 : -1;
        tryDash();
      }
      lastTap = now;
    }
  });
  btn.addEventListener("touchend", e => { e.preventDefault(); keys[key] = false; });
  btn.addEventListener("mousedown", () => {
    keys[key] = true;
    if (key === "a" || key === "d") {
      const now = performance.now();
      if (now - (btn._lastMouse || 0) < 300) {
        player.facing = key === "d" ? 1 : -1;
        tryDash();
      }
      btn._lastMouse = now;
    }
  });
  btn.addEventListener("mouseup", () => keys[key] = false);
  btn.addEventListener("mouseleave", () => keys[key] = false);
}
function pressAttack() {
  if (player.attackTimer <= 0 && player.attackCooldown <= 0 && !player.attackCharging) {
    keys["f"] = true;
    player.attackCharging = true;
    player.attackChargeTime = 0;
  }
}

function releaseAttack() {
  if (keys["f"]) {
    keys["f"] = false;

    // manually trigger keyup logic
    if (player.attackCharging) {
      player.attackCharging = false;
      player.attackTimer = player.attackDuration;
      player.attackCooldown = 20;
      player.attackKnockback =
        5 + 5 * Math.min(player.attackChargeTime / player.maxChargeTime, 1);
      player.attackHitObjects.clear();
    }
  }
}

attackBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  pressAttack();
});

attackBtn.addEventListener("touchend", e => {
  e.preventDefault();
  releaseAttack();
});

attackBtn.addEventListener("touchcancel", releaseAttack);

// Mouse support (CodePen desktop testing)
attackBtn.addEventListener("mousedown", pressAttack);
attackBtn.addEventListener("mouseup", releaseAttack);
attackBtn.addEventListener("mouseleave", releaseAttack);

document.getElementById("btnRestart").addEventListener("touchstart", e => {
  e.preventDefault();
  keys["r"] = true;
  hideCanvas();
  hideAllMenus();
  triggerGameOver();
  setTimeout(() => keys["r"] = false, 60);
});

document.getElementById("btnRestart").addEventListener("mousedown", () => {
  keys["r"] = true;
  setTimeout(() => keys["r"] = false, 60);
});


bindTouch("btnLeft", "a");
bindTouch("btnRight", "d");
bindTouch("btnJump", "w");
bindTouch("btnAttack", "f");

document.getElementById("btnPause").addEventListener("click", () => {
  togglePause();
});

// --- Mouse click to fire ---
canvas.addEventListener("mousedown", (e) => {
  if (!hasPotato || !gameRunning || gamePaused || gameOver) return;
  if (e.button === 0) firePotatoCannon();
});

// --- Inject mobile joystick into touchControls div ---
(function injectJoystick() {
  const joystickHTML = `
    <div id="potatoJoystickArea" style="
      display:none; 
      position:relative; 
      width:80px; 
      height:80px; 
      border-radius:50%; 
      background:rgba(255,255,255,0.15); 
      border:2px solid #ffd966; 
      touch-action:none; 
      flex-shrink:0;
    ">
      <div id="potatoJoystickKnob" style="
        position:absolute; 
        width:32px; 
        height:32px; 
        border-radius:50%; 
        background:#b58b4a; 
        border:2px solid #ffd966; 
        top:50%; 
        left:50%; 
        transform:translate(-50%,-50%); 
        pointer-events:none;
      "></div>
      <div style="position:absolute; bottom:-22px; left:50%; transform:translateX(-50%); font-size:10px; color:#ffd966; font-weight:bold; white-space:nowrap; pointer-events:none;">🥔 AIM</div>
    </div>`;

  const rightControls = document.querySelector(".right-controls");
  if (rightControls) {
    // Append it to the right-controls container
    rightControls.insertAdjacentHTML("beforeend", joystickHTML);
  }
  const zone = document.getElementById("potatoJoystickArea");
  const knob = document.getElementById("potatoJoystickKnob");
  if (!zone || !knob) return;

  let activeTouchId = null; // ← track which finger owns the joystick

  zone.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (activeTouchId !== null) return; // already tracking a finger
    const t = e.changedTouches[0];
    activeTouchId = t.identifier;
    joystick.active   = true;
    joystick.startX   = t.clientX;
    joystick.startY   = t.clientY;
    joystick.currentX = t.clientX;
    joystick.currentY = t.clientY;
  }, { passive: false });

  zone.addEventListener("touchmove", (e) => {
    e.preventDefault();
    // Only respond to the finger that started on this joystick
    let t = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        t = e.changedTouches[i];
        break;
      }
    }
    if (!t) return;

    joystick.currentX = t.clientX;
    joystick.currentY = t.clientY;

    const rect   = zone.getBoundingClientRect();
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const dx     = t.clientX - center.x;
    const dy     = t.clientY - center.y;
    const maxR   = 30;
    const dist   = Math.min(Math.hypot(dx, dy), maxR);
    const angle  = Math.atan2(dy, dx);

    joystick.angle     = angle;
    joystick.magnitude = dist / maxR;

    knob.style.left      = `calc(50% + ${Math.cos(angle) * dist}px)`;
    knob.style.top       = `calc(50% + ${Math.sin(angle) * dist}px)`;
    knob.style.transform = "none";
  }, { passive: false });

  function onJoystickRelease(e) {
    // Check if the released finger is the one we're tracking
    let found = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        found = true;
        break;
      }
    }
    if (!found) return; // a different finger lifted, ignore

    if (joystick.active && joystick.magnitude > 0.15) {
      cannonAimAngle = joystick.angle;
      firePotatoCannon();
    }
    activeTouchId      = null;
    joystick.active    = false;
    joystick.magnitude = 0;
    knob.style.left      = "50%";
    knob.style.top       = "50%";
    knob.style.transform = "translate(-50%, -50%)";
  }

  zone.addEventListener("touchend",    onJoystickRelease);
  zone.addEventListener("touchcancel", onJoystickRelease);
})();

// Show/hide joystick based on potato state (call this wherever state changes)
function syncJoystickVisibility() {
  const zone = document.getElementById("potatoJoystickArea");
  if (!zone) return;
  zone.style.display = hasPotato ? "flex" : "none";
}

const crtToggle = document.getElementById("crtToggle");

crtToggle.addEventListener("change", () => {
  document.body.classList.toggle("crt", crtToggle.checked);
});

function triggerVHSGlitch() {
  if (!document.body.classList.contains("crt")) return;

  document.body.classList.add("vhs");

  setTimeout(() => {
    document.body.classList.remove("vhs");
  }, 120 + Math.random() * 120);
}

// random VHS glitch every 6–14 seconds
setInterval(() => {
  if (Math.random() < 0.5) triggerVHSGlitch();
}, 6000 + Math.random() * 8000);

// Keep track of state outside the function


/*function updateLights() {
  const now = performance.now();
  const cycleTime = now % 10000;
  const isOn = cycleTime < 5000;

  if (isOn) {
    ambientLight = 0.68;
    
    // Only initialize once when the cycle first starts
    if (wasOff) {
      initializeLevelLights();
      wasOff = false;
    }

    for (let light of lights) {
      if (light.flickerSpeed > 0) {
        const flicker = Math.sin(now * light.flickerSpeed * 0.01) * light.flickerAmount;
        light.radius = light.baseRadius;
        
        const newIntensity = light.baseIntensity + (flicker * light.baseIntensity);
        light.intensity = Math.max(0.3, newIntensity);
      }
    }
  } else {
    // "Off" state
    wasOff = true; 
    ambientLight = 1;
    
    for (let light of lights) {
      light.intensity = 0;
      light.radius = 0;
    }
  }
}
*/

function updateLights() {
  const now = performance.now();
  const cycleDuration = 60000; // 10 seconds total
  const cycleTime = now % cycleDuration;
  
  // Define transition windows (e.g., 2 seconds for sunrise, 2 seconds for sunset)
  const sunriseDuration = 3000; 
  const sunsetDuration = 5000;
  const dayDuration = 35000; // Total time lights are "active" (including transitions)

  let transitionFactor = 0; // 0 = Midnight (Off), 1 = Noon (Full Intensity)

  if (cycleTime < dayDuration) {
    // We are in the "Daylight" half of the cycle
    if (cycleTime < sunriseDuration) {
      // Sunrise: Ramp up from 0 to 1
      transitionFactor = cycleTime / sunriseDuration;
    } else if (cycleTime > dayDuration - sunsetDuration) {
      // Sunset: Ramp down from 1 to 0
      transitionFactor = (dayDuration - cycleTime) / sunsetDuration;
    } else {
      // Full Day
      transitionFactor = 1;
    }
  }

  const isOn = transitionFactor > 0;

  if (isOn) {
    // Smoothly transition ambientLight between 1.0 (dark/off) and 0.67 (active)
    ambientLight = 1.0 - (0.33 * transitionFactor);
    
    if (wasOff) {
      initializeLevelLights();
      wasOff = false;
    }

    for (let light of lights) {
      // Scale flickering by the transition factor so lights fade in/out smoothly
      if (light.flickerSpeed > 0) {
        const flicker = Math.sin(now * light.flickerSpeed * 0.01) * light.flickerAmount;
        
        // Base values scaled by the "sun" position
        light.radius = light.baseRadius * transitionFactor;
        const targetIntensity = light.baseIntensity + (flicker * light.baseIntensity);
        light.intensity = targetIntensity * transitionFactor;
        
        // Ensure they don't drop below your minimum threshold while active
        light.intensity = Math.max(0.1 * transitionFactor, light.intensity);
      }
    }
  } else {
    // "Deep Night" state
    if (!wasOff) {
      wasOff = true; 
      ambientLight = 1.0;
      for (let light of lights) {
        light.intensity = 0;
        light.radius = 0;
      }
    }
  }
}



function initializeLevelLights() {
  lights = [];
  
  if (currentLevel === 1) {
    // Level 1: Warm scattered lighting
    lights.push(
      createLight(400, 500, 400, "#ffcc66", 0.5),
      createLight(1200, 500, 450, "#ffaa44", 0.4),
      createLight(1600, 500, 400, "#ffcc66", 0.5),
      createLight(1000, 1950, 450, "#ffaa44", 0.4),
      createLight(2200, 500, 400, "#ffcc66", 0.4),
      createLight(2700, 2000, 400, "#aaddff", 0.6),
      createLight(1000, 1400, 350, "#ff8844", 0.4)
      
    );
  } else if (currentLevel === 2) {
    // Level 2: Tower with lights at key floors
    lights.push(
      createLight(400, 1900, 350, "#ffcc66", 0.7),   // Ground floor
      createLight(750, 1350, 300, "#ffaa44", 0.6),   // Mid section
      createLight(650, 900, 350, "#ffcc66", 0.7),    // Upper section
      createLight(1300, 600, 300, "#ff8844", 0.6),   // Trap corridor
      createLight(1350, 300, 400, "#ffcc88", 0.8)    // Summit
    );
  } else if (currentLevel === 3) {
    // Level 3: Cold blue Christmas lights
    lights.push(
      createLight(500, 1300, 400, "#aaddff", 0.6),
      createLight(1200, 1000, 450, "#88ccff", 0.7),
      createLight(1800, 1300, 400, "#aaddff", 0.6)
    );
  } else if (currentLevel === 4) {
    // Level 4: Chaos - flickering emergency lights
    lights.push(
      createLight(700, 100, 600, "#ff4444", 0.5),
      createLight(2100, 100, 600, "#ff4444", 0.5)
    );
    lights[0].flickerSpeed = 0.1;
    lights[0].flickerAmount = 0.3;
    lights[1].flickerSpeed = 0.15;
    lights[1].flickerAmount = 0.3;
  }
}

function createLight(x, y, radius, color, intensity = 1.0) {
  return {
    x: x,
    y: y,
    radius: radius,
    color: color,
    intensity: intensity,
    flickerSpeed: 0,
    flickerAmount: 0,
    baseRadius: radius
  };
}

// Line segment intersection test
function lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
  if (denom === 0) return false;
  
  const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denom;
  const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denom;
  
  return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
}

// Cast shadows from a light source
function drawShadows(light) {
  // Get all shadow casters (walls, boxes, large entities)
  const casters = [
    ...walls.map(w => ({ ...w, type: 'wall' })),
    ...boxes.map(b => ({ x: b.x, y: b.y, width: b.width, height: b.height, type: 'box' })),
    ...yetis.filter(y => y.alive).map(y => ({ x: y.x, y: y.y, width: y.width, height: y.height, type: 'yeti' }))
  ];
  
  ctx.fillStyle = `rgba(0, 0, 0, ${0.7 - ambientLight})`;
  
  for (let caster of casters) {
    // Skip if too far from light
    const dx = caster.x + caster.width / 2 - light.x;
    const dy = caster.y + caster.height / 2 - light.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > light.radius * 1.5) continue;
    
    // Get corners of the caster
    const corners = [
      { x: caster.x, y: caster.y },
      { x: caster.x + caster.width, y: caster.y },
      { x: caster.x + caster.width, y: caster.y + caster.height },
      { x: caster.x, y: caster.y + caster.height }
    ];
    
    // For each edge of the caster, project shadow
    for (let i = 0; i < corners.length; i++) {
      const corner1 = corners[i];
      const corner2 = corners[(i + 1) % corners.length];
      
      // Check if this edge faces away from light
      const edgeDx = corner2.x - corner1.x;
      const edgeDy = corner2.y - corner1.y;
      const lightDx = light.x - corner1.x;
      const lightDy = light.y - corner1.y;
      
      // Cross product to check if edge faces light
      const cross = edgeDx * lightDy - edgeDy * lightDx;
      
      if (cross > 0) continue; // Edge faces light, no shadow
      
      // Project shadow far away
      const projectionDist = 2770;
      
      const dir1x = corner1.x - light.x;
      const dir1y = corner1.y - light.y;
      const len1 = Math.sqrt(dir1x * dir1x + dir1y * dir1y) || 1;
      
      const dir2x = corner2.x - light.x;
      const dir2y = corner2.y - light.y;
      const len2 = Math.sqrt(dir2x * dir2x + dir2y * dir2y) || 1;
      
      const proj1x = corner1.x + (dir1x / len1) * projectionDist;
      const proj1y = corner1.y + (dir1y / len1) * projectionDist;
      
      const proj2x = corner2.x + (dir2x / len2) * projectionDist;
      const proj2y = corner2.y + (dir2y / len2) * projectionDist;
      
      // Draw shadow polygon
      ctx.beginPath();
      ctx.moveTo(corner1.x, corner1.y);
      ctx.lineTo(corner2.x, corner2.y);
      ctx.lineTo(proj2x, proj2y);
      ctx.lineTo(proj1x, proj1y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawBackground() {
  if (!bgTile.complete) return; // wait until image is loaded

  const tileW = bgTile.width;   // 100
  const tileH = bgTile.height;  // 100

  const cols = Math.ceil(MAP_WIDTH / tileW);
  const rows = Math.ceil(MAP_HEIGHT / tileH);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.drawImage(bgTile, x * tileW, y * tileH, tileW, tileH);
    }
  }
}

// Draw lighting layer
function drawLighting() {
  if (!lightingEnabled && ambientLight < 0.75) return;

  ctx.save();
  
  // Create darkness overlay
  ctx.fillStyle = `rgba(0, 0, 0, ${1 - ambientLight})`;
  ctx.fillRect(0, 0, world.width, world.height);
  
  // Set blend mode for lights
  ctx.globalCompositeOperation = 'lighter';
  
  // Draw each light source
  for (let light of lights) {
    ctx.save();

  // Bulb body (circle)
  ctx.fillStyle = '#A8B360';
  ctx.beginPath();
  ctx.arc(light.x, light.y, 6, 0, Math.PI * 2);
  ctx.fill();

  // Bulb base (small rectangle)
  ctx.fillStyle = 'silver';
  ctx.fillRect(light.x - 3, light.y - 10, 6, 4);
    
    let beamStopY = -2099;
    
    for (let obj of walls) {
      // Check if light is horizontally aligned with the object
      if (light.x >= obj.x && light.x <= obj.x + obj.width) {
        // Find the bottom edge of the object that is ABOVE the light
        let objBottom = obj.y + obj.height;
        if (objBottom < light.y && objBottom > beamStopY) {
          beamStopY = objBottom;
        }
      }
    }

    // 2. Draw the vertical beam (grey line)
    ctx.fillStyle = 'grey';
    const beamHeight = light.y - beamStopY;
    ctx.fillRect(light.x, beamStopY, 1, beamHeight);

    // Create radial gradient for light
    const gradient = ctx.createRadialGradient(
      light.x, light.y, 0,
      light.x, light.y, light.radius
    );
    
    const alpha = (light.intensity || 0) * 0.8;
    gradient.addColorStop(0, `${light.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.4, `${light.color}${Math.floor(alpha * 0.5 * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  // Reset blend mode
  ctx.globalCompositeOperation = 'source-over';
  
  // Draw shadows
  for (let light of lights) {
    drawShadows(light);
  }
  
  ctx.restore();
}


// Player torch/flashlight (optional)
let playerLight = null;

/*function updatePlayerLight() {
  if (!playerLight) {
    playerLight = createLight(
      player.x + player.width / 2,
      player.y + player.height / 2,
      200,
      "#ffeeaa",
      0.6
    );
    lights.push(playerLight);
  } else {
    // Follow player
    playerLight.x = player.x + player.width / 2;
    playerLight.y = player.y + player.height / 2;
  }
}
*/
// Toggle lighting (for testing)
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "l") {
    lightingEnabled = !lightingEnabled;
  }
});

// --- Aim update (called every frame in gameLoop) ---
function updateCannonAim() {
  if (!hasPotato) return;

  if (!joystick.active) {
    // Desktop: aim toward world-space mouse
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    const cx = player.x + player.width  / 2;
    const cy = player.y + player.height / 2;
    cannonAimAngle = Math.atan2(worldMouseY - cy, worldMouseX - cx);
  } else {
    cannonAimAngle = joystick.angle;
  }

  // Keep player facing the cannon direction
  player.facing = Math.abs(cannonAimAngle) < Math.PI / 2 ? 1 : -1;

  // Cooldown tick
  if (cannonCooldown > 0) cannonCooldown--;
}

// --- Fire a projectile ---
function firePotatoCannon() {
  if (cannonCooldown > 0) return;

  const speed = 14;
  const cx = player.x + player.width  / 2;
  const cy = player.y + player.height / 2;
  const baked = potatoState === "baked";

  cannonProjectiles.push({
    x:         cx + Math.cos(cannonAimAngle) * 20,  // spawn at barrel tip
    y:         cy + Math.sin(cannonAimAngle) * 20,
    vx:        Math.cos(cannonAimAngle) * speed,
    vy:        Math.sin(cannonAimAngle) * speed,
    size:      baked ? 13 : 8,
    explosive: baked,
    alive:     true,
    trail:     []
  });

  cannonCooldown = CANNON_COOLDOWN_FRAMES;

  // Tiny recoil
  player.dx -= Math.cos(cannonAimAngle) * 1.5;
  player.dy -= Math.sin(cannonAimAngle) * 0.8;
}

// --- Update projectiles ---
function updateCannonProjectiles() {
  for (let i = cannonProjectiles.length - 1; i >= 0; i--) {
    const p = cannonProjectiles[i];

    if (!p.alive) { cannonProjectiles.splice(i, 1); continue; }

    // Trail
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 9) p.trail.shift();

    // Physics
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.25;  // light gravity

    // World bounds
    if (p.x < 0 || p.x > world.width || p.y > world.height + 300) {
      p.alive = false; continue;
    }

    // Wall collision
    if (collidesWithWall(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2)) {
      if (p.explosive) createExplosion(p.x, p.y);
      p.alive = false; continue;
    }

    // Enemy hit detection
    const hitBox = { x: p.x - p.size, y: p.y - p.size, width: p.size * 2, height: p.size * 2 };
    let hit = false;
    const dmg = p.explosive ? 3 : 1;
    const kb  = { x: p.vx * 0.4, y: -3 };

    const enemyChecks = [
      { list: snails,     key: 'snail' },
      { list: SuperSnails,key: 'superSnail' },
      { list: bats,       key: 'bat' },
      { list: snowmen,    key: 'snowman' },
    ];

    for (const { list, key } of enemyChecks) {
      if (hit) break;
      for (let j = list.length - 1; j >= 0; j--) {
        const e = list[j];
        if (isColliding(hitBox, e)) {
          damageEnemy(e, dmg, kb);
          if (e.hp <= 0) { list.splice(j, 1); onEnemyKilled(key); }
          hit = true; break;
        }
      }
    }

    // Yetis
    if (!hit) for (const y of yetis) {
      if (!y.alive) continue;
      if (isColliding(hitBox, y)) {
        damageEnemy(y, p.explosive ? 4 : 1, kb);
        if (y.hp <= 0) { y.alive = false; onEnemyKilled('yeti'); }
        hit = true; break;
      }
    }

    // Turrets
    if (!hit) for (let j = turrets.length - 1; j >= 0; j--) {
      if (isColliding(hitBox, turrets[j])) {
        damageEnemy(turrets[j], dmg, { x: 0, y: 0 });
        if (turrets[j].hp <= 0) { turrets.splice(j, 1); onEnemyKilled('turret'); }
        hit = true; break;
      }
    }

    // Boxes — knock them away
    if (!hit) for (const b of boxes) {
      if (isColliding(hitBox, b)) {
        damageBox(b, 1);
        b.dx += p.vx * 0.5;
        b.dy += p.vy * 0.3 - 2;
        hit = true; break;
      }
    }

    if (hit) {
      if (p.explosive) createExplosion(p.x, p.y);
      p.alive = false;
    }
  }
}

// --- Explosion (baked potato only) ---
function createExplosion(x, y) {
  explosions.push({ x, y, radius: 0, maxRadius: 85, timer: 28, maxTimer: 28 });

  const R   = 85;
  const dmg = 3;
  const kb  = (ex, ey) => ({ x: (ex - x) * 0.12, y: -5 });

  for (let j = snails.length - 1; j >= 0; j--) {
    const s = snails[j];
    if (Math.hypot((s.x + s.width/2) - x, (s.y + s.height/2) - y) < R) {
      damageEnemy(s, dmg, kb(s.x, s.y));
      if (s.hp <= 0) { snails.splice(j, 1); onEnemyKilled('snail'); }
    }
  }
  for (let j = SuperSnails.length - 1; j >= 0; j--) {
    const s = SuperSnails[j];
    if (Math.hypot((s.x + s.width/2) - x, (s.y + s.height/2) - y) < R) {
      damageEnemy(s, dmg, kb(s.x, s.y));
      if (s.hp <= 0) { SuperSnails.splice(j, 1); onEnemyKilled('superSnail'); }
    }
  }
  for (const yeti of yetis) {
    if (!yeti.alive) continue;
    if (Math.hypot((yeti.x + yeti.width/2) - x, (yeti.y + yeti.height/2) - y) < R) {
      damageEnemy(yeti, 4, kb(yeti.x, yeti.y));
      if (yeti.hp <= 0) { yeti.alive = false; onEnemyKilled('yeti'); }
    }
  }
  for (let j = snowmen.length - 1; j >= 0; j--) {
    const s = snowmen[j];
    if (Math.hypot((s.x + s.width/2) - x, (s.y + s.height/2) - y) < R) {
      damageEnemy(s, dmg, kb(s.x, s.y));
      if (s.hp <= 0) { snowmen.splice(j, 1); onEnemyKilled('snowman'); }
    }
  }
  for (const b of boxes) {
    const dx   = (b.x + b.width/2)  - x;
    const dy   = (b.y + b.height/2) - y;
    const dist = Math.hypot(dx, dy);
    if (dist < R) {
      const force = (1 - dist / R) * 16;
      b.dx += (dx / dist) * force;
      b.dy -= (1 - dist / R) * 10;
    }
  }

  // Screen shake + VHS glitch
  camera.x += (Math.random() - 0.5) * 22;
  camera.y += (Math.random() - 0.5) * 22;
  triggerVHSGlitch();

  if (hasPotato) {
    potatoMessage = "🥔🔥 BOOM";
    potatoMessageTimer = 60;
  }
}

// --- Update explosion animations ---
function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    e.timer--;
    e.radius = e.maxRadius * (1 - e.timer / e.maxTimer);
    if (e.timer <= 0) explosions.splice(i, 1);
  }
}

function drawPotatoCannon() {
  if (!hasPotato) return;

  const cx     = player.x + player.width  / 2;
  const cy     = player.y + player.height / 2;
  const baked  = potatoState === "baked";

  // --- Draw cannon barrel ---
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(cannonAimAngle);

  // Barrel body
  ctx.fillStyle = baked ? "#6b3a1f" : "#5a3820";
  ctx.fillRect(2, -5, 28, 10);

  // Metal bands
  ctx.fillStyle = baked ? "#9c5522" : "#7a5030";
  ctx.fillRect(4,  -5, 4, 10);
  ctx.fillRect(18, -5, 4, 10);

  // Muzzle
  ctx.fillStyle = baked ? "#ff7722" : "#4a2e18";
  ctx.fillRect(27, -6, 5, 12);

  // Baked: fiery glow around barrel
  if (baked) {
    ctx.shadowColor  = "#ff6600";
    ctx.shadowBlur   = 14;
    ctx.strokeStyle  = "#ffaa44";
    ctx.lineWidth    = 1.5;
    ctx.strokeRect(2, -5, 28, 10);
  }

  ctx.restore();

  // --- Draw projectiles ---
  for (const p of cannonProjectiles) {
    if (!p.alive) continue;

    // Trail
    for (let j = 0; j < p.trail.length; j++) {
      const frac  = j / p.trail.length;
      const alpha = frac * 0.55;
      const sz    = p.size * frac * 0.65;
      ctx.fillStyle = p.explosive
        ? `rgba(255,110,0,${alpha})`
        : `rgba(160,100,40,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.trail[j].x, p.trail[j].y, Math.max(sz, 1), 0, Math.PI * 2);
      ctx.fill();
    }

    // Main ball (rectangle sprite placeholder)
    ctx.save();
    if (p.explosive) {
      ctx.shadowColor = "#ff5500";
      ctx.shadowBlur  = 18;
    }
    ctx.fillStyle = p.explosive ? "#ff8800" : "#b58b4a";
    // Draw as small rectangle (swap for sprite when asset is ready)
    const s = p.size;
    ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);

    // Inner highlight
    ctx.fillStyle = p.explosive ? "#ffdd88" : "#d4aa6a";
    ctx.fillRect(p.x - s + 2, p.y - s + 2, s - 2, s - 2);

    ctx.restore();
  }

  // --- Draw explosions ---
  for (const e of explosions) {
    const alpha = e.timer / e.maxTimer;

    // Outer shockwave ring
    ctx.strokeStyle = `rgba(255,160,40,${alpha * 0.6})`;
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Gradient fill
    const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
    grad.addColorStop(0,   `rgba(255,220,80,${alpha * 0.85})`);
    grad.addColorStop(0.35,`rgba(255,100,0,${alpha * 0.65})`);
    grad.addColorStop(0.7, `rgba(200,40,0,${alpha * 0.3})`);
    grad.addColorStop(1,   `rgba(100,20,0,0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// HUD crosshair — draw in screen-space (after ctx.restore for camera)
function drawCannonCrosshair() {
  if (!hasPotato || gameOver) return;

  const screenMouseX = mouse.x;
  const screenMouseY = mouse.y;

  ctx.save();
  ctx.translate(screenMouseX, screenMouseY);

  const baked = potatoState === "baked";
  const col   = baked ? "#ff8800" : "#ffd966";
  const r     = 12;

  ctx.strokeStyle = col;
  ctx.lineWidth   = 2;

  // Crosshair circle
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  // Cross lines
  [[-r - 5, 0], [r + 5, 0], [0, -r - 5], [0, r + 5]].forEach(([tx, ty]) => {
    ctx.beginPath();
    ctx.moveTo(tx < 0 ? -r + 3 : r - 3, ty < 0 ? -r + 3 : r - 3);
    ctx.lineTo(tx || (ty < 0 ? 0 : 0), ty || 0);
    if (Math.abs(tx) > 0) { ctx.moveTo(tx < 0 ? -r : r, 0); ctx.lineTo(tx, 0); }
    if (Math.abs(ty) > 0) { ctx.moveTo(0, ty < 0 ? -r : r); ctx.lineTo(0, ty); }
    ctx.stroke();
  });

  // Simpler cross
  ctx.beginPath();
  ctx.moveTo(-r - 5, 0); ctx.lineTo(-r, 0);
  ctx.moveTo( r,     0); ctx.lineTo( r + 5, 0);
  ctx.moveTo(0, -r - 5); ctx.lineTo(0, -r);
  ctx.moveTo(0,  r);     ctx.lineTo(0,  r + 5);
  ctx.stroke();

  if (baked) {
    ctx.fillStyle = `rgba(255,140,0,0.25)`;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSnowAura(s) {
  const cx = s.x + s.width / 2;
  const cy = s.y + s.height / 2;
  const R = s.slowRadius;

  // --- AURA RING ---
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(220,240,255,0.45)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // subtle glow
  ctx.beginPath();
  ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // --- SPAWN SNOW PARTICLES ---
  if (s.flurryParticles.length < 40) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * R;

    s.flurryParticles.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      vx: 0.4 + Math.random() * 0.9,
      vy: 0.4 + Math.random() * 1,// sideways wind
      size: 1.5 + Math.random() * 1.5
    });
  }

  // --- UPDATE & DRAW PARTICLES ---
  ctx.fillStyle = "rgba(255,255,255,0.9)";

  for (let i = s.flurryParticles.length - 1; i >= 0; i--) {
    const p = s.flurryParticles[i];

    p.x += p.vx;

    // distance from center
    const dx = p.x - cx;
    const dy = p.y - cy;

    // remove if outside radius
    if (dx * dx + dy * dy > R * R) {
      s.flurryParticles.splice(i, 1);
      continue;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isChristmasMap() {
  return currentLevel === 3;
}

function shatterIcicle(i) {
  i.active = false;
  i.falling = false;
  i.respawnTimer = 120; // ~2 seconds at 60fps
}

function getGroundSurface(entity) {
  for (let wall of walls) {
    if (
      entity.x + entity.width > wall.x &&
      entity.x < wall.x + wall.width &&
      entity.y + entity.height <= wall.y + 6 &&
      entity.y + entity.height >= wall.y - 6
    ) {
      return wall;
    }
  }
  return null;
}


function showCanvas() {
  canvas.style.display = "block";
}

function hideCanvas() {
  canvas.style.display = "none";
}

function startGame() {
  // Always stop any existing loop first
  stopGameLoop();
  // Reset everything
  resetGameState();
  hideAllMenus();
  document.getElementById("game").style.display = "block";

  
  gameRunning = true;
  gamePaused = false;
  lastFrameTime = performance.now();
  lastTimestamp = performance.now();

  // Start loop
  gameLoopId = requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
  gameRunning = false;
}


function openSettings() {
  hideAllMenus();
  document.getElementById("settings").classList.remove("hidden");
}

function openLevelSelect() {
  hideAllMenus();
  document.getElementById("levelSelect").classList.remove("hidden");
}

function openFreeSelect() {
  hideAllMenus();
  document.getElementById("freeSelect").classList.remove("hidden");
  
}
function openWaveSelect() {
  hideAllMenus();
  document.getElementById("waveSelect").classList.remove("hidden");
}
function openFreeSelect() {
  hideAllMenus();
  document.getElementById("freeSelect").classList.remove("hidden");
}
function openControls() {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("controls").classList.remove("hidden");
}

function loadLevel(level) {
  resetWorld(); // clear previous map junk
  currentLevel = level;
  if (level === 1) loadMap_Level1();
  if (level === 2) loadMap_Level2();
  if (level === 3) loadMap_Level3();
  //if (level === 4) loadMap_Level4();

  initializeLevelLights();
  saveInitialState(); // allow reset after death
}

function addMapBounds() {
  // Floor
  walls.push({ x: 0, y: MAP_HEIGHT - WALL_THICKNESS, width: MAP_WIDTH, height: 1000 });

  // Ceiling
  walls.push({ x: 0, y: -970, width: MAP_WIDTH, height: 1000 });

  // Left wall
  walls.push({ x: -970, y: 0, width: 1000, height: MAP_HEIGHT });

  // Right wall
  walls.push({ x: MAP_WIDTH - WALL_THICKNESS, y: 0, width: 1000, height: MAP_HEIGHT });
}

function loadMap_Level1() {

  /* ------------------ WORLD BOUNDS ------------------ */
 addMapBounds();

  /* ------------------ MAIN GROUND PATH ------------------ */
    walls.push(
    { x: 30, y: 570, width: 600, height: 20 },
    { x: 700, y: 570, width: 500, height: 20 },
    { x: 1300, y: 570, width: 600, height: 20 },
    { x: 2000, y: 570, width: 700, height: 20 },
    { x: 2690, y: 570, width: 20, height: 1380 },
    { x: 30, y: 570, width: 620, height: 20 }
  );

    chairs.push(createChair(500, 540));
  chairs.push(createChair(1200, 540));
  /* ------------------ LOWER PLATFORMS ------------------ */
  walls.push(
    { x: 200, y: 450, width: 160, height: 20 },
    { x: 450, y: 380, width: 160, height: 20 },
    { x: 700, y: 310, width: 160, height: 20 },

    { x: 1100, y: 450, width: 180, height: 20 },
    { x: 1400, y: 380, width: 180, height: 20 },

    { x: 1800, y: 450, width: 200, height: 20 }
  );

  /* ------------------ VERTICAL CLIMB (CENTER) ------------------ */
  walls.push(
    { x: 950, y: 1500, width: 200, height: 20 },
    { x: 900, y: 1365, width: 200, height: 20 },
    { x: 1000, y: 1230, width: 200, height: 20 },
    { x: 900, y: 1000, width: 100, height: 20 },
    { x: 950, y: 1090, width: 200, height: 20 },
    { x: 1000, y: 900, width: 200, height: 20 }
  );
  
  boxes.push(createBox(300, 200, BOX_TYPE.BOUNCY));
boxes.push(createBox(350, 200, BOX_TYPE.BREAKABLE));
  boxes.push(createBox(350, 200, BOX_TYPE.HEAVY));
boxes.push(createBox(400, 200, BOX_TYPE.ICE));

  /* ------------------ MOVING PLATFORMS (LATE AREA) ------------------ */
  walls.push(
    { x: 1500, y: 1100, width: 120, height: 20, moving: true, dir: 1, speed: 2, startX: 1500, range: 200},
    { x: 1800, y: 970, width: 120, height: 20 }
  );

  /* ------------------ SEESAWS (INTENTIONAL) ------------------ */
  seesaws.push(
    {
      x: 500,
      y: 260,
      width: 160,
      height: 12,
      angle: 0,
      angularVelocity: 0
    },
      {
      x: 580,
      y: 500,
      width: 160,
      height: 12,
      angle: 0,
      angularVelocity: 0
    },
    { x: 950,
     y: 1665,
     width: 100,
     height: 12,
     angle: 0,
     angularVelocity: 0 },
    { x: 1150,
     y: 1720,
     width: 120,
     height: 12,
     angle: 0,
     angularVelocity: 0 },
    { x: 920,
     y: 1595,
     width: 120,
     height: 12,
     angle: 0,
     angularVelocity: 0 },
    {
      x: 1500,
      y: 320,
      width: 200,
      height: 12,
      angle: 0,
      angularVelocity: 0
    }
  );

  ovens.push(
  { x: 200, y: 840, width: 40, height: 50,  active: false, baked: false,  glow: 0 }
);

   turrets.push(
    { x: 100, y: 650, cooldown: 0, fireRate: 200 },
  );
  
  walls.push(
    { x: 500, y: 680, width: 120, height: 20, moving: true, dir: 1, speed: 2, startX: 500, range: 100},
    );
// === POTATO MODULE ===
let potato = {
  x: 2700,
  y: 1800,
  width: 20,
  height: 10,
  wobble: 0,
  collected: false,
  active: true
};

let hasPotato = false;

  /* ------------------ BOXES (PUZZLE / CHAOS) ------------------ */
boxes.push(
  createBox(220, 418, BOX_TYPE.NORMAL),
  createBox(260, 418, BOX_TYPE.NORMAL),
  createBox(520, 228, BOX_TYPE.NORMAL),
  createBox(960, 1468, BOX_TYPE.NORMAL),
  createBox(1000, 1468, BOX_TYPE.NORMAL),
  createBox(1820, 918, BOX_TYPE.NORMAL)
);

/* ------------------ LOW-THREAT FILL ------------------ */
boxes.push(
  createBox(950, 748, BOX_TYPE.NORMAL),
  createBox(1780, 788, BOX_TYPE.NORMAL)
);
  /* ------------------ SNAILS (GROUND PRESSURE) ------------------ */
  snails.push(
    { x: 350, y: 540, width: 28, height: 20, dx: 0, dy: 0, dir: 1, speed: 0.7, gravity: 0.6, chaseRange: 400, knockbackTimer: 0, knockbackDx: 0, knockbackDy: 0, frame: 0,
  frameTimer: 0},
    { x: 850, y: 540, width: 28, height: 20, dx: 0, dy: 0, dir: -1, speed: 0.65, gravity: 0.6, chaseRange: 400, knockbackTimer: 0, knockbackDx: 0, knockbackDy: 0, frame: 0,
  frameTimer: 0 },
    { x: 1450, y: 540, width: 28, height: 20, dx: 0, dy: 0, dir: 1, speed: 0.55, gravity: 0.6, chaseRange: 400, knockbackTimer: 0, knockbackDx: 0, knockbackDy: 0, frame: 0,
  frameTimer: 0 }
  );
   

  /* ------------------ SUPER SNAIL (MID-LATE THREAT) ------------------ */
  SuperSnails.push({
    x: 1000,
    y: 870,
    width: 28,
    height: 20,
    dx: 0,
    dy: 0,
    speed: 1.8,
    gravity: 0.5,
    dir: 1,
    jumpPower: -14,
    mode: "ground",
    knockbackTimer: 0,
    knockbackDx: 0,
    knockbackDy: 0,
    jumpTimer: 0,
    lastWallSide: null,
    prevMode: "ground"
  });

  /* ------------------ TURRETS (CLEAR TELEGRAPHING) ------------------ */
  turrets.push(
    { x: 1200, y: 420, cooldown: 0, fireRate: 120 },
    { x: 1900, y: 880, cooldown: 0, fireRate: 150 }
  );

  /* ------------------ SPIKES (FAIR, AVOIDABLE) ------------------ */
  spikes.push(
    { x: 570, y: 544, width: 40, height: 26 },
    { x: 700, y: 544, width: 40, height: 26 },

    { x: 1550, y: 544, width: 40, height: 26 }
  );
  /* ------------------ RECOVERY LADDERS ------------------ */
ladders.push(
  // Left recovery
  { x: 110, y: 590, width: 39, height: 2050 },

  // Center recovery
  { x: 1100, y: 1750, width: 40, height: 350 },

  // Right recovery
  { x: 2550, y: 1230, width: 40, height: 1050 }
);

  /* ------------------ MID-SPACE FILL PLATFORMS ------------------ */
walls.push(
  // Left air-fill
  { x: 150, y: 900, width: 140, height: 20 },
  { x: 350, y: 820, width: 140, height: 20 },

  // Center air-fill
  { x: 900, y: 780, width: 160, height: 20 },
  { x: 1150, y: 700, width: 160, height: 20 },

  // Right air-fill
  { x: 1750, y: 820, width: 180, height: 20 },
  { x: 2100, y: 740, width: 180, height: 20 }
);

  /* ------------------ FLOOR ROUTE STRUCTURE ------------------ */
walls.push(
  { x: 300, y: 1850, width: 300, height: 20 },
  { x: 800, y: 1750, width: 300, height: 20 },
  { x: 1300, y: 1680, width: 300, height: 20 },
  { x: 1700, y: 1580, width: 300, height: 20 },
  { x: 1300, y: 1520, width: 300, height: 20 }
);
/* ------------------ LOW-THREAT FILL ------------------ */
boxes.push(
  { x: 950, y: 748, width: 32, height: 32, dx: 0, dy: 0 },
  { x: 1780, y: 788, width: 32, height: 32, dx: 0, dy: 0 }
);

snails.push(
  {
    x: 2100,
    y: 1720,
    width: 28,
    height: 20,
    dx: 0,
    dy: 0,
    dir: -1,
    speed: 0.75,
    gravity: 0.6,
    chaseRange: 400,
    knockbackTimer: 0,
    knockbackDx: 0,
    knockbackDy: 0,
    frame: 0,
    frameTimer: 0
  }
);

}

function loadMap_Level2() {
  walls = [];
  turrets = [];
  seesaws = [];
  boxes = [];
  snails = [];
  SuperSnails = [];
  spikes = [];
  ladders = [];
  addMapBounds();

  /* ==================== LEVEL 2: THE TOWER ====================
   * Theme: Vertical platforming with branching paths
   * Features: Multiple routes (left/right), seesaw puzzles, trap gauntlets
   * Design: Bottom → Mid → Upper → Summit
   * =========================================================== */

  /* ------------------ GROUND FLOOR (Safe spawn) ------------------ */
  walls.push(
    { x: 50, y: 1950, width: 700, height: 30 },    // Main floor
    { x: 900, y: 1950, width: 700, height: 30 }
  );

  // Starting platforms
  walls.push(
    { x: 200, y: 1850, width: 120, height: 20 },
    { x: 400, y: 1750, width: 120, height: 20 },
    { x: 200, y: 1650, width: 120, height: 20 }
  );

  /* ------------------ LEFT PATH: Box Puzzle Route ------------------ */
  
  // Left staircase with boxes
  walls.push(
    { x: 100, y: 1550, width: 150, height: 20 },
    { x: 100, y: 1450, width: 150, height: 20 },
    { x: 100, y: 1350, width: 150, height: 20 }
  );

  // Box puzzle area
  boxes.push(
    createBox(120, 1518, BOX_TYPE.NORMAL),
    createBox(152, 1518, BOX_TYPE.NORMAL),
    createBox(136, 1486, BOX_TYPE.NORMAL),
    createBox(120, 1418, BOX_TYPE.BOUNCY),  // Bouncy to reach upper
    createBox(160, 1418, BOX_TYPE.HEAVY)
  );

  // Left upper platforms
  walls.push(
    { x: 80, y: 1250, width: 140, height: 20 },
    { x: 120, y: 1150, width: 140, height: 20 },
    { x: 80, y: 1050, width: 140, height: 20 }
  );

  // Left route snail
  snails.push({
    x: 140, y: 1520, width: 28, height: 20,
    dx: 0, dy: 0, dir: 1, speed: 0.7,
    chaseRange: 400, gravity: 0.6,
    knockbackTimer: 0, knockbackDx: 0, knockbackDy: 0,
    hp: 1, maxHp: 1, hitFlash: 0, frame: 0,
  frameTimer: 0
  });

  /* ------------------ RIGHT PATH: Seesaw & Precision Route ------------------ */

  // Right stepping stones
  walls.push(
    { x: 1100, y: 1850, width: 120, height: 20 },
    { x: 1300, y: 1750, width: 120, height: 20 },
    { x: 1500, y: 1650, width: 120, height: 20 }
  );

  // First seesaw challenge
  seesaws.push({
    x: 1150,
    y: 1550,
    width: 200,
    height: 12,
    angle: 0,
    angularVelocity: 0
  });

  // Boxes for seesaw weight
  boxes.push(
    createBox(1180, 1518, BOX_TYPE.HEAVY),
    createBox(1280, 1518, BOX_TYPE.NORMAL)
  );

  // Right upper platforms
  walls.push(
    { x: 1400, y: 1450, width: 140, height: 20 },
    { x: 1500, y: 1350, width: 140, height: 20 },
    { x: 1400, y: 1250, width: 140, height: 20 }
  );

  // Right route enemy
  SuperSnails.push({
    x: 1450, y: 1420, width: 28, height: 20,
    dx: 0, dy: 0, speed: 1.8, gravity: 0.5,
    dir: -1, jumpPower: -14, mode: "ground",
    knockbackTimer: 0, knockbackDx: 0, knockbackDy: 0,
    jumpTimer: 0, lastWallSide: null, prevMode: "ground",
    hp: 3, maxHp: 3, hitFlash: 0
  });

  /* ------------------ MIDDLE SECTION: Convergence ------------------ */

  // Center platform where paths meet
  walls.push(
    { x: 600, y: 1400, width: 300, height: 30 }
  );

  // Moving platform across gap
  walls.push({
    x: 400, y: 1300, width: 120, height: 20,
    moving: true, dir: 1, speed: 2, startX: 400, range: 250
  });

  // Spike trap below moving platform
  spikes.push(
    { x: 420, y: 1374, width: 40, height: 26 },
    { x: 480, y: 1374, width: 40, height: 26 },
    { x: 540, y: 1374, width: 40, height: 26 },
    { x: 600, y: 1374, width: 40, height: 26 }
  );

  // Turret guarding center
  turrets.push(
    { x: 720, y: 1370, cooldown: 0, fireRate: 110, hp: 2, maxHp: 2, hitFlash: 0 }
  );

  /* ------------------ UPPER SECTION: Seesaw Gauntlet ------------------ */

  walls.push(
    { x: 300, y: 1200, width: 140, height: 20 },
    { x: 1200, y: 1200, width: 140, height: 20 }
  );

  // Triple seesaw challenge
  seesaws.push(
    {
      x: 500,
      y: 1150,
      width: 180,
      height: 12,
      angle: 0,
      angularVelocity: 0
    },
    {
      x: 750,
      y: 1050,
      width: 180,
      height: 12,
      angle: 0,
      angularVelocity: 0
    },
    {
      x: 1000,
      y: 950,
      width: 180,
      height: 12,
      angle: 0,
      angularVelocity: 0
    }
  );

  // Boxes for seesaw puzzles
  boxes.push(
    createBox(520, 1118, BOX_TYPE.NORMAL),
    createBox(620, 1118, BOX_TYPE.ICE),
    createBox(770, 1018, BOX_TYPE.HEAVY),
    createBox(1020, 918, BOX_TYPE.BOUNCY),
    createBox(1100, 918, BOX_TYPE.BREAKABLE)
  );

  // Enemies in seesaw section
  snails.push(
    {
      x: 550, y: 1118, width: 28, height: 20,
      dx: 0, dy: 0, dir: 1, speed: 0.8,
      chaseRange: 350, gravity: 0.6,
      knockbackTimer: 0, knockbackDx: 0, knockbackDy: 0,
      hp: 1, maxHp: 1, hitFlash: 0, frame: 0,
  frameTimer: 0
    },
    {
      x: 1050, y: 918, width: 28, height: 20,
      dx: 0, dy: 0, dir: -1, speed: 0.8,
      chaseRange: 350, gravity: 0.6,
      knockbackTimer: 0, knockbackDx: 0, knockbackDy: 0,
      hp: 1, maxHp: 1, hitFlash: 0, frame: 0,
  frameTimer: 0
    }
  );

  /* ------------------ TRAP CORRIDOR ------------------ */

  walls.push(
    { x: 1250, y: 850, width: 140, height: 20 },
    { x: 1450, y: 750, width: 140, height: 20 },
    { x: 1650, y: 650, width: 140, height: 20 }
  );

  // Spike gauntlet
  spikes.push(
    { x: 1270, y: 824, width: 40, height: 26 },
    { x: 1330, y: 824, width: 40, height: 26 },
    { x: 1470, y: 724, width: 40, height: 26 },
    { x: 1530, y: 724, width: 40, height: 26 },
    { x: 1670, y: 624, width: 40, height: 26 }
  );

  // Turrets in corridor
  turrets.push(
    { x: 1300, y: 820, cooldown: 0, fireRate: 90, hp: 2, maxHp: 2, hitFlash: 0 },
    { x: 1700, y: 620, cooldown: 0, fireRate: 80, hp: 2, maxHp: 2, hitFlash: 0 }
  );

  /* ------------------ UPPER PLATFORMS: Alternative Path ------------------ */

  walls.push(
    { x: 200, y: 850, width: 160, height: 20 },
    { x: 400, y: 750, width: 160, height: 20 },
    { x: 600, y: 650, width: 160, height: 20 },
    { x: 800, y: 550, width: 160, height: 20 }
  );

  // Moving platform section
  walls.push(
    {
      x: 1000, y: 500, width: 120, height: 20,
      moving: true, dir: 1, speed: 2.5, startX: 1000, range: 200
    }
  );

  // Super snail guardian
  SuperSnails.push({
    x: 650, y: 620, width: 28, height: 20,
    dx: 0, dy: 0, speed: 2.0, gravity: 0.5,
    dir: 1, jumpPower: -14, mode: "ground",
    knockbackTimer: 0, knockbackDx: 0, knockbackDy: 0,
    jumpTimer: 0, lastWallSide: null, prevMode: "ground",
    hp: 4, maxHp: 4, hitFlash: 0
  });

  /* ------------------ SUMMIT AREA ------------------ */

  walls.push(
    { x: 1200, y: 450, width: 200, height: 20 },
    { x: 1000, y: 350, width: 200, height: 20 },
    { x: 1200, y: 250, width: 200, height: 20 }
  );

  // Final seesaw before summit
  seesaws.push({
    x: 1450,
    y: 400,
    width: 220,
    height: 12,
    angle: 0,
    angularVelocity: 0
  });

  // Final boxes
  boxes.push(
    createBox(1480, 368, BOX_TYPE.HEAVY),
    createBox(1520, 368, BOX_TYPE.HEAVY),
    createBox(1580, 368, BOX_TYPE.BOUNCY)
  );

  // Victory platform
  walls.push(
    { x: 1700, y: 150, width: 300, height: 30 }
  );

  // Final guardian
  SuperSnails.push({
    x: 1250, y: 220, width: 28, height: 20,
    dx: 0, dy: 0, speed: 2.2, gravity: 0.5,
    dir: -1, jumpPower: -14, mode: "ground",
    knockbackTimer: 0, knockbackDx: 0, knockbackDy: 0,
    jumpTimer: 0, lastWallSide: null, prevMode: "ground",
    hp: 5, maxHp: 5, hitFlash: 0
  });

  /* ------------------ RECOVERY LADDERS ------------------ */

  ladders.push(
    // Left side recovery
    { x: 40, y: 1000, width: 40, height: 1050 },
    
    // Center recovery
    { x: 560, y: 650, width: 40, height: 800 },
    
    // Right side recovery
    { x: 1850, y: 400, width: 40, height: 1600 }
  );

  /* ------------------ SAFETY NETS (prevent death loops) ------------------ */

  walls.push(
    { x: 0, y: 1700, width: 300, height: 20 },     // Left catch
    { x: 1500, y: 1500, width: 300, height: 20 },  // Right catch
    { x: 700, y: 900, width: 200, height: 20 }     // Mid catch
  );
}

function loadMap_Level3() {
  walls = [];
  turrets = [];
  seesaws = [];
  boxes = [];
  snails = [];
  SuperSnails = [];
  spikes = [];
  icicles = [];

walls.push({ x: 0, y: 0, width: 2800, height: 30, ice: true },
{ x: 0, y: 0, width: 30, height: 2100, ice: true },
{ x: 0, y: 2070, width: 2800, height: 30, ice: true },{ x: 2770, y: 0, width: 30, height:2100, ice: true },
);
  // --- VERTICAL CLIMB ---
// Long icy floor
walls.push({ x: 200, y: 1350, width: 1800, height: 30, ice: true });

// Raised icy ledges
walls.push({ x: 300, y: 1200, width: 200, height: 25, ice: true });
walls.push({ x: 600, y: 1150, width: 200, height: 25, ice: true });
walls.push({ x: 900, y: 1100, width: 200, height: 25, ice: true });
walls.push({ x: 1200, y: 1050, width: 200, height: 25, ice: true });
walls.push({ x: 1500, y: 1000, width: 200, height: 25, ice: true });

walls.push({ x: 80, y: 1300, width: 120, height: 20, ice: true });
walls.push({ x: 80, y: 1220, width: 120, height: 20, ice: true });
walls.push({ x: 80, y: 1140, width: 120, height: 20, ice: true });
walls.push({ x: 80, y: 1060, width: 120, height: 20, ice: true });
walls.push({ x: 80, y: 980, width: 120, height: 20, ice: true });

  // --- SEESAW GAUNTLET ---
  seesaws.push(
    { x: 450, y: 1550, width: 200, height: 12, angle: 0, angularVelocity: 0 },
    { x: 800, y: 1400, width: 200, height: 12, angle: 0, angularVelocity: 0 },
    { x: 1150, y: 1250, width: 200, height: 12, angle: 0, angularVelocity: 0 }
  );
  
  // --- BOX CHAOS ---
/*boxes.push(
{ x: 500, y: 1300, width: 40, height: 40, dx: 0, dy: 0},
{ x: 850, y: 1300, width: 40, height: 40, dx: 0, dy: 0 }, 
{ x: 1400, y: 1300, width: 40, height: 40, dx: 0, dy: 0 },
{ x: 500, y: 1200, width: 40, height: 40, dx: 0, dy: 0},
{ x: 600, y: 100, width: 40, height: 40, dx: 0, dy: 0},
{ x: 500, y: 1300, width: 40, height: 40, dx: 0, dy: 0},
{ x: 900, y: 1300, width: 40, height: 40, dx: 0, dy: 0},
{ x: 2600, y: 100, width: 40, height: 40, dx: 0, dy: 0},
{ x: 1200, y: 2000, width: 40, height: 40, dx: 0, dy: 0},
);
*/

  // --- ENEMIES ---
  yetis.push({
  x: 1200,
  y: 1250,
  width: 48,
  height: 64,

  dx: 0,
  dy: 0,

  dead: false,
  speed: 1.2,
  chaseRange: 500,

  hp: 5,
  alive: true,

  throwCooldown: 0,
  facing: 1, // 1 = right, -1 = left
   
  knockbackTimer: 0,
  knockbackDx: 0,
  knockbackDy: 0
});

  snails.push(
    {
      x: 750, y: 1430, width: 32, height: 24,
      dx: 0, dy: 0, dir: 1, speed: 0.9,
      chaseRange: 500, gravity: 0.6,
      knockbackTimer: 0, knockbackDx: 0, knockbackDy: 0, frame: 0,
  frameTimer: 0
    }
  );

  SuperSnails.push(
    {
      x: 1450, y: 980, width: 28, height: 20,
      dx: 0, dy: 0, speed: 2.1, gravity: 0.6,
      dir: -1, jumpPower: -15, mode: "ground",
      knockbackTimer: 0, knockbackDx: 0, knockbackDy: 0,
      jumpTimer: 0, lastWallSide: null, prevMode: "ground"
    }
  );

  // --- TURRET PRESSURE ---
  turrets.push(
    { x: 1650, y: 870, cooldown: 0, fireRate: 90 },
    { x: 150, y: 1600, cooldown: 0, fireRate: 90 },
    { x: 1050, y: 2000, cooldown: 0, fireRate: 90 }
  );
 
  snowmen.push(
   { x: 1000,
    y: 1000,
    width: 26,
    height: 38,
    speed: 0.6,
    slowRadius: 140,
    slowAmount: 0.45, // 45% speed
    dx: 0,
    facing: 1,
    flurryParticles: []
   }
);

  icicles.push (
{
  x: 900,
  y: 30,          // ceiling position
  startY: 30,     // respawn anchor
  width: 12,
  height: 24,
  dy: 0,
  falling: false,
  active: true,
  respawnTimer: 0
},
  {
  x: 600,
  y: 30,          // ceiling position
  startY: 30,     // respawn anchor
  width: 12,
  height: 24,
  dy: 0,
  falling: false,
  active: true,
  respawnTimer: 0
},
{
  x: 1000,
  y: 1383,          // ceiling position
  startY: 1383,     // respawn anchor
  width: 12,
  height: 24,
  dy: 0,
  falling: false,
  active: true,
  respawnTimer: 0
});
}

/*function loadMap_Level4() {
 addMapBounds();

        }*/
function startLevel(level) {
  hideAllMenus();
  document.getElementById("game").style.display = "block";

  stopGameLoop();   // stop old loop
  resetGameState(); // reset player & flags

  loadLevel(level); // THIS is now the only loader
  startMusic();
  gameRunning = true;
  gamePaused = false;
  lastFrameTime = performance.now();
  lastTimestamp = performance.now();

  gameLoopId = requestAnimationFrame(gameLoop);
}

canvas.width = 800;
canvas.height = 600;

const gravity = 0.6;


const BOX_TYPE = {
  NORMAL: "normal",
  BOUNCY: "bouncy",
  BREAKABLE: "breakable",
  HEAVY: "heavy",
  ICE: "ice"
};

// === OFF-SCREEN ENEMY INDICATORS ===

const ENEMY_COLORS = {
  snail: "#5b3",      // green
  superSnail: "#4dff68", // bright green
  bat: "#6b4c8a",     // purple
  yeti: "#eef",       // white
  snowman: "#fff",    // white
  turret: "#f44"      // red
};

function drawOffScreenIndicators() {
  if (!waveSystem.enabled || !waveSystem.waveActive) return;
  
  ctx.save();
  
  // Get all alive enemies
  const allEnemies = [
    ...snails.map(s => ({ ...s, type: 'snail' })),
    ...SuperSnails.map(s => ({ ...s, type: 'superSnail' })),
    ...bats.map(b => ({ ...b, type: 'bat' })),
    ...yetis.filter(y => y.alive).map(y => ({ ...y, type: 'yeti' })),
    ...snowmen.map(s => ({ ...s, type: 'snowman' })),
    ...turrets.map(t => ({ ...t, type: 'turret' }))
  ].filter(e => e.hp > 0 || e.alive);
  
  for (let enemy of allEnemies) {
    const enemyScreenX = enemy.x - camera.x;
    const enemyScreenY = enemy.y - camera.y;
    
    // Check if enemy is off-screen
    const offScreen = 
      enemyScreenX < -50 || 
      enemyScreenX > canvas.width + 50 ||
      enemyScreenY < -50 ||
      enemyScreenY > canvas.height + 50;
    
    if (!offScreen) continue;
    
    // Calculate arrow position at screen edge
    let arrowX, arrowY;
    const margin = 30;
    
    // Clamp to screen edges
    arrowX = Math.max(margin, Math.min(canvas.width - margin, enemyScreenX));
    arrowY = Math.max(margin, Math.min(canvas.height - margin, enemyScreenY));
    
    // Calculate angle to enemy
    const dx = enemyScreenX - arrowX;
    const dy = enemyScreenY - arrowY;
    const angle = Math.atan2(dy, dx);
    
    // Draw arrow
    const color = ENEMY_COLORS[enemy.type] || "#fff";
    
    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);
    
    // Arrow body (triangle)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(15, 0);      // tip
    ctx.lineTo(-10, -8);    // top back
    ctx.lineTo(-10, 8);     // bottom back
    ctx.closePath();
    ctx.fill();
    
    // Arrow outline
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    
    ctx.restore();
    
    // Distance text (optional)
    const distance = Math.sqrt(
      Math.pow(enemy.x - player.x, 2) + 
      Math.pow(enemy.y - player.y, 2)
    );
    
    ctx.fillStyle = color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    
    const distText = Math.floor(distance);
    ctx.strokeText(distText, arrowX, arrowY - 20);
    ctx.fillText(distText, arrowX, arrowY - 20);
  }
  
  ctx.restore();
}

// Enhanced box creation
function createBox(x, y, type = BOX_TYPE.NORMAL, width = 32, height = 32) {
  let box = {
    x: x,
    y: y,
    width: width,
    height: height,
    dx: 0,
    dy: 0,
    type: type,
    
    // Type-specific properties
    hp: type === BOX_TYPE.BREAKABLE ? 3 : Infinity,
    maxHp: type === BOX_TYPE.BREAKABLE ? 3 : Infinity,
    hitFlash: 0,
    
    bounciness: type === BOX_TYPE.BOUNCY ? 1 : 0.1,
    friction: type === BOX_TYPE.ICE ? 0.99 : 
              type === BOX_TYPE.HEAVY ? 0.7 : 0.9,
    gravityMultiplier: type === BOX_TYPE.HEAVY ? 1.5 : 1.0,
    
    broken: false
  };
  
  return box;
}

function updateSpecialBoxes() {
  for (let i = boxes.length - 1; i >= 0; i--) {
    let box = boxes[i];
    
    // Initialize type if missing
    if (!box.type) box.type = BOX_TYPE.NORMAL;
    
    // Remove broken boxes
    if (box.type === BOX_TYPE.BREAKABLE && box.hp <= 0) {
      createBreakEffect(box.x + box.width / 2, box.y + box.height / 2);
      boxes.splice(i, 1);
      continue;
    }
    
    // Hit flash
    if (box.hitFlash > 0) box.hitFlash--;
    
    // Apply special gravity
    if (box.gravityMultiplier) {
      box.dy += gravity * box.gravityMultiplier;
    } else {
      box.dy += gravity;
    }
    
    // Move box
    box.x += box.dx;
    box.y += box.dy;
    
        for (let j = 0; j < boxes.length; j++) {
      if (i === j) continue;
      const other = boxes[j];
      if (isColliding(box, other)) resolveBoxCollision(box, other);
    }
    
    // Wall collisions
    for (let wall of walls) {
      if (isColliding(box, wall)) {
        const overlapX = Math.min(
          box.x + box.width - wall.x,
          wall.x + wall.width - box.x
        );
        const overlapY = Math.min(
          box.y + box.height - wall.y,
          wall.y + wall.height - box.y
        );
        
        if (overlapX < overlapY) {
          // Horizontal
          if (box.x < wall.x) box.x -= overlapX;
          else box.x += overlapX;
          box.dx = 0;
        } else {
          // Vertical
          if (box.y < wall.y) {
            box.y -= overlapY;
            
            // Bouncy box bounce
            if (box.type === BOX_TYPE.BOUNCY && Math.abs(box.dy) > 2) {
              box.dy = -box.dy * box.bounciness;
            } else {
              box.dy = 0;
            }
          } else {
            box.y += overlapY;
            box.dy = 0;
          }
        }
      }
    }
    for (let j = 0; j < boxes.length; j++) {
      if (i === j) continue;
      const other = boxes[j];
      if (isColliding(box, other)) resolveBoxCollision(box, other);
    }

// --- BOX COLLISIONS WITH PLAYER ---
if (
  player.x + player.width > box.x &&
  player.x < box.x + box.width &&
  player.y + player.height > box.y &&
  player.y < box.y + box.height
) {
  const overlapX = Math.min(
    player.x + player.width - box.x,
    box.x + box.width - player.x
  );
  const overlapY = Math.min(
    player.y + player.height - box.y,
    box.y + box.height - player.y
  );

  if (overlapX < overlapY) {
    // Horizontal collision → stop player and box if blocked
    if (player.x < box.x) {
      // Player is left of box
      const blocked = walls.some(w =>
        box.x + overlapX > w.x &&
        box.x + overlapX < w.x + w.width &&
        box.y + box.height > w.y &&
        box.y < w.y + w.height
      );

      if (!blocked) {
        // Free to push
        box.x += overlapX;
        box.dx = player.dx;
        player.x -= 0; // player already moving normally
      } else {
        // Blocked → stop
        player.x -= overlapX;
        player.dx = 0;
        box.dx = 0;
      }
    } else {
      // Player is right of box
      const blocked = walls.some(w =>
        box.x - overlapX < w.x + w.width &&
        box.x - overlapX + box.width > w.x &&
        box.y + box.height > w.y &&
        box.y < w.y + w.height
      );

      if (!blocked) {
        // Free to push
        box.x -= overlapX;
        box.dx = player.dx;
        player.x += 0;
      } else {
        // Blocked → stop
        player.x += overlapX;
        player.dx = 0;
        box.dx = 0;
      }
    }
  } else {
    // Vertical collision → same as working vertical logic
    if (player.y + player.height - overlapY <= box.y) {
      // Player is above box → stand on it
      player.y = box.y - player.height;
      player.dy = 0;
      player.onGround = true;
      player.x += box.dx * 0.8;
    } else if (box.y + box.height - overlapY <= player.y) {
      // Box is landing on player
      box.y = player.y - box.height;
      box.dy = 0;
      box.x += player.dx * 0.7;
    } else {
      // Sideways overlap (player inside box) → push player out
      if (player.y < box.y) player.y -= overlapY;
      else player.y += overlapY;
      player.dy = 0;
    }
  }
}

    // --- BOX COLLISIONS WITH SNAILS ---
    for (let s of [...snails, ...SuperSnails]) {
      if (isColliding(box, s)) resolveBoxCollision(box, s);
    }

    // Apply wall/ground friction
    const ground = getGroundSurface(box);
if (ground && ground.ice) {
  box.dx *= 0.99;
} else {
  box.dx *= box.friction; 
}
  }
}

// --- Helper to resolve box vs solid collisions ---
function resolveBoxCollision(box, solid) {
  const overlapX = Math.min(box.x + box.width - solid.x, solid.x + solid.width - box.x);
  const overlapY = Math.min(box.y + box.height - solid.y, solid.y + solid.height - box.y);

  if (overlapX < overlapY) {
    // Horizontal separation
    if (box.x < solid.x) box.x -= overlapX / 2;
    else box.x += overlapX / 2;

    if (solid.dx !== undefined) { // Moving object like player/snail
      box.dx = solid.dx * 0.8;
    } else {
      box.dx = 0;
    }
  } else {
    // Vertical separation
    if (box.y < solid.y) {
      box.y -= overlapY;
      box.dy = 0;
    } else {
      box.y += overlapY;
      box.dy = 0;
    }

    // If box is on top of a moving object, move with it slightly
    if (solid.dx !== undefined && box.y + box.height <= solid.y + solid.height + 1) {
      box.x += solid.dx * 0.8; 
    }
  }
    // Apply friction
    const ground = getGroundSurface(box);
    if (ground && ground.ice) {
      box.dx *= 0.99;
    } else {
      box.dx *= box.friction || 0.9;
    }
  }


function drawSpecialBoxes() {
  for (let box of boxes) {
    if (!box.type) box.type = BOX_TYPE.NORMAL;
    
    ctx.save();
    
    if (box.hitFlash > 0) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(box.x, box.y, box.width, box.height);
    }
    
    switch (box.type) {
      case BOX_TYPE.BOUNCY:
        drawBouncyBox(box);
        break;
      case BOX_TYPE.BREAKABLE:
        drawBreakableBox(box);
        break;
      case BOX_TYPE.HEAVY:
        drawHeavyBox(box);
        break;
      case BOX_TYPE.ICE:
        drawIceBox(box);
        break;
      default:
        drawNormalBox(box);
    }
    
    ctx.restore();
  }
}

function drawBouncyBox(b) {
  // Squishy spring box
  const squish = Math.sin(performance.now() * 0.01) * 2;
  
  // Main body - bright green
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(b.x, b.y + squish, b.width, b.height - squish * 2);
  
  // Spring coils
  ctx.strokeStyle = "#81c784";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(b.x + 8 + i * 7, b.y + b.height / 2, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Bounce indicator
  ctx.fillStyle = "#fff";
  ctx.font = "12px Arial";
  ctx.fillText("↑", b.x + b.width / 2 - 4, b.y + b.height / 2 + 4);
}

function drawBreakableBox(b) {
  // Cracked crate
  const healthPercent = b.hp / b.maxHp;
  
  // Base color gets darker as damaged
  const darkness = Math.floor((1 - healthPercent) * 100);
  ctx.fillStyle = `rgb(${139 - darkness}, ${90 - darkness}, ${43 - darkness})`;
  ctx.fillRect(b.x, b.y, b.width, b.height);
  
  // Cracks
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  
  if (healthPercent < 0.66) {
    ctx.beginPath();
    ctx.moveTo(b.x + 5, b.y);
    ctx.lineTo(b.x + 8, b.y + b.height);
    ctx.stroke();
  }
  
  if (healthPercent < 0.33) {
    ctx.beginPath();
    ctx.moveTo(b.x + b.width - 5, b.y + 5);
    ctx.lineTo(b.x + b.width - 8, b.y + b.height - 5);
    ctx.stroke();
  }

}

function drawHeavyBox(b) {
  // Dense metal box
  ctx.fillStyle = "#546e7a";
  ctx.fillRect(b.x, b.y, b.width, b.height);
  
  // Metal borders
  ctx.strokeStyle = "#37474f";
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x, b.y, b.width, b.height);
  
  // Rivets
  ctx.fillStyle = "#263238";
  for (let corner of [[4,4], [b.width-4, 4], [4, b.height-4], [b.width-4, b.height-4]]) {
    ctx.beginPath();
    ctx.arc(b.x + corner[0], b.y + corner[1], 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Weight indicator
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px Arial";
  ctx.fillText("H", b.x + b.width / 2 - 4, b.y + b.height / 2 + 4);
}

function drawIceBox(b) {
  // Frozen ice block
  ctx.fillStyle = "#b3e5fc";
  ctx.fillRect(b.x, b.y, b.width, b.height);
  
  // Ice shine
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(b.x + 4, b.y + 4, b.width - 8, 6);
  
  // Frost crystals
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const cx = b.x + 8 + i * 10;
    const cy = b.y + b.height / 2;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx, cy + 4);
    ctx.moveTo(cx - 3, cy);
    ctx.lineTo(cx + 3, cy);
    ctx.stroke();
  }
}

function drawNormalBox(b) {
  if (isChristmasMap()) {
    // Present box (existing code)
    ctx.fillStyle = "#c33";
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(b.x + b.width / 2 - 3, b.y, 6, b.height);
    ctx.fillRect(b.x, b.y + b.height / 2 - 3, b.width, 6);
    ctx.beginPath();
    ctx.arc(b.x + b.width / 2 - 6, b.y + 6, 4, 0, Math.PI * 2);
    ctx.arc(b.x + b.width / 2 + 6, b.y + 6, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Wood crate (existing code)
    ctx.fillStyle = "#a36a2f";
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    for (let y = b.y; y < b.y + b.height; y += 10) {
      ctx.beginPath();
      ctx.moveTo(b.x, y);
      ctx.lineTo(b.x + b.width, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#555";
    ctx.fillRect(b.x, b.y, 4, 4);
    ctx.fillRect(b.x + b.width - 4, b.y, 4, 4);
    ctx.fillRect(b.x, b.y + b.height - 4, 4, 4);
    ctx.fillRect(b.x + b.width - 4, b.y + b.height - 4, 4, 4);
  }
}

function createBreakEffect(x, y) {
  // Create particle debris
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const speed = 2 + Math.random() * 3;
    
    // You can add to a particles array if you have one
    // For now, just visual feedback
  }
}

// Damage box when hit by sword
function damageBox(box, damage) {
  if (box.type !== BOX_TYPE.BREAKABLE) return false;
  
  box.hp -= damage;
  box.hitFlash = 5;
  
  if (box.hp <= 0) {
    box.broken = true;
    return true;
  }
  
  return false;
}

const BAT_STATE = {
  PATROL: "patrol",
  CHASE: "chase",
  LUNGE: "lunge",
  RETREAT: "retreat"
};

function createBat(x, y, hp = 2) {
  return {
    x: x,
    y: y,
    width: 24,
    height: 20,
    
    // Movement
    dx: 0,
    dy: 0,
    speed: 2.5,
    lungeSpeed: 6,
    
    // AI
    state: BAT_STATE.PATROL,
    patrolCenterX: x,
    patrolCenterY: y,
    patrolRadius: 150,
    detectionRange: 300,
    lungeRange: 200,
    
    // Lunge mechanics
    lungeTimer: 0,
    lungeCooldown: 0,
    lungeTargetX: 0,
    lungeTargetY: 0,
    
    // Animation
    wingFlap: 0,
    facing: 1, // 1 = right, -1 = left
    
    // Health
    hp: hp,
    maxHp: hp,
    hitFlash: 0,
    
    // Knockback
    knockbackTimer: 0,
    knockbackDx: 0,
    knockbackDy: 0
  };
}

function updateBats() {
  for (let i = bats.length - 1; i >= 0; i--) {
    let bat = bats[i];
    
    // Remove dead bats
    if (bat.hp <= 0) {
      bats.splice(i, 1);
      onEnemyKilled('bat');
      continue;
    }
    
    // Knockback
    if (bat.knockbackTimer > 0) {
      bat.x += bat.knockbackDx;
      bat.y += bat.knockbackDy;
      bat.knockbackTimer--;
      bat.knockbackDx *= 0.9;
      bat.knockbackDy *= 0.9;
      continue;
    }
    
    // Hit flash
    if (bat.hitFlash > 0) bat.hitFlash--;
    
    // Wing flap animation
    bat.wingFlap += 0.15;
    
    // Distance to player
    const dx = player.x + player.width / 2 - (bat.x + bat.width / 2);
    const dy = player.y + player.height / 2 - (bat.y + bat.height / 2);
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);
    
    // Update facing
    if (dx > 0) bat.facing = 1;
    else if (dx < 0) bat.facing = -1;
    
    // Cooldown
    if (bat.lungeCooldown > 0) bat.lungeCooldown--;
    
    // === STATE MACHINE ===
    
    if (bat.state === BAT_STATE.PATROL) {
      // Circular patrol around spawn point
      const patrolAngle = performance.now() * 0.001 + i; // unique per bat
      const targetX = bat.patrolCenterX + Math.cos(patrolAngle) * bat.patrolRadius;
      const targetY = bat.patrolCenterY + Math.sin(patrolAngle) * bat.patrolRadius;
      
      const pdx = targetX - bat.x;
      const pdy = targetY - bat.y;
      const patrolDist = Math.sqrt(pdx * pdx + pdy * pdy);
      
      if (patrolDist > 5) {
        bat.dx = (pdx / patrolDist) * bat.speed * 0.6;
        bat.dy = (pdy / patrolDist) * bat.speed * 0.6;
      }
      
      // Detect player
      if (distToPlayer < bat.detectionRange) {
        bat.state = BAT_STATE.CHASE;
      }
    }
    
    else if (bat.state === BAT_STATE.CHASE) {
      // Move toward player
      bat.dx = (dx / distToPlayer) * bat.speed;
      bat.dy = (dy / distToPlayer) * bat.speed;
      
      // Lunge when close enough
      if (distToPlayer < bat.lungeRange && bat.lungeCooldown <= 0) {
        bat.state = BAT_STATE.LUNGE;
        bat.lungeTimer = 30; // frames
        bat.lungeTargetX = player.x + player.width / 2;
        bat.lungeTargetY = player.y + player.height / 2;
        bat.lungeCooldown = 90; // 1.5 seconds
      }
      
      // Return to patrol if player too far
      if (distToPlayer > bat.detectionRange + 100) {
        bat.state = BAT_STATE.PATROL;
      }
    }
    
    else if (bat.state === BAT_STATE.LUNGE) {
      bat.lungeTimer--;
      
      // Fast dive toward target
      const ldx = bat.lungeTargetX - bat.x;
      const ldy = bat.lungeTargetY - bat.y;
      const lungeDist = Math.sqrt(ldx * ldx + ldy * ldy);
      
      if (lungeDist > 5) {
        bat.dx = (ldx / lungeDist) * bat.lungeSpeed;
        bat.dy = (ldy / lungeDist) * bat.lungeSpeed;
      }
      
      // End lunge
      if (bat.lungeTimer <= 0 || lungeDist < 10) {
        bat.state = BAT_STATE.RETREAT;
        bat.lungeTimer = 20;
      }
    }
    
    else if (bat.state === BAT_STATE.RETREAT) {
      bat.lungeTimer--;
      
      // Move away from player
      bat.dx = -(dx / distToPlayer) * bat.speed * 1.2;
      bat.dy = -(dy / distToPlayer) * bat.speed * 1.2;
      
      if (bat.lungeTimer <= 0) {
        bat.state = BAT_STATE.CHASE;
      }
    }
    
    // Apply movement
    bat.x += bat.dx;
    bat.y += bat.dy;
    
    // Damping
    bat.dx *= 0.95;
    bat.dy *= 0.95;
    
    // Keep in bounds
    if (bat.x < 30) bat.x = 30;
    if (bat.x > MAP_WIDTH - 30) bat.x = MAP_WIDTH - 30;
    if (bat.y < 30) bat.y = 30;
    if (bat.y > MAP_HEIGHT - 30) bat.y = MAP_HEIGHT - 30;
    
    // Damage player on contact
    if (isColliding(bat, player)) {
      loseLife();
    }
  }
}

function drawBats() {
  for (let bat of bats) {
    ctx.save();
    
    // Hit flash
    if (bat.hitFlash > 0) {
      ctx.fillStyle = "#f00";
    } else if (bat.state === BAT_STATE.LUNGE) {
      ctx.fillStyle = "#c44"; // red when lunging
    } else {
      ctx.fillStyle = "#6b4c8a"; // purple
    }
    
    // Body
    ctx.beginPath();
    ctx.ellipse(
      bat.x + bat.width / 2,
      bat.y + bat.height / 2,
      bat.width / 2,
      bat.height / 2,
      0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Wings (animated)
    const wingSpread = Math.sin(bat.wingFlap) * 8;
    
    ctx.fillStyle = bat.hitFlash > 0 ? "#f00" : "#4a3a5a";
    
    // Left wing
    ctx.beginPath();
    ctx.moveTo(bat.x + bat.width / 2, bat.y + bat.height / 2);
    ctx.lineTo(bat.x - wingSpread, bat.y + bat.height / 2 - 6);
    ctx.lineTo(bat.x - wingSpread - 6, bat.y + bat.height / 2 + 4);
    ctx.closePath();
    ctx.fill();
    
    // Right wing
    ctx.beginPath();
    ctx.moveTo(bat.x + bat.width / 2, bat.y + bat.height / 2);
    ctx.lineTo(bat.x + bat.width + wingSpread, bat.y + bat.height / 2 - 6);
    ctx.lineTo(bat.x + bat.width + wingSpread + 6, bat.y + bat.height / 2 + 4);
    ctx.closePath();
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = "#ff0";
    if (bat.state === BAT_STATE.LUNGE) {
      ctx.fillStyle = "#f00"; // red eyes when attacking
    }
    
    const eyeX = bat.facing > 0 ? bat.x + 14 : bat.x + 6;
    ctx.fillRect(eyeX, bat.y + 8, 3, 3);
    ctx.fillRect(eyeX + 4, bat.y + 8, 3, 3);
    
    ctx.restore();
  }
}

// Add bat to wave spawn
function spawnBat(x, y, hp) {
  bats.push(createBat(x, y, hp));
  createSpawnEffect(x, y);
}

const player = {
  x: 50,
  y: 50,
  dx: 0,
  dy: 0,
  width: 32,
  height: 32,
  speed: 3,
  jumpPower: 11,
  wallJumpPower: 11,
  onGround: false,
  onWall: false,
  wallDir: 0,
  wallJumpBoost: 0,
  prevOnGround: false,
  
  attacking: false,
  attackDuration: 10, // frames
  attackTimer: 0,
  attackCooldown: 30, // frames
  attackDir: 1 // 1 = right, -1 = left
};

player.facing = 1; // 1 = right, -1 = left, default right

player.attackCharging = false;
player.attackChargeTime = 0;
player.maxChargeTime = 30;       // frames to fully charge
player.attackTimer = 0;          // counts down swing duration
player.attackCooldown = 0;       // prevents spamming
player.attackDuration = 20;      // frames the swing lasts
player.attackKnockback = 2;      // scales with charge
player.attackHitObjects = new Set(); // track hits per swing

// --- DASH ---
player.dashSpeed = 14;
player.dashDuration = 0;       // frames remaining in dash
player.dashMaxDuration = 12;   // how long the dash lasts
player.dashCooldown = 0;
player.dashMaxCooldown = 50;   // ~0.8s at 60fps
player.dashUsedInAir = false;  // one air dash per jump
player.dashActive = false;

function addEnemyHealth() {
  // Snails get 1-2 HP
  for (let s of snails) {
    if (!s.hp) s.hp = 1;
    if (!s.maxHp) s.maxHp = s.hp;
  }
  
  // Super Snails get 3-4 HP
  for (let s of SuperSnails) {
    if (!s.hp) s.hp = 3;
    if (!s.maxHp) s.maxHp = s.hp;
  }
  
  // Yetis already have HP in your code (5)
  for (let y of yetis) {
    if (!y.hp) y.hp = 5;
    if (!y.maxHp) y.maxHp = y.hp;
  }
  
  // Snowmen get 4 HP
  for (let s of snowmen) {
    if (!s.hp) s.hp = 4;
    if (!s.maxHp) s.maxHp = s.hp;
  }
  
  // Turrets get 2 HP (can be destroyed!)
  for (let t of turrets) {
    if (!t.hp) t.hp = 2;
    if (!t.maxHp) t.maxHp = t.hp;
  }
}

// Handle damage to enemies
function damageEnemy(enemy, damage, knockbackDir) {
  if (!enemy.hp) enemy.hp = 1; // safety
  
  enemy.hp -= damage;
  
  // Apply knockback
  enemy.knockbackTimer = 10;
  enemy.knockbackDx = knockbackDir.x;
  enemy.knockbackDy = knockbackDir.y;
  
  // Visual hit flash
  enemy.hitFlash = 5; // frames to show red
  
  // Death
  if (enemy.hp <= 0) {
    enemy.dead = true;
    return true; // enemy died
  }
  
  return false; // enemy survived
}

// Draw health bars for all enemies
function drawEnemyHealthBars() {
  ctx.save();
  
  // Snails
  for (let s of snails) {
    if (!s.hp || s.hp <= 0) continue;
    
    const barWidth = 24;
    const barHeight = 4;
    const x = s.x + (s.width - barWidth) / 2;
    const y = s.y - 8;
    
    // Background
    ctx.fillStyle = "#300";
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Health
    const healthPercent = s.hp / s.maxHp;
    ctx.fillStyle = healthPercent > 0.5 ? "#0f0" : healthPercent > 0.25 ? "#ff0" : "#f00";
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    // Border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }
  for (let c of chairs) {
    if (!c.hp || c.hp <= 0) continue;
    const barWidth = 32;
    const barHeight = 4;
    const x = c.x + (c.width - barWidth) / 2;
    const y = c.y - 8;
    ctx.fillStyle = "#300";
    ctx.fillRect(x, y, barWidth, barHeight);
    const hp = c.hp / c.maxHp;
    ctx.fillStyle = hp > 0.5 ? "#0f0" : hp > 0.25 ? "#ff0" : "#f00";
    ctx.fillRect(x, y, barWidth * hp, barHeight);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }
  for (let b of bats) {
    if (!b.hp || b.hp <= 0) continue;
    
    const barWidth = 24;
    const barHeight = 4;
    const x = b.x + (b.width - barWidth) / 2;
    const y = b.y - 8;
    
    // Background
    ctx.fillStyle = "#300";
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Health
    const healthPercent = b.hp / b.maxHp;
    ctx.fillStyle = healthPercent > 0.5 ? "#0f0" : healthPercent > 0.25 ? "#ff0" : "#f00";
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    // Border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }
  // Super Snails
  for (let s of SuperSnails) {
    if (!s.hp || s.hp <= 0) continue;
    
    const barWidth = 28;
    const barHeight = 4;
    const x = s.x + (s.width - barWidth) / 2;
    const y = s.y - 8;
    
    ctx.fillStyle = "#300";
    ctx.fillRect(x, y, barWidth, barHeight);
    
    const healthPercent = s.hp / s.maxHp;
    ctx.fillStyle = healthPercent > 0.5 ? "#0f0" : healthPercent > 0.25 ? "#ff0" : "#f00";
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }
  
  // Yetis
  for (let y of yetis) {
    if (!y.alive || !y.hp || y.hp <= 0) continue;
    
    const barWidth = 40;
    const barHeight = 5;
    const x = y.x + (y.width - barWidth) / 2;
    const yPos = y.y - 10;
    
    ctx.fillStyle = "#300";
    ctx.fillRect(x, yPos, barWidth, barHeight);
    
    const healthPercent = y.hp / y.maxHp;
    ctx.fillStyle = healthPercent > 0.5 ? "#0f0" : healthPercent > 0.25 ? "#ff0" : "#f00";
    ctx.fillRect(x, yPos, barWidth * healthPercent, barHeight);
    
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, yPos, barWidth, barHeight);
  }
  
  // Snowmen
  for (let s of snowmen) {
    if (!s.hp || s.hp <= 0) continue;
    
    const barWidth = 30;
    const barHeight = 4;
    const x = s.x + (s.width - barWidth) / 2;
    const y = s.y - 8;
    
    ctx.fillStyle = "#300";
    ctx.fillRect(x, y, barWidth, barHeight);
    
    const healthPercent = s.hp / s.maxHp;
    ctx.fillStyle = healthPercent > 0.5 ? "#0f0" : healthPercent > 0.25 ? "#ff0" : "#f00";
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }
  
  // Turrets
  for (let t of turrets) {
    if (!t.hp || t.hp <= 0) continue;
    
    const barWidth = 32;
    const barHeight = 4;
    const x = t.x;
    const y = t.y - 6;
    
    ctx.fillStyle = "#300";
    ctx.fillRect(x, y, barWidth, barHeight);
    
    const healthPercent = t.hp / t.maxHp;
    ctx.fillStyle = healthPercent > 0.5 ? "#0f0" : healthPercent > 0.25 ? "#ff0" : "#f00";
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }
  
  ctx.restore();
}

// Update hit flash effect
function updateEnemyHitFlashes() {
  for (let s of [...snails, ...SuperSnails, ...snowmen]) {
    if (s.hitFlash > 0) s.hitFlash--;
  }
  
  for (let y of yetis) {
    if (y.hitFlash > 0) y.hitFlash--;
  }
  
  for (let t of turrets) {
    if (t.hitFlash > 0) t.hitFlash--;
  }
}

// === ADVANCED WAVE SYSTEM ===

let waveSystem = {
  enabled: false,
  currentWave: 0,
  enemiesRemaining: 0,
  waveActive: false,
  timeBetweenWaves: 180,
  waveTimer: 0,
  totalEnemiesKilled: 0,
  
  spawnQueue: [],
  spawnTimer: 0,
  
  // Current map's wave configuration
  currentMapWaves: null
};

// === WAVE DEFINITIONS PER MAP ===

const waveConfigurations = {
  // Level 1 Waves - Tutorial-style progression
  level1:
  [
    {
      name: "First Contact",
      enemies: [
        { type: "snail", count: { min: 2, max: 3 }, hp: 1 }
      ],
      spawnDelay: 60,
      message: "🌊 Wave 1: First Contact"
    },
    {
      name: "Air Assault",
      enemies: [
        { type: "bat", count: { min: 2, max: 4 }, hp: 2 },
        { type: "snail", count: 3, hp: 1 }
      ],
      spawnDelay: 50,
      message: "🦇 From Above!"
    },
    {
      name: "Double Trouble",
      enemies: [
        { type: "snail", count: { min: 3, max: 4 }, hp: 1 },
        { type: "turret", count: 1, hp: 2 }
      ],
      spawnDelay: 50,
      message: "🌊 Wave 2: Double Trouble"
    },
    {
      name: "Speed Demons",
      enemies: [
        { type: "snail", count: 2, hp: 1 },
        { type: "superSnail", count: { min: 1, max: 2 }, hp: 3 }
      ],
      spawnDelay: 45,
      message: "🌊 Wave 3: Speed Demons"
    },
    {
      name: "Mixed Assault",
      enemies: [
        { type: "snail", count: { min: 3, max: 5 }, hp: 1 },
        { type: "superSnail", count: 2, hp: 3 },
        { type: "turret", count: { min: 1, max: 2 }, hp: 2 }
      ],
      spawnDelay: 40,
      message: "🌊 Wave 4: Mixed Assault"
    },
    {
      name: "Boss Wave",
      enemies: [
        { type: "snail", count: 4, hp: 2 }, // tougher snails
        { type: "superSnail", count: 3, hp: 4 },
        { type: "turret", count: 2, hp: 3 }
      ],
      spawnDelay: 35,
      message: "⚔️ BOSS WAVE!"
    },
    // Wave 6+ uses random generation
    {
      name: "Random Wave",
      random: true,
      randomConfig: {
        enemyPool: ["snail", "superSnail", "turret"],
        totalEnemies: { min: 8, max: 12 },
        hpMultiplier: 1.2
      },
      spawnDelay: 35,
      message: "🎲 Random Wave"
    }
  ],
  
  // Level 2 Waves - More complex
  level2: [
    {
      name: "Warm Up",
      enemies: [
        { type: "snail", count: { min: 4, max: 5 }, hp: 1 },
        { type: "turret", count: 1, hp: 2 }
      ],
      spawnDelay: 50
    },
    {
      name: "Swarm",
      enemies: [
        { type: "snail", count: { min: 6, max: 8 }, hp: 1 }
      ],
      spawnDelay: 30,
      message: "🐌 SNAIL SWARM!"
    },
    {
      name: "Elite Squad",
      enemies: [
        { type: "superSnail", count: { min: 3, max: 5 }, hp: 4 },
        { type: "turret", count: 2, hp: 3 }
      ],
      spawnDelay: 40
    },
    {
      name: "Random Chaos",
      random: true,
      randomConfig: {
        enemyPool: ["snail", "superSnail", "turret"],
        totalEnemies: { min: 10, max: 15 },
        hpMultiplier: 1.3
      },
      spawnDelay: 35
    }
  ],
  
  // Level 3 Waves - Christmas themed
  level3: [
    {
      name: "Winter Greeting",
      enemies: [
        { type: "snail", count: { min: 2, max: 3 }, hp: 1 },
        { type: "snowman", count: 1, hp: 4 }
      ],
      spawnDelay: 60,
      message: "❄️ Winter is Coming"
    },
    {
      name: "Frosty Friends",
      enemies: [
        { type: "snowman", count: { min: 2, max: 3 }, hp: 4 },
        { type: "turret", count: 1, hp: 2 }
      ],
      spawnDelay: 50
    },
    {
      name: "Ice & Fire",
      enemies: [
        { type: "snail", count: 3, hp: 1 },
        { type: "snowman", count: 2, hp: 5 },
        { type: "turret", count: { min: 2, max: 3 }, hp: 2 }
      ],
      spawnDelay: 45
    },
    {
      name: "Yeti Attack",
      enemies: [
        { type: "yeti", count: { min: 1, max: 2 }, hp: 6 },
        { type: "snowman", count: { min: 1, max: 2 }, hp: 4 }
      ],
      spawnDelay: 50,
      message: "🦣 YETI ATTACK!"
    },
    {
      name: "Winter Boss",
      enemies: [
        { type: "yeti", count: 2, hp: 8 },
        { type: "snowman", count: 3, hp: 6 },
        { type: "superSnail", count: 2, hp: 4 }
      ],
      spawnDelay: 40,
      message: "❄️⚔️ WINTER BOSS WAVE!"
    },
    {
      name: "Endless Winter",
      random: true,
      randomConfig: {
        enemyPool: ["snail", "superSnail", "yeti", "snowman", "turret"],
        totalEnemies: { min: 10, max: 15 },
        hpMultiplier: 1.4
      },
      spawnDelay: 35
    }
  ],
  
  // Level 4 Waves - Chaos
  level4: [
    {
      name: "Box Chaos Start",
      enemies: [
        { type: "snail", count: { min: 10, max: 15 }, hp: 1 }
      ],
      spawnDelay: 20,
      message: "📦 CHAOS BEGINS"
    },
    {
      name: "Everything",
      random: true,
      randomConfig: {
        enemyPool: ["snail", "superSnail", "turret"],
        totalEnemies: { min: 20, max: 30 },
        hpMultiplier: 1.5
      },
      spawnDelay: 25
    }
  ]
};

// Generate a random wave based on config
function generateRandomWave(config) {
  const totalEnemies = typeof config.totalEnemies === 'number' 
    ? config.totalEnemies 
    : randomBetween(config.totalEnemies.min, config.totalEnemies.max);
  
  const enemies = [];
  
  for (let i = 0; i < totalEnemies; i++) {
    const enemyType = config.enemyPool[Math.floor(Math.random() * config.enemyPool.length)];
    
    // Base HP per enemy type
    const baseHP = {
      snail: 1,
      superSnail: 3,
      turret: 2,
      yeti: 5,
      snowman: 4
    };
    
    enemies.push({
      type: enemyType,
      count: 1,
      hp: Math.ceil(baseHP[enemyType] * (config.hpMultiplier || 1))
    });
  }
  
  return { enemies };
}

// Random number between min and max (inclusive)
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Initialize wave mode for a level
function startWaveMode(levelNumber) {
  waveSystem.enabled = true;
  waveSystem.currentWave = 0;
  waveSystem.enemiesRemaining = 0;
  waveSystem.waveActive = false;
  waveSystem.waveTimer = 180; // 3 second delay before first wave
  waveSystem.totalEnemiesKilled = 0;
  waveSystem.spawnQueue = [];
  
  // Load wave config for this level
  const levelKey = `level${levelNumber}`;
  waveSystem.currentMapWaves = waveConfigurations[levelKey] || waveConfigurations.level1;
  
  // Clear existing enemies
  snails = [];
  SuperSnails = [];
  yetis = [];
  snowmen = [];
  turrets = [];
  bats = [];
  
  potatoMessage = "🌊 WAVE MODE STARTING...";
  potatoMessageTimer = 120;
}

// Start the next wave
function startNextWave() {
  waveSystem.currentWave++;
  waveSystem.waveActive = true;
  waveSystem.waveTimer = 0;
  
  // Get wave config
  let waveIndex = Math.min(waveSystem.currentWave - 1, waveSystem.currentMapWaves.length - 1);
  let waveConfig = waveSystem.currentMapWaves[waveIndex];
  
  // If this is a random wave, generate it
  if (waveConfig.random) {
    const generated = generateRandomWave(waveConfig.randomConfig);
    waveConfig = { ...waveConfig, ...generated };
  }
  
  // Show wave message
  if (waveConfig.message) {
    potatoMessage = waveConfig.message;
  } else {
    potatoMessage = `🌊 Wave ${waveSystem.currentWave}`;
  }
  potatoMessageTimer = 120;
  
  // Build spawn queue
  waveSystem.spawnQueue = [];
  let delayCounter = 0;
  
  for (let enemyDef of waveConfig.enemies) {
    // Determine count (can be fixed number or range)
    let count;
    if (typeof enemyDef.count === 'number') {
      count = enemyDef.count;
    } else {
      count = randomBetween(enemyDef.count.min, enemyDef.count.max);
    }
    
    // Add to spawn queue
    for (let i = 0; i < count; i++) {
      waveSystem.spawnQueue.push({
        type: enemyDef.type,
        hp: enemyDef.hp,
        delay: delayCounter
      });
      delayCounter += waveConfig.spawnDelay;
    }
  }
  
  // Shuffle spawn queue for variety
  waveSystem.spawnQueue.sort(() => Math.random() - 0.5);
  
  waveSystem.enemiesRemaining = waveSystem.spawnQueue.length;
  waveSystem.spawnTimer = 0;
}

// Spawn positions for different enemy types
function getSpawnPosition(type) {
  // Get valid spawn zones based on current level
  let spawnZones = [];
  
  if (currentLevel === 1) {
    spawnZones = [
      { x: 100, y: 200 },
      { x: 800, y: 400 },
      { x: 1500, y: 1000 },
      { x: 2200, y: 400 }
    ];
  } else if (currentLevel === 2) {
    spawnZones = [
      { x: 200, y: 1000 },
      { x: 1000, y: 875 },
      { x: 2000, y: 900 }
    ];
  } else if (currentLevel === 3) {
    spawnZones = [
      { x: 300, y: 100 },
      { x: 900, y: 100 },
      { x: 1500, y: 100 },
      { x: 2100, y: 100 }
    ];
  } else {
    spawnZones = [
      { x: 200, y: 100 },
      { x: 1400, y: 100 },
      { x: 2400, y: 100 }
    ];
  }
  
  // Pick random spawn zone
  let zone = spawnZones[Math.floor(Math.random() * spawnZones.length)];
  
  return {
    x: zone.x + (Math.random() - 0.5) * 100,
    y: zone.y
  };
}

// Spawn an enemy with custom HP
function spawnEnemy(type, hp) {
  let pos = getSpawnPosition(type);
  
  switch(type) {
    case 'snail':
      snails.push({
        x: pos.x + Math.random() * 100,
        y: pos.y,
        width: 28,
        height: 20,
        dx: 0,
        dy: 0,
        dir: Math.random() > 0.5 ? 1 : -1,
        speed: 0.6 + Math.random() * 0.3,
        gravity: 0.6,
        chaseRange: 400 + Math.random() * 200,
        knockbackTimer: 0,
        knockbackDx: 0,
        knockbackDy: 0,
        hp: hp || 1,
        maxHp: hp || 1,
        hitFlash: 0,
        frame: 0, 
        frameTimer: 0
      });
      break;
      
    case 'superSnail':
      SuperSnails.push({
        x: pos.x + Math.random() * 100,
        y: pos.y,
        width: 28,
        height: 20,
        dx: 0,
        dy: 0,
        speed: 1.2 + Math.random() * 1,
        gravity: 0.5,
        dir: Math.random() > 0.5 ? 1 : -1,
        jumpPower: -14,
        mode: "ground",
        knockbackTimer: 0,
        knockbackDx: 0,
        knockbackDy: 0,
        jumpTimer: 0,
        lastWallSide: null,
        prevMode: "ground",
        hp: hp || 3,
        maxHp: hp || 3,
        hitFlash: 0
      });
      break;
      
    case 'turret':
      turrets.push({
        x: pos.x,
        y: pos.y,
        width: 40,  // REQUIRED for collision
        height: 40, // REQUIRED for collision
        cooldown: 0,
        fireRate: 120 + Math.random() * 100,
        hp: hp || 2,
        maxHp: hp || 2,
        hitFlash: 0
      });
      break;
      
    case 'yeti':
      if (isChristmasMap()) {
        yetis.push({
          x: pos.x,
          y: pos.y + 1100,
          width: 48,
          height: 64,
          dx: 0,
          dy: 0,
          dead: false,
          speed: 1.2,
          chaseRange: 500,
          hp: hp || 5,
          maxHp: hp || 5,
          alive: true,
          throwCooldown: 0,
          facing: 1,
          knockbackTimer: 0,
          knockbackDx: 0,
          knockbackDy: 0,
          hitFlash: 0
        });
      }
      break;
      
    case 'bat':
    spawnBat(pos.x, pos.y, hp || 2);
    break;
      
    case 'snowman':
      if (isChristmasMap()) {
        snowmen.push({
          x: pos.x,
          y: pos.y + 1100,
          width: 26,
          height: 38,
          speed: 0.6 + Math.random() * 1,
          slowRadius: 140,
          slowAmount: 0.45,
          dx: 0,
          facing: 1,
          flurryParticles: [],
          hp: hp || 4,
          maxHp: hp || 4,
          hitFlash: 0
        });
      }
      break;
      
  }
  
  // Spawn particle effect
  createSpawnEffect(pos.x, pos.y);
}

function createSpawnEffect(x, y) {
  for (let i = 0; i < 12; i++) {
    if (isChristmasMap()) {
      snowParticles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y - 20,
        speed: 2 + Math.random() * 2,
        size: 2 + Math.random() * 2,
        drift: (Math.random() - 0.5) * 2,
        life: 30
      });
    }
  }
}

// Update wave system
function updateWaveSystem() {
  if (!waveSystem.enabled) return;
  
  // Process spawn queue
  if (waveSystem.spawnQueue.length > 0) {
    waveSystem.spawnTimer++;
    
    for (let i = waveSystem.spawnQueue.length - 1; i >= 0; i--) {
      let spawn = waveSystem.spawnQueue[i];
      
      if (waveSystem.spawnTimer >= spawn.delay) {
        spawnEnemy(spawn.type, spawn.hp);
        waveSystem.spawnQueue.splice(i, 1);
      }
    }
  }
  
  // Check if wave is complete
  if (waveSystem.waveActive && waveSystem.spawnQueue.length === 0) {
    let aliveCount = 0;
    
    aliveCount += snails.filter(s => s.hp > 0).length;
    aliveCount += SuperSnails.filter(s => s.hp > 0).length;
    aliveCount += yetis.filter(y => y.alive && y.hp > 0).length;
    aliveCount += snowmen.filter(s => s.hp > 0).length;
    aliveCount += turrets.filter(t => t.hp > 0).length;
    aliveCount += bats.filter(b => b.hp > 0).length;
    if (aliveCount === 0) {
      waveSystem.waveActive = false;
      waveSystem.waveTimer = waveSystem.timeBetweenWaves;
      
      giveWaveReward();
      
      potatoMessage = `✅ Wave ${waveSystem.currentWave} Complete!`;
      potatoMessageTimer = 180;
    }
  }
  
  // Start next wave after delay
  if (!waveSystem.waveActive && waveSystem.waveTimer > 0) {
    waveSystem.waveTimer--;
    
    if (waveSystem.waveTimer === 0) {
      startNextWave();
    }
  }
}

// Give player a reward
function giveWaveReward() {
  if (playerLives < maxLives) {
    playerLives++;
    potatoHUDLine = "❤️ Life restored!";
  }
  
  if (waveSystem.currentWave % 3 === 0) {
    player.jumpPower *= 1.03;
    player.speed *= 1.03;
    potatoHUDLine = "⚡ Power increased!";
  }
   setTimeout(() => { potatoHUDLine = ""; }, 3000); 
}

// Track enemy death
function onEnemyKilled(enemyType) {
  if (!waveSystem.enabled) return;
  waveSystem.totalEnemiesKilled++;
}

// Draw wave UI
function drawWaveUI() {
  if (!waveSystem.enabled || gameOver) return;
  
  ctx.save();
  
  ctx.fillStyle = "#fff";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "right";
  ctx.fillText(`Wave ${waveSystem.currentWave}`, canvas.width - 20, 30);
  
  if (waveSystem.waveActive) {
    let aliveCount = 0;
    aliveCount += snails.filter(s => s.hp > 0).length;
    aliveCount += SuperSnails.filter(s => s.hp > 0).length;
    aliveCount += yetis.filter(y => y.alive && y.hp > 0).length;
    aliveCount += snowmen.filter(s => s.hp > 0).length;
    aliveCount += turrets.filter(t => t.hp > 0).length;
    aliveCount += bats.filter(b => b.hp > 0).length;
    
    ctx.font = "18px Arial";
    ctx.fillText(`Enemies: ${aliveCount}`, canvas.width - 20, 55);
  }
  
  if (!waveSystem.waveActive && waveSystem.waveTimer > 0) {
    let seconds = Math.ceil(waveSystem.waveTimer / 60);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffcc00";
    ctx.fillText(`Next wave: ${seconds}s`, canvas.width - 20, 55);
  }
  
  ctx.font = "16px Arial";
  ctx.fillStyle = "#aaa";
  ctx.fillText(`Kills: ${waveSystem.totalEnemiesKilled}`, canvas.width - 20, 80);
  
  ctx.textAlign = "left";
  ctx.restore();
}

// Start wave mode for a level
function startWaveModeLevel(level) {
  hideAllMenus();
  document.getElementById("game").style.display = "block";
  
  stopGameLoop();
  resetGameState();
  loadLevel(level);
  startMusic();
  startWaveMode(level);
  
  gameRunning = true;
  gamePaused = false;
  lastFrameTime = performance.now();
  lastTimestamp = performance.now();
  
  gameLoopId = requestAnimationFrame(gameLoop);
}


const keys = {};

const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  smoothFactor: 0.1
};

// --- WORLD SETTINGS ---
const world = {
  width: 2800,  // how wide your level is
  height: 2100  // how tall your level is
};

function hideAllMenus() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("levelSelect").classList.add("hidden");
  document.getElementById("waveSelect").classList.add("hidden");
 
   document.getElementById("freeSelect").classList.add("hidden");
  document.getElementById("settings").classList.add("hidden");
  document.getElementById("pauseMenu").classList.add("hidden");
}

// AABB collision
function isColliding(a, b) {
    const aWidth = a.width ?? a.size;   // use size if width not defined
    const aHeight = a.height ?? a.size; // use size if height not defined
    const bWidth = b.width ?? b.size;
    const bHeight = b.height ?? b.size;

    return (
        a.x < b.x + bWidth &&
        a.x + aWidth > b.x &&
        a.y < b.y + bHeight &&
        a.y + aHeight > b.y
    );
}

// Check if a rectangle collides with any wall
function collidesWithWall(x, y, w, h) {
  for (let wall of walls) {
    if (
      x < wall.x + wall.width &&
      x + w > wall.x &&
      y < wall.y + wall.height &&
      y + h > wall.y
    ) return true;
  }
  return false;
}


function resetGameState() {
  
    if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
  // Reset player
  player.x = 100;
  player.y = 100;
  player.dx = 0;
  player.dy = 0;
  
  player.jumpPower = 11;
  player.wallJumpPower = 11;
  player.speed = 3
  // Reset lives & flags
  playerLives = maxLives;
  gameOver = false;
  gamePaused = false;
  gameRunning = false;
  player.attacking = false;

  generatedTiles = [];
  enemies = [];
  fireballs = [];
  timeElapsed = 0;
 hasPotato = false;
  potato.collected = false;

  cannonProjectiles = [];
  explosions = [];
  cannonCooldown = 0;
  syncJoystickVisibility();
  potatoMessage = "";
  potatoMessageTimer = 0;
  potatoHUDLine = "";
  potatoState = "none";
  // "none" | "raw" | "baked"
  if (initialChairs && initialChairs.length) chairs = initialChairs.map(c => ({ ...c }));
  if (initialBoxes && initialBoxes.length) boxes = initialBoxes.map(b => ({ ...b }));
  if (initialSnails && initialSnails.length) snails = initialSnails.map(s => ({ ...s }));
  if (initialSuperSnails && initialSuperSnails.length) SuperSnails = initialSuperSnails.map(s => ({ ...s }));
  if (initialWalls && initialWalls.length) walls = initialWalls.map(w => ({ ...w }));
  if (initialSpikes && initialSpikes.length) spikes = initialSpikes.map(s => ({ ...s }));
  if (initialLadders && initialLadders.length) ladders = initialLadders.map(l => ({ ...l }));

  // Cancel the animation frame if scheduled
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}


function triggerGameOver() {
  stopGameLoop();          // stop loop immediately
  resetGameState();        // reset everything
  hideAllMenus();
  document.getElementById("menu").classList.remove("hidden");
}

function stopGameLoop() {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
  gameRunning = false;
}


// === LEVEL BUILDER MODULE ===
// Utility functions to easily build platforms, ladders, spikes, and boxes.

function addPlatform(x, y, width, height, moving = false, dir = 1) {
  walls.push({ x, y, width, height, moving, dir });
}

function addLadder(x, y, width, height) {
  ladders.push({ x, y, width, height });
}

function addSpike(x, y, width = 40, height = 26) {
  spikes.push({ x, y, width, height });
}

function addBox(x, y, width = 32, height = 32) {
  boxes.push({ x, y, width, height, dx: 0, dy: 0 });
}

// Example: helper pattern for a staircase of platforms
function addStaircase(startX, startY, stepWidth, stepHeight, steps, rise) {
  for (let i = 0; i < steps; i++) {
    addPlatform(startX + i * stepWidth, startY - i * rise, stepWidth, stepHeight);
  }
}

function seesawSurfaceY(s, x) {
  const centerX = s.x + s.width / 2;
  const dx = x - centerX;
  return s.y + Math.sin(s.angle) * dx;
}

/*function handleSwordHit() {
  if (!player.attacking) return;

  const attackBox = {
    x: player.attackDir > 0 ? player.x + player.width : player.x - 20,
    y: player.y,
    width: 20,
    height: player.height
  };

  for (let s of snails.concat(SuperSnails)) {
    if (
      attackBox.x < s.x + s.width &&
      attackBox.x + attackBox.width > s.x &&
      attackBox.y < s.y + s.height &&
      attackBox.y + attackBox.height > s.y
    ) {
      // Apply knockback
      s.knockbackDx = 5 * player.attackDir; // push left/right
      s.knockbackDy = -5;                   // lift slightly
      s.knockbackTimer = 10;                // lasts 10 frames
    }
  }
}
*/

function saveInitialState() {
  initialBoxes = boxes.map(b => ({ ...b }));
  initialSnails = snails.map(s => ({ ...s }));
  initialSuperSnails = SuperSnails.map(s => ({ ...s }));
  initialWalls = walls.map(w => ({ ...w }));
  initialSpikes = spikes.map(s => ({ ...s }));
  initialLadders = ladders.map(l => ({ ...l }));
  initialChairs = chairs.map(c => ({ ...c }));
  
  
}

function bakePotato(oven) {
  oven.used = true;
  potatoState = "baked";

  potatoMessage = "🥔🔥 we are cooked.";
  potatoMessageTimer = 180;

  activatePotatoChaosLevel2();
}

function updateFireballs() {
    for (let i = fireballs.length - 1; i >= 0; i--) {
        const f = fireballs[i];

        // Apply velocity
        f.x += f.vx;
        f.y += f.vy;

      
        // Gravity optional (comment out if you want straight shots)
        f.vy += -0.01;

          // 🔥 IGNITE OVEN
    for (let i = ovens.length - 1; i >= 0; i--) {
  const oven = ovens[i];

  if (oven.baked || oven.active) continue;

  if (
    f.x > oven.x &&
    f.x < oven.x + oven.width &&
    f.y > oven.y &&
    f.y < oven.y + oven.height
  ) {
    oven.active = true;
    oven.glow = 0;

      potatoMessage = "🥔 the oven awakens";
      potatoMessageTimer = 120;

      fireballs.splice(i, 1); // consume fireball
      continue;
    }
    }     
 if (player.sword && player.sword.active) {
            const s = player.sword;

            if (
                f.x < s.x + s.width &&
                f.x + f.size > s.x &&
                f.y < s.y + s.height &&
                f.y + f.size > s.y
            ) {
                // Reflect fireball horizontally away from player center
                const centerX = player.x + player.width / 2;

                if (f.x < centerX) f.vx = -Math.abs(f.vx); // bounce left
                else f.vx = Math.abs(f.vx); // bounce right

                // Slight upward kick so it feels like a ricochet
                f.vy -= 0.5;

                continue; // DO NOT allow box/player checks this frame
            }
        }


        // Collision with walls
        if (collidesWithWall(f.x, f.y, f.size, f.size)) {
            fireballs.splice(i, 1);
            continue;
        }

         // Collision with boxes
        for (let j = 0; j < boxes.length; j++) {
            const box = boxes[j];
            if (isColliding(f, box)) {
                // Knockback: push the box slightly away
                const dx = box.x + box.width/2 - f.x;
                const dy = box.y + box.height/2 - f.y;
                const mag = Math.sqrt(dx*dx + dy*dy) || 2;
                const knockback = 20; // tweak this value for stronger push

              box.x += (dx / mag) * (knockback * 2);
              box.y += (dy / mag) * -knockback;

                fireballs.splice(i, 1); // destroy fireball
                break; // stop checking boxes
            }
        }
        // Collision with player
        if (
            player.x < f.x + f.size &&
            player.x + player.width > f.x &&
            player.y < f.y + f.size &&
            player.y + player.height > f.y
        ) {
            loseLife();
            fireballs.splice(i, 1);
          
        }
    }
}

function updateYetis() {
  for (let y of yetis) {
    if (!y.alive) continue;

    const dx = player.x - y.x;
    const dy = player.y - y.y;
    const dist = Math.hypot(dx, dy);

    // Face player
    y.facing = dx >= 0 ? 1 : -1;

    // Chase player
    if (dist < y.chaseRange) {
      y.dx = Math.sign(dx) * y.speed;
    } else {
      y.dx = 0;
    }

    y.x += y.dx;

    // Throw snowballs
    if (dist < 450 && y.throwCooldown <= 0) {
      throwSnowball(y);
      y.throwCooldown = 90; // cooldown frames
    }

    if (y.throwCooldown > 0) y.throwCooldown--;
  }
}

function throwSnowball(y) {
  const speed = 6;
  const dx = player.x - y.x;
  const dy = player.y - y.y;
  const dist = Math.hypot(dx, dy) || 1;

  snowballs.push({
  x: y.x + y.width / 2 - 6,
  y: y.y + 20 - 6,
  width: 12,
  height: 12,
  dx: (dx / dist) * speed,
  dy: (dy / dist) * speed - 2,
  alive: true
});
}

function updateSnowballs() {
  for (let s of snowballs) {
    if (!s.alive) continue;

    s.x += s.dx;
    s.y += s.dy;
    s.dy += 0.25; // gravity

    // Kill player
    if (rectsOverlap(s, player)) {
      loseLife();
      s.alive = false;
    }

    // Remove if off world
    if (s.y > world.height + 200) {
      s.alive = false;
    }
  }
}

function updateTurrets() {
    for (let turret of turrets) {
        if (turret.cooldown > 0) {
            turret.cooldown--;
            continue;
        }

        // Distance to player
        const dx = player.x + player.width / 2 - (turret.x + 16);
        const dy = player.y + player.height / 2 - (turret.y + 16);
        const dist = Math.sqrt(dx * dx + dy * dy);

      turret.armed = dist <= 450;
        // 🚫 OUT OF RANGE → DO NOTHING
        if (dist > 450) continue;

        // Shoot fireball
        const speed = 11;
        fireballs.push({
            x: turret.x + 16,
            y: turret.y + 16,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            size: 20
        });

        turret.cooldown = turret.fireRate;
    }
}

// === SPIKES MODULE ===
function updateSpikes() {
  for (let spike of spikes) {
    if (
      player.x < spike.x + spike.width &&
      player.x + player.width > spike.x &&
      player.y < spike.y + spike.height &&
      player.y + player.height > spike.y
    ) {
      loseLife();
      break;
    }
  }
}

function drawSpikes() {
  ctx.fillStyle = "#d33";
  for (let s of spikes) {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y + s.height);
    ctx.lineTo(s.x + s.width / 2, s.y);
    ctx.lineTo(s.x + s.width, s.y + s.height);
    ctx.closePath();
    ctx.fill();
  }
}

function updateIcicles() {
  if (!isChristmasMap()) return;

  for (let i of icicles) {

    // --- RESPAWN LOGIC ---
    if (!i.active) {
      i.respawnTimer--;
      if (i.respawnTimer <= 0) {
        i.y = i.startY;
        i.dy = 0;
        i.falling = false;
        i.active = true;
      }
      continue;
    }

    // --- RANDOM DROP ---
    if (!i.falling && Math.random() < 0.003) {
      i.falling = true;
      i.dy = 0;
    }

    if (!i.falling) continue;

    // --- FALL PHYSICS ---
    i.dy += 0.35;               // gravity
    i.dy = Math.min(i.dy, 7);   // terminal velocity
    i.y += i.dy;

    // --- PLAYER HIT ---
    if (rectsOverlap(i, player)) {
      loseLife();
      shatterIcicle(i);
      continue;
    }

    // --- PLATFORM HIT ---
    for (let w of walls) {
      if (rectsOverlap(i, w)) {
        shatterIcicle(i);
        break;
      }
    }
  }
}

// === SMART SNAIL MODULE (Enhanced AI) ===
function updateSnails() {
  for (let s of snails) {
    
    if (s.knockbackTimer > 0) {
  s.x += s.knockbackDx;
  s.y += s.knockbackDy;
  s.knockbackTimer--;
  continue; // skip normal AI/movement for this frame
}

    if (s.dy > 12) s.dy = 12; 
    if (s.dy < -16) s.dy = -16; 
    
    // Gravity
    s.dy += s.gravity;
    s.y += s.dy;

    // --- AI BEHAVIOR ---
    const dx = player.x - s.x;
    const dy = player.y - s.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < s.chaseRange) {
      // Move toward player horizontally only
      s.dir = dx > 0 ? 1 : -1;
      s.dx = s.speed * s.dir;
    } else {
      // Idle crawl
      s.dx = 0;
    }

    // Apply horizontal movement
    s.x += s.dx;

    // Collision + gravity correction
    let onGround = false;

    for (let wall of walls) {
      if (
        s.x < wall.x + wall.width &&
        s.x + s.width > wall.x &&
        s.y < wall.y + wall.height &&
        s.y + s.height > wall.y
      ) {
        const overlapX = Math.min(
          s.x + s.width - wall.x,
          wall.x + wall.width - s.x
        );
        const overlapY = Math.min(
          s.y + s.height - wall.y,
          wall.y + wall.height - s.y
        );

        if (overlapX < overlapY) {
          // Horizontal wall bounce
          s.dir *= -1;
          s.x += s.dir * overlapX;
          s.dx = 0;
        } else {
          // Vertical correction
          if (s.y < wall.y) {
            s.y -= overlapY;
            s.dy = 0;
            onGround = true;
          } else {
            s.y += overlapY;
            s.dy = 0;
          }
        }
      }
      for (let snail of snails) {

  snail.frameTimer++;

  if (snail.frameTimer > 40) { // speed control
    snail.frameTimer = 0;
    snail.frame++;

    if (snail.frame >= snailFrames.length) {
      snail.frame = 0;
    }
  }
}
    }

    // --- Edge detection: turn around before falling ---
    if (onGround) {
      const frontX = s.dir > 0 ? s.x + s.width + 2 : s.x - 2;
      const frontY = s.y + s.height + 4;
      let groundAhead = false;

      for (let wall of walls) {
        if (
          frontX > wall.x &&
          frontX < wall.x + wall.width &&
          frontY > wall.y &&
          frontY < wall.y + wall.height
        ) {
          groundAhead = true;
          break;
        }
      }

      if (!groundAhead) s.dir *= -1; // turn before falling
    }

    // --- Player collision kills player ---
    if (
      player.x < s.x + s.width &&
      player.x + player.width > s.x &&
      player.y < s.y + s.height &&
      player.y + player.height > s.y
    ) {
      loseLife();
    }
  }
}
// === ENEMY MODULE (Smart Snail) ===
let snails = [
  { 
    x: 700, 
    y: 538, 
    width: 32, 
    height: 24, 
    dx: 0, 
    dy: 0, 
    dir: 1, 
    speed: 0.6, 
    chaseRange: 400, 
    gravity: 0.6,
    
    // Inside each snail object
knockbackTimer: 0,
knockbackDx: 0,
knockbackDy: 0

  }
];

// === POTATO MODULE ===
// === POTATO MODULE ===
potato = {
  x: 2700,
  y: 2000,
  width: 28,
  height: 22,
  wobble: 0,
  collected: false,
  active: true
};


let hasPotato = false;


// === SUPER SNAILS ===
let SuperSnails = [
  {
    x: 600,
    y: 500,
    width: 28,
    height: 20,
    dx: 0,
    dy: 0,
    speed: 1.8,
    gravity: 0.5,
    dir: 1,
    jumpPower: -14,
    mode: "ground",

    knockbackTimer: 0,
    knockbackDx: 0,
    knockbackDy: 0,

    jumpTimer: 0,
    lastWallSide: null,
    prevMode: "ground"
  }
];

// Cooldown timer
const SUPER_JUMP_COOLDOWN= 150;
const SUPER_JUMP_COOLDOWN_MIN = 45;  // ~.75 sec at 60fps
const SUPER_JUMP_COOLDOWN_MAX = 180; // ~3 sec at 60fps


function updateSuperSnails() {
  for (let s of SuperSnails) {

    if (s.prevMode === undefined) s.prevMode = s.mode;
if (s.lastWallSide === undefined) s.lastWallSide = null;
if (s.jumpTimer === undefined) s.jumpTimer = 0;
    s.wallJumpBoost = 0;

    if (s.knockbackTimer > 0) {
  s.x += s.knockbackDx;
  s.y += s.knockbackDy;
  s.knockbackTimer--;
  continue; // skip normal AI/movement for this frame
}

    // Reduce jump timer each frame
    if (s.jumpTimer > 0) s.jumpTimer--;

    // Gravity for ground + falling
if (s.mode === "ground" || s.mode === "falling") {
  s.dy += s.gravity;
} else {
  s.dy = 0; // wall + ceiling = cling
}


    if (s.dy > 12) s.dy = 12; 
    if (s.dy < -15) s.dy = -15; 
    
    // Predict direction toward player
    const dx = player.x - s.x;
    const dy = player.y - s.y;
    s.dir = dx > 0 ? 1 : -1;

    // Apply movement
    s.x += s.dx;
    s.y += s.dy;

    // Collision detection
    let touching = { left: false, right: false, top: false, bottom: false };

    // --- BOX COLLISIONS ---
    // --- BOX COLLISIONS (fixed, minimal changes) ---
for (let b of boxes) {
  if (!isColliding(s, b)) continue;

  const ox = Math.min(s.x + s.width - b.x, b.x + b.width - s.x);
  const oy = Math.min(s.y + s.height - b.y, b.y + b.height - s.y);

  // 🟢 VERTICAL collision (landing on top or hitting bottom)
  if (oy < ox) {
    if (s.dy > 0) {
      // LAND ON TOP OF BOX
      s.y = b.y - s.height;
      s.dy = 0;
      touching.bottom = true;

      // prevent climb-reset spam loop
      s.jumpTimer = Math.max(s.jumpTimer, 10);

      // ONLY allow stepping up if the snail was falling or walking
      if (s.mode === "falling" || s.mode === "ground") {
        s.mode = "ground";
      }

    } else {
  // hit underside of box → just bounce down
  s.y = b.y + b.height;
  s.dy = 0;
  // NO touching.top for boxes
    }
  }

  // 🔵 HORIZONTAL collision (push box, but DON'T climb its side)
  else {
    if (s.dx > 0) {
      // RIGHT SIDE
      s.x = b.x - s.width;
      touching.right = true;
    } else if (s.dx < 0) {
      // LEFT SIDE
      s.x = b.x + b.width;
      touching.left = true;
    }

    // stop horizontal movement
    s.dx = 0;

    // 🛑 prevent broken climb loops by forcing the snail out of "wall climb" here
    if (s.mode === "wall") {
      s.mode = "falling";
      s.wallJumpActive = false;
    }
  }
}


    // --- WALL COLLISIONS ---
for (let w of walls) {
  if (isColliding(s, w)) {
    const ox = Math.min(s.x + s.width - w.x, w.x + w.width - s.x);
    const oy = Math.min(s.y + s.height - w.y, w.y + w.height - s.y);

    if (ox < oy) {
      // Horizontal collision
      if (s.x < w.x) {
        s.x -= ox;
        touching.right = true;
        s.lastWallSide = "right";
      } else {
        s.x += ox;
        touching.left = true;
        s.lastWallSide = "left";
      }
      s.dx = 0;
    } else {
  // Vertical collision
  if (s.y < w.y) {
    s.y -= oy;
    touching.bottom = true;
  } else {
    s.y += oy;
    touching.top = true; // ✅ ceiling ONLY from walls
  }
  // Only cancel vertical velocity if NOT wall-climbing
if (s.mode !== "wall") {
  s.dy = 0;
}

    }
  }
}


// === MODE SELECTOR ===

// Bottom → grounded
if (touching.bottom) {
  s.mode = "ground";
}

// --- WALL MODE (ONLY real walls, never boxes) ---
if (touching.left || touching.right) {
  s.mode = "wall";
}

// Top → ceiling
else if (touching.top && s.dy <= 0) {
  s.mode = "ceiling";
}


// Otherwise → falling
else if (!touching.bottom && s.mode !== "wall" && s.mode !== "ceiling") {
  s.mode = "falling";
}
    // Ground → Wall transition: clear jump cooldown
if (s.mode === "wall" && s.prevMode === "ground") {
  s.jumpTimer = 6; // tiny grace window
}


  // === WALL → NOT-WALL TRANSITION (WALL JUMP) ===
   // --- WALL → NOT-WALL TRANSITION (smooth wall jump) ---
    if (s.prevMode === "wall" && s.mode !== "wall" && !s.wallJumpActive) {
      s.wallJumpActive = true;

      if (s.lastWallSide === "left") s.wallJumpTargetDx = 60;
      else if (s.lastWallSide === "right") s.wallJumpTargetDx = -60;
      else s.wallJumpTargetDx = s.dir * 55;

      s.dy = s.jumpPower * 0.7; // upward kick
      s.mode = "falling";
      s.wallJumpBoost = 10; // frames of smoothing
    }

    // Apply smooth horizontal wall-jump
    if (s.wallJumpActive) {
      const smoothing = 0.2; // smaller = slower smoothing
      s.dx += (s.wallJumpTargetDx - s.dx) * smoothing;
      s.wallJumpBoost--;
      if (s.wallJumpBoost <= 0) s.wallJumpActive = false;
    }
    
    // --- EDGE DETECTION ---
    let frontX = s.dir > 0 ? s.x + s.width + 2 : s.x - 2;
    let frontY = s.y + s.height + 1;
    let groundAhead = false;

    for (let w of [...walls, ...boxes]) { // boxes count as ground for edge detection
      if (frontX > w.x && frontX < w.x + w.width &&
          frontY >= w.y && frontY <= w.y + w.height) {
        groundAhead = true;
        break;
      }
    }

    // --- MODE BEHAVIOR ---
    if (s.mode === "ground") {
      s.dx = s.speed * s.dir;

      const distX = Math.abs(player.x - s.x);
      const distY = Math.abs(player.y - s.y);

      // Jump if near player, edge, or blocked
      if (((distX < 170 && distY < 750 && s.jumpTimer <= 0) ||
           !groundAhead ||
           collidesWithWall(s.x + s.dir * (s.width + 2), s.y, 2, s.height) ||
           touching.left || touching.right)) {

        s.dy = s.jumpPower;
        s.jumpTimer = SUPER_JUMP_COOLDOWN + Math.floor(Math.random() * 60);      
      }
    }

    // --- WALL CLIMB FIX ---
if (s.mode === "wall") {
  if (s.mode === "wall") s.dx = 0;


  if (player.y > s.y) {
    // Player is BELOW snail → move DOWN
    s.dy = s.speed * 1.4;
  } else {
    // Player is ABOVE snail → move UP
    s.dy = -s.speed * 1.4;
  }

  if (s.jumpTimer <= 0) {
    s.mode = "falling";
  }
}
    
    if (s.mode === "ceiling") {
      let ceilingAbove = false;
      for (let w of walls) {
        if (s.x + s.width > w.x && s.x < w.x + w.width &&
            s.y >= w.y && s.y <= w.y + w.height) {
          ceilingAbove = true;
          break;
        }
      }

      if (ceilingAbove) {
        s.dy = 0;
        s.dx = s.speed * s.dir; // crawl along ceiling
      } else {
       
        s.mode = "falling";
      }

      const playerBelow = player.y > s.y + s.height;
      const playerNearX = Math.abs(player.x - s.x) < 75;
      if (playerBelow && playerNearX) s.mode = "falling";
    }

  if (s.mode === "falling") {

    if (s.wallJumpBoost > 0) {
        // use strong push first
        s.dx = s.dx; // keep current boosted dx
        s.wallJumpBoost--;
    } else {
        // go back to normal falling movement
        s.dx = s.speed * s.dir;
    }
}

if ((touching.left || touching.right) && s.mode !== "wall") {
  s.dir *= -1;
}
    // Player collision kills player
    if (isColliding(player, s)) loseLife();
    
        s.prevMode = s.mode;
  }
}

function drawSuperSnails() {
      if (SuperSnails.hitFlash > 0) {
      ctx.fillStyle = "#f00"; // red
    } else {
      ctx.fillStyle = "#4dff68"; // normal green
    }
  for (let s of SuperSnails) {
    ctx.fillRect(s.x, s.y, s.width, s.height);
  }
}

// === LADDER MODULE (V2 — fixed ground & speed) ===

function updateLadders() {
  const climbSpeed = 2.5// slower climb rate
  let onLadder = false;

  for (let ladder of ladders) {
    const insideLadder =
      player.x + player.width > ladder.x &&
      player.x < ladder.x + ladder.width &&
      player.y + player.height > ladder.y &&
      player.y < ladder.y + ladder.height;

    if (insideLadder) {
      onLadder = true;

      // Disable gravity while on ladder
      player.dy = 0;

      // Handle climb inputs
      if (keys["ArrowUp"] || keys["w"]) {
        player.y -= climbSpeed;
      } else if (keys["ArrowDown"] || keys["s"]) {
        player.y += climbSpeed;
      }

      // Prevent jump abuse
      player.onGround = false;
      player.onWall = false;
      player.wallSliding = false;
    }
  }

  // If not on ladder, re-enable normal gravity
  if (!onLadder) {
    player.isOnLadder = false;
  } else {
    player.isOnLadder = true;
  }
}

function drawLadders() {
  ctx.fillStyle = "#b5651d";
  for (let ladder of ladders) {
    ctx.fillRect(ladder.x, ladder.y, ladder.width, ladder.height);
  }
}

function drawYetis() {
  for (let y of yetis) {
    if (!y.alive) continue;

        if (yetis.hitFlash > 0) {
      ctx.fillStyle = "#f00"; // red
    } else {
      ctx.fillStyle = "#eef"; // normal green
    }
    // body
    ctx.fillRect(y.x, y.y, y.width, y.height);

    // face
    ctx.fillStyle = "#222";
    const eyeX = y.facing === 1 ? y.x + 30 : y.x + 10;
    ctx.fillRect(eyeX, y.y + 16, 6, 6);

    // HP bar
    ctx.fillStyle = "red";
    ctx.fillRect(y.x, y.y - 6, (y.hp / 5) * y.width, 4);
  }
}

function drawOven() {
  for (let oven of ovens) {
    // init glow if missing (safety)
    if (oven.glow === undefined) oven.glow = 0;

    oven.glow += 0.05;
    const heat = Math.sin(oven.glow) * 10;

    ctx.save();
    ctx.translate(oven.x, oven.y);

    // === BODY ===
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(0, 0, oven.width, oven.height);

    // Metal border
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, oven.width, oven.height);

    // === INNER CAVITY ===
    ctx.fillStyle = "#1a0d05";
    ctx.fillRect(10, 20, oven.width - 20, oven.height - 30);

    // === FIRE GLOW ===
    const fireGradient = ctx.createRadialGradient(
      oven.width / 2,
      oven.height - 20,
      5,
      oven.width / 2,
      oven.height - 20,
      35
    );

    fireGradient.addColorStop(0, "rgba(255,180,60,0.8)");
    fireGradient.addColorStop(1, "rgba(255,80,0,0.1)");

   if (oven.active && !oven.baked) {
  ctx.fillStyle = fireGradient;
  ctx.fillRect(12, 22, oven.width - 24, oven.height - 34);
}

    if (oven.baked) {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(12, 22, oven.width - 24, oven.height - 34);
}

    // === HEAT WAVES ===
    ctx.strokeStyle = "rgba(255,140,50,0.3)";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(20 + i * 15, 20);
      ctx.quadraticCurveTo(
        30 + i * 15,
        10 - heat,
        40 + i * 15,
        20
      );
      ctx.stroke();
    }

    // === KNOBS ===
    ctx.fillStyle = "#555";
    ctx.beginPath();
    ctx.arc(20, 10, 4, 0, Math.PI * 2);
    ctx.arc(oven.width - 20, 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // === FEET ===
    ctx.fillStyle = "#222";
    ctx.fillRect(10, oven.height, 15, 6);
    ctx.fillRect(oven.width - 25, oven.height, 15, 6);

    ctx.restore();
  }
}


function drawSnowballs() {
  ctx.fillStyle = "#fff";
  for (let s of snowballs) {
    if (!s.alive) continue;
    ctx.beginPath();
    ctx.arc(
      s.x + s.width / 2,
      s.y + s.height / 2,
      s.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}


// --- PLAYER LIVES MODULE ---
const maxLives = 3;
let playerLives = maxLives;

// Function to handle losing a life
function loseLife() {
  playerLives--;

  if (hasPotato) {
    potatoMessage =
      potatoDeathLines[Math.floor(Math.random() * potatoDeathLines.length)];
    potatoMessageTimer = 180;

    potatoHUDLine = "🥔 disappointed but present";
  }

  if (playerLives <= 0) {
    playerLives = 0;
    endGame();
  } else {
    resetPlayer();
  }
}


// Reset player position
function resetPlayer() {
  player.x = 50;
  player.y = 50;
  player.dx = 0;
  player.dy = 0;
}

// --- GAME OVER MODULE ---
  let gameOver = false;

function endGame() {
  gameOver = true;
}

function resetGame() {
  playerLives = maxLives;
  gameOver = false;
  resetPlayer();

  cannonProjectiles = [];
  explosions = [];
  cannonCooldown = 0;
  syncJoystickVisibility();
  // --- POTATO RESET ---
  hasPotato = false;
  potato.collected = false;

  potatoMessage = "";
  potatoMessageTimer = 0;
  potatoHUDLine = "";
  potatoState = "none";
// "none" | "raw" | "baked"

  // Optional: reset potato wobble
  potato.wobble = 0;
}


// --- AIR FLOAT MODULE ---
const floatFactor = 0.1; // fraction of gravity applied while holding up

function applyAirFloat() {
  if ((keys["ArrowUp"] || keys["w"]|| keys[" "]) && !player.onGround) {
    // Reduce downward speed while in the air
    if (player.dy > 0) {
      player.dy *= (1 - floatFactor); 
    }
  }
}

// --- BOX-TO-BOX FRICTION MODULE ---
const boxFrictionStrength = 1; // 0 = no friction, 1 = locked together

function applyBoxFriction() {
  for (let i = 0; i < boxes.length; i++) {
    for (let j = 0; j < boxes.length; j++) {
      if (i === j) continue;

      const boxA = boxes[i];
      const boxB = boxes[j];

      // Only apply friction when boxA is directly on top of boxB
      const touchingVertically =
        boxA.y + boxA.height >= boxB.y &&
        boxA.y < boxB.y + boxB.height;

      const overlappingHorizontally =
        boxA.x < boxB.x + boxB.width && boxA.x + boxA.width > boxB.x;

      if (touchingVertically && overlappingHorizontally) {
        // Reduce relative horizontal movement between stacked boxes
        const relativeDx = boxA.dx - boxB.dx;
        const frictionForce = relativeDx * boxFrictionStrength;
        boxA.dx -= frictionForce / 2;
        boxB.dx += frictionForce / 2;

        // Optional: also reduce vertical "bouncing" slightly
        const relativeDy = boxA.dy - boxB.dy;
        const verticalFriction = relativeDy * (boxFrictionStrength / 2);
        boxA.dy -= verticalFriction / 2;
        boxB.dy += verticalFriction / 2;
      }
    }
  }
}

// --- STACKABLE BOX MODULE ---
const boxFriction = 0.9; // slows boxes when touching other boxes
const wallFriction = 0.9; // slows boxes when on wall/ground

/*function updateBoxes() {
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];

    // Apply gravity
    box.dy += gravity;

    // Move box
    box.x += box.dx;
    box.y += box.dy;

    // --- BOX COLLISIONS WITH WALLS ---
    for (let wall of walls) {
      if (isColliding(box, wall)) resolveBoxCollision(box, wall);
    }

    // --- BOX COLLISIONS WITH OTHER BOXES ---
    for (let j = 0; j < boxes.length; j++) {
      if (i === j) continue;
      const other = boxes[j];
      if (isColliding(box, other)) resolveBoxCollision(box, other);
    }

// --- BOX COLLISIONS WITH PLAYER ---
if (
  player.x + player.width > box.x &&
  player.x < box.x + box.width &&
  player.y + player.height > box.y &&
  player.y < box.y + box.height
) {
  const overlapX = Math.min(
    player.x + player.width - box.x,
    box.x + box.width - player.x
  );
  const overlapY = Math.min(
    player.y + player.height - box.y,
    box.y + box.height - player.y
  );

  if (overlapX < overlapY) {
    // Horizontal collision → stop player and box if blocked
    if (player.x < box.x) {
      // Player is left of box
      const blocked = walls.some(w =>
        box.x + overlapX > w.x &&
        box.x + overlapX < w.x + w.width &&
        box.y + box.height > w.y &&
        box.y < w.y + w.height
      );

      if (!blocked) {
        // Free to push
        box.x += overlapX;
        box.dx = player.dx;
        player.x -= 0; // player already moving normally
      } else {
        // Blocked → stop
        player.x -= overlapX;
        player.dx = 0;
        box.dx = 0;
      }
    } else {
      // Player is right of box
      const blocked = walls.some(w =>
        box.x - overlapX < w.x + w.width &&
        box.x - overlapX + box.width > w.x &&
        box.y + box.height > w.y &&
        box.y < w.y + w.height
      );

      if (!blocked) {
        // Free to push
        box.x -= overlapX;
        box.dx = player.dx;
        player.x += 0;
      } else {
        // Blocked → stop
        player.x += overlapX;
        player.dx = 0;
        box.dx = 0;
      }
    }
  } else {
    // Vertical collision → same as working vertical logic
    if (player.y + player.height - overlapY <= box.y) {
      // Player is above box → stand on it
      player.y = box.y - player.height;
      player.dy = 0;
      player.onGround = true;
      player.x += box.dx * 0.8;
    } else if (box.y + box.height - overlapY <= player.y) {
      // Box is landing on player
      box.y = player.y - box.height;
      box.dy = 0;
      box.x += player.dx * 0.7;
    } else {
      // Sideways overlap (player inside box) → push player out
      if (player.y < box.y) player.y -= overlapY;
      else player.y += overlapY;
      player.dy = 0;
    }
  }
}

    // --- BOX COLLISIONS WITH SNAILS ---
    for (let s of [...snails, ...SuperSnails]) {
      if (isColliding(box, s)) resolveBoxCollision(box, s);
    }

    // Apply wall/ground friction
    const ground = getGroundSurface(box);
if (ground && ground.ice) {
  box.dx *= 0.99;
} else {
  box.dx *= 0.9;
}
  }
}*/

// --- Helper to resolve box vs solid collisions ---
function resolveBoxCollision(box, solid) {
  const overlapX = Math.min(box.x + box.width - solid.x, solid.x + solid.width - box.x);
  const overlapY = Math.min(box.y + box.height - solid.y, solid.y + solid.height - box.y);

  if (overlapX < overlapY) {
    // Horizontal separation
    if (box.x < solid.x) box.x -= overlapX / 2;
    else box.x += overlapX / 2;

    if (solid.dx !== undefined) { // Moving object like player/snail
      box.dx = solid.dx * 0.8;
    } else {
      box.dx = 0;
    }
  } else {
    // Vertical separation
    if (box.y < solid.y) {
      box.y -= overlapY;
      box.dy = 0;
    } else {
      box.y += overlapY;
      box.dy = 0;
    }

    // If box is on top of a moving object, move with it slightly
    if (solid.dx !== undefined && box.y + box.height <= solid.y + solid.height + 1) {
      box.x += solid.dx * 0.8; 
    }
  }
}

function drawBox(b) {
      if (isChristmasMap()) {
      // PRESENT BOX
      ctx.fillStyle = "#c33";
      ctx.fillRect(b.x, b.y, b.width, b.height);

      ctx.fillStyle = "#fff";
      ctx.fillRect(b.x + b.width / 2 - 3, b.y, 6, b.height);
      ctx.fillRect(b.x, b.y + b.height / 2 - 3, b.width, 6);

      ctx.beginPath();
      ctx.arc(b.x + b.width / 2 - 6, b.y + 6, 4, 0, Math.PI * 2);
      ctx.arc(b.x + b.width / 2 + 6, b.y + 6, 4, 0, Math.PI * 2);
      ctx.fill();

    } else {
  // wood base
  ctx.fillStyle = "#a36a2f";
  ctx.fillRect(b.x, b.y, b.width, b.height);

  // planks
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  for (let y = b.y; y < b.y + b.height; y += 10) {
    ctx.beginPath();
    ctx.moveTo(b.x, y);
    ctx.lineTo(b.x + b.width, y);
    ctx.stroke();
  }

  // metal corners
  ctx.fillStyle = "#555";
  ctx.fillRect(b.x, b.y, 4, 4);
  ctx.fillRect(b.x + b.width - 4, b.y, 4, 4);
  ctx.fillRect(b.x, b.y + b.height - 4, 4, 4);
  ctx.fillRect(b.x + b.width - 4, b.y + b.height - 4, 4, 4);
}
}

function spawnSnow() {
  if (!isChristmasMap()) return;

  if (snowParticles.length < 150) {
    snowParticles.push({
      x: Math.random() * world.width,
      y: -20,
      speed: 0.5 + Math.random() * 1.2,
      size: 1 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 0.3
    });
  }
}

function updateSnow() {
  if (!isChristmasMap()) return;

  for (let s of snowParticles) {
    s.y += s.speed;

    // Respawn at top once off-screen
    if (s.y > 2200) {
      s.y = -10;
      s.x = Math.random() * world.width;
    }
  }
}

/*function spawnSimpleYetiDeath(y) {
  for (let i = 0; i < 12; i++) {
    snowParticles.push({
      x: y.x + y.width / 2,
      y: y.y + y.height / 2,
      dx: (Math.random() - 0.5) * 4,
      dy: -Math.random() * 3,
      size: 3,
      life: 20
    });
  }
}*/

function drawPotato() {
  if (potato.collected) return;

  potato.wobble += 0.05;

  ctx.save();
  ctx.translate(
    potato.x + potato.width / 2,
    potato.y + potato.height / 2
  );
  ctx.rotate(Math.sin(potato.wobble) * 0.15);

  ctx.fillStyle = "#b58b4a";
  ctx.beginPath();
  ctx.ellipse(0, 0, potato.width / 2, potato.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // little "eyes" (optional but recommended)
  ctx.fillStyle = "#5a3d1e";
  ctx.fillRect(-6, -2, 4, 3);
  ctx.fillRect(3, 1, 3, 3);
  ctx.fillRect(-2, 5, 2, 2);

  ctx.restore();
}


// INPUT

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();

  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;

  if (devMapView) {
    // dev mode: scaled full map
    mouse.worldX = Math.floor(mouse.x / devScale);
    mouse.worldY = Math.floor(mouse.y / devScale);
  } else {
    // normal camera-follow mode
    mouse.worldX = Math.floor(mouse.x + camera.x);
    mouse.worldY = Math.floor(mouse.y + camera.y);
  }
});

document.addEventListener("keydown", (e) => {
  if (!devMapView) return;

  if (e.key.toLowerCase() === "g") {
    devShowGrid = !devShowGrid;
  }
});

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  
  if ((e.key === "r" || e.key === "R") && gameOver) {
  resetGame();
  triggerGameOver();
     document.getElementById("game").style.display = "none";
}

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m") {
    devMapView = !devMapView;
  }
});

  if (e.key === "Escape") togglePause();
});
document.addEventListener("keyup", (e) => keys[e.key] = false);

document.addEventListener("keydown", e => {
    keys[e.key] = true;

    // Start charging if not attacking or on cooldown
    if (e.key === "Shift") { e.preventDefault(); tryDash(); }
  
    if ((keys["f"]) && player.attackTimer <= 0 && player.attackCooldown <= 0 && !player.attackCharging) {
        player.attackCharging = true;
        player.attackChargeTime = 0;
    }
});

document.addEventListener("keyup", e => {
    keys[e.key] = false;

    // Release attack
    if ((e.key === "f") && player.attackCharging) {
        player.attackCharging = false;
        player.attackTimer = player.attackDuration;
        player.attackCooldown = 20; // short cooldown
        // scale knockback with charge
        player.attackKnockback = 5 + 5 * Math.min(player.attackChargeTime / player.maxChargeTime, 1);
        player.attackHitObjects.clear(); // reset for this swing
    }
});



function togglePause() {
  if (!gameRunning) return;

  gamePaused = !gamePaused;

  const menu = document.getElementById("pauseMenu");

  if (gamePaused) {
    menu.classList.remove("hidden");
  } else {
    menu.classList.add("hidden");
  }
}

function backToMenu() {

  stopGameLoop();  
   document.getElementById("pauseMenu").classList.add("hidden");
  document.getElementById("levelSelect").classList.add("hidden");
  document.getElementById("waveSelect").classList.add("hidden");
 
  document.getElementById("freeSelect").classList.add("hidden");
  document.getElementById("settings").classList.add("hidden");
  document.getElementById("menu").classList.remove("hidden");
  document.getElementById("controls").classList.add("hidden");

  // Hide canvas to be safe
  document.getElementById("game").style.display = "none";
}

function checkPotatoPickup() {
  if (potato.collected) return;

  if (
    player.x < potato.x + potato.width &&
    player.x + player.width > potato.x &&
    player.y < potato.y + potato.height &&
    player.y + player.height > potato.y
  ) {
    potato.collected = true;
    hasPotato = true;
    potatoState = "raw";

    potatoMessage = "The potato accepts you.";
potatoMessageTimer = 180; // 3 seconds

potatoHUDLine = "🥔 something feels different";


    // Tiny screen shake
    camera.x += (Math.random() - 0.5) * 13;
    camera.y += (Math.random() - 0.5) * 15;
  }
}

function updateOvens(player) {
  for (const oven of ovens) {
    if (!oven.active || oven.baked || !hasPotato) continue;

    if (
      player.x + player.width > oven.x &&
      player.x < oven.x + oven.width &&
      player.y + player.height > oven.y &&
      player.y < oven.y + oven.height
    ) {
      bakePotato(oven);
      break;
    }
  }
}


function bakePotato(oven) {
  oven.baked = true;
  oven.active = false;

  potatoState = "baked";
  potatoChaosLevel = 2;

  potatoMessage = randomFrom([
    "🥔 baked to perfection",
    "🥔 I am crispy now",
    "🥔 warmth… I feel complete",
    "🥔 LET ME COOK",
    "🥔 the oven accepts me"
  ]);

  potatoMessageTimer = 180;

  player.wallJumpPower *= 1.15;
  player.speed *= 1.2;
  player.jumpPower *= 1.15;
}



function updateSnowmen() {
  for (let s of snowmen) {
    const dx = player.x - s.x;
    const dist = Math.abs(dx);

    s.facing = dx >= 0 ? 1 : -1;

    // Simple chase
    if (dist < 600) {
      s.dx = Math.sign(dx) * s.speed;
    } else {
      s.dx = 0;
    }

    s.x += s.dx;
  }
}

function drawOvens() {
  for (const oven of ovens) {
    drawOven(oven);
  }
}

// UPDATE LOOP
// UPDATE LOOP
 function potatoChaos() {
  if (!hasPotato) return;

  // Slight gravity corruption
player.dy += (Math.random() - 0.5) * 1.0;
player.dy *= 1 + (Math.random() - 0.5) * 0.02;

   if (Math.random() < 0.002) {
  const whispers = [
    "🥔 it is too late",
    "🥔 gravity is lying",
    "🥔 the boxes remember",
    "🥔 keep going",
    "🥔 do not trust the ladder"
  ];
  potatoHUDLine = whispers[Math.floor(Math.random() * whispers.length)];
}

  // Rare micro-freeze (players will feel it, not see it)
if (Math.random() < 0.0005) {
  player.chaosStall = 20; // frames
}
}

function applySnowmanSlow() {
  player.slowMultiplier = 1; // reset EVERY frame

  // 🥔 Potato = no snow slow
if (!hasPotato) {
  for (let s of snowmen) {
    const cx = s.x + s.width / 2;
    const cy = s.y + s.height / 2;

    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    const dist = Math.hypot(px - cx, py - cy);

    if (dist < s.slowRadius) {
      player.slowMultiplier = Math.min(
        player.slowMultiplier,
        s.slowAmount
      );
    }
    }
  }
}

function tryDash() {
  if (player.dashCooldown > 0) return;
  if (!player.onGround && player.dashUsedInAir) return;

  player.dashActive = true;
  player.dashDuration = player.dashMaxDuration;
  player.dashCooldown = player.dashMaxCooldown;
  player.dy = player.wallSliding ? 0 : player.dy * 0.2; // kill vertical on dash
  player.dx = player.facing * player.dashSpeed;

  if (!player.onGround) player.dashUsedInAir = true;
}

// === CHAIR MODULE ===
function createChair(x, y) {
  return {
    x, y,
    width: 40,
    height: 48,
    dx: 0,
    dy: 0,
    dir: Math.random() > 0.5 ? 1 : -1,
    speed: 1.2 + Math.random() * 0.6,
    frame: 0,
    frameTimer: 0,
    frameSpeed: 7,
    onGround: false,
    hp: 3,
    maxHp: 3,
    hitFlash: 0,
    knockbackTimer: 0,
    knockbackDx: 0,
    knockbackDy: 0
  };
}

function updateChairs() {
  for (let c of chairs) {

    if (c.hitFlash > 0) c.hitFlash--;

    // Knockback
    if (c.knockbackTimer > 0) {
      c.x += c.knockbackDx;
      c.y += c.knockbackDy;
      c.knockbackDx *= 0.85;
      c.knockbackDy *= 0.85;
      c.knockbackTimer--;
      continue;
    }

    // Gravity
    c.dy += gravity;
    if (c.dy > 12) c.dy = 12;

    c.dx = c.dir * c.speed;
    c.x += c.dx;
    c.y += c.dy;
    c.onGround = false;

    // Wall collisions
    for (let wall of walls) {
      if (!isColliding(c, wall)) continue;
      const ox = Math.min(c.x + c.width - wall.x, wall.x + wall.width - c.x);
      const oy = Math.min(c.y + c.height - wall.y, wall.y + wall.height - c.y);

      if (ox < oy) {
        c.x += c.x < wall.x ? -ox : ox;
        c.dir *= -1;
        c.dx = 0;
      } else {
        if (c.y < wall.y) {
          c.y -= oy;
          c.dy = 0;
          c.onGround = true;
        } else {
          c.y += oy;
          c.dy = 0;
        }
      }
    }

    // Edge detection — turn before falling off ledge
    if (c.onGround) {
      const frontX = c.dir > 0 ? c.x + c.width + 2 : c.x - 2;
      const frontY = c.y + c.height + 4;
      let groundAhead = false;
      for (let wall of walls) {
        if (frontX > wall.x && frontX < wall.x + wall.width &&
            frontY > wall.y && frontY < wall.y + wall.height) {
          groundAhead = true;
          break;
        }
      }
      if (!groundAhead) c.dir *= -1;
    }

    // Animation
    c.frameTimer++;
    if (c.frameTimer >= c.frameSpeed) {
      c.frameTimer = 0;
      c.frame = (c.frame + 1) % chairFrames.length;
    }

    // --- PLAYER COLLISION ---
    if (!isColliding(c, player)) continue;

    const playerFeet = player.y + player.height;
    const chairMid = c.y + c.height * 0.5; // halfway down sprite

    const landingFromAbove = playerFeet <= chairMid + 8 && player.dy >= 0;

    if (landingFromAbove) {
      // Safe zone — ride it
      player.y = c.y - player.height + 22;
      player.dy = 0;
      player.onGround = true;
      player.x += c.dx; // carry player along
    } else {
      // Leg zone — ouch
      loseLife();
    }
  }
}

function drawChairs() {
  for (let c of chairs) {
    const img = chairFrames[c.frame];
    if (!img || !img.complete) continue;

    ctx.save();
    if (c.hitFlash > 0) ctx.filter = "brightness(8)";

    if (c.dir < 0) {
      ctx.translate(c.x + c.width, c.y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -10, -10, c.width + 20, c.height + 20);
    } else {
      ctx.drawImage(img, c.x -10, c.y -10, c.width + 20, c.height + 20);
    }
    ctx.restore();
  }
}

// --- UPDATE PLAYER ---
function updatePlayer() {
  if (gameOver) return;

  if (player.attackTimer > 0) {
    player.attackTimer--;
  }
  
  // Decrease cooldown
  if (player.attackCooldown > 0) {
    player.attackCooldown--;
  }

  // Horizontal movement
const ground = getGroundSurface(player);
const onIce = ground && ground.ice;

let accel = onIce ? 0.6 : player.speed;
let friction = onIce ? 0.99 : 0.0;

const moveSpeed = player.speed * player.slowMultiplier;

// input
if (keys["ArrowLeft"] || keys["a"]) {
  player.dx -= accel;
  player.facing = -1;
}
if (keys["ArrowRight"] || keys["d"]) {
  player.dx += accel;
  player.facing = 1;
}

// friction when no input
if (
  !keys["ArrowLeft"] &&
  !keys["a"] &&
  !keys["ArrowRight"] &&
  !keys["d"]
) {
  player.dx *= friction;
}

// hard clamp speed (THIS is the important part)
if (!player.dashActive) {
  player.dx = Math.max(
    -moveSpeed,
    Math.min(player.dx, moveSpeed)
  );
}


  // Jumping
if ((keys["ArrowUp"] || keys["w"] || keys[" "]) && player.onGround) {
  player.dy = -player.jumpPower;
  player.onGround = false;
}
  // Wall jump
 else if ((keys["ArrowUp"] || keys["w"] || keys[" "]) && player.onWall) {
  player.dy = -player.wallJumpPower;
  player.wallJumpBoost = 60 * -player.wallDir;
  player.onWall = false;
}

//Sword
// Charging
if (player.attackCharging) {
    player.attackChargeTime++;
    if (player.attackChargeTime > player.maxChargeTime) player.attackChargeTime = player.maxChargeTime;
}

// Swing
/*if (player.attackTimer > 0) {
    player.attackTimer--;

    const t = 1 - player.attackTimer / player.attackDuration;
    const angle = -Math.PI + t * Math.PI;

    const pivotX = player.x + player.width / 2;
    const pivotY = player.y + player.height / 2;
    const radius = 70;

    const swordTipX = pivotX + Math.cos(angle) * radius;
    const swordTipY = pivotY + Math.sin(angle) * radius;

    const attackBox = {
        x: swordTipX - 40,
        y: swordTipY - 10,
        width: 70,
        height: 20
    };

    // Hit snails
    for (let i = snails.length - 1; i >= 0; i--) {
        let s = snails[i];
        
        if (isColliding(attackBox, s) && !player.attackHitObjects.has(s)) {
            const died = damageEnemy(s, 1, {
                x: player.attackKnockback * 2 * Math.sign(s.x - pivotX),
                y: -player.attackKnockback * 1.3
            });
            
            if (died) {
                setTimeout(() => {
                    let index = snails.indexOf(s);
                    if (index > -1) {
                        snails.splice(index, 1);
                        onEnemyKilled('snail');
                    }
                }, 300);
            }
            
            player.attackHitObjects.add(s);
        }
    }
    
    // Hit super snails
    for (let i = SuperSnails.length - 1; i >= 0; i--) {
        let s = SuperSnails[i];
        
        if (isColliding(attackBox, s) && !player.attackHitObjects.has(s)) {
            const died = damageEnemy(s, 1, {
                x: player.attackKnockback * 2 * Math.sign(s.x - pivotX),
                y: -player.attackKnockback * 1.3
            });
            
            if (died) {
                setTimeout(() => {
                    let index = SuperSnails.indexOf(s);
                    if (index > -1) {
                        SuperSnails.splice(index, 1);
                        onEnemyKilled('superSnail');
                    }
                }, 300);
            }
            
            player.attackHitObjects.add(s);
        }
    }
    
    // Hit yetis
    for (let y of yetis) {
        if (!y.alive) continue;
        
        if (isColliding(attackBox, y) && !player.attackHitObjects.has(y)) {
            const died = damageEnemy(y, 1, {
                x: player.attackKnockback * 2 * Math.sign(y.x - pivotX),
                y: -player.attackKnockback * 1.3
            });
            
            if (died) {
                y.alive = false;
                onEnemyKilled('yeti');
            }
            
            player.attackHitObjects.add(y);
        }
    }
    
    // Hit snowmen
    for (let i = snowmen.length - 1; i >= 0; i--) {
        let s = snowmen[i];
        
        if (isColliding(attackBox, s) && !player.attackHitObjects.has(s)) {
            const died = damageEnemy(s, 1, {
                x: player.attackKnockback * 2 * Math.sign(s.x - pivotX),
                y: -player.attackKnockback * 1.3
            });
            
            if (died) {
                setTimeout(() => {
                    let index = snowmen.indexOf(s);
                    if (index > -1) {
                        snowmen.splice(index, 1);
                        onEnemyKilled('snowman');
                    }
                }, 300);
            }
            
            player.attackHitObjects.add(s);
        }
    }
    
    // Hit turrets (turrets can now be destroyed!)
    for (let i = turrets.length - 1; i >= 0; i--) {
        let t = turrets[i];
        
        if (isColliding(attackBox, t) && !player.attackHitObjects.has(t)) {
            const died = damageEnemy(t, 1, {
                x: 0,
                y: 0
            });
            
            if (died) {
                turrets.splice(i, 1);
                onEnemyKilled('turret');
            }
            
            player.attackHitObjects.add(t);
        }
    }
      // Hit boxes
    for (let box of boxes) {
        if (isColliding(attackBox, box) && !player.attackHitObjects.has(box)) {
            box.dx += player.attackKnockback * 2 * Math.sign(box.x - pivotX);
            box.dy -= -player.attackKnockback * 2 * Math.sign(box.y - pivotY);
            player.attackHitObjects.add(box);
        }
    }
}
*/
// Decrease cooldown
if (player.attackCooldown > 0) player.attackCooldown--;

  // Gravity
  player.dy += gravity;

  // Wall jump horizontal boost
  if (player.wallJumpBoost !== 0) {
    player.dx += player.wallJumpBoost * 0.2;
    player.wallJumpBoost *= 0.7;
    if (Math.abs(player.wallJumpBoost) < 0.5) player.wallJumpBoost = 0;
  }

  // Apply velocity
  player.x += player.dx;
  player.y += player.dy;
  
      if (player.dy > 14) player.dy = 14;

  // Dash override
  if (player.dashDuration > 0) {
    player.dx = player.facing * player.dashSpeed;
    player.dy *= 0.15; // suppress gravity during dash
    player.dashDuration--;
    if (player.dashDuration === 0) player.dashActive = false;
  }
  if (player.dashCooldown > 0) player.dashCooldown--;
  
  // Reset ground/wall flags
  player.onGround = false;
  player.onWall = false;

  // --- Collision detection ---
  for (let wall of walls) {
    if (
      player.x < wall.x + wall.width &&
      player.x + player.width > wall.x &&
      player.y < wall.y + wall.height &&
      player.y + player.height > wall.y
    ) {
      const overlapX = Math.min(
        player.x + player.width - wall.x,
        wall.x + wall.width - player.x
      );
      const overlapY = Math.min(
        player.y + player.height - wall.y,
        wall.y + wall.height - player.y
      );

      if (overlapX < overlapY) {
        // Horizontal collision
        if (player.x < wall.x) {
          player.x -= overlapX;
          player.wallDir = 1;
        } else {
          player.x += overlapX;
          player.wallDir = -1;
        }
        player.dx = 0;
        player.onWall = true;
      } else {
        // Vertical collision
        if (player.y < wall.y) {
          player.y -= overlapY;
          player.dy = 0;
          player.onGround = true;
        } else {
          player.y += overlapY;
          player.dy = 0;
          if (!player.prevOnGround && player.onGround)
player.prevOnGround = player.onGround;
        }
      }
    }
  }

  if (player.chaosStall > 0) {
  player.dy = 0;
  player.chaosStall--;
  return;
}

// Reset air dash when grounded
  if (player.onGround) player.dashUsedInAir = false;
  
  // --- Lose life if player falls off-screen ---
  if (player.y > world.height + 200) { // extra margin below screen
    loseLife();
  }
}


function drawPlayerSword() {
  if (player.attackTimer <= 0) return;
  
  const t = 1 - player.attackTimer / player.attackDuration;
  
  // Use player.facing to determine sword arc direction
  let angle;
  
  if (player.facing === 1) {
    // Right-facing: sweep from left (-π) to right (0)
    angle = -Math.PI + t * Math.PI;
  } else {
    // Left-facing: sweep from right (0) to left (-π)
    angle = -t * Math.PI;
  }
  
  const pivotX = player.x + player.width / 2;
  const pivotY = player.y + player.height / 2;
  const radius = 60;
  
  const tipX = pivotX + Math.cos(angle) * radius * player.facing;
  const tipY = pivotY + Math.sin(angle) * radius;
  
  // Dynamic thickness
  const dynamicWidth = 3 + Math.sin(t * Math.PI) * 7;
  
  // Main sword gradient
  const grad = ctx.createLinearGradient(pivotX, pivotY, tipX, tipY);
  grad.addColorStop(0, "white");
  grad.addColorStop(0.5, "cyan");
  grad.addColorStop(1, "blue");
  
  ctx.strokeStyle = grad;
  ctx.lineWidth = dynamicWidth;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  
  // Arc trail afterimages
  const trailAngles = [0.15, 0.30, 0.45];
  
  for (let i = 0; i < trailAngles.length; i++) {
    let trailAngle;
    
    if (player.facing === 1) {
      trailAngle = angle - trailAngles[i];
    } else {
      trailAngle = angle + trailAngles[i];
    }
    
    const trailX = pivotX + Math.cos(trailAngle) * radius * player.facing;
    const trailY = pivotY + Math.sin(trailAngle) * radius;
    
    const alpha = 0.35 - i * 0.1;
    
    ctx.strokeStyle = `rgba(100,180,255,${alpha})`;
    ctx.lineWidth = dynamicWidth - (i + 1);
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(trailX, trailY);
    ctx.stroke();
  }
}

function updatePlayerSwordAttack() {
  if (player.attackTimer <= 0) return;
  
  const t = 1 - player.attackTimer / player.attackDuration;
  
  let angle;
  if (player.facing === 1) {
    angle = -Math.PI + t * Math.PI;
  } else {
    angle = -t * Math.PI;
  }
  
  const pivotX = player.x + player.width / 2;
  const pivotY = player.y + player.height / 2;
  const radius = 60;
  
  const tipX = pivotX + Math.cos(angle) * radius * player.facing;
  const tipY = pivotY + Math.sin(angle) * radius;
  
  const attackBox = {
    x: tipX - 40,
    y: tipY - 10,
    width: 70,
    height: 20
  };
  
  // Hit snails
  for (let i = snails.length - 1; i >= 0; i--) {
    let s = snails[i];
    
    if (isColliding(attackBox, s) && !player.attackHitObjects.has(s)) {
      const died = damageEnemy(s, 1, {
        x: player.attackKnockback * 2 * Math.sign(s.x - player.x),  // ✅ FIXED
        y: -player.attackKnockback * 1.3
      });
      
      if (died) {
        setTimeout(() => {
          let index = snails.indexOf(s);
          if (index > -1) {
            snails.splice(index, 1);
            onEnemyKilled('snail');
          }
        }, 300);
      }
      
      player.attackHitObjects.add(s);
    }
  }
  
  // Hit super snails
  for (let i = SuperSnails.length - 1; i >= 0; i--) {
    let s = SuperSnails[i];
    
    if (isColliding(attackBox, s) && !player.attackHitObjects.has(s)) {
      const died = damageEnemy(s, 1, {
        x: player.attackKnockback * 2 * Math.sign(s.x - player.x),  // ✅ FIXED
        y: -player.attackKnockback * 1.3
      });
      
      if (died) {
        setTimeout(() => {
          let index = SuperSnails.indexOf(s);
          if (index > -1) {
            SuperSnails.splice(index, 1);
            onEnemyKilled('superSnail');
          }
        }, 300);
      }
      
      player.attackHitObjects.add(s);
    }
  }
  
  // Hit bats
  for (let i = bats.length - 1; i >= 0; i--) {
    let bat = bats[i];
    
    if (isColliding(attackBox, bat) && !player.attackHitObjects.has(bat)) {
      const died = damageEnemy(bat, 1, {
        x: player.attackKnockback * 2 * Math.sign(bat.x - player.x),  // ✅ FIXED
        y: -player.attackKnockback * 1.3
      });
      
      if (died) {
        setTimeout(() => {
          let index = bats.indexOf(bat);
          if (index > -1) {
            bats.splice(index, 1);
            onEnemyKilled('bat');
          }
        }, 300);
      }
      
      player.attackHitObjects.add(bat);
    }
  }
  
  // Hit yetis
  for (let y of yetis) {
    if (!y.alive) continue;
    
    if (isColliding(attackBox, y) && !player.attackHitObjects.has(y)) {
      const died = damageEnemy(y, 1, {
        x: player.attackKnockback * 2 * Math.sign(y.x - player.x),  // ✅ FIXED
        y: -player.attackKnockback * 1.3
      });
      
      if (died) {
        y.alive = false;
        onEnemyKilled('yeti');
      }
      
      player.attackHitObjects.add(y);
    }
  }
  
  // Hit snowmen
  for (let i = snowmen.length - 1; i >= 0; i--) {
    let s = snowmen[i];
    
    if (isColliding(attackBox, s) && !player.attackHitObjects.has(s)) {
      const died = damageEnemy(s, 1, {
        x: player.attackKnockback * 2 * Math.sign(s.x - player.x),  // ✅ FIXED
        y: -player.attackKnockback * 1.3
      });
      
      if (died) {
        setTimeout(() => {
          let index = snowmen.indexOf(s);
          if (index > -1) {
            snowmen.splice(index, 1);
            onEnemyKilled('snowman');
          }
        }, 300);
      }
      
      player.attackHitObjects.add(s);
    }
  }
  
  // Hit turrets
  for (let i = turrets.length - 1; i >= 0; i--) {
    let t = turrets[i];
    
    if (isColliding(attackBox, t) && !player.attackHitObjects.has(t)) {
      const died = damageEnemy(t, 1, { x: 0, y: 0 });  // Turrets don't move
      
      if (died) {
        turrets.splice(i, 1);
        onEnemyKilled('turret');
      }
      
      player.attackHitObjects.add(t);
    }
  }
  
  // Hit boxes (breakable ones take damage)
  for (let box of boxes) {
    if (isColliding(attackBox, box) && !player.attackHitObjects.has(box)) {
      damageBox(box, 1);
      
      // Knockback for all boxes - away from player
      box.dx += player.attackKnockback * 2 * Math.sign(box.x - player.x);  // ✅ FIXED
      box.dy -= player.attackKnockback * 2;
      
      player.attackHitObjects.add(box);
    }
  }
    // Hit chairs
  for (let i = chairs.length - 1; i >= 0; i--) {
    let c = chairs[i];
    if (isColliding(attackBox, c) && !player.attackHitObjects.has(c)) {
      const died = damageEnemy(c, 1, {
        x: player.attackKnockback * 2 * Math.sign(c.x - player.x),
        y: -player.attackKnockback * 1.5
      });
      if (died) {
        chairs.splice(i, 1);
        onEnemyKilled('chair');
      }
      player.attackHitObjects.add(c);
    }
  }
}

function resetWorld() {
  walls = [];
  turrets = [];
  seesaws = [];
  boxes = [];
  snails = [];
  bats = [];
  chairs = [];
  SuperSnails = [];
  ladders = [];
  spikes = [];
  bats = [];
  hasPotato = false;
  yetis =[];
  snowmen =[];
  ovens = [];
  lights = [];        // ← ADD THIS LINE
  playerLight = null; // ← ADD THIS LINE
  let potato
  let potatoMessage = "";
  let potatoMessageTimer = 0;
  let potatoHUDLine = "";
  let potatoState = "none";
  let fireballs = [];
  player.speed *= 1;
  player.jumpPower *= 1;

  cannonProjectiles = [];
  explosions = [];
  cannonCooldown = 0;
  syncJoystickVisibility();
  waveSystem = {
  enabled: false,
  currentWave: 0,
  enemiesRemaining: 0,
  waveActive: false,
  timeBetweenWaves: 180,
  waveTimer: 0,
  totalEnemiesKilled: 0,
  
  spawnQueue: [],
  spawnTimer: 0,
  
  // Current map's wave configuration
  currentMapWaves: null
};
}

// --- CAMERA MODULE ---
function updateCamera() {
  const targetX =
    player.x + player.width / 2 - camera.width / 2;
  const targetY =
    player.y + player.height / 2 - camera.height / 2;

  camera.x += (targetX - camera.x) * camera.smoothFactor;
  camera.y += (targetY - camera.y) * camera.smoothFactor;

  // ✅ HARD CLAMP — ALWAYS
  camera.x = Math.max(
    0,
    Math.min(camera.x, world.width - camera.width)
  );
  camera.y = Math.max(
    0,
    Math.min(camera.y, world.height - camera.height)
  );
}

function updateSeesaws() {
  for (let s of seesaws) {

    // gravity pull toward flat
    s.angularVelocity += -s.angle * 0.01;

    // player influence
    const playerOn =
      player.y + player.height <= s.y + 8 &&
      player.y + player.height >= s.y - 8 &&
      player.x + player.width > s.x &&
      player.x < s.x + s.width;

    if (playerOn) {
      const center = s.x + s.width / 2;
      const offset = (player.x + player.width / 2) - center;
      s.angularVelocity += offset * 0.0005;
      player.x += s.angularVelocity * 6; // instability
    }

    // box influence
    for (let box of boxes) {
      const boxOn =
        box.y + box.height <= s.y + 8 &&
        box.y + box.height >= s.y - 8 &&
        box.x + box.width > s.x &&
        box.x < s.x + s.width;

      if (boxOn) {
        const center = s.x + s.width / 2;
        const offset = (box.x + box.width / 2) - center;
        s.angularVelocity += offset * 0.0003;
        box.x += s.angularVelocity * 4;
      }
    }

    // damping
    s.angularVelocity *= 0.92; // friction in the hinge

    const SPRING_STRENGTH = 0.0015;
s.angularVelocity += -s.angle * SPRING_STRENGTH;

    s.angle += s.angularVelocity;
    const MAX_ANGLE = Math.PI / 10; // ~18 degrees

s.angle = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, s.angle));

// --- PLAYER SUPPORT ON SEESAW (edge-safe) ---
const playerFeet = player.y + player.height;

for (let s of seesaws) {
  const playerCenterX = player.x + player.width / 2;

  // must be horizontally over the seesaw
  if (
    playerCenterX < s.x ||
    playerCenterX > s.x + s.width
  ) continue;

  const surfaceY = seesawSurfaceY(s, playerCenterX);

  const onSeesaw =
    playerFeet >= surfaceY - 6 &&
    playerFeet <= surfaceY + 10 &&
    player.dy >= 0;

  if (onSeesaw) {
    player.y = surfaceY - player.height;
    player.dy = 0;
    player.onGround = true;

    // slide toward lower side
    player.x += Math.sin(s.angle) * 1.4;
  }
}

// --- BOX VISUAL HEIGHT ON SEESAW ---
// --- BOX SUPPORT ON SEESAW ---
for (let box of boxes) {
  const boxFeet = box.y + box.height;
  const boxCenterX = box.x + box.width / 2;

  for (let s of seesaws) {
    if (boxCenterX < s.x || boxCenterX > s.x + s.width) continue;

    const surfaceY = seesawSurfaceY(s, boxCenterX);

    const boxOn =
      boxFeet >= surfaceY - 6 &&
      boxFeet <= surfaceY + 10 &&
      box.dy >= 0;

    if (boxOn) {
      box.y = surfaceY - box.height;
      box.dy = 0;
      box.x += Math.sin(s.angle) * 1.2;
    }
  }
}

  }
}

// === MOVING PLATFORM MODULE (with friction) ===
function updateMovingPlatforms() {
  for (let wall of walls) {
    if (!wall.moving) continue;

    const prevX = wall.x;

    wall.x += wall.dir * wall.speed;

    // per-wall bounds (NO magic numbers)
    if (
      wall.x > wall.startX + wall.range ||
      wall.x < wall.startX - wall.range
    ) {
      wall.dir *= -1;
    }

    const deltaX = wall.x - prevX;

    // --- PLAYER RIDING PLATFORM ---
    const standingOn =
      player.y + player.height <= wall.y + 5 &&
      player.y + player.height >= wall.y - 10 &&
      player.x + player.width > wall.x &&
      player.x < wall.x + wall.width;

    if (standingOn && player.onGround) {
      player.x += deltaX;
    }

    // --- BOX RIDING PLATFORM ---
    for (let box of boxes) {
      const boxOn =
        box.y + box.height <= wall.y + 5 &&
        box.y + box.height >= wall.y - 10 &&
        box.x + box.width > wall.x &&
        box.x < wall.x + wall.width;

      if (boxOn) {
        box.x += deltaX;
      }
    }
  }
}

// --- WALL SLIDING MODULE ---
function updateWallSliding() {
  if (!player.onGround && player.onWall) {
    player.wallSliding = true;
    player.dy *= 0.3; // slower fall
  } else {
    player.wallSliding = false;
  }
}

function drawMouseCoords() {
  ctx.save();
  ctx.fillStyle = "#0ff";
  ctx.font = "14px monospace";

  ctx.fillText(
    `Mouse: ${Math.round(mouse.worldX * 3.5)}, ${Math.round(mouse.worldY * 3.5)}`,
    10,
    canvas.height - 10
  );

  ctx.restore();
}

 function drawDevGrid(scale) {
  const STEP = 100;

  ctx.save();
  ctx.strokeStyle = "rgba(0, 255, 255, 0.25)";
  ctx.lineWidth = 1;

  // vertical lines
  for (let x = 0; x <= world.width; x += STEP) {
    const sx = x * scale;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, canvas.height);
    ctx.stroke();
  }

  // horizontal lines
  for (let y = 0; y <= world.height; y += STEP) {
    const sy = y * scale;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(canvas.width, sy);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDevRulers(scale) {
  const STEP = 100;

  ctx.save();
  ctx.font = "8px monospace";
  ctx.fillStyle = "#0ff";
  ctx.strokeStyle = "#0ff";
  ctx.lineWidth = 1;

  // --- X AXIS (TOP) ---
  for (let x = 0; x <= world.width; x += STEP) {
    const sx = x * scale;

    // tick
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, 12);
    ctx.stroke();

    // label
    ctx.fillText(x, sx + 2, 24);
  }

  // --- Y AXIS (LEFT) ---
  for (let y = 0; y <= world.height; y += STEP) {
    const sy = y * scale;

    // tick
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(12, sy);
    ctx.stroke();

    // label
    ctx.fillText(y, 16, sy - 2);
  }

  ctx.restore();
}

function drawSnow() {
  if (!isChristmasMap()) return;

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  for (let s of snowParticles) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIcicles() {
  if (!isChristmasMap()) return;

  ctx.fillStyle = "#ccf2ff";

  for (let i of icicles) {
    if (!i.active) continue;

    ctx.beginPath();
    ctx.moveTo(i.x, i.y);                         // top-left (ceiling)
    ctx.lineTo(i.x + i.width, i.y);               // top-right
    ctx.lineTo(i.x + i.width / 2, i.y + i.height); // sharp tip DOWN
    ctx.closePath();
    ctx.fill();
  }
}

function drawSnowmen() {
  for (let s of snowmen) {
        if (s.hitFlash > 0) {
      ctx.fillStyle = "#f00"; // red
    } else {
      ctx.fillStyle = "#fff"; // normal green
    }
     drawSnowAura(s);

    const cx = s.x + s.width / 2;
    const baseY = s.y + s.height;

    // === BODY ===
    ctx.fillStyle = "#fff";

    // bottom
    ctx.beginPath();
    ctx.arc(cx, baseY - 10, 14, 0, Math.PI * 2);
    ctx.fill();

    // middle
    ctx.beginPath();
    ctx.arc(cx, baseY - 26, 11, 0, Math.PI * 2);
    ctx.fill();

    // head
    ctx.beginPath();
    ctx.arc(cx, baseY - 40, 9, 0, Math.PI * 2);
    ctx.fill();

    // 🎩 TOP HAT
const hatY = baseY - 56;

// brim
ctx.fillStyle = "#111";
ctx.fillRect(cx - 12, hatY + 10, 24, 4);

// hat body
ctx.fillRect(cx - 9, hatY - 8, 18, 18);

// band
ctx.fillStyle = "#c22"; // red band to match scarf
ctx.fillRect(cx - 9, hatY + 2, 18, 3);

// subtle highlight
ctx.fillStyle = "rgba(255,255,255,0.15)";
ctx.fillRect(cx - 7, hatY - 6, 3, 14);

    // === COAL EYES ===
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(cx - 3, baseY - 42, 1.5, 0, Math.PI * 2);
    ctx.arc(cx + 3, baseY - 42, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // === CARROT NOSE ===
    ctx.fillStyle = "#ff9933";
    ctx.beginPath();
    ctx.moveTo(cx, baseY - 39);
    ctx.lineTo(cx + s.facing * 8, baseY - 37);
    ctx.lineTo(cx, baseY - 35);
    ctx.closePath();
    ctx.fill();

    // === COAL BUTTONS ===
    ctx.fillStyle = "#222";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, baseY - 26 + i * 6, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // === SCARF ===
    ctx.fillStyle = "#c22";
    ctx.fillRect(cx - 10, baseY - 32, 20, 4);
    ctx.fillRect(cx + 4, baseY - 28, 4, 10);

    // === TWIG ARMS ===
    ctx.strokeStyle = "#6b4a2d";
    ctx.lineWidth = 2;

    function twigArm(dir) {
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 28);
      ctx.lineTo(cx + dir * 16, baseY - 36);
      ctx.stroke();

      // fingers
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 14, baseY - 34);
        ctx.lineTo(cx + dir * (18 + i * 3), baseY - (40 + i * 2));
        ctx.stroke();
      }
    }

    twigArm(1);
    twigArm(-1);
  }
}


//Draw Everything
function draw() {
 ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.save();

let devScale = 1;

if (devMapView) {
  const scaleX = canvas.width / world.width;
  const scaleY = canvas.height / world.height;
  devScale = Math.min(scaleX, scaleY);
drawMouseCoords();
  // DEV MODE: full world, no camera offset
  ctx.scale(devScale, devScale);
} else {
  // NORMAL MODE: camera-follow
  ctx.translate(-camera.x, -camera.y);
}

drawBackground();
  // --- DRAW DECOR ---
/*for (let d of decor) {
    ctx.fillStyle = d.color;
    ctx.fillRect(d.x, d.y, d.width, d.height);
}*/

  for (let s of seesaws) {
  ctx.save();
    // --- DRAW PIVOT ---
const pivotX = s.x + s.width / 2;
const pivotY = s.y;

ctx.fillStyle = "#222";
ctx.beginPath();
ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
ctx.fill();

// optional highlight
ctx.fillStyle = "#888";
ctx.beginPath();
ctx.arc(pivotX - 1, pivotY - 1, 2, 0, Math.PI * 2);
ctx.fill();

  ctx.translate(s.x + s.width / 2, s.y + s.height / 2);
  ctx.rotate(s.angle);
  ctx.fillStyle = "#950";
  ctx.fillRect(-s.width / 2, -s.height / 2, s.width, s.height);
  ctx.restore();
    
}
  
  drawLadders();
  drawSnow();
  drawIcicles();
  drawSnowmen();
   drawPotato();
  drawOven();
  // Draw walls
  for (let wall of walls) {

  if (isChristmasMap() && wall.ice) {
    // ICE BODY
    ctx.fillStyle = "#5cc6ff";
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

    // ICE SHINE
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(wall.x + 4, wall.y + 4, wall.width - 8, 6);

    // SNOW CAP
    ctx.fillStyle = "#fff";
    ctx.fillRect(wall.x, wall.y - 6, wall.width, 6);

    // uneven snow bumps
    for (let i = 0; i < wall.width; i += 12) {
      ctx.beginPath();
      ctx.arc(wall.x + i + 6, wall.y - 6, 4, 0, Math.PI * 2);
      ctx.fill();
    }
ctx.strokeStyle = "rgba(255,255,255,0.35)";
ctx.lineWidth = 1;

for (let i = 0; i < wall.width / 60; i++) {
  ctx.beginPath();
  ctx.moveTo(
    wall.x + Math.random() * wall.width,
    wall.y + Math.random() * wall.height
  );
  ctx.lineTo(
    wall.x + Math.random() * wall.width,
    wall.y + Math.random() * wall.height
  );
  ctx.stroke();
}

  } else {
    // NORMAL WALL
    ctx.fillStyle = "#444";
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
  }
}

  //Draw Spikes
drawSpikes();

  //draw snow
  drawSnow();

  
function drawSnails() {
    for (let snail of snails) {
        ctx.save();
        const img = snailFrames[snail.frame];
        
        // Ensure image is loaded before drawing
        if (!img || !img.complete) continue;

        if (snail.dir < 0) {
            // 1. Move origin to the right edge of the snail
            ctx.translate(snail.x + snail.width, snail.y);
            // 2. Flip horizontal axis
            ctx.scale(-1, 1);
            // 3. Draw image at 0,0 (which is now top-left, but flipped)
            ctx.drawImage(img, 0, 0, snail.width, snail.height);
        } else {
            // Draw normally
            ctx.drawImage(img, snail.x, snail.y, snail.width, snail.height);
        }
        
        ctx.restore();
    }
}


  // Draw boxes
  for (let b of boxes) {
  drawBox(b);
}
  drawChairs();
  drawSnails();
  drawSuperSnails();
  drawYetis();
  drawSnowballs();


  ctx.save();
if (player.facing === -1) {
  ctx.translate(player.x + player.width, player.y);
  ctx.scale(-1, 1);
  ctx.drawImage(playerImg, 0, 0, player.width, player.height);
} else {
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}
ctx.restore();
  
  // --- POTATO FLOATING MESSAGE ---
if (potatoMessageTimer > 0) {
  ctx.fillStyle = "#ffd966";
  ctx.font = "16px monospace";
  ctx.textAlign = "center";
  
  ctx.fillText(
    potatoMessage,
    player.x + 9,
    player.y - 23.67
  );

  potatoMessageTimer--;
}

// Draw turrets
for (let t of turrets) {

  // --- POTATO CHAOS TREMBLE ---
  let shakeX = 0;
  let shakeY = 0;

  if (hasPotato && t.armed) {
    shakeX = (Math.random() - 0.5) * 2; // -1 to +1 px
    shakeY = (Math.random() - 0.5) * 2;
  }
if (isChristmasMap()) {
  // ORNAMENT
  const cx = t.x + 16 + shakeX;
  const cy = t.y + 16 + shakeY;

  ctx.fillStyle = t.armed ? "#ff4444" : "#cc2222";
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 5, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#777";
  ctx.fillRect(cx - 4, cy - 18, 8, 6);

} else {
  // NORMAL TURRET
ctx.fillStyle = "#777";
ctx.fillRect(t.x, t.y, 32, 32);

// top plate
ctx.fillStyle = "#999";
ctx.fillRect(t.x + 4, t.y + 4, 24, 8);

// barrel
ctx.fillStyle = "#333";
ctx.fillRect(t.x + 14, t.y - 6, 4, 6);
}

  // --- TURRET EYE ---
  const cx = t.x + 16 + shakeX;
  const cy = t.y + 16 + shakeY;

  ctx.fillStyle = t.armed ? "#ff3b3b" : "#444";
  ctx.beginPath();
  ctx.arc(cx, cy, t.armed ? 4 : 3, 0, Math.PI * 2);
  ctx.fill();
  if (hasPotato && t.armed && Math.random() < 0.05) {
  ctx.fillStyle = "#9c7a2f"; // potato-brown flash    
  }
}

// Draw fireballs
ctx.fillStyle = "#f33";
for (let f of fireballs) {
    ctx.beginPath();
    ctx.arc(f.x + f.size/2, f.y + f.size/2, f.size/2, 0, Math.PI*2);
    ctx.fill();
}

  
  // Sword swing
/*if (player.attackTimer > 0) {
    const t = 1 - player.attackTimer / player.attackDuration;

    // Your original swing angle (kept exactly)
    const angle = -Math.PI + t * Math.PI;

    const pivotX = player.x + player.width / 2;
    const pivotY = player.y + player.height / 2;
    const radius = 60;

    const tipX = pivotX + Math.cos(angle) * radius;
    const tipY = pivotY + Math.sin(angle) * radius;

    // --- Dynamic thickness (3 → 10 → 3) ---
    const dynamicWidth = 3 + Math.sin(t * Math.PI) * 7;

    // --- Main sword gradient glow ---
    const grad = ctx.createLinearGradient(pivotX, pivotY, tipX, tipY);
    grad.addColorStop(0, "white");
    grad.addColorStop(0.5, "cyan");
    grad.addColorStop(1, "blue");

    // Draw the glowing sword
    ctx.strokeStyle = grad;
    ctx.lineWidth = dynamicWidth;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();


    // --- Arc Trail Afterimages ---
    const trailAngles = [0.15, 0.30, 0.45];

    for (let i = 0; i < trailAngles.length; i++) {
        const a = angle - trailAngles[i];

        const trailX = pivotX + Math.cos(a) * radius;
        const trailY = pivotY + Math.sin(a) * radius;

        const alpha = 0.35 - i * 0.1; // fade out

        ctx.strokeStyle = `rgba(100,180,255,${alpha})`;
        ctx.lineWidth = dynamicWidth - (i + 1); // thinner each level
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(trailX, trailY);
        ctx.stroke();
    }
}
*/
// Charge bar
if (player.attackCharging) {
    ctx.fillStyle = "yellow";
    const barWidth = (player.attackChargeTime / player.maxChargeTime) * player.width;
    ctx.fillRect(player.x, player.y - 10, barWidth, 5);
}
  drawBats();
  drawSpecialBoxes();
  drawPlayerSword();
  
  // Dash afterimage trail
if (player.dashActive || player.dashDuration > 0) {
  const alpha = (player.dashDuration / player.dashMaxDuration) * 0.5;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (player.facing === -1) {
    ctx.translate(player.x + player.width, player.y);
    ctx.scale(-1, 1);
    ctx.drawImage(playerImg, 8, 0, player.width, player.height);
  } else {
    ctx.drawImage(playerImg, player.x - 8, player.y, player.width, player.height);
  }
  ctx.globalAlpha = alpha * 0.4;
  if (player.facing === -1) {
    ctx.translate(-8, 0);
    ctx.drawImage(playerImg, 8, 0, player.width, player.height);
  } else {
    ctx.drawImage(playerImg, player.x - 16, player.y, player.width, player.height);
  }
  ctx.restore();
}
  
  drawPotatoCannon();
  drawLighting();
  drawEnemyHealthBars();
  ctx.restore(); // Restore camera transform for HUD

  drawOffScreenIndicators();
  
  // HUD / DEV OVERLAYS
if (devMapView) {
  if (devShowGrid) {
    drawDevGrid(devScale);
  }

  drawDevRulers(devScale);
}
  // HUD — fixed to screen
  ctx.fillStyle = "#fff";
  ctx.font = "18px Arial";
  ctx.fillText("Lives: " + playerLives, 10, 40);

  // Dash cooldown indicator
if (player.dashCooldown > 0) {
  ctx.fillStyle = "#aaa";
  ctx.font = "13px Arial";
  ctx.fillText("DASH cooling...", 10, 60);
} else if (player.onGround || !player.dashUsedInAir) {
  ctx.fillStyle = "#00eeff";
  ctx.font = "13px Arial";
  ctx.fillText("DASH ready [Shift]", 10, 60);
} else {
  ctx.fillStyle = "#555";
  ctx.font = "13px Arial";
  ctx.fillText("DASH used", 10, 60);
}

  // --- POTATO HUD WHISPER ---
  ctx.fillStyle = "#ffcc66";
  ctx.font = "14px Arial";
  ctx.fillText(potatoHUDLine, 10, 80);

  // Version label
  ctx.fillStyle = "#fff";
  ctx.fillText("Version 12", 10, 20);

  // --- GAME OVER OVERLAY ---
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = "20px Arial";
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = "left";
  }

  drawWaveUI();  
      ctx.restore();

  drawCannonCrosshair();
  if (devMapView) {
  drawDevRulers(devScale);
}
  // --- DEV MODE LABEL ---
  if (devMapView) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(10, 10, 220, 30);
    ctx.fillStyle = "#0f0";
    ctx.font = "16px monospace";
    ctx.fillText("DEV MAP VIEW (M)", 20, 30);
  }
}

saveInitialState();

// --- MAIN LOOP ---
function gameLoop(currentTime) {
  if (!gameRunning) return;

  // Calculate time since last frame
  deltaTime = currentTime - lastFrameTime;

  // Only update if enough time has passed (60 FPS cap)
  if (deltaTime >= FRAME_DURATION) {
    // Track how much extra time we have
    const excess = deltaTime % FRAME_DURATION;
    lastFrameTime = currentTime - excess;

  if (!gamePaused) {
    updateWaveSystem();
    updateEnemyHitFlashes();
    applySnowmanSlow();
    updatePlayer();
    updatePlayerSwordAttack();
    updateBats();
    updateCannonAim();
    updateCannonProjectiles();
    updateExplosions();
    syncJoystickVisibility();
    //updateBoxes();
    updateSpecialBoxes();
    updateWallSliding();
    applyAirFloat();
    applyBoxFriction();
    updateMovingPlatforms();
    updateSeesaws();
    updateSnowmen();
    updateLadders();
    updateSpikes();
    updateIcicles();
    updateTurrets();
    updateFireballs();
    updateYetis();
    updateSnowballs();
    checkPotatoPickup();
    potatoChaos();
    updateOvens(player);
    updateSnails();
    updateChairs();
    updateSuperSnails();
    updateCamera();
    updateSnow();
    updateLights();
    spawnSnow();
    drawIcicles();
    drawOven();
    draw();
  }
  }
  requestAnimationFrame(gameLoop);
}
gameLoop();
