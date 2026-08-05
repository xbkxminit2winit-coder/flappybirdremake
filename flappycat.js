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
  y: height / 1,
  radius: 12,
  vel: 0,
  gravity: 0.46,
  lift: -7.4,
  rotation: 0,
};

const obstacles = [];
const gapHeight = 140;
const spawnInterval = 122;

function loadBest() {
  state.best = Math.max(state.best, Number(localStorage.getItem("catGlideBest") || "0"));
}

function saveBest() {
  localStorage.setItem("catGlideBest", String(state.best));
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
  const minTop = 86;
  const maxTop = height - gapHeight - 160;
  const top = minTop + Math.random() * (maxTop - minTop);
  obstacles.push({
    x: width + 28,
    top,
    width: 88,
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
  grad.addColorStop(0, "#8cc8f7");
  grad.addColorStop(0.3, "#5aa9ee");
  grad.addColorStop(0.65, "#1f4c96");
  grad.addColorStop(1, "#091b3a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.arc(width * 0.8, 100, 72, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 5; i += 1) {
    const x = (i * 170 + state.frame * 0.45) % 560 - 120;
    const y = 120 + Math.sin((state.frame * 0.02 + i) * 1.1) * 20;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(x, y, 68, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 3; i += 1) {
    const x = 70 + i * 160;
    const y = 430 + Math.sin((state.frame * 0.015 + i) * 1.25) * 12;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.ellipse(x, y, 200, 68, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround() {
  ctx.fillStyle = "#1c2d5e";
  ctx.fillRect(0, height - 46, width, 46);

  ctx.fillStyle = "rgba(255,255,255,0.10)";
  for (let x = 0; x < width; x += 44) {
    ctx.fillRect(x, height - 40, 28, 8);
  }

  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(0, height - 76, width, 18);

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, height - 50, width, 10);
}

function drawObstacle(obs) {
  const grad = ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
  grad.addColorStop(0, "#ecf4ff");
  grad.addColorStop(0.5, "#cddcff");
  grad.addColorStop(1, "#eaf1ff");
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(obs.x, 0);
  ctx.lineTo(obs.x + obs.width, 0);
  ctx.lineTo(obs.x + obs.width, obs.top - 10);
  ctx.quadraticCurveTo(obs.x + obs.width, obs.top, obs.x + obs.width - 10, obs.top);
  ctx.lineTo(obs.x + 10, obs.top);
  ctx.quadraticCurveTo(obs.x, obs.top, obs.x, obs.top - 10);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(obs.x, obs.top + obs.gap + 10);
  ctx.quadraticCurveTo(obs.x, obs.top + obs.gap, obs.x + 10, obs.top + obs.gap);
  ctx.lineTo(obs.x + obs.width - 10, obs.top + obs.gap);
  ctx.quadraticCurveTo(obs.x + obs.width, obs.top + obs.gap, obs.x + obs.width, obs.top + obs.gap + 10);
  ctx.lineTo(obs.x + obs.width, height - 42);
  ctx.lineTo(obs.x, height - 42);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(33, 65, 121, 0.16)";
  for (let y = 10; y < obs.top; y += 28) {
    ctx.fillRect(obs.x + 10, y, obs.width - 20, 9);
  }
  for (let y = obs.top + obs.gap + 12; y < height - 44; y += 28) {
    ctx.fillRect(obs.x + 10, y, obs.width - 20, 9);
  }
}

function drawCat() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.rotation * 0.75);

  // body
  const bodyGrad = ctx.createRadialGradient(0, -4, 2, 0, 0, player.radius);
  bodyGrad.addColorStop(0, "#f4e1c9");
  bodyGrad.addColorStop(1, "#c68f62");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, player.radius * 0.78, player.radius * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // ears
  ctx.fillStyle = "#c1895a";
  ctx.beginPath();
  ctx.moveTo(-player.radius * 0.45, -player.radius * 0.7);
  ctx.lineTo(-player.radius * 0.65, -player.radius * 1.3);
  ctx.lineTo(-player.radius * 0.25, -player.radius * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(player.radius * 0.45, -player.radius * 0.7);
  ctx.lineTo(player.radius * 0.65, -player.radius * 1.3);
  ctx.lineTo(player.radius * 0.25, -player.radius * 0.85);
  ctx.closePath();
  ctx.fill();

  // face
  ctx.fillStyle = "#f7ecdd";
  ctx.beginPath();
  ctx.ellipse(0, -player.radius * 0.08, player.radius * 0.58, player.radius * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // eyes
  ctx.fillStyle = "#403d3f";
  ctx.beginPath();
  ctx.ellipse(-player.radius * 0.22, -player.radius * 0.18, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(player.radius * 0.22, -player.radius * 0.18, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // nose
  ctx.fillStyle = "#d16f73";
  ctx.beginPath();
  ctx.moveTo(0, -player.radius * 0.02);
  ctx.lineTo(-4, player.radius * 0.08);
  ctx.lineTo(4, player.radius * 0.08);
  ctx.closePath();
  ctx.fill();

  // whiskers
  ctx.strokeStyle = "#5b453e";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-4, player.radius * 0.08);
  ctx.lineTo(-player.radius * 0.6, player.radius * 0.08);
  ctx.moveTo(-4, player.radius * 0.14);
  ctx.lineTo(-player.radius * 0.62, player.radius * 0.16);
  ctx.moveTo(4, player.radius * 0.08);
  ctx.lineTo(player.radius * 0.6, player.radius * 0.08);
  ctx.moveTo(4, player.radius * 0.14);
  ctx.lineTo(player.radius * 0.62, player.radius * 0.16);
  ctx.stroke();

  // tail
  ctx.strokeStyle = "#af7a4e";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(player.radius * 0.7, player.radius * 0.2);
  ctx.quadraticCurveTo(player.radius * 1.2, player.radius * 0.1, player.radius * 1.1, -player.radius * 0.4);
  ctx.stroke();

  ctx.restore();
}

function drawOverlay() {
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(16, 18, 146, 72);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(24, 26, 130, 56);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 38px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(String(state.score), 28, 60);

  ctx.font = "500 16px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.fillText(`BEST ${state.best}`, 28, 84);

  if (state.mode === "ready") {
    ctx.textAlign = "center";
    ctx.font = "600 24px system-ui, sans-serif";
    ctx.fillText("Tap or press SPACE to start", width / 2, height / 2 - 28);
    ctx.font = "400 16px system-ui, sans-serif";
    ctx.fillText("Guide the cat through the sky", width / 2, height / 2 + 4);
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

  drawCat();
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
