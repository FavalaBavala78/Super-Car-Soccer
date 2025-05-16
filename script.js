// Rocket League Inspired Game - Basic Mechanics

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
const fieldGeometry = new THREE.PlaneGeometry(60, 40);
const fieldMaterial = new THREE.MeshStandardMaterial({ color: 0x0066cc });
const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
field.rotation.x = -Math.PI / 2;
field.receiveShadow = true;
scene.add(field);

// Add field lines and goals (visual only)
function createGoal(x, color) {
  const postGeometry = new THREE.BoxGeometry(0.5, 4, 8);
  const postMaterial = new THREE.MeshStandardMaterial({ color });
  const post = new THREE.Mesh(postGeometry, postMaterial);
  post.position.set(x, 2, 0);
  post.castShadow = true;
  scene.add(post);
}
createGoal(-30, 0xff3333); // Left
createGoal(30, 0x33ff33); // Right

// --- SOCCER BALL ---
const ballRadius = 1.2;
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
const carBodyGeometry = new THREE.BoxGeometry(2, 1, 4);
const carBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
carBody.castShadow = true;

function createWheel(x, y, z) {
  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  wheel.castShadow = true;
  return wheel;
}
const wheels = [
  createWheel(-0.8, -0.5, 1.5),
  createWheel(0.8, -0.5, 1.5),
  createWheel(-0.8, -0.5, -1.5),
  createWheel(0.8, -0.5, -1.5)
];

const car = new THREE.Group();
car.add(carBody, ...wheels);
car.position.set(0, 1.2, -10);
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
addBoostPad(0, 15);
addBoostPad(0, -15);
addBoostPad(-20, 0);
addBoostPad(20, 0);

// --- MOVEMENT & GAME VARIABLES ---
const baseCarSpeed = 0.25;
const maxCarSpeed = 1.6;
const turnSpeed = 0.045;
const airTurnSpeed = 0.03;
const jumpStrength = 0.5;
const doubleJumpStrength = 0.5;
const flipBoost = 0.8;
const gravity = -0.025;
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
function moveCar() {
  // Handle boost
  if ((keys['Shift'] || keys['shift']) && boost > 0) {
    isBoosting = true;
    carSpeed = Math.min(carSpeed + boostSpeedIncrement, maxCarSpeed);
    boost = Math.max(0, boost - boostDecrement);
  } else {
    isBoosting = false;
    carSpeed = Math.max(baseCarSpeed, carSpeed - boostSpeedIncrement);
  }

  // Turning (always allowed, slower in air)
  let currentTurnSpeed = !isJumping ? turnSpeed : airTurnSpeed;
  if (keys['ArrowLeft'] || keys['a']) car.rotation.y += currentTurnSpeed;
  if (keys['ArrowRight'] || keys['d']) car.rotation.y -= currentTurnSpeed;

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
function handleJumpOrFlip() {
  // Initial jump (from ground)
  if (keys[' '] && !isJumping && !isFlipping) {
    isJumping = true;
    verticalVelocity = jumpStrength;
    hasDoubleJumped = false;
    canDoubleJump = true;
  }

  // While airborne, check for flip or double jump
  if (
    isJumping && !isFlipping && canDoubleJump && keys[' ']
  ) {
    // FLIP: If a movement key is held
    if ((keys['ArrowUp'] || keys['w']) || (keys['ArrowDown'] || keys['s']) || (keys['ArrowLeft'] || keys['a']) || (keys['ArrowRight'] || keys['d'])) {
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

  // Animate flip
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

    if (car.position.y <= 1.2) {
      car.position.y = 1.2;
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
  if (Math.abs(ball.position.x) + ballRadius > 30) {
    ball.position.x = Math.sign(ball.position.x) * (30 - ballRadius);
    ballVelocity.x *= -ballRestitution;
  }
  if (Math.abs(ball.position.z) + ballRadius > 20) {
    ball.position.z = Math.sign(ball.position.z) * (20 - ballRadius);
    ballVelocity.z *= -ballRestitution;
  }

  // --- CAR TO BALL COLLISION ---
  const dist = Math.sqrt(
    (ball.position.x - car.position.x) ** 2 +
    (ball.position.y - car.position.y) ** 2 +
    (ball.position.z - car.position.z) ** 2
  );
  if (dist < ballRadius + 1.5) {
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
    ball.position.x = car.position.x + dx * (ballRadius + 1.6);
    ball.position.y = Math.max(car.position.y + dy * (ballRadius + 1.6), ballRadius + 0.1);
    ball.position.z = car.position.z + dz * (ballRadius + 1.6);
  }
}

// --- CAMERA ---
function updateCamera() {
  const offset = new THREE.Vector3(0, 6, 14);
  const rotatedOffset = offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);
  camera.position.copy(car.position.clone().add(rotatedOffset));
  camera.lookAt(car.position.clone().add(new THREE.Vector3(0, 1, 0)));
}

// --- GAME LOOP ---
function animate() {
  requestAnimationFrame(animate);
  moveCar();
  handleJumpOrFlip();
  updateBoostPads();
  updateBall();
  updateCamera();
  boostDisplay.innerText = `Boost: ${Math.floor(boost)}`;
  renderer.render(scene, camera);
}

animate();
// ... (all code above remains unchanged)

// Play button functionality: start the game loop when clicked, only once
let gameStarted = false;

playButton.addEventListener('click', () => {
  if (!gameStarted) {
    menu.style.display = 'none'; // Hide menu
    animate(); // Start the game loop
    gameStarted = true; // Prevent multiple loops
  }
});

// ... (rest of your code remains unchanged)
// ... (all your Rocket League game code above remains unchanged)

// ... (all your Rocket League game code above remains unchanged)

// --- MULTIPLAYER MENU UI (updated) ---
const multiplayerMenu = document.createElement('div');
multiplayerMenu.style.position = 'fixed';
multiplayerMenu.style.top = '50%';
multiplayerMenu.style.left = '50%';
multiplayerMenu.style.transform = 'translate(-50%, -50%)';
multiplayerMenu.style.background = 'rgba(20, 20, 20, 0.95)';
multiplayerMenu.style.padding = '32px';
multiplayerMenu.style.display = 'none';
multiplayerMenu.style.flexDirection = 'column';
multiplayerMenu.style.alignItems = 'center';
multiplayerMenu.style.borderRadius = '10px';
multiplayerMenu.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)';
multiplayerMenu.innerHTML = `
  <h2 style="color:white; margin-bottom:24px;">Multiplayer</h2>
  <button id="createMatchBtn" style="margin: 8px 0; font-size: 18px; padding: 10px 30px;">Create</button>
  <button id="joinMatchBtn" style="margin: 8px 0; font-size: 18px; padding: 10px 30px;">Join</button>
  <div id="multiplayerCreate" style="display:none; margin-top:20px;">
    <div style="color:white; margin-bottom:12px;">Choose Match Type:</div>
    <label style="color:white; font-size:18px;">
      <input type="radio" id="publicMatch" name="matchType" value="public" checked>
      Public
    </label>
    <label style="color:white; font-size:18px; margin-left:24px;">
      <input type="radio" id="privateMatch" name="matchType" value="private">
      Private
    </label>
    <div id="privateCodeSection" style="display:none; margin-top:16px;">
      <div style="color:white; margin-bottom:12px;">Your Match Code:</div>
      <input id="matchCodeDisplay" readonly style="font-size:22px; text-align:center; width:120px;"/>
      <div style="color: #aaa; margin-top:8px;">Share this code for others to join.</div>
    </div>
    <button id="startMatchBtn" style="margin-top:18px;">Start Match</button>
    <button id="backFromCreateBtn" style="margin-top:18px;">Back</button>
  </div>
  <div id="multiplayerJoin" style="display:none; margin-top:20px;">
    <div style="color:white; margin-bottom:12px;">Enter Match Code:</div>
    <input id="matchCodeInput" style="font-size:22px; width:120px; text-align:center;" maxlength="8" />
    <button id="joinCodeBtn" style="margin-left: 12px;">Join</button>
    <div id="joinError" style="color:red; margin-top:8px; min-height:22px;"></div>
    <button id="backFromJoinBtn" style="margin-top:18px;">Back</button>
  </div>
`;
document.body.appendChild(multiplayerMenu);

// --- Multiplayer Button Event ---
multiplayerButton.addEventListener('click', () => {
  menu.style.display = 'none';
  multiplayerMenu.style.display = 'flex';
  document.getElementById('multiplayerCreate').style.display = 'none';
  document.getElementById('multiplayerJoin').style.display = 'none';
});

// --- CREATE MATCH ---
function generateMatchCode(length = 6) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; ++i) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
let currentMatchCode = null;
let currentMatchType = "public"; // "public" or "private"

// Show create match UI and handle match type selection
document.getElementById('createMatchBtn').onclick = () => {
  document.getElementById('multiplayerCreate').style.display = 'block';
  document.getElementById('multiplayerJoin').style.display = 'none';
  document.getElementById('privateCodeSection').style.display = 'none';
  document.getElementById('publicMatch').checked = true;
  document.getElementById('privateMatch').checked = false;
  currentMatchType = "public";
  currentMatchCode = null;
  document.getElementById('matchCodeDisplay').value = "";
};

// Toggle between public and private, generate code if private
document.getElementById('publicMatch').onchange = () => {
  if (document.getElementById('publicMatch').checked) {
    currentMatchType = "public";
    document.getElementById('privateCodeSection').style.display = 'none';
    currentMatchCode = null;
    document.getElementById('matchCodeDisplay').value = "";
  }
};
document.getElementById('privateMatch').onchange = () => {
  if (document.getElementById('privateMatch').checked) {
    currentMatchType = "private";
    document.getElementById('privateCodeSection').style.display = 'block';
    currentMatchCode = generateMatchCode();
    document.getElementById('matchCodeDisplay').value = currentMatchCode;
  }
};

document.getElementById('backFromCreateBtn').onclick = () => {
  document.getElementById('multiplayerCreate').style.display = 'none';
  document.getElementById('privateCodeSection').style.display = 'none';
};

// --- START MATCH BUTTON (Create match) ---
document.getElementById('startMatchBtn').onclick = () => {
  multiplayerMenu.style.display = 'none';
  if (currentMatchType === "public") {
    alert("Game started on a public server!\n(For demo purposes, this just starts the local game)");
    animate();
  } else {
    alert("Private match created! Code: " + currentMatchCode + "\n(For demo, only people with this code can join)");
    animate();
  }
};

// --- JOIN MATCH ---
document.getElementById('joinMatchBtn').onclick = () => {
  document.getElementById('multiplayerJoin').style.display = 'block';
  document.getElementById('multiplayerCreate').style.display = 'none';
  document.getElementById('joinError').innerText = '';
  document.getElementById('matchCodeInput').value = '';
};

document.getElementById('backFromJoinBtn').onclick = () => {
  document.getElementById('multiplayerJoin').style.display = 'none';
  document.getElementById('joinError').innerText = '';
  document.getElementById('matchCodeInput').value = '';
};

// --- JOIN BUTTON LOGIC (FAKE MATCH FOR DEMO) ---
document.getElementById('joinCodeBtn').onclick = () => {
  const code = document.getElementById('matchCodeInput').value.trim().toUpperCase();
  if (!code || code.length < 4) {
    document.getElementById('joinError').innerText = 'Enter a valid code.';
    return;
  }
  if (currentMatchCode && code === currentMatchCode && currentMatchType === "private") {
    document.getElementById('joinError').innerText = '';
    multiplayerMenu.style.display = 'none';
    alert('Joined private match with code: ' + code + '\n(Multiplayer networking not implemented in this demo)');
    animate();
  } else {
    document.getElementById('joinError').innerText = 'Match not found (demo: only works with the code you just created and private matches)';
  }
};

// --- PUBLIC QUICK PLAY BUTTON ---
let gameStarted = false;
playButton.addEventListener('click', () => {
  if (!gameStarted) {
    menu.style.display = 'none';
    // Teleport to public server if available, else start local game
    alert("Joining a public server!\n(For demo purposes, this just starts the local game)");
    animate();
    gameStarted = true;
  }
});

// --- Optionally: allow going back to main menu ---
multiplayerMenu.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    multiplayerMenu.style.display = 'none';
    menu.style.display = '';
  }
});

// ... (rest of your code remains unchanged)
// ... (all your Rocket League game code above remains unchanged)

// --- JUMP, DOUBLE JUMP, AND FLIP (with only spacebar needed) ---
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
      // FLIP: If a movement key is held, determine flip direction and apply directional boost
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

        // Directional boost vector
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
      }
      // DOUBLE JUMP: If NO movement key, DOUBLE JUMP
      else if (!hasDoubleJumped) {
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

    if (car.position.y <= 1.2) {
      car.position.y = 1.2;
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

// ... (rest of your code remains unchanged)
// ... (all your Rocket League game code above remains unchanged)
// ... (all your Rocket League game code above remains unchanged)

// --- JUMP, DOUBLE JUMP, AND FLIP (with only spacebar needed, and jump allowed in any direction) ---
let jumpKeyWasDown = false;

function handleJumpOrFlip() {
  // SPACEBAR handling: jump, double jump, flip (only spacebar needed)
  const jumpKey = keys[' '];

  // Detect "just pressed" event for spacebar
  if (jumpKey && !jumpKeyWasDown) {
    // Initial jump (from ground) - allow jumping even if moving in any direction!
    if (!isJumping && !isFlipping) {
      isJumping = true;
      verticalVelocity = jumpStrength;

      // Keep horizontal momentum if moving while jumping
      if (keys['ArrowUp'] || keys['w']) {
        horizontalVelocity.x = -Math.sin(car.rotation.y) * carSpeed;
        horizontalVelocity.z = -Math.cos(car.rotation.y) * carSpeed;
      } else if (keys['ArrowDown'] || keys['s']) {
        horizontalVelocity.x = Math.sin(car.rotation.y) * carSpeed;
        horizontalVelocity.z = Math.cos(car.rotation.y) * carSpeed;
      }
      // Allow diagonal jump with left/right + up/down
      if ((keys['ArrowLeft'] || keys['a']) && (keys['ArrowUp'] || keys['w'])) {
        // Up + left
        const angle = car.rotation.y + Math.PI / 4;
        horizontalVelocity.x = -Math.sin(angle) * carSpeed;
        horizontalVelocity.z = -Math.cos(angle) * carSpeed;
      } else if ((keys['ArrowRight'] || keys['d']) && (keys['ArrowUp'] || keys['w'])) {
        // Up + right
        const angle = car.rotation.y - Math.PI / 4;
        horizontalVelocity.x = -Math.sin(angle) * carSpeed;
        horizontalVelocity.z = -Math.cos(angle) * carSpeed;
      } else if ((keys['ArrowLeft'] || keys['a']) && (keys['ArrowDown'] || keys['s'])) {
        // Down + left
        const angle = car.rotation.y + (3 * Math.PI) / 4;
        horizontalVelocity.x = -Math.sin(angle) * carSpeed;
        horizontalVelocity.z = -Math.cos(angle) * carSpeed;
      } else if ((keys['ArrowRight'] || keys['d']) && (keys['ArrowDown'] || keys['s'])) {
        // Down + right
        const angle = car.rotation.y - (3 * Math.PI) / 4;
        horizontalVelocity.x = -Math.sin(angle) * carSpeed;
        horizontalVelocity.z = -Math.cos(angle) * carSpeed;
      } else if (keys['ArrowLeft'] || keys['a']) {
        // Just left
        const angle = car.rotation.y + Math.PI / 2;
        horizontalVelocity.x = -Math.sin(angle) * carSpeed;
        horizontalVelocity.z = -Math.cos(angle) * carSpeed;
      } else if (keys['ArrowRight'] || keys['d']) {
        // Just right
        const angle = car.rotation.y - Math.PI / 2;
        horizontalVelocity.x = -Math.sin(angle) * carSpeed;
        horizontalVelocity.z = -Math.cos(angle) * carSpeed;
      }

      hasDoubleJumped = false;
      canDoubleJump = true;
    }
    // While airborne, check for flip or double jump
    else if (isJumping && !isFlipping && canDoubleJump) {
      // FLIP: If a movement key is held, determine flip direction and apply directional boost
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

        // Directional boost vector
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
      }
      // DOUBLE JUMP: If NO movement key, DOUBLE JUMP
      else if (!hasDoubleJumped) {
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

    if (car.position.y <= 1.2) {
      car.position.y = 1.2;
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

// ... (rest of your code remains unchanged)
