// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create ground
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
scene.add(ground);

// Create player cube
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1; // Start above the ground
scene.add(player);

camera.position.z = 10;
camera.position.y = 5;
camera.lookAt(player.position);

// Physics variables
let velocityY = 0;
const gravity = -0.05;
const jumpForce = 1.2;
let grounded = false;

// Controls
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  space: false,
};

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
  const speed = 0.1;
  if (keys.w) player.position.z -= speed;
  if (keys.s) player.position.z += speed;
  if (keys.a) player.position.x -= speed;
  if (keys.d) player.position.x += speed;

  // Jump
  if (keys.space && grounded) {
    velocityY = jumpForce;
    grounded = false;
  }

  renderer.render(scene, camera);
}

animate();
