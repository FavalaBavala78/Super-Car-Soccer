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
// Increased field size - MAKE ARENA BIGGER HERE!
const fieldWidth = 180;      // was 100
const fieldDepth = 120;      // was 70
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
// Larger ball (optional: you may want to scale this up too!)
const ballRadius = 10;
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
car.position.set(0, 0.8, -35); // Start further back for bigger arena
scene.add(car);

// --- BOOST PADS ---
// Spread out boost pads for larger field
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
addBoostPad(0, 45);
addBoostPad(0, -45);
addBoostPad(-65, 0);
addBoostPad(65, 0);

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
// ... (rest of your code unchanged) ...
// --- The remainder of the code remains unchanged except for the arena size and car/boost pad starting positions as above ---
