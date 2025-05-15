// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create ground
const groundGeometry = new THREE.PlaneGeometry(50, 30);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Make it horizontal
scene.add(ground);

// Create player (cube)
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1; // Start above the ground
scene.add(player);

// Create ball
const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 1, 0); // Place at the center
scene.add(ball);

// Create goals
const goalMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff, wireframe: true });

// Left goal
const leftGoal = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 10), goalMaterial);
leftGoal.position.set(-24, 2.5, 0);
scene.add(leftGoal);

// Right goal
const rightGoal = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 10), goalMaterial);
rightGoal.position.set(24, 2.5, 0);
scene.add(rightGoal);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

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

  // Gravity
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

  // Update camera to stay behind the cube
  const cameraOffset = new THREE.Vector3(0, 3, -6); // Offset position (behind and above the cube)
  const cameraPosition = cameraOffset.applyMatrix4(player.matrixWorld); // Apply the player's transformation matrix
  camera.position.lerp(cameraPosition, 0.1); // Smooth movement of the camera
  camera.lookAt(player.position); // Make the camera look at the player

  renderer.render(scene, camera);
}

animate();
