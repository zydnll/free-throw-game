const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const courtStage = document.querySelector(".court-stage");

const madeCountEl = document.getElementById("madeCount");
const shotCountEl = document.getElementById("shotCount");
const feedbackEl = document.getElementById("feedback");
const resetButton = document.getElementById("resetButton");
const shootButton = document.getElementById("shootButton");
const powerFill = document.getElementById("powerFill");
const powerText = document.getElementById("powerText");
const characterGrid = document.getElementById("characterGrid");
const characterPanel = document.getElementById("characterPanel");
const characterToggle = document.getElementById("characterToggle");
const selectedAvatar = document.getElementById("selectedAvatar");
const selectedName = document.getElementById("selectedName");
const resultModal = document.getElementById("resultModal");
const resultMessage = document.getElementById("resultMessage");
const playAgainButton = document.getElementById("playAgainButton");

const characters = [
  { name: "明哥", badge: "明" },
  { name: "教练", badge: "教" },
  { name: "老于", badge: "于" },
  { name: "医生", badge: "马" },
  { name: "老张", badge: "张" },
  { name: "凯哥", badge: "凯" },
  { name: "松哥", badge: "松" },
  { name: "小魏", badge: "魏" },
  { name: "流川枫", badge: "川" },
  { name: "高老板", badge: "高" },
];

const mascot = {
  skin: "#f2bf63",
  jersey: "#f8fafc",
  hair: "#d7dce2",
  blush: true,
  centerPart: true,
  overalls: true,
};

const courtImage = new Image();
courtImage.src = "court-front.jpg";
let courtImageReady = false;
courtImage.addEventListener("load", () => {
  courtImageReady = true;
});

const state = {
  selected: 0,
  made: 0,
  shots: 0,
  aiming: false,
  power: 0,
  powerDirection: 1,
  aimTime: 0,
  aimOffset: 0,
  activePointerId: null,
  ball: null,
  result: "",
  resultTimer: 0,
  gameOver: false,
};

let width = 1280;
let height = 720;
let lastFrame = performance.now();

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  width = rect.width;
  height = rect.height;
}

function sx(x) {
  return (x / 1280) * width;
}

function sy(y) {
  return (y / 720) * height;
}

function su(value) {
  return (value / 1280) * width;
}

function getImageFrame() {
  const imageRatio = courtImage.naturalWidth / courtImage.naturalHeight;
  const canvasRatio = width / height;
  if (canvasRatio > imageRatio) {
    const frameW = width;
    const frameH = width / imageRatio;
    return { x: 0, y: (height - frameH) / 2, w: frameW, h: frameH };
  }
  const frameH = height;
  const frameW = height * imageRatio;
  return { x: (width - frameW) / 2, y: 0, w: frameW, h: frameH };
}

function imagePoint(nx, ny) {
  const frame = getImageFrame();
  return {
    x: frame.x + frame.w * nx,
    y: frame.y + frame.h * ny,
  };
}

function getHoopTarget() {
  if (courtImageReady) return imagePoint(0.49, 0.365);
  return { x: sx(640), y: sy(258) };
}

function getPlayerAnchor() {
  if (courtImageReady) {
    const scale = Math.min(width / 430, height / 760) * 1.04;
    const unit = su(1) * scale;
    const freeThrowLineY = imagePoint(0.5, 0.985).y;
    return {
      x: width * 0.5,
      y: freeThrowLineY - unit * 150,
      scale,
    };
  }
  return {
    x: sx(640),
    y: width < 700 ? sy(430) : sy(574),
    scale: 1,
  };
}

function getBallRestPosition() {
  if (courtImageReady) {
    const player = getPlayerAnchor();
    return {
      x: player.x,
      y: player.y - su(152) * player.scale,
    };
  }
  return {
    x: sx(640),
    y: width < 700 ? sy(343) : sy(487),
  };
}

function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCourt() {
  if (courtImageReady) {
    const frame = getImageFrame();
    ctx.drawImage(courtImage, frame.x, frame.y, frame.w, frame.h);

    const shade = ctx.createLinearGradient(0, 0, 0, height);
    shade.addColorStop(0, "rgba(12, 18, 24, 0.03)");
    shade.addColorStop(0.58, "rgba(12, 18, 24, 0.04)");
    shade.addColorStop(1, "rgba(12, 18, 24, 0.18)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  const sky = ctx.createLinearGradient(0, 0, 0, sy(310));
  sky.addColorStop(0, "#1c2228");
  sky.addColorStop(1, "#32373c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, sy(320));

  ctx.fillStyle = "#111417";
  ctx.fillRect(0, sy(264), width, sy(22));

  for (let i = 0; i < 7; i += 1) {
    ctx.fillStyle = i % 2 ? "#2c3339" : "#252b31";
    ctx.fillRect(sx(i * 190), sy(120), sx(190), sy(144));
  }

  const floor = ctx.createLinearGradient(0, sy(260), 0, height);
  floor.addColorStop(0, "#bd7650");
  floor.addColorStop(0.55, "#d99860");
  floor.addColorStop(1, "#a75f3f");
  ctx.fillStyle = floor;
  ctx.fillRect(0, sy(260), width, height - sy(260));

  ctx.strokeStyle = "rgba(255,255,255,0.23)";
  ctx.lineWidth = Math.max(1, sx(2));
  for (let i = 0; i <= 12; i += 1) {
    const x = sx(i * 106);
    ctx.beginPath();
    ctx.moveTo(x, sy(275));
    ctx.lineTo(sx(640) + (x - sx(640)) * 1.9, height);
    ctx.stroke();
  }

  for (let i = 0; i < 9; i += 1) {
    const y = sy(315 + i * 48);
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = "#f4c178";
    ctx.fillRect(0, y, width, sy(5));
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = "rgba(255,255,255,0.86)";
  ctx.lineWidth = sx(5);
  ctx.beginPath();
  ctx.moveTo(sx(421), sy(306));
  ctx.lineTo(sx(859), sy(306));
  ctx.lineTo(sx(1008), sy(675));
  ctx.lineTo(sx(272), sy(675));
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx(490), sy(306));
  ctx.lineTo(sx(790), sy(306));
  ctx.lineTo(sx(858), sy(532));
  ctx.lineTo(sx(422), sy(532));
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(sx(640), sy(532), sx(218), sy(58), 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx(394), sy(626));
  ctx.lineTo(sx(886), sy(626));
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.ellipse(sx(640), sy(622), sx(74), sy(16), 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHoop() {
  if (courtImageReady) {
    return;
  }

  const cx = sx(640);
  const boardX = sx(504);
  const boardY = sy(118);
  const boardW = su(272);
  const boardH = su(154);
  const rimY = boardY + boardH + su(14);
  const rimFrontY = rimY + su(9);
  const rimBackY = rimY - su(7);

  ctx.strokeStyle = "#4b5563";
  ctx.lineWidth = su(11);
  ctx.beginPath();
  ctx.moveTo(cx, boardY);
  ctx.lineTo(cx, rimFrontY + su(28));
  ctx.stroke();

  ctx.fillStyle = "rgba(226, 241, 252, 0.78)";
  ctx.strokeStyle = "#e7eef7";
  ctx.lineWidth = su(4);
  drawRoundedRect(boardX, boardY, boardW, boardH, su(6));
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(50, 68, 82, 0.55)";
  ctx.lineWidth = su(2);
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(boardX + (boardW / 4) * i, boardY + su(7));
    ctx.lineTo(boardX + (boardW / 4) * i, boardY + boardH - su(7));
    ctx.stroke();
  }

  ctx.strokeStyle = "#ef4f34";
  ctx.lineWidth = su(5);
  ctx.strokeRect(cx - su(46), boardY + su(52), su(92), su(62));

  ctx.fillStyle = "#4b5563";
  ctx.fillRect(cx - su(24), boardY + boardH - su(6), su(48), su(13));

  ctx.strokeStyle = "#b9331f";
  ctx.lineWidth = su(10);
  ctx.beginPath();
  ctx.ellipse(cx, rimBackY, su(76), su(18), 0, Math.PI, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#ff6935";
  ctx.lineWidth = su(10);
  ctx.beginPath();
  ctx.ellipse(cx, rimFrontY, su(78), su(20), 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#c83b22";
  ctx.lineWidth = su(3);
  ctx.beginPath();
  ctx.moveTo(cx - su(76), rimY);
  ctx.lineTo(cx + su(76), rimY);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.84)";
  ctx.lineWidth = su(2.4);
  for (let i = -5; i <= 5; i += 1) {
    const topX = cx + su(i * 14);
    const bottomX = cx + su(i * 7.4);
    ctx.beginPath();
    ctx.moveTo(topX, rimFrontY + su(13));
    ctx.lineTo(bottomX, rimFrontY + su(78));
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.62)";
  ctx.lineWidth = su(2);
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(cx, rimFrontY + su(22 + i * 13), su(62 - i * 8), su(10), 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = "#ff8754";
  ctx.lineWidth = su(4);
  ctx.beginPath();
  ctx.ellipse(cx, rimFrontY - su(2), su(78), su(18), 0, 0, Math.PI);
  ctx.stroke();
}

function drawPlayer() {
  const p = mascot;
  const player = getPlayerAnchor();
  const x = player.x;
  const y = player.y;
  const unit = courtImageReady ? su(1) * player.scale : su(1);

  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + unit * 154, unit * 86, unit * 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#20242a";
  ctx.lineWidth = unit * 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - unit * 34, y + unit * 82);
  ctx.lineTo(x - unit * 47, y + unit * 142);
  ctx.moveTo(x + unit * 34, y + unit * 82);
  ctx.lineTo(x + unit * 47, y + unit * 142);
  ctx.stroke();

  ctx.strokeStyle = p.skin;
  ctx.lineWidth = unit * 16;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - unit * 34, y + unit * 34);
  ctx.lineTo(x - unit * 70, y + unit * 4);
  ctx.moveTo(x + unit * 34, y + unit * 34);
  ctx.lineTo(x + unit * 70, y + unit * 4);
  ctx.stroke();

  ctx.fillStyle = p.overalls ? "#f8fafc" : p.jersey;
  drawRoundedRect(x - unit * 58, y - unit * 8, unit * 116, unit * 104, unit * 18);
  ctx.fill();

  const jerseyShade = ctx.createLinearGradient(0, y, 0, y + unit * 96);
  jerseyShade.addColorStop(0, "rgba(255,255,255,0.22)");
  jerseyShade.addColorStop(0.42, "rgba(255,255,255,0.02)");
  jerseyShade.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = jerseyShade;
  drawRoundedRect(x - unit * 58, y - unit * 8, unit * 116, unit * 104, unit * 18);
  ctx.fill();

  ctx.strokeStyle = p.overalls ? "#171717" : "rgba(255,255,255,0.78)";
  ctx.lineWidth = unit * 4;
  ctx.beginPath();
  ctx.moveTo(x - unit * 33, y - unit * 4);
  ctx.lineTo(x - unit * 45, y + unit * 88);
  ctx.moveTo(x + unit * 33, y - unit * 4);
  ctx.lineTo(x + unit * 45, y + unit * 88);
  ctx.stroke();

  ctx.fillStyle = p.overalls ? "#171717" : "rgba(255,255,255,0.88)";
  if (p.overalls) {
    drawRoundedRect(x - unit * 38, y + unit * 28, unit * 76, unit * 70, unit * 9);
    ctx.fill();
    ctx.fillStyle = "#f6c45f";
    ctx.beginPath();
    ctx.arc(x - unit * 25, y + unit * 35, unit * 4, 0, Math.PI * 2);
    ctx.arc(x + unit * 25, y + unit * 35, unit * 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.88)";
  }
  ctx.fillRect(x - unit * 46, y + unit * 92, unit * 92, unit * 7);

  ctx.fillStyle = p.overalls ? "#f8fafc" : "rgba(255,255,255,0.88)";
  ctx.font = `800 ${unit * 34}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText(String(state.selected + 1), x, y + unit * 58);

  ctx.fillStyle = p.overalls ? "#171717" : p.jersey;
  drawRoundedRect(x - unit * 58, y + unit * 92, unit * 48, unit * 48, unit * 8);
  ctx.fill();
  drawRoundedRect(x + unit * 10, y + unit * 92, unit * 48, unit * 48, unit * 8);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.62)";
  ctx.lineWidth = unit * 3;
  ctx.beginPath();
  ctx.moveTo(x - unit * 15, y + unit * 101);
  ctx.lineTo(x - unit * 15, y + unit * 134);
  ctx.moveTo(x + unit * 15, y + unit * 101);
  ctx.lineTo(x + unit * 15, y + unit * 134);
  ctx.stroke();

  ctx.strokeStyle = p.skin;
  ctx.lineWidth = unit * 14;
  ctx.beginPath();
  ctx.moveTo(x - unit * 43, y + unit * 139);
  ctx.lineTo(x - unit * 54, y + unit * 158);
  ctx.moveTo(x + unit * 43, y + unit * 139);
  ctx.lineTo(x + unit * 54, y + unit * 158);
  ctx.stroke();

  ctx.fillStyle = "#151a22";
  drawRoundedRect(x - unit * 76, y + unit * 154, unit * 46, unit * 15, unit * 4);
  ctx.fill();
  drawRoundedRect(x + unit * 30, y + unit * 154, unit * 46, unit * 15, unit * 4);
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(x - unit * 39, y + unit * 158, unit * 9, unit * 4);
  ctx.fillRect(x + unit * 30, y + unit * 158, unit * 9, unit * 4);

  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.arc(x, y - unit * 50, unit * 35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.hair;
  if (p.centerPart) {
    const hairShade = ctx.createLinearGradient(x - unit * 44, y - unit * 94, x + unit * 44, y - unit * 44);
    hairShade.addColorStop(0, "#f4f6f8");
    hairShade.addColorStop(0.48, "#d6dbe2");
    hairShade.addColorStop(1, "#bfc6cf");
    ctx.fillStyle = hairShade;
    ctx.beginPath();
    ctx.moveTo(x, y - unit * 91);
    ctx.bezierCurveTo(x - unit * 20, y - unit * 99, x - unit * 49, y - unit * 96, x - unit * 55, y - unit * 70);
    ctx.bezierCurveTo(x - unit * 61, y - unit * 47, x - unit * 45, y - unit * 38, x - unit * 29, y - unit * 45);
    ctx.bezierCurveTo(x - unit * 30, y - unit * 61, x - unit * 14, y - unit * 77, x, y - unit * 91);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - unit * 91);
    ctx.bezierCurveTo(x + unit * 20, y - unit * 99, x + unit * 49, y - unit * 96, x + unit * 55, y - unit * 70);
    ctx.bezierCurveTo(x + unit * 61, y - unit * 47, x + unit * 45, y - unit * 38, x + unit * 29, y - unit * 45);
    ctx.bezierCurveTo(x + unit * 30, y - unit * 61, x + unit * 14, y - unit * 77, x, y - unit * 91);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = unit * 2;
    ctx.beginPath();
    ctx.moveTo(x - unit * 31, y - unit * 80);
    ctx.bezierCurveTo(x - unit * 43, y - unit * 70, x - unit * 43, y - unit * 56, x - unit * 32, y - unit * 47);
    ctx.moveTo(x + unit * 31, y - unit * 80);
    ctx.bezierCurveTo(x + unit * 43, y - unit * 70, x + unit * 43, y - unit * 56, x + unit * 32, y - unit * 47);
    ctx.stroke();
    ctx.strokeStyle = "rgba(90, 96, 105, 0.7)";
    ctx.lineWidth = unit * 2;
    ctx.beginPath();
    ctx.moveTo(x, y - unit * 88);
    ctx.lineTo(x, y - unit * 53);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(x, y - unit * 70, unit * 39, unit * 22, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  if (p.spiky) {
    ctx.beginPath();
    ctx.moveTo(x - unit * 36, y - unit * 67);
    ctx.lineTo(x - unit * 22, y - unit * 96);
    ctx.lineTo(x - unit * 10, y - unit * 70);
    ctx.lineTo(x + unit * 2, y - unit * 101);
    ctx.lineTo(x + unit * 15, y - unit * 70);
    ctx.lineTo(x + unit * 30, y - unit * 94);
    ctx.lineTo(x + unit * 38, y - unit * 66);
    ctx.closePath();
    ctx.fill();
  }
  if (!p.centerPart) {
    ctx.beginPath();
    ctx.arc(x - unit * 25, y - unit * 60, unit * 13, Math.PI * 0.9, Math.PI * 1.95);
    ctx.arc(x + unit * 25, y - unit * 60, unit * 13, Math.PI * 1.05, Math.PI * 2.1);
    ctx.fill();
  }

  if (!p.centerPart) {
    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth = unit * 5;
    ctx.beginPath();
    ctx.moveTo(x - unit * 28, y - unit * 63);
    ctx.lineTo(x + unit * 28, y - unit * 63);
    ctx.stroke();
  }

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x - unit * 12, y - unit * 45, unit * 6, 0, Math.PI * 2);
  ctx.arc(x + unit * 12, y - unit * 45, unit * 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#191919";
  ctx.beginPath();
  ctx.arc(x - unit * 12, y - unit * 45, unit * 2.6, 0, Math.PI * 2);
  ctx.arc(x + unit * 12, y - unit * 45, unit * 2.6, 0, Math.PI * 2);
  ctx.fill();

  if (p.blush) {
    ctx.fillStyle = "rgba(235, 75, 86, 0.78)";
    ctx.beginPath();
    ctx.ellipse(x - unit * 24, y - unit * 34, unit * 9, unit * 5, -0.08, 0, Math.PI * 2);
    ctx.ellipse(x + unit * 24, y - unit * 34, unit * 9, unit * 5, 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "#2d1710";
  ctx.lineWidth = unit * 2;
  ctx.beginPath();
  ctx.arc(x, y - unit * 35, unit * 11, 0.16 * Math.PI, 0.84 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

function getShotPath(offset = state.aimOffset, power = state.power) {
  const target = getHoopTarget();
  const start = getBallRestPosition();
  const end = {
    x: target.x + su(offset * 4.4),
    y: target.y + su((power - 0.72) * 135),
  };
  const control = {
    x: (start.x + target.x) / 2 + su(offset * 1.25),
    y: Math.min(start.y, target.y) - height * (courtImageReady ? 0.28 + power * 0.12 : 0.24 + power * 0.08),
  };
  return { start, control, end };
}

function quadraticPoint(path, t) {
  const one = 1 - t;
  return {
    x: one * one * path.start.x + 2 * one * t * path.control.x + t * t * path.end.x,
    y: one * one * path.start.y + 2 * one * t * path.control.y + t * t * path.end.y,
  };
}

function drawAimPath() {
  if (!state.aiming && !state.ball) return;
  const path = state.ball ? state.ball.path : getShotPath();

  ctx.setLineDash([sx(12), sx(12)]);
  ctx.strokeStyle = state.aiming ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)";
  ctx.lineWidth = courtImageReady ? su(5) : sx(4);
  ctx.beginPath();
  ctx.moveTo(path.start.x, path.start.y);
  ctx.quadraticCurveTo(path.control.x, path.control.y, path.end.x, path.end.y);
  ctx.stroke();
  ctx.setLineDash([]);

  if (state.aiming) {
    ctx.fillStyle = "rgba(244,201,93,0.88)";
    ctx.beginPath();
    ctx.arc(path.end.x, path.end.y, sx(8), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBall() {
  const ballPos = state.ball
    ? quadraticPoint(state.ball.path, Math.min(state.ball.t, 1))
    : getBallRestPosition();
  let radius = state.ball ? su(46 - state.ball.t * 8) : su(46);
  if (courtImageReady) {
    const player = getPlayerAnchor();
    const unit = su(1) * player.scale;
    const t = state.ball ? Math.min(state.ball.t, 1) : 0;
    radius = unit * (62 - t * 10);
  }

  ctx.fillStyle = "#d96824";
  ctx.beginPath();
  ctx.arc(ballPos.x, ballPos.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5b2a16";
  ctx.lineWidth = Math.max(1, sx(2));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ballPos.x - radius, ballPos.y);
  ctx.quadraticCurveTo(ballPos.x, ballPos.y - radius * 0.35, ballPos.x + radius, ballPos.y);
  ctx.moveTo(ballPos.x, ballPos.y - radius);
  ctx.quadraticCurveTo(ballPos.x - radius * 0.26, ballPos.y, ballPos.x, ballPos.y + radius);
  ctx.stroke();
}

function drawResult() {
  if (!state.result || state.resultTimer <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.resultTimer / 0.35);
  ctx.fillStyle = state.result === "进了" ? "#f4c95d" : "#ffffff";
  ctx.font = `800 ${sx(54)}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText(state.result, sx(640), sy(104));
  ctx.restore();
}

function update(dt) {
  if (state.aiming) {
    state.aimTime += dt;
    state.aimOffset = Math.sin(state.aimTime * 3.1) * 68;
    state.power += dt * state.powerDirection * 0.92;
    if (state.power >= 1) {
      state.power = 1;
      state.powerDirection = -1;
    }
    if (state.power <= 0.18) {
      state.power = 0.18;
      state.powerDirection = 1;
    }
  }

  if (state.ball) {
    state.ball.t += dt * 1.05;
    if (state.ball.t >= 1) {
      finishShot();
    }
  }

  if (state.resultTimer > 0) state.resultTimer -= dt;

  const pct = Math.round(state.power * 100);
  powerFill.style.width = `${pct}%`;
  powerText.textContent = `${pct}%`;
}

function render() {
  ctx.clearRect(0, 0, width, height);
  drawCourt();
  drawHoop();
  drawAimPath();
  drawPlayer();
  drawBall();
  drawResult();
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastFrame) / 1000);
  lastFrame = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function startAim(event) {
  event.preventDefault();
  if (state.gameOver) return;
  if (state.ball) return;
  if (state.activePointerId !== null) return;
  state.activePointerId = event.pointerId;
  shootButton.setPointerCapture?.(event.pointerId);
  state.aiming = true;
  state.power = 0.42;
  state.powerDirection = 1;
  shootButton.classList.add("is-aiming");
  feedbackEl.textContent = "抛物线扫过篮筐时松手";
}

function releaseShot(event) {
  event.preventDefault();
  if (state.activePointerId !== event.pointerId) return;
  shootButton.releasePointerCapture?.(event.pointerId);
  state.activePointerId = null;
  if (!state.aiming || state.ball) return;
  state.aiming = false;
  shootButton.classList.remove("is-aiming");

  const path = getShotPath();
  const target = getHoopTarget();
  const missX = Math.abs(path.end.x - target.x);
  const missY = Math.abs(path.end.y - target.y);
  const made = missX < su(48) && missY < su(30);

  if (!made) {
    path.end.x += Math.sign(path.end.x - target.x || 1) * su(110 + Math.random() * 80);
    path.end.y += su(44 + Math.random() * 70);
  }

  state.ball = { path, t: 0, made };
  state.shots += 1;
  shotCountEl.textContent = state.shots;
  feedbackEl.textContent = made ? "手感不错，这球看着要进" : "偏了，看看球飞去哪";
}

function finishShot() {
  if (state.ball.made) {
    state.made += 1;
    madeCountEl.textContent = state.made;
    state.result = "进了";
    feedbackEl.textContent = "命中！继续找手感";
  } else {
    state.result = "没进";
    feedbackEl.textContent = "差一点，再对准篮筐";
  }
  state.resultTimer = 1.1;
  state.ball = null;
  state.power = 0;
  if (state.shots >= 10) {
    endGame();
  }
}

function endGame() {
  const name = characters[state.selected].name;
  state.gameOver = true;
  shootButton.disabled = true;
  feedbackEl.textContent = "本局结束";
  resultMessage.textContent =
    state.made === 10 ? `不愧是${name}，十中十的男人！` : `${name}，你还得练！`;
  resultModal.classList.add("is-open");
  resultModal.setAttribute("aria-hidden", "false");
}

function resetGame() {
  state.made = 0;
  state.shots = 0;
  state.ball = null;
  state.aiming = false;
  state.activePointerId = null;
  state.power = 0;
  state.result = "";
  state.gameOver = false;
  madeCountEl.textContent = "0";
  shotCountEl.textContent = "0";
  feedbackEl.textContent = "按住投篮键，抛物线对准篮筐时松手";
  shootButton.classList.remove("is-aiming");
  shootButton.disabled = false;
  resultModal.classList.remove("is-open");
  resultModal.setAttribute("aria-hidden", "true");
}

function renderCharacters() {
  characterGrid.innerHTML = "";
  selectedAvatar.textContent = characters[state.selected].badge;
  selectedName.textContent = characters[state.selected].name;
  characters.forEach((character, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `character-card${index === state.selected ? " is-active" : ""}`;
    button.innerHTML = `<span class="avatar-dot text-avatar">${character.badge}</span><span>${character.name}</span>`;
    button.addEventListener("click", () => {
      state.selected = index;
      selectedAvatar.textContent = character.badge;
      selectedName.textContent = character.name;
      characterPanel.classList.add("is-collapsed");
      characterToggle.setAttribute("aria-expanded", "false");
      document.querySelectorAll(".character-card").forEach((card, cardIndex) => {
        card.classList.toggle("is-active", cardIndex === index);
      });
    });
    characterGrid.appendChild(button);
  });
}

window.addEventListener("resize", resizeCanvas);
courtStage.addEventListener("contextmenu", (event) => event.preventDefault());
courtStage.addEventListener("selectstart", (event) => event.preventDefault());
courtStage.addEventListener("dragstart", (event) => event.preventDefault());
shootButton.addEventListener("pointerdown", startAim);
window.addEventListener("pointerup", releaseShot);
window.addEventListener("pointercancel", releaseShot);
resetButton.addEventListener("click", resetGame);
playAgainButton.addEventListener("click", resetGame);
characterToggle.addEventListener("click", () => {
  const collapsed = characterPanel.classList.toggle("is-collapsed");
  characterToggle.setAttribute("aria-expanded", String(!collapsed));
});

renderCharacters();
resizeCanvas();
requestAnimationFrame(loop);
