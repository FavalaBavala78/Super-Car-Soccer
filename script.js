// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
scene.add(ground);

// Create player (a cube)
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1; // Start above the ground
scene.add(player);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Camera position
camera.position.set(0, 5, 10);
camera.lookAt(player.position);

// Physics variables
let velocityY = 0;
const gravity = -0.05;
const jumpForce = 1.2;
let grounded = false;

// Movement variables
const moveSpeed = 0.2;
const rotationSpeed = 0.05;
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  space: false,
};

// Event listeners for controls
document.addEventListener('keydown', (event) => {
  if (event.key === 'w') keys.w = true;
  if (event.key === 'a') keys.a = true;
  if (event.key === 's') keys.s = true;
  if (event.key === 'd') keys.d = true;
  if (event.key === ' ') keys.space = true;
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'w') keys.w = false;
  if (event.key === 'a') keys.a = false;
  if (event.key === 's') keys.s = false;
  if (event.key === 'd') keys.d = false;
  if (event.key === ' ') keys.space = false;
});

// Game loop
function animate() {
  requestAnimationFrame(animate);

  // Apply gravity
  if (!grounded) velocityY += gravity;
  player.position.y += velocityY;

  // Check for ground collision
  if (player.position.y <= 1) {
    player.position.y = 1;
    velocityY = 0;
    grounded = true;
  } else {
    grounded = false;
  }

  // Movement
  if (keys.w) {
    player.position.z -= moveSpeed * Math.cos(player.rotation.y);
    player.position.x -= moveSpeed * Math.sin(player.rotation.y);
  }
  if (keys.s) {
    player.position.z += moveSpeed * Math.cos(player.rotation.y);
    player.position.x += moveSpeed * Math.sin(player.rotation.y);
  }
  if (keys.a) {
    player.rotation.y += rotationSpeed;
  }
  if (keys.d) {
    player.rotation.y -= rotationSpeed;
  }

  // Jump
  if (keys.space && grounded) {
    velocityY = jumpForce;
    grounded = false;
  }

  // Update camera to follow the player
  camera.position.set(player.position.x, player.position.y + 5, player.position.z + 10);
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}

animate();
