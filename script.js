// Rocket League Inspired Game - Advanced Mechanics

// --- SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// --- FIELD (ARENA) ---
// Increased field size
const fieldWidth = 100;
const fieldDepth = 70;
const fieldGeometry = new THREE.PlaneGeometry(fieldWidth, fieldDepth);
const fieldMaterial = new THREE.MeshStandardMaterial({ color: 0x0066cc });
const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
field.rotation.x = -Math.PI / 2;
field.receiveShadow = true;
scene.add(field);

// --- ARENA WALLS WITH RAMPS AND ROOF ---
const wallHeight = 8;
const wallThickness = 1;
const rampHeight = 3.5;
const rampDepth = 4;

// Walls
function createWall(x, z, rotY = 0, length = fieldDepth, color = 0x333355) {
  const geometry = new THREE.BoxGeometry(wallThickness, wallHeight, length);
  const material = new THREE.MeshStandardMaterial({ color });
  const wall = new THREE.Mesh(geometry, material);
  wall.position.set(x, wallHeight / 2, z);
  wall.rotation.y = rotY;
  wall.receiveShadow = true;
  wall.castShadow = true;
  scene.add(wall);
  return wall;
}
createWall(-(fieldWidth/2), 0, 0, fieldDepth); // Left
createWall((fieldWidth/2), 0, 0, fieldDepth);  // Right
createWall(0, -(fieldDepth/2), Math.PI/2, fieldWidth); // Near
createWall(0, (fieldDepth/2), Math.PI/2, fieldWidth);  // Far

// Ramps
function createRamp(x, z, rotY = 0, color = 0x222244) {
  const geometry = new THREE.BoxGeometry(rampDepth, rampHeight, fieldDepth - 2 * rampDepth);
  geometry.translate(rampDepth / 2, rampHeight / 2, 0);
  const material = new THREE.MeshStandardMaterial({ color });
  const ramp = new THREE.Mesh(geometry, material);
  ramp.position.set(x, rampHeight / 2, z);
  ramp.rotation.z = -Math.atan(rampHeight / rampDepth);
  ramp.rotation.y = rotY;
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  scene.add(ramp);
  return ramp;
}
createRamp(-(fieldWidth/2) + rampDepth/2, 0, 0); // Left ramp
createRamp((fieldWidth/2) - rampDepth/2, 0, Math.PI, 0x222244); // Right ramp

function createRampZ(x, z, rotY = 0, color = 0x222244) {
  const geometry = new THREE.BoxGeometry(fieldWidth - 2 * rampDepth, rampHeight, rampDepth);
  geometry.translate(0, rampHeight / 2, rampDepth / 2);
  const material = new THREE.MeshStandardMaterial({ color });
  const ramp = new THREE.Mesh(geometry, material);
  ramp.position.set(x, rampHeight / 2, z);
  ramp.rotation.x = Math.atan(rampHeight / rampDepth);
  ramp.rotation.y = rotY;
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  scene.add(ramp);
  return ramp;
}
createRampZ(0, -(fieldDepth/2) + rampDepth/2, 0); // Near ramp
createRampZ(0, (fieldDepth/2) - rampDepth/2, Math.PI, 0x222244); // Far ramp

// --- ROOF ---
const roofGeometry = new THREE.PlaneGeometry(fieldWidth, fieldDepth);
const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide, transparent: true, opacity: 0.88 });
const roof = new THREE.Mesh(roofGeometry, roofMaterial);
roof.position.set(0, wallHeight + 0.1, 0);
roof.rotation.x = Math.PI / 2;
roof.receiveShadow = true;
scene.add(roof);

// Add field lines and goals (visual only)
function createGoal(x, color) {
  const postGeometry = new THREE.BoxGeometry(0.5, 4, 12);
  const postMaterial = new THREE.MeshStandardMaterial({ color });
  const post = new THREE.Mesh(postGeometry, postMaterial);
  post.position.set(x, 2, 0);
  post.castShadow = true;
  scene.add(post);
}
createGoal(-fieldWidth/2, 0xff3333); // Left
createGoal(fieldWidth/2, 0x33ff33); // Right

// --- SOCCER BALL ---
// Larger ball
const ballRadius = 2.5;
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, ballRadius, 0);
ball.castShadow = true;
scene.add(ball);

let ballVelocity = { x: 0, y: 0, z: 0 };
const ballRestitution = 0.8;
const ballFriction = 0.99;

// --- CAR SETUP ---
// Smaller car
const carBodyGeometry = new THREE.BoxGeometry(1.2, 0.6, 2.2);
const carBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
carBody.castShadow = true;

function createWheel(x, y, z) {
  const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  wheel.castShadow = true;
  return wheel;
}
const wheels = [
  createWheel(-0.5, -0.3, 1.0),
  createWheel(0.5, -0.3, 1.0),
  createWheel(-0.5, -0.3, -1.0),
  createWheel(0.5, -0.3, -1.0)
];

const car = new THREE.Group();
car.add(carBody, ...wheels);
car.position.set(0, 0.8, -15);
scene.add(car);

// --- BOOST PADS ---
const boostPads = [];
function addBoostPad(x, z) {
  const geometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffa500 });
  const pad = new THREE.Mesh(geometry, material);
  pad.position.set(x, 0.11, z);
  pad.rotation.x = -Math.PI / 2;
  pad.receiveShadow = true;
  pad.userData = { active: true, cooldownTimeout: null };
  scene.add(pad);
  boostPads.push(pad);
}
addBoostPad(0, 25);
addBoostPad(0, -25);
addBoostPad(-35, 0);
addBoostPad(35, 0);

// --- MOVEMENT & GAME VARIABLES ---
const baseCarSpeed = 0.25;
const maxCarSpeed = 1.6;
const turnSpeed = 0.045;
const airTurnSpeed = 0.03;
const jumpStrength = 0.35;
const doubleJumpStrength = 0.35;
const flipBoost = 0.8;
// Lower gravity
const gravity = -0.0125;
const keys = {};
let carSpeed = baseCarSpeed;
let isJumping = false, canDoubleJump = true, hasDoubleJumped = false, isFlipping = false, flipDirection = null, flipProgress = 0;
let verticalVelocity = 0;
let horizontalVelocity = { x: 0, z: 0 };

let boost = 100;
const maxBoost = 100;
const boostPadValue = 33;
const boostPadCooldown = 2000;
let isBoosting = false;
let boostSpeedIncrement = 0.025;
const boostDecrement = 0.8;

const boostDisplay = document.createElement('div');
boostDisplay.style.position = 'fixed';
boostDisplay.style.left = '20px';
boostDisplay.style.bottom = '20px';
boostDisplay.style.color = 'white';
boostDisplay.style.fontFamily = 'Arial';
boostDisplay.style.fontSize = '30px';
boostDisplay.style.background = 'rgba(0,0,0,0.5)';
boostDisplay.style.padding = '8px 16px';
boostDisplay.style.borderRadius = '8px';
boostDisplay.innerText = `Boost: ${Math.floor(boost)}`;
document.body.appendChild(boostDisplay);

// --- INPUT HANDLING ---
document.addEventListener('keydown', (e) => { keys[e.key] = true; });
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

// --- BOOST PAD LOGIC ---
function updateBoostPads() {
  boostPads.forEach(pad => {
    const padPos = pad.position;
    const carPos = car.position;
    const dist = Math.sqrt((padPos.x - carPos.x) ** 2 + (padPos.z - carPos.z) ** 2);
    if (pad.userData.active && dist < 2.5 && car.position.y <= 2.5) {
      boost = Math.min(boost + boostPadValue, maxBoost);
      pad.material = pad.material.clone();
      pad.material.color.set(0x888888);
      pad.userData.active = false;
      if (pad.userData.cooldownTimeout) clearTimeout(pad.userData.cooldownTimeout);
      pad.userData.cooldownTimeout = setTimeout(() => {
        pad.material = pad.material.clone();
        pad.material.color.set(0xffd700);
        pad.userData.active = true;
      }, boostPadCooldown);
    }
  });
}

// --- CAR MOVEMENT ---
// Allow boosting to switch direction instantly and allow car rotation (pitch) in air
function moveCar() {
  // Handle boost
  if ((keys['Shift'] || keys['shift']) && boost > 0) {
    isBoosting = true;
    carSpeed = Math.min(carSpeed + boostSpeedIncrement, maxCarSpeed);
    boost = Math.max(0, boost - boostDecrement);
    // Allow instant direction change when boosting
    if ((keys['ArrowUp'] || keys['w']) || (keys['ArrowDown'] || keys['s'])) {
      if (keys['ArrowUp'] || keys['w']) {
        horizontalVelocity.x = -Math.sin(car.rotation.y) * carSpeed;
        horizontalVelocity.z = -Math.cos(car.rotation.y) * carSpeed;
      }
      if (keys['ArrowDown'] || keys['s']) {
        horizontalVelocity.x = Math.sin(car.rotation.y) * carSpeed;
        horizontalVelocity.z = Math.cos(car.rotation.y) * carSpeed;
      }
    }
  } else {
    isBoosting = false;
    carSpeed = Math.max(baseCarSpeed, carSpeed - boostSpeedIncrement);
  }

  // Turning (always allowed, slower in air)
  let currentTurnSpeed = !isJumping ? turnSpeed : airTurnSpeed;
  if (keys['ArrowLeft'] || keys['a']) car.rotation.y += currentTurnSpeed;
  if (keys['ArrowRight'] || keys['d']) car.rotation.y -= currentTurnSpeed;

  // Car air rotation - pitch (forward/backward flip), only in air or always for more fun
  if (isJumping || true) {
    if (keys['w']) car.rotation.x -= 0.05;
    if (keys['s']) car.rotation.x += 0.05;
    // Clamp pitch for realism
    car.rotation.x = Math.max(Math.min(car.rotation.x, Math.PI/2), -Math.PI/2);
  }

  // Forward/Backward (only on ground)
  if (!isJumping) {
    if (keys['ArrowUp'] || keys['w']) {
      car.position.x -= Math.sin(car.rotation.y) * carSpeed;
      car.position.z -= Math.cos(car.rotation.y) * carSpeed;
      horizontalVelocity.x = -Math.sin(car.rotation.y) * carSpeed;
      horizontalVelocity.z = -Math.cos(car.rotation.y) * carSpeed;
    }
    if (keys['ArrowDown'] || keys['s']) {
      car.position.x += Math.sin(car.rotation.y) * carSpeed;
      car.position.z += Math.cos(car.rotation.y) * carSpeed;
      horizontalVelocity.x = Math.sin(car.rotation.y) * carSpeed;
      horizontalVelocity.z = Math.cos(car.rotation.y) * carSpeed;
    }
  }
}

// --- JUMP, DOUBLE JUMP, AND FLIP ---
const fullFlipAngle = Math.PI * 2;
const flipDuration = 16;
let jumpKeyWasDown = false;

function handleJumpOrFlip() {
  // SPACEBAR handling: jump, double jump, flip (only spacebar needed)
  const jumpKey = keys[' '];

  // Detect "just pressed" event for spacebar
  if (jumpKey && !jumpKeyWasDown) {
    // Initial jump (from ground)
    if (!isJumping && !isFlipping) {
      isJumping = true;
      verticalVelocity = jumpStrength;
      hasDoubleJumped = false;
      canDoubleJump = true;
    }
    // While airborne, check for flip or double jump
    else if (isJumping && !isFlipping && canDoubleJump) {
      // FLIP: If a movement key is held
      if (
        (keys['ArrowUp'] || keys['w']) ||
        (keys['ArrowDown'] || keys['s']) ||
        (keys['ArrowLeft'] || keys['a']) ||
        (keys['ArrowRight'] || keys['d'])
      ) {
        if (keys['ArrowUp'] || keys['w']) flipDirection = 'forward';
        else if (keys['ArrowDown'] || keys['s']) flipDirection = 'backward';
        else if (keys['ArrowLeft'] || keys['a']) flipDirection = 'left';
        else if (keys['ArrowRight'] || keys['d']) flipDirection = 'right';
        isFlipping = true;
        flipProgress = 0;

        // Directional boost
        let boostVec = { x: 0, z: 0 };
        const angle = car.rotation.y;
        switch (flipDirection) {
          case 'forward':
            boostVec.x = -Math.sin(angle) * flipBoost;
            boostVec.z = -Math.cos(angle) * flipBoost;
            break;
          case 'backward':
            boostVec.x = Math.sin(angle) * flipBoost;
            boostVec.z = Math.cos(angle) * flipBoost;
            break;
          case 'left':
            boostVec.x = -Math.cos(angle) * flipBoost;
            boostVec.z = Math.sin(angle) * flipBoost;
            break;
          case 'right':
            boostVec.x = Math.cos(angle) * flipBoost;
            boostVec.z = -Math.sin(angle) * flipBoost;
            break;
        }
        horizontalVelocity.x = boostVec.x;
        horizontalVelocity.z = boostVec.z;
        canDoubleJump = false;
        hasDoubleJumped = false;
      } else if (!hasDoubleJumped) {
        verticalVelocity = doubleJumpStrength;
        hasDoubleJumped = true;
        canDoubleJump = false;
      }
    }
  }

  jumpKeyWasDown = jumpKey;

  // Animate flip if flipping
  if (isFlipping) {
    const flipStep = fullFlipAngle / flipDuration;
    switch (flipDirection) {
      case 'forward': car.rotation.x -= flipStep; break;
      case 'backward': car.rotation.x += flipStep; break;
      case 'left': car.rotation.z += flipStep; break;
      case 'right': car.rotation.z -= flipStep; break;
    }
    flipProgress++;
    if (flipProgress >= flipDuration) {
      isFlipping = false;
      if (flipDirection === 'forward' || flipDirection === 'backward')
        car.rotation.x = Math.round(car.rotation.x / (Math.PI * 2)) * (Math.PI * 2);
      else car.rotation.z = Math.round(car.rotation.z / (Math.PI * 2)) * (Math.PI * 2);
      flipDirection = null;
    }
  }

  // Jump physics and landing
  if (isJumping) {
    car.position.y += verticalVelocity;
    verticalVelocity += gravity;
    car.position.x += horizontalVelocity.x;
    car.position.z += horizontalVelocity.z;

    if (car.position.y <= 0.8) {
      car.position.y = 0.8;
      isJumping = false;
      canDoubleJump = true;
      isFlipping = false;
      flipDirection = null;
      flipProgress = 0;
      hasDoubleJumped = false;
      verticalVelocity = 0;
      carSpeed = baseCarSpeed;
      car.rotation.x = 0;
      car.rotation.z = 0;
      horizontalVelocity.x = 0;
      horizontalVelocity.z = 0;
    }
  }
}

// --- BALL PHYSICS, COLLISION WITH FIELD AND CAR ---
function updateBall() {
  // Gravity
  ballVelocity.y += gravity;
  // Move ball
  ball.position.x += ballVelocity.x;
  ball.position.y += ballVelocity.y;
  ball.position.z += ballVelocity.z;

  // Field collision (bounce)
  if (ball.position.y - ballRadius < 0.1) {
    ball.position.y = ballRadius + 0.1;
    ballVelocity.y *= -ballRestitution;
    ballVelocity.x *= ballFriction;
    ballVelocity.z *= ballFriction;
    if (Math.abs(ballVelocity.y) < 0.05) ballVelocity.y = 0;
  }

  // Wall collision
  if (Math.abs(ball.position.x) + ballRadius > fieldWidth/2) {
    ball.position.x = Math.sign(ball.position.x) * ((fieldWidth/2) - ballRadius);
    ballVelocity.x *= -ballRestitution;
  }
  if (Math.abs(ball.position.z) + ballRadius > fieldDepth/2) {
    ball.position.z = Math.sign(ball.position.z) * ((fieldDepth/2) - ballRadius);
    ballVelocity.z *= -ballRestitution;
  }
  // Roof collision
  if (ball.position.y + ballRadius > wallHeight) {
    ball.position.y = wallHeight - ballRadius;
    ballVelocity.y *= -ballRestitution * 0.85;
  }

  // --- CAR TO BALL COLLISION ---
  const dist = Math.sqrt(
    (ball.position.x - car.position.x) ** 2 +
    (ball.position.y - car.position.y) ** 2 +
    (ball.position.z - car.position.z) ** 2
  );
  if (dist < ballRadius + 1.2) {
    // Kick the ball in the direction the car is moving
    let dx = ball.position.x - car.position.x;
    let dy = ball.position.y - car.position.y;
    let dz = ball.position.z - car.position.z;
    const mag = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    dx /= mag; dy /= mag; dz /= mag;
    const power = Math.max(0.22, Math.abs(horizontalVelocity.x) + Math.abs(horizontalVelocity.z) + (isBoosting ? 0.45 : 0));
    ballVelocity.x = dx * power;
    ballVelocity.y = Math.abs(verticalVelocity) > 0.15 ? dy * (power + 0.15) : ballVelocity.y;
    ballVelocity.z = dz * power;
    // Move ball out of car
    ball.position.x = car.position.x + dx * (ballRadius + 1.3);
    ball.position.y = Math.max(car.position.y + dy * (ballRadius + 1.3), ballRadius + 0.1);
    ball.position.z = car.position.z + dz * (ballRadius + 1.3);
  }
}

// --- CAMERA ---
function updateCamera() {
  const offset = new THREE.Vector3(0, 6, 14);
  const rotatedOffset = offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);
  camera.position.copy(car.position.clone().add(rotatedOffset));
  camera.lookAt(car.position.clone().add(new THREE.Vector3(0, 1, 0)));
}

// --- SCORE LOGIC ---
const scoreDisplay = document.createElement('div');
scoreDisplay.style.position = 'fixed';
scoreDisplay.style.top = '20px';
scoreDisplay.style.left = '50%';
scoreDisplay.style.transform = 'translateX(-50%)';
scoreDisplay.style.color = '#fff';
scoreDisplay.style.fontFamily = 'Arial';
scoreDisplay.style.fontSize = '36px';
scoreDisplay.style.background = 'rgba(0,0,0,0.6)';
scoreDisplay.style.padding = '12px 24px';
scoreDisplay.style.borderRadius = '8px';
scoreDisplay.style.zIndex = '20';
scoreDisplay.innerText = "Red: 0  |  Green: 0";
document.body.appendChild(scoreDisplay);

let redScore = 0;
let greenScore = 0;

function updateScoreDisplay() {
  scoreDisplay.innerText = `Red: ${redScore}  |  Green: ${greenScore}`;
}

function showGoalMessage(team) {
  const goalMsg = document.createElement('div');
  goalMsg.style.position = 'fixed';
  goalMsg.style.top = '50%';
  goalMsg.style.left = '50%';
  goalMsg.style.transform = 'translate(-50%, -50%)';
  goalMsg.style.fontSize = '64px';
  goalMsg.style.fontWeight = 'bold';
  goalMsg.style.color = team === "red" ? "#ff3333" : "#33ff33";
  goalMsg.style.textShadow = "0 4px 32px #000";
  goalMsg.style.zIndex = '99';
  goalMsg.style.pointerEvents = 'none';
  goalMsg.innerText = `${team.charAt(0).toUpperCase() + team.slice(1)} Scores!`;
  document.body.appendChild(goalMsg);
  setTimeout(() => { goalMsg.remove(); }, 1600);
}

// --- GOAL DETECTION ---
function checkGoal() {
  // Left Goal (Red goal): Green scores
  if (
    ball.position.x - ballRadius < -(fieldWidth/2 - 1) &&
    Math.abs(ball.position.z) < 8 &&
    ball.position.y < 3
  ) {
    greenScore += 1;
    updateScoreDisplay();
    showGoalMessage("green");
    resetAfterGoal();
  }
  // Right Goal (Green goal): Red scores
  else if (
    ball.position.x + ballRadius > (fieldWidth/2 - 1) &&
    Math.abs(ball.position.z) < 8 &&
    ball.position.y < 3
  ) {
    redScore += 1;
    updateScoreDisplay();
    showGoalMessage("red");
    resetAfterGoal();
  }
}

// --- GOAL RESET ---
function resetAfterGoal() {
  ball.position.set(0, ballRadius, 0);
  car.position.set(0, 0.8, -15);
  car.rotation.set(0, 0, 0);
  ballVelocity.x = 0;
  ballVelocity.y = 0;
  ballVelocity.z = 0;
  verticalVelocity = 0;
  horizontalVelocity.x = 0;
  horizontalVelocity.z = 0;
  isJumping = false;
  isFlipping = false;
  flipDirection = null;
  flipProgress = 0;
  hasDoubleJumped = false;
  boost = maxBoost;
}

// --- GAME LOOP ---
function animate() {
  requestAnimationFrame(animate);
  moveCar();
  handleJumpOrFlip();
  updateBoostPads();
  updateBall();
  checkGoal();
  updateCamera();
  boostDisplay.innerText = `Boost: ${Math.floor(boost)}`;
  renderer.render(scene, camera);
}
animate();
// ... (all code above remains unchanged)

// --- MOVEMENT & GAME VARIABLES ---
const baseCarSpeed = 0.25;
const maxCarSpeed = 1.6;
const acceleration = 0.012; // NEW: acceleration per frame
const deceleration = 0.018; // NEW: natural slow down per frame
const turnSpeed = 0.045;
const airTurnSpeed = 0.03;
const jumpStrength = 0.35;
const doubleJumpStrength = 0.35;
const flipBoost = 0.8;
const gravity = -0.0125;
const keys = {};
let carSpeed = 0; // START AT 0 FOR GRADUAL ACCELERATION
let targetSpeed = 0;
let isJumping = false, canDoubleJump = true, hasDoubleJumped = false, isFlipping = false, flipDirection = null, flipProgress = 0;
let verticalVelocity = 0;
let horizontalVelocity = { x: 0, z: 0 };

// ... (boost variables, boostDisplay, etc. remain unchanged)

// --- CAR MOVEMENT ---
// Allow boosting to switch direction instantly and allow car rotation (pitch) in air
function moveCar() {
  // Determine target speed
  if ((keys['ArrowUp'] || keys['w'])) {
    targetSpeed = maxCarSpeed;
  } else if ((keys['ArrowDown'] || keys['s'])) {
    targetSpeed = -maxCarSpeed * 0.7; // Reverse is slower
  } else {
    targetSpeed = 0;
  }

  // Handle boost
  if ((keys['Shift'] || keys['shift']) && boost > 0) {
    targetSpeed = targetSpeed > 0 ? maxCarSpeed * 1.15 : -maxCarSpeed * 0.8;
    boost = Math.max(0, boost - boostDecrement);
    isBoosting = true;
  } else {
    isBoosting = false;
  }

  // Gradually approach target speed (acceleration/deceleration)
  if (carSpeed < targetSpeed) {
    carSpeed = Math.min(carSpeed + acceleration, targetSpeed);
  } else if (carSpeed > targetSpeed) {
    carSpeed = Math.max(carSpeed - deceleration, targetSpeed);
  }

  // Natural slow down (friction) when no input
  if (Math.abs(targetSpeed) < 0.01 && Math.abs(carSpeed) > 0.01) {
    carSpeed -= Math.sign(carSpeed) * deceleration * 0.5;
    if (Math.abs(carSpeed) < 0.01) carSpeed = 0;
  }

  // Turning (always allowed, slower in air)
  let currentTurnSpeed = !isJumping ? turnSpeed : airTurnSpeed;
  if (keys['ArrowLeft'] || keys['a']) car.rotation.y += currentTurnSpeed;
  if (keys['ArrowRight'] || keys['d']) car.rotation.y -= currentTurnSpeed;

  // Car air rotation - pitch (forward/backward flip), only in air or always for more fun
  if (isJumping || true) {
    if (keys['w']) car.rotation.x -= 0.05;
    if (keys['s']) car.rotation.x += 0.05;
    // Clamp pitch for realism
    car.rotation.x = Math.max(Math.min(car.rotation.x, Math.PI/2), -Math.PI/2);
  }

  // Move car
  if (!isJumping) {
    car.position.x -= Math.sin(car.rotation.y) * carSpeed;
    car.position.z -= Math.cos(car.rotation.y) * carSpeed;
    horizontalVelocity.x = -Math.sin(car.rotation.y) * carSpeed;
    horizontalVelocity.z = -Math.cos(car.rotation.y) * carSpeed;
  } else if (isBoosting) {
    // Allow instant direction switch in air only if boosting
    if ((keys['ArrowUp'] || keys['w'])) {
      horizontalVelocity.x = -Math.sin(car.rotation.y) * Math.abs(carSpeed);
      horizontalVelocity.z = -Math.cos(car.rotation.y) * Math.abs(carSpeed);
    }
    if ((keys['ArrowDown'] || keys['s'])) {
      horizontalVelocity.x = Math.sin(car.rotation.y) * Math.abs(carSpeed);
      horizontalVelocity.z = Math.cos(car.rotation.y) * Math.abs(carSpeed);
    }
  }
}

// ... (rest of your code remains unchanged)
