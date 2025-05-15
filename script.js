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
const carSpeed = 0.2; // Forward and backward speed
const turnSpeed = 0.05; // Turning speed (rotation)
const jumpStrength = 0.5;
const gravity = -0.02;
const keys = {};
let isJumping = false;
let canDoubleJump = true; // Allows a second jump or flip
let verticalVelocity = 0;

// Add event listeners for key presses
document.addEventListener('keydown', (event) => {
  keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
  keys[event.key] = false;
});

// Function to handle car movement and turning
function moveCar() {
  // Allow movement and turning only if the car is not flipping mid-air
  if (!isJumping || canDoubleJump) {
    if (keys['ArrowUp'] || keys['w']) {
      // Move forward in the direction the car is facing
      car.position.x -= Math.sin(car.rotation.y) * carSpeed;
      car.position.z -= Math.cos(car.rotation.y) * carSpeed;
    }
    if (keys['ArrowDown'] || keys['s']) {
      // Move backward in the direction the car is facing
      car.position.x += Math.sin(car.rotation.y) * carSpeed;
      car.position.z += Math.cos(car.rotation.y) * carSpeed;
    }
    if (keys['ArrowLeft'] || keys['a']) {
      // Turn left
      car.rotation.y += turnSpeed;
    }
    if (keys['ArrowRight'] || keys['d']) {
      // Turn right
      car.rotation.y -= turnSpeed;
    }
  }
}

// Function to handle jumping and flipping
function handleJumpOrFlip() {
  if (keys[' '] && !isJumping) { // Initial jump
    isJumping = true;
    verticalVelocity = jumpStrength;
  } else if (keys[' '] && isJumping && canDoubleJump) {
    // Handle double jump or flip
    if (keys['ArrowUp'] || keys['w']) {
      // Perform a forward flip
      car.rotation.x -= Math.PI / 2; // Rotate forward
    } else if (keys['ArrowDown'] || keys['s']) {
      // Perform a backward flip
      car.rotation.x += Math.PI / 2; // Rotate backward
    } else {
      // Perform a simple double jump
      verticalVelocity = jumpStrength;
    }
    canDoubleJump = false; // Disable further jumps or flips
  }

  if (isJumping) {
    car.position.y += verticalVelocity; // Apply vertical velocity
    verticalVelocity += gravity; // Apply gravity
    
    if (car.position.y <= 1.5) { // Stop jumping when car hits the ground
      car.position.y = 1.5;
      isJumping = false;
      canDoubleJump = true; // Reset double jump ability
      verticalVelocity = 0;
      car.rotation.x = 0; // Reset any flips
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

  // Update the camera
  updateCamera();

  // Render the scene
  renderer.render(scene, camera);
}
