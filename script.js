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
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// UI Menu
const menu = document.getElementById('menu');
const playButton = document.getElementById('playButton');
const settingsButton = document.getElementById('settingsButton');
const multiplayerButton = document.getElementById('multiplayerButton');
const quitButton = document.getElementById('quitButton');

// Movement variables
const carSpeed = 0.2;
const jumpStrength = 0.5;
const gravity = -0.02;
const keys = {};
let isJumping = false;
let verticalVelocity = 0;

// Add event listeners for key presses
document.addEventListener('keydown', (event) => {
  keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
  keys[event.key] = false;
});

// Function to handle car movement
function moveCar() {
  if (keys['ArrowUp'] || keys['w']) {
    car.position.z -= carSpeed; // Move forward
  }
  if (keys['ArrowDown'] || keys['s']) {
    car.position.z += carSpeed; // Move backward
  }
  if (keys['ArrowLeft'] || keys['a']) {
    car.position.x -= carSpeed; // Move left
  }
  if (keys['ArrowRight'] || keys['d']) {
    car.position.x += carSpeed; // Move right
  }
}

// Function to handle jumping
function handleJump() {
  if (keys[' '] && !isJumping) { // Spacebar key to jump
    isJumping = true;
    verticalVelocity = jumpStrength;
  }
  
  if (isJumping) {
    car.position.y += verticalVelocity; // Apply vertical velocity
    verticalVelocity += gravity; // Apply gravity
    
    if (car.position.y <= 1.5) { // Stop jumping when car hits the ground
      car.position.y = 1.5;
      isJumping = false;
      verticalVelocity = 0;
    }
  }
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
  
  // Update car movement and jumping
  moveCar();
  handleJump();

  // Render the scene
  renderer.render(scene, camera);
}
