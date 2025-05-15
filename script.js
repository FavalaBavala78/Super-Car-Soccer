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

// Ball
const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 1, 0);
ball.castShadow = true; // Ball casts shadows
scene.add(ball);

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
const ballSpeed = 0.2;
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

// Function to handle ball movement
function moveBall() {
  if (keys['ArrowUp'] || keys['w']) {
    ball.position.z -= ballSpeed; // Move forward
  }
  if (keys['ArrowDown'] || keys['s']) {
    ball.position.z += ballSpeed; // Move backward
  }
  if (keys['ArrowLeft'] || keys['a']) {
    ball.position.x -= ballSpeed; // Move left
  }
  if (keys['ArrowRight'] || keys['d']) {
    ball.position.x += ballSpeed; // Move right
  }
}

// Function to handle jumping
function handleJump() {
  if (keys[' '] && !isJumping) { // Spacebar key to jump
    isJumping = true;
    verticalVelocity = jumpStrength;
  }
  
  if (isJumping) {
    ball.position.y += verticalVelocity; // Apply vertical velocity
    verticalVelocity += gravity; // Apply gravity
    
    if (ball.position.y <= 1) { // Stop jumping when ball hits the ground
      ball.position.y = 1;
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
  
  // Update ball movement and jumping
  moveBall();
  handleJump();

  // Render the scene
  renderer.render(scene, camera);
}
