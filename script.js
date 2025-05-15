// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create ground
const groundGeometry = new THREE.PlaneGeometry(100, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
scene.add(ground);

// Create ball
const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 1, 0); // Start in the center
scene.add(ball);

// Create goals
const goalWidth = 10;
const goalHeight = 5;
const goalDepth = 2;

const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const goal1 = new THREE.Mesh(new THREE.BoxGeometry(goalWidth, goalHeight, goalDepth), goalMaterial);
goal1.position.set(0, goalHeight / 2, -25); // Place at the far end
scene.add(goal1);

const goal2 = goal1.clone();
goal2.material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
goal2.position.set(0, goalHeight / 2, 25); // Place at the near end
scene.add(goal2);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Camera position
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

// Ball physics variables
let ballVelocityX = 0;
let ballVelocityZ = 0;
const friction = 0.98;

// Controls for moving the ball (WASD)
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
};

document.addEventListener('keydown', (event) => {
  if (event.key === 'w') keys.w = true;
  if (event.key === 'a') keys.a = true;
  if (event.key === 's') keys.s = true;
  if (event.key === 'd') keys.d = true;
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'w') keys.w = false;
  if (event.key === 'a') keys.a = false;
  if (event.key === 's') keys.s = false;
  if (event.key === 'd') keys.d = false;
});

// Game loop
function animate() {
  requestAnimationFrame(animate);

  // Ball movement
  if (keys.w) ballVelocityZ -= 0.1;
  if (keys.s) ballVelocityZ += 0.1;
  if (keys.a) ballVelocityX -= 0.1;
  if (keys.d) ballVelocityX += 0.1;

  ball.position.x += ballVelocityX;
  ball.position.z += ballVelocityZ;

  // Apply friction
  ballVelocityX *= friction;
  ballVelocityZ *= friction;

  // Prevent the ball from leaving the ground
  if (ball.position.x < -50 || ball.position.x > 50) ballVelocityX = -ballVelocityX;
  if (ball.position.z < -25 || ball.position.z > 25) ballVelocityZ = -ballVelocityZ;

  // Check for scoring
  if (
    ball.position.z < -24.5 &&
    ball.position.x > -goalWidth / 2 &&
    ball.position.x < goalWidth / 2
  ) {
    console.log('Scored in Goal 1!');
    resetBall();
  }

  if (
    ball.position.z > 24.5 &&
    ball.position.x > -goalWidth / 2 &&
    ball.position.x < goalWidth / 2
  ) {
    console.log('Scored in Goal 2!');
    resetBall();
  }

  renderer.render(scene, camera);
}

// Reset ball position after scoring
function resetBall() {
  ball.position.set(0, 1, 0);
  ballVelocityX = 0;
  ballVelocityZ = 0;
}

animate();
