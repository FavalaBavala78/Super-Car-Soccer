// Game setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadow mapping
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true; // Enable shadows
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(50, 30);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Horizontal
ground.receiveShadow = true; // Ground receives shadows
scene.add(ground);

// Car (Body)
const carBodyGeometry = new THREE.BoxGeometry(2, 1, 4);
const carBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
carBody.position.set(0, 1.5, 0);
carBody.castShadow = true; // Car casts shadows
scene.add(carBody);

// Car (Wheels)
const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 32);
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

function createWheel(x, y, z) {
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.rotation.z = Math.PI / 2; // Rotate to match wheel orientation
  wheel.position.set(x, y, z);
  wheel.castShadow = true; // Wheels cast shadows
  return wheel;
}

const frontLeftWheel = createWheel(-0.8, 1, 1.5);
const frontRightWheel = createWheel(0.8, 1, 1.5);
const backLeftWheel = createWheel(-0.8, 1, -1.5);
const backRightWheel = createWheel(0.8, 1, -1.5);

scene.add(frontLeftWheel, frontRightWheel, backLeftWheel, backRightWheel);

// Group car parts together
const car = new THREE.Group();
car.add(carBody, frontLeftWheel, frontRightWheel, backLeftWheel, backRightWheel);
scene.add(car);

// Camera positioning
camera.position.set(0, 5, 10); // Initial camera position
camera.lookAt(car.position); // Look at the car's position

// UI Menu
const menu = document.getElementById('menu');
const playButton = document.getElementById('playButton');
const settingsButton = document.getElementById('settingsButton');
const multiplayerButton = document.getElementById('multiplayerButton');
const quitButton = document.getElementById('quitButton');

// Movement variables
let carSpeed = 0.2; // Forward and backward speed
const baseCarSpeed = 0.2;
const maxCarSpeed = 1.2; // Max speed with full boost
const turnSpeed = 0.05; // Turning speed (rotation)
const airTurnSpeed = 0.03; // Slightly slower turning in air
const jumpStrength = 0.5;
const doubleJumpStrength = 0.5;
const flipSpeedBoost = 0.7; // Extra speed for flip (can be adjusted)
const gravity = -0.02;
const keys = {};
let isJumping = false;
let canDoubleJump = true; // Allows a second jump or flip
let hasDoubleJumped = false; // True if double jump was used
let verticalVelocity = 0;
let horizontalVelocity = { x: 0, z: 0 }; // Tracks car's momentum

// Flip state
let isFlipping = false;
let flipDirection = null; // 'forward', 'backward', 'left', 'right'
let flipProgress = 0;
const flipDuration = 12; // Frames to complete flip (adjust for speed)
const fullFlipAngle = Math.PI * 2; // 360 degrees

// BOOST MECHANIC VARIABLES
let boost = 0; // Current boost amount (0-100)
const maxBoost = 100;
const boostPadValue = 25; // How much boost a pad gives
const boostPadCooldown = 2000; // ms before a pad reactivates
let isBoosting = false;
let boostSpeedIncrement = 0.02; // How much speed increases per frame holding boost
const boostDecrement = 0.6; // Boost consumed per frame holding boost

// Boost display (simple UI)
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

// BOOST PAD SETUP
const boostPads = [];
const boostPadGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
const boostPadMaterialActive = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffa500 });
const boostPadMaterialInactive = new THREE.MeshStandardMaterial({ color: 0x555555, emissive: 0x111111 });

function addBoostPad(x, z) {
  const pad = new THREE.Mesh(boostPadGeometry, boostPadMaterialActive.clone());
  pad.position.set(x, 0.11, z);
  pad.rotation.x = -Math.PI / 2;
  pad.receiveShadow = true;
  pad.userData = { active: true, cooldownTimeout: null };
  scene.add(pad);
  boostPads.push(pad);
}

// Place a few boost pads on the map
addBoostPad(0, 10);
addBoostPad(-20, 0);
addBoostPad(20, 0);
addBoostPad(0, -10);
addBoostPad(-10, 10);
addBoostPad(10, -10);

function updateBoostPads() {
  // Check collision with each pad
  boostPads.forEach(pad => {
    const padPos = pad.position;
    const carPos = car.position;
    const dist = Math.sqrt(
      (padPos.x - carPos.x) ** 2 +
      (padPos.z - carPos.z) ** 2
    );
    if (pad.userData.active && dist < 2.5 && car.position.y <= 2.5) {
      // Collect boost!
      boost = Math.min(boost + boostPadValue, maxBoost);
      pad.material = boostPadMaterialInactive.clone();
      pad.userData.active = false;
      // Reactivate after cooldown
      if (pad.userData.cooldownTimeout) clearTimeout(pad.userData.cooldownTimeout);
      pad.userData.cooldownTimeout = setTimeout(() => {
        pad.material = boostPadMaterialActive.clone();
        pad.userData.active = true;
      }, boostPadCooldown);
    }
  });
}

// Add event listeners for key presses
document.addEventListener('keydown', (event) => {
  keys[event.key] = true;
});
document.addEventListener('keyup', (event) => {
  keys[event.key] = false;
});

// Function to handle car movement and turning (boost logic included)
function moveCar() {
  // Handle boost
  let boostingThisFrame = false;
  if (keys['Shift'] && boost > 0) {
    isBoosting = true;
    boostingThisFrame = true;
    // Gradually ramp up speed, but cap at maxCarSpeed
    carSpeed = Math.min(carSpeed + boostSpeedIncrement, maxCarSpeed);
    boost = Math.max(0, boost - boostDecrement);
  } else {
    isBoosting = false;
    // Gradually return to base speed if not boosting
    carSpeed = Math.max(baseCarSpeed, carSpeed - boostSpeedIncrement);
  }

  // Allow turning in mid-air
  let currentTurnSpeed = !isJumping ? turnSpeed : airTurnSpeed;
  if (keys['ArrowLeft'] || keys['a']) car.rotation.y += currentTurnSpeed;
  if (keys['ArrowRight'] || keys['d']) car.rotation.y -= currentTurnSpeed;

  if (!isJumping) {
    // Move only on ground
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

// Function to handle jumping, double jumping, and flipping
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
    // FLIP: If a movement key is held, determine flip direction and apply directional boost
    if (
      (keys['ArrowUp'] || keys['w']) ||
      (keys['ArrowDown'] || keys['s']) ||
      (keys['ArrowLeft'] || keys['a']) ||
      (keys['ArrowRight'] || keys['d'])
    ) {
      // Determine flip direction
      if (keys['ArrowUp'] || keys['w']) {
        flipDirection = 'forward';
      } else if (keys['ArrowDown'] || keys['s']) {
        flipDirection = 'backward';
      } else if (keys['ArrowLeft'] || keys['a']) {
        flipDirection = 'left';
      } else if (keys['ArrowRight'] || keys['d']) {
        flipDirection = 'right';
      }
      isFlipping = true;
      flipProgress = 0;

      // Directional boost vector
      let boostVec = { x: 0, z: 0 };
      const angle = car.rotation.y;
      switch (flipDirection) {
        case 'forward':
          boostVec.x = -Math.sin(angle) * flipSpeedBoost;
          boostVec.z = -Math.cos(angle) * flipSpeedBoost;
          break;
        case 'backward':
          boostVec.x = Math.sin(angle) * flipSpeedBoost;
          boostVec.z = Math.cos(angle) * flipSpeedBoost;
          break;
        case 'left':
          boostVec.x = -Math.cos(angle) * flipSpeedBoost;
          boostVec.z = Math.sin(angle) * flipSpeedBoost;
          break;
        case 'right':
          boostVec.x = Math.cos(angle) * flipSpeedBoost;
          boostVec.z = -Math.sin(angle) * flipSpeedBoost;
          break;
      }
      // Apply boost to momentum for this jump
      horizontalVelocity.x = boostVec.x;
      horizontalVelocity.z = boostVec.z;
      canDoubleJump = false; // Only one flip/double jump per air time
      hasDoubleJumped = false;
    }
    // DOUBLE JUMP: If NO movement key, DOUBLE JUMP
    else if (!hasDoubleJumped) {
      verticalVelocity = doubleJumpStrength;
      hasDoubleJumped = true;
      canDoubleJump = false;
    }
  }

  // Animate flip if flipping
  if (isFlipping) {
    const flipStep = fullFlipAngle / flipDuration;
    switch (flipDirection) {
      case 'forward':
        car.rotation.x -= flipStep;
        break;
      case 'backward':
        car.rotation.x += flipStep;
        break;
      case 'left':
        car.rotation.z += flipStep;
        break;
      case 'right':
        car.rotation.z -= flipStep;
        break;
    }
    flipProgress++;
    if (flipProgress >= flipDuration) {
      isFlipping = false;
      // Snap rotation for perfect alignment
      if (flipDirection === 'forward' || flipDirection === 'backward') {
        car.rotation.x = Math.round(car.rotation.x / (Math.PI * 2)) * (Math.PI * 2);
      } else {
        car.rotation.z = Math.round(car.rotation.z / (Math.PI * 2)) * (Math.PI * 2);
      }
      flipDirection = null;
    }
  }

  // Jump physics and landing
  if (isJumping) {
    car.position.y += verticalVelocity; // Apply vertical velocity
    verticalVelocity += gravity; // Apply gravity

    // Apply horizontal momentum during jump
    car.position.x += horizontalVelocity.x;
    car.position.z += horizontalVelocity.z;

    if (car.position.y <= 1.5) { // Stop jumping when car hits the ground
      car.position.y = 1.5;
      isJumping = false;
      canDoubleJump = true; // Reset double jump/flip ability
      isFlipping = false;
      flipDirection = null;
      flipProgress = 0;
      hasDoubleJumped = false;
      verticalVelocity = 0;
      carSpeed = baseCarSpeed; // Reset speed after landing
      car.rotation.x = 0; // Reset flips
      car.rotation.z = 0;
      horizontalVelocity.x = 0;
      horizontalVelocity.z = 0;
    }
  }
}

// Function to update the camera to follow the car
function updateCamera() {
  const offset = new THREE.Vector3(0, 5, 10); // Offset behind and above the car
  const rotatedOffset = offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y); // Rotate the offset based on the car's rotation
  camera.position.copy(car.position.clone().add(rotatedOffset)); // Position the camera
  camera.lookAt(car.position); // Make the camera look at the car
}

playButton.addEventListener('click', () => {
  menu.style.display = 'none'; // Hide menu
  animate(); // Start the game loop
});

settingsButton.addEventListener('click', () => {
  alert('Settings menu not implemented yet!');
});

multiplayerButton.addEventListener('click', () => {
  alert('Multiplayer mode not implemented yet!');
});

quitButton.addEventListener('click', () => {
  window.close(); // Close the window
});

// Game loop
function animate() {
  requestAnimationFrame(animate);

  // Update car movement and jumping/flipping
  moveCar();
  handleJumpOrFlip();

  // Update boost pads and UI
  updateBoostPads();
  boostDisplay.innerText = `Boost: ${Math.floor(boost)}`;

  // Update the camera
  updateCamera();

  // Render the scene
  renderer.render(scene, camera);
}
