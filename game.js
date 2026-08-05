const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;

const state = {
  mode: "ready",
  score: 0,
  best: 0,
  frame: 0,
  speed: 2.4,
  spawnTimer: 0,
};

const player = {
  x: 120,
  y: height / 2,
  radius: 24,
  vel: 0,
  gravity: 0.52,
  lift: -10.4,
  rotation: 0,
};

const obstacles = [];
const gapHeight = 170;
const spawnInterval = 140;

function loadBest() {
  state.best = Math.max(state.best, Number(localStorage.getItem("balloonBreezeBest") || "0"));
}

function saveBest() {
  localStorage.setItem("balloonBreezeBest", String(state.best));
}

function resetGame() {
  state.mode = "ready";
  state.score = 0;
  state.frame = 0;
  state.spawnTimer = 0;
  player.y = height / 2;
  player.vel = 0;
  player.rotation = 0;
  obstacles.length = 0;
  loadBest();
}

function spawnObstacle() {
  const minTop = 72;
  const maxTop = height - gapHeight - 180;
  const top = minTop + Math.random() * (maxTop - minTop);
  obstacles.push({
    x: width + 30,
    top,
    width: 76,
    gap: gapHeight,
    passed: false,
    wobble: Math.random() * 0.9 - 0.45,
  });
}

function updatePlayer() {
  player.vel += player.gravity;
  player.y += player.vel;
  player.rotation = Math.max(-0.95, Math.min(0.95, player.vel / 14));

  if (player.y + player.radius > height - 42) {
    player.y = height - 42 - player.radius;
    return true;
  }

  if (player.y - player.radius < 14) {
    player.y = 14 + player.radius;
    player.vel = 0;
  }

  return false;
}

function updateObstacles() {
  for (const obs of obstacles) {
    obs.x -= state.speed;
    obs.top += Math.sin((state.frame + obs.wobble * 100) / 60) * 0.4;

    if (!obs.passed && obs.x + obs.width < player.x) {
      state.score += 1;
      obs.passed = true;
      state.best = Math.max(state.best, state.score);
      saveBest();
    }
  }

  while (obstacles.length && obstacles[0].x + obstacles[0].width < -20) {
    obstacles.shift();
  }
}

function hasCollision(obs) {
  return (
    player.x + player.radius > obs.x &&
    player.x - player.radius < obs.x + obs.width &&
    (player.y - player.radius < obs.top || player.y + player.radius > obs.top + obs.gap)
  );
}

function checkCollisions() {
  if (player.y + player.radius >= height - 42) {
    return true;
  }

  return obstacles.some(hasCollision);
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#0b1c48");
  grad.addColorStop(0.45, "#2b5ca8");
  grad.addColorStop(1, "#7fc3f5");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 6; i += 1) {
    const x = (i * 160 + state.frame * 0.4) % 520 - 100;
    const y = 110 + Math.sin((state.frame * 0.018 + i) * 1.05) * 18;
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath();
    ctx.ellipse(x, y, 52, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround() {
  ctx.fillStyle = "#273a67";
  ctx.fillRect(0, height - 42, width, 42);
  ctx.fillStyle = "#395283";
  ctx.fillRect(0, height - 62, width, 20);
}

function drawObstacle(obs) {
  ctx.fillStyle = "#fafcff";
  ctx.fillRect(obs.x, 0, obs.width, obs.top);
  ctx.fillRect(obs.x, obs.top + obs.gap, obs.width, height - obs.top - obs.gap - 42);

  ctx.fillStyle = "rgba(0,0,0,0.09)";
  for (let y = 8; y < obs.top; y += 26) {
    ctx.fillRect(obs.x + 12, y, obs.width - 24, 10);
  }
  for (let y = obs.top + obs.gap + 8; y < height - 42; y += 26) {
    ctx.fillRect(obs.x + 12, y, obs.width - 24, 10);
  }
}

function drawBalloon() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.rotation);

  ctx.fillStyle = "#ff8fb7";
  ctx.beginPath();
  ctx.ellipse(0, 0, player.radius * 0.85, player.radius, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-9, -11, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8f5b9c";
  ctx.fillRect(-18, player.radius * 0.72, 36, 10);
  ctx.fillStyle = "#6d4533";
  ctx.fillRect(-24, player.radius * 0.72 + 10, 48, 20);

  ctx.fillStyle = "#ffbe5b";
  ctx.beginPath();
  ctx.moveTo(0, player.radius * 0.9);
  ctx.quadraticCurveTo(10, player.radius + 22, 0, player.radius + 30);
  ctx.quadraticCurveTo(-12, player.radius + 18, 0, player.radius * 0.9);
  ctx.fill();

  ctx.restore();
}

function drawOverlay() {
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 36px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(String(state.score), 24, 56);

  ctx.font = "500 16px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(`best ${state.best}`, 24, 78);

  if (state.mode === "ready") {
    ctx.textAlign = "center";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText("Click or press SPACE to launch", width / 2, height / 2 - 32);
    ctx.font = "400 18px system-ui, sans-serif";
    ctx.fillText("Float through sky arches and collect points", width / 2, height / 2 + 6);
  }

  if (state.mode === "over") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
    ctx.fillRect(32, height / 2 - 96, width - 64, 172);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "700 44px system-ui, sans-serif";
    ctx.fillText("Game Over", width / 2, height / 2 - 28);
    ctx.font = "500 20px system-ui, sans-serif";
    ctx.fillText(`Score ${state.score}`, width / 2, height / 2 + 8);
    ctx.fillText("Press ENTER or tap to try again", width / 2, height / 2 + 44);
  }
}

function gameLoop() {
  state.frame += 1;
  drawBackground();
  drawGround();

  if (state.mode === "playing") {
    if (updatePlayer()) {
      state.mode = "over";
    }

    if (state.spawnTimer <= 0) {
      spawnObstacle();
      state.spawnTimer = spawnInterval;
    }
    state.spawnTimer -= 1;
    updateObstacles();

    if (checkCollisions()) {
      state.mode = "over";
    }
  } else {
    updatePlayer();
  }

  for (const obs of obstacles) {
    drawObstacle(obs);
  }

  drawBalloon();
  drawOverlay();

  requestAnimationFrame(gameLoop);
}

function jump() {
  if (state.mode === "over") {
    resetGame();
    state.mode = "playing";
  }

  player.vel = player.lift;
  player.y -= 4;
  state.mode = "playing";
}

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    jump();
  }

  if (event.code === "Enter" && state.mode === "over") {
    resetGame();
    state.mode = "playing";
  }
});

canvas.addEventListener("pointerdown", jump);

window.addEventListener("load", () => {
  loadBest();
  resetGame();
  requestAnimationFrame(gameLoop);
});
