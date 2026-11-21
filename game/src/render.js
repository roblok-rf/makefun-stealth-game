// Canvas rendering for Nightshade. All drawing is plain 2D canvas; the
// playfield is drawn translated down by HUD_H so world coordinates stay
// in the 1280x640 play area.
import {
  TILE,
  COLS,
  ROWS,
  HUD_H,
  VIEW_W,
  VIEW_H,
  CONE_RANGE,
  CONE_HALF_ANGLE,
  CAMERA_RANGE,
  CAMERA_HALF_ANGLE,
  COLORS,
} from './config.js';
import { detectionLevel, artifactsLeft } from './world.js';

function conePath(ctx, x, y, angle, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, half, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  conePath(ctx, x, y, angle, range, half);
  ctx.fill();
  ctx.restore();
}

function drawFloor(ctx, world) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  // Faint marble seams.
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= COLS; tx += 4) {
    ctx.beginPath();
    ctx.moveTo(tx * TILE, 0);
    ctx.lineTo(tx * TILE, ROWS * TILE);
    ctx.stroke();
  }
  for (let ty = 0; ty <= ROWS; ty += 4) {
    ctx.beginPath();
    ctx.moveTo(0, ty * TILE);
    ctx.lineTo(COLS * TILE, ty * TILE);
    ctx.stroke();
  }
}

function drawWalls(ctx, world) {
  for (const key of world.walls) {
    const [tx, ty] = key.split(',').map(Number);
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(tx * TILE, ty * TILE, TILE, 4);
  }
}

function drawBushes(ctx, world, frame) {
  for (const key of world.bushes) {
    const [tx, ty] = key.split(',').map(Number);
    ctx.fillStyle = COLORS.bush;
    ctx.fillRect(tx * TILE + 1, ty * TILE + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = COLORS.bushLeaf;
    // Deterministic leaf dots from the tile position (no RNG in render).
    for (let i = 0; i < 5; i++) {
      const lx = tx * TILE + 5 + ((tx * 7 + ty * 13 + i * 11) % 22);
      const ly = ty * TILE + 5 + ((tx * 3 + ty * 5 + i * 17) % 22);
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  void frame;
}

function drawExit(ctx, world) {
  const { x, y } = world.exit;
  const active = world.exitActive;
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.45;
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(x - 15, y - 15, 30, 30);
  ctx.strokeStyle = active ? COLORS.exitGlow : '#2c5c40';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 15, y - 15, 30, 30);
  ctx.fillStyle = active ? '#d8ffe9' : '#9fc4ab';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(active ? 'EXIT' : 'LOCK', x, y + 1);
  ctx.restore();
}

function drawArtifacts(ctx, world, frame) {
  for (const a of world.artifacts) {
    if (a.taken) continue;
    const pulse = 0.7 + 0.3 * Math.sin(frame / 18 + a.x);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.artifactGlow;
    ctx.beginPath();
    ctx.arc(a.x, a.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.artifact;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 9);
    ctx.lineTo(a.x + 8, a.y);
    ctx.lineTo(a.x, a.y + 9);
    ctx.lineTo(a.x - 8, a.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff6cf';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 5);
    ctx.lineTo(a.x + 4, a.y);
    ctx.lineTo(a.x, a.y + 5);
    ctx.lineTo(a.x - 4, a.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawCameras(ctx, world) {
  for (const cam of world.cameras) {
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, COLORS.cameraCone);
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dbeafe';
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 5, cam.y + Math.sin(cam.angle) * 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuards(ctx, world) {
  for (const g of world.guards) {
    const fill =
      g.state === 'chase'
        ? COLORS.coneAlert
        : g.state === 'suspicious' || g.state === 'investigate'
          ? COLORS.coneSuspicious
          : COLORS.cone;
    drawCone(ctx, g.x, g.y, g.angle, CONE_RANGE, CONE_HALF_ANGLE, fill);
  }
  for (const g of world.guards) {
    ctx.fillStyle = COLORS.guardBody;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = COLORS.guard;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 15, g.y + Math.sin(g.angle) * 15);
    ctx.stroke();
    // State mark.
    if (g.state === 'chase') {
      ctx.fillStyle = '#ff5a5f';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 20);
    } else if (g.state === 'suspicious' || g.state === 'investigate') {
      ctx.fillStyle = COLORS.artifact;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 20);
    }
    // Suspicion arc under the guard.
    if (g.suspicion > 0.02) {
      ctx.strokeStyle = g.suspicion >= 1 ? '#ff5a5f' : COLORS.artifact;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.suspicion);
      ctx.stroke();
    }
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  ctx.save();
  if (p.hidden) ctx.globalAlpha = 0.55;
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
  ctx.fill();
  // Hood point shows facing.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.dir) * 9, p.y + Math.sin(p.dir) * 9);
  ctx.lineTo(p.x + Math.cos(p.dir + 2.5) * 6, p.y + Math.sin(p.dir + 2.5) * 6);
  ctx.lineTo(p.x + Math.cos(p.dir - 2.5) * 6, p.y + Math.sin(p.dir - 2.5) * 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (p.hidden) {
    ctx.fillStyle = '#b7f7cd';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', p.x, p.y - 18);
  }
}

function drawNoise(ctx, world) {
  if (!world.noise) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(245,197,66,0.9)';
  ctx.lineWidth = 2;
  const r = 8 + (150 - world.noise.ttl) * 0.12;
  ctx.beginPath();
  ctx.arc(world.noise.x, world.noise.y, Math.min(26, r), 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.artifact;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('clink', world.noise.x, world.noise.y - 14);
  ctx.restore();
}

export function drawWorld(ctx, world) {
  ctx.save();
  ctx.translate(0, HUD_H);
  drawFloor(ctx, world);
  drawExit(ctx, world);
  drawBushes(ctx, world, world.frame);
  drawWalls(ctx, world);
  drawArtifacts(ctx, world, world.frame);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawNoise(ctx, world);
  drawPlayer(ctx, world);
  ctx.restore();
}

export function drawHUD(ctx, world) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#1d2230';
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.title;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('NIGHTSHADE', 18, 24);
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font = '13px sans-serif';
  ctx.fillText(world.wing.name, 18, 52);
  // Wing progress dots, under the wing name (kept clear of the TIME readout).
  ctx.fillStyle = COLORS.title;
  ctx.font = '13px sans-serif';
  ctx.fillText(
    [0, 1, 2].map((i) => (i < world.wingIndex ? '●' : i === world.wingIndex ? '◉' : '○')).join(' '),
    18, 70,
  );

  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(`SCORE ${world.score}`, 330, 24);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = COLORS.hudMuted;
  const mm = String(Math.floor(world.totalTime / 3600)).padStart(2, '0');
  const ss = String(Math.floor(world.totalTime / 60) % 60).padStart(2, '0');
  ctx.fillText(`TIME ${mm}:${ss}`, 330, 52);

  // Lives as hearts.
  ctx.fillStyle = '#ff5a5f';
  ctx.font = '18px sans-serif';
  ctx.fillText('♥'.repeat(world.lives) + '♡'.repeat(Math.max(0, 3 - world.lives)), 520, 24);
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font = '14px sans-serif';
  ctx.fillText(`LIVES ${world.lives}`, 520, 52);

  // Artifacts + pebbles.
  ctx.fillStyle = COLORS.artifact;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`◆ ${world.artifacts.length - artifactsLeft(world)}/${world.artifacts.length}`, 660, 24);
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font = '14px sans-serif';
  ctx.fillText(`PEBBLES ${world.pebbles}  (Q or click to throw)`, 660, 52);

  // Detection eye-meter.
  const level = detectionLevel(world);
  const ex = 1000;
  ctx.fillStyle = level >= 1 ? '#ff5a5f' : level >= 0.45 ? COLORS.artifact : COLORS.hudMuted;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(level >= 1 ? '◉ SPOTTED!' : level >= 0.45 ? '◉ SUSPICIOUS' : '◉ UNSEEN', ex, 24);
  ctx.fillStyle = '#2a2f42';
  ctx.fillRect(ex, 44, 180, 10);
  ctx.fillStyle = level >= 1 ? '#ff5a5f' : level >= 0.45 ? COLORS.artifact : '#4ade80';
  ctx.fillRect(ex, 44, 180 * level, 10);
  if (!world.seenThisWing) {
    ctx.fillStyle = '#4ade80';
    ctx.font = '13px sans-serif';
    ctx.fillText('GHOST +500', ex, 68);
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 8, 14, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#10131f';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  const w = 760;
  const h = 120 + lines.length * 30;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(title, VIEW_W / 2, y + 56);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, y + 104 + i * 30);
  });
}

export function drawTitle(ctx) {
  ctx.fillStyle = '#0d0f16';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Gallery backdrop: a dark hall with light pools.
  ctx.fillStyle = '#1a1e2c';
  ctx.fillRect(0, 120, VIEW_W, 420);
  for (let i = 0; i < 5; i++) {
    const gx = 140 + i * 250;
    ctx.fillStyle = 'rgba(245,197,66,0.08)';
    ctx.beginPath();
    ctx.ellipse(gx, 330, 90, 150, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(gx - 26, 250, 52, 66);
    ctx.fillStyle = '#8a6d1f';
    ctx.fillRect(gx - 26, 250, 52, 8);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.title;
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('NIGHTSHADE', VIEW_W / 2, 92);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '24px sans-serif';
  ctx.fillText('The Silent Gallery', VIEW_W / 2, 132);
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font = '17px sans-serif';
  ctx.fillText('Steal every artifact. Reach the exit. Never be seen.', VIEW_W / 2, 580);
  ctx.fillStyle = COLORS.player;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Press ENTER or click to begin', VIEW_W / 2, 624);
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font = '14px sans-serif';
  ctx.fillText('WASD / arrows to move · Shift to sneak · Q or click to throw a pebble · P to pause', VIEW_W / 2, 656);
}

export function drawBriefing(ctx, world) {
  overlay(ctx, world.wing.name, [
    world.wing.brief,
    '',
    `Artifacts: ${world.artifacts.length}   Guards: ${world.guards.length}   Cameras: ${world.cameras.length}   Pebbles: ${world.pebbles}`,
    'Press ENTER to enter the gallery',
  ], COLORS.title);
}

export function drawPaused(ctx) {
  overlay(ctx, 'PAUSED', ['Take a breath. The guards wait for no one.', 'Press P or ENTER to resume'], COLORS.hudMuted);
}

export function drawWingClear(ctx, world) {
  const ghost = world.seenThisWing ? 'Seen — no Ghost bonus this wing.' : 'GHOST BONUS +500 — never seen!';
  overlay(ctx, 'WING CLEAR', [
    `${world.wing.name} — cleared.`,
    `Wing bonus: ${world.clearBonus} pts   ${ghost}`,
    `Total score: ${world.score}`,
    'Press ENTER for the next wing',
  ], COLORS.exitGlow);
}

export function drawGameOver(ctx, world) {
  overlay(ctx, 'CAUGHT', [
    'The gallery lights blaze and the guards close in.',
    `You reached ${world.wing.name} with a score of ${world.score}.`,
    'Press ENTER to try again from Wing 1',
  ], '#ff5a5f');
}

export function drawWin(ctx, world) {
  const ghost = world.seenThisWing ? '' : ' — including the Ghost bonus';
  overlay(ctx, 'THE SILENT GALLERY IS YOURS', [
    `All three wings cleared. Final score: ${world.score}${ghost}.`,
    'Not a single alarm that mattered. Nightshade vanishes into the dark.',
    'Press ENTER to play again',
  ], COLORS.title);
}
