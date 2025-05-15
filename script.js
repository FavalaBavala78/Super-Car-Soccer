const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player properties
const player = {
  x: 100,
  y: 300,
  width: 30,
  height: 30,
  color: 'red',
  velocityX: 0,
  velocityY: 0,
  speed: 5,
  jumpForce: -12,
  gravity: 0.5,
  grounded: false,
};

// Controls
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  space: false,
};

// Ground properties
const ground = {
  x: 0,
  y: 350,
  width: canvas.width,
  height: 50,
  color: 'green',
};

// Event listeners for keyboard input
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
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply gravity
  player.velocityY += player.gravity;

  // Horizontal movement
  if (keys.a) player.velocityX = -player.speed;
  if (keys.d) player.velocityX = player.speed;
  if (!keys.a && !keys.d) player.velocityX = 0;

  // Jumping
  if (keys.space && player.grounded) {
    player.velocityY = player.jumpForce;
    player.grounded = false;
  }

  // Update player position
  player.x += player.velocityX;
  player.y += player.velocityY;

  // Collision detection with ground
  if (player.y + player.height >= ground.y) {
    player.y = ground.y - player.height;
    player.velocityY = 0;
    player.grounded = true;
  }

  // Draw the player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Draw the ground
  ctx.fillStyle = ground.color;
  ctx.fillRect(ground.x, ground.y, ground.width, ground.height);

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
