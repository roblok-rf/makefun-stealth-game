// Pure game logic for Nightshade — no DOM, no canvas. The browser's main.js
// owns the loop and rendering; Node can import this file to play-test.
import {
  TILE,
  COLS,
  ROWS,
  PLAYER_SPEED,
  PLAYER_SNEAK_SPEED,
  GUARD_SPEED,
  GUARD_CHASE_SPEED,
  CONE_RANGE,
  CONE_HALF_ANGLE,
  CAMERA_RANGE,
  CAMERA_HALF_ANGLE,
  DETECT_RATE,
  SNEAK_DETECT_MULT,
  DETECT_DECAY,
  SUSPICIOUS_AT,
  SPOTTED_AT,
  CATCH_RADIUS,
  PEBBLES_PER_WING,
  PEBBLE_NOISE_RADIUS,
  MAX_LIVES,
  GHOST_BONUS,
  ARTIFACT_SCORE,
  WING_CLEAR_BASE,
} from './config.js';
import { WINGS } from './levels.js';
import { hashSeed, mulberry32 } from './random.js';

export function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

function wallSet(wing) {
  const set = new Set();
  for (const [x, y, w, h] of wing.walls) {
    for (let cy = y; cy < y + h; cy++) {
      for (let cx = x; cx < x + w; cx++) set.add(`${cx},${cy}`);
    }
  }
  return set;
}

function bushSet(wing) {
  const set = new Set();
  for (const [x, y, w, h] of wing.bushes) {
    for (let cy = y; cy < y + h; cy++) {
      for (let cx = x; cx < x + w; cx++) set.add(`${cx},${cy}`);
    }
  }
  return set;
}

export function isWallTile(walls, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  return walls.has(`${tx},${ty}`);
}

function isWallPx(walls, x, y) {
  return isWallTile(walls, Math.floor(x / TILE), Math.floor(y / TILE));
}

// Line of sight between two points, blocked by walls (sampled every 6px).
export function lineOfSight(walls, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isWallPx(walls, x0 + dx * t, y0 + dy * t)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can a viewer at (x,y) facing `angle` with given range/half-angle see the player?
export function canSee(walls, vx, vy, angle, range, halfAngle, px, py, playerHidden) {
  const dx = px - vx;
  const dy = py - vy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  // Hiding in a bush: only spotted at very close range.
  if (playerHidden && dist > 64) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  return lineOfSight(walls, vx, vy, px, py);
}

export function buildWing(wingIndex, opts = {}) {
  const wing = WINGS[wingIndex];
  const rng = mulberry32(hashSeed(`nightshade-wing-${wingIndex + 1}`));
  void rng;
  const walls = wallSet(wing);
  const bushes = bushSet(wing);
  const start = tileCenter(wing.player[0], wing.player[1]);
  const exit = tileCenter(wing.exit[0], wing.exit[1]);
  const world = {
    wingIndex,
    wing,
    walls,
    bushes,
    player: { x: start.x, y: start.y, dir: 0, hidden: false, moving: false },
    guards: wing.guards.map((g) => {
      const first = tileCenter(g.path[0][0], g.path[0][1]);
      return {
        x: first.x,
        y: first.y,
        path: g.path.map(([tx, ty]) => tileCenter(tx, ty)),
        waypoint: 1 % g.path.length,
        pause: g.pause,
        pauseLeft: 0,
        angle: 0,
        state: 'patrol', // patrol | suspicious | investigate | chase
        suspicion: 0,
        stuck: 0, // frames spent blocked while patrolling; skips a waypoint if stuck
        lastSeen: null,
        investigateTarget: null,
      };
    }),
    cameras: wing.cameras.map((c) => {
      const p = tileCenter(c.x, c.y);
      return { x: p.x, y: p.y, baseAngle: c.baseAngle, sweep: c.sweep, speed: c.speed, angle: c.baseAngle, t: 0 };
    }),
    artifacts: wing.artifacts.map(([tx, ty]) => ({ ...tileCenter(tx, ty), taken: false })),
    exit,
    exitActive: false,
    pebbles: PEBBLES_PER_WING,
    pebbleInFlight: null,
    noise: null, // {x, y, ttl} — a thrown pebble's landing noise
    lives: opts.lives ?? MAX_LIVES,
    score: opts.score ?? 0,
    wingTime: 0,
    totalTime: opts.totalTime ?? 0,
    seenThisWing: false,
    alarm: false,
    status: 'playing', // playing | wing-clear | game-over | win
    clearBonus: 0,
    frame: 0,
  };

  // Validate patrol loops: every leg (including last waypoint back to the
  // first) must have line of sight, or the guard would walk into a wall
  // and stall. Warn loudly instead of silently shipping a stuck guard.
  for (let gi = 0; gi < world.guards.length; gi++) {
    const path = world.guards[gi].path;
    for (let wi = 0; wi < path.length; wi++) {
      const a = path[wi];
      const b = path[(wi + 1) % path.length];
      if (!lineOfSight(walls, a.x, a.y, b.x, b.y)) {
        console.warn(`wing ${wingIndex + 1} guard ${gi}: patrol leg ${wi} crosses a wall`);
      }
    }
  }
  return world;
}

function moveCircle(walls, e, dx, dy, radius) {
  // Axis-separated movement so the player slides along walls.
  const nx = e.x + dx;
  if (!isWallPx(walls, nx + Math.sign(dx) * radius, e.y - radius + 2) &&
      !isWallPx(walls, nx + Math.sign(dx) * radius, e.y + radius - 2) &&
      !isWallPx(walls, nx + Math.sign(dx) * radius, e.y)) {
    e.x = nx;
  }
  const ny = e.y + dy;
  if (!isWallPx(walls, e.x - radius + 2, ny + Math.sign(dy) * radius) &&
      !isWallPx(walls, e.x + radius - 2, ny + Math.sign(dy) * radius) &&
      !isWallPx(walls, e.x, ny + Math.sign(dy) * radius)) {
    e.y = ny;
  }
  e.x = Math.max(radius, Math.min(COLS * TILE - radius, e.x));
  e.y = Math.max(radius, Math.min(ROWS * TILE - radius, e.y));
}

function playerInBush(world) {
  const tx = Math.floor(world.player.x / TILE);
  const ty = Math.floor(world.player.y / TILE);
  return world.bushes.has(`${tx},${ty}`);
}

// One simulation step. input: {up,down,left,right,sneak,throwPebble,pebbleX,pebbleY}
export function stepWorld(world, input) {
  if (world.status !== 'playing') return world;
  world.frame++;
  world.wingTime++;
  world.totalTime++;

  const p = world.player;
  const speed = input.sneak ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx = (dx / len) * speed;
    dy = (dy / len) * speed;
    p.dir = Math.atan2(dy, dx);
    p.moving = true;
  } else {
    p.moving = false;
  }
  moveCircle(world.walls, p, dx, dy, 11);
  p.hidden = playerInBush(world);

  // Pebble throw: instant landing at the clicked point (clamped to the floor).
  if (input.throwPebble && world.pebbles > 0) {
    world.pebbles--;
    const tx = Math.max(16, Math.min(COLS * TILE - 16, input.pebbleX ?? p.x + Math.cos(p.dir) * 120));
    const ty = Math.max(16, Math.min(ROWS * TILE - 16, input.pebbleY ?? p.y + Math.sin(p.dir) * 120));
    world.noise = { x: tx, y: ty, ttl: 150 };
  }
  if (world.noise) {
    world.noise.ttl--;
    if (world.noise.ttl <= 0) world.noise = null;
  }

  // Cameras sweep; a camera spotting the player raises the alarm.
  let cameraSees = false;
  for (const cam of world.cameras) {
    cam.t += 1;
    cam.angle = cam.baseAngle + Math.sin(cam.t * cam.speed) * cam.sweep;
    if (canSee(world.walls, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, p.x, p.y, p.hidden)) {
      cameraSees = true;
    }
  }
  if (cameraSees) {
    world.seenThisWing = true;
    world.alarm = true;
    for (const g of world.guards) {
      g.state = 'suspicious';
      g.suspicion = Math.max(g.suspicion, SUSPICIOUS_AT + 0.05);
      g.lastSeen = { x: p.x, y: p.y };
    }
  }

  // Guards: see, suspect, chase, investigate noise, patrol.
  for (const g of world.guards) {
    const sees = canSee(world.walls, g.x, g.y, g.angle, CONE_RANGE, CONE_HALF_ANGLE, p.x, p.y, p.hidden);
    if (sees) {
      const closeness = 1.6 - Math.hypot(p.x - g.x, p.y - g.y) / CONE_RANGE;
      const rate = DETECT_RATE * (input.sneak ? SNEAK_DETECT_MULT : 1);
      g.suspicion = Math.min(SPOTTED_AT, g.suspicion + rate * Math.max(0.6, closeness));
      g.lastSeen = { x: p.x, y: p.y };
      if (g.suspicion >= SPOTTED_AT) {
        g.state = 'chase';
        world.seenThisWing = true;
        world.alarm = true;
      } else if (g.suspicion >= SUSPICIOUS_AT && g.state === 'patrol') {
        g.state = 'suspicious';
      }
    } else {
      g.suspicion = Math.max(0, g.suspicion - DETECT_DECAY);
      if (g.state === 'suspicious' && g.suspicion < SUSPICIOUS_AT * 0.5) g.state = 'patrol';
      if (g.state === 'chase' && g.suspicion <= 0.05) g.state = 'suspicious';
    }

    // Hearing: a fresh pebble noise pulls nearby guards to investigate.
    if (world.noise && g.state !== 'chase') {
      const d = Math.hypot(world.noise.x - g.x, world.noise.y - g.y);
      if (d < PEBBLE_NOISE_RADIUS) {
        g.state = 'investigate';
        g.investigateTarget = { x: world.noise.x, y: world.noise.y };
      }
    }

    const target = (() => {
      if (g.state === 'chase' || g.state === 'suspicious') return g.lastSeen;
      if (g.state === 'investigate') return g.investigateTarget;
      return g.path[g.waypoint];
    })();

    if (target) {
      const dxg = target.x - g.x;
      const dyg = target.y - g.y;
      const dist = Math.hypot(dxg, dyg);
      const spd = g.state === 'chase' ? GUARD_CHASE_SPEED : GUARD_SPEED;
      if (dist > 4) {
        const step = Math.min(spd, dist);
        const nx = g.x + (dxg / dist) * step;
        const ny = g.y + (dyg / dist) * step;
        if (!isWallPx(world.walls, nx, ny)) {
          g.x = nx;
          g.y = ny;
          g.stuck = 0;
        } else if (g.state === 'patrol') {
          // Blocked while patrolling: after 4 seconds, give up on this
          // waypoint instead of standing against the wall forever.
          g.stuck++;
          if (g.stuck > 240) {
            g.waypoint = (g.waypoint + 1) % g.path.length;
            g.stuck = 0;
          }
        }
        g.angle = Math.atan2(dyg, dxg);
      } else if (g.state === 'patrol') {
        if (g.pauseLeft > 0) {
          g.pauseLeft--;
        } else {
          g.waypoint = (g.waypoint + 1) % g.path.length;
          g.pauseLeft = g.pause;
        }
        // Look around while pausing at a waypoint.
        g.angle += 0.02;
      } else if (g.state === 'investigate') {
        g.investigateTarget = null;
        g.state = 'patrol';
      } else if (g.state === 'suspicious' && dist <= 4) {
        // Reached the last-seen spot and found nothing: calm down.
        g.lastSeen = null;
        g.state = 'patrol';
      }
    }

    // Caught?
    if (Math.hypot(p.x - g.x, p.y - g.y) < CATCH_RADIUS) {
      return loseLife(world);
    }
  }

  // Artifacts.
  for (const a of world.artifacts) {
    if (!a.taken && Math.hypot(p.x - a.x, p.y - a.y) < 22) {
      a.taken = true;
      world.score += ARTIFACT_SCORE;
      if (world.artifacts.every((x) => x.taken)) world.exitActive = true;
    }
  }

  // Exit.
  if (world.exitActive && Math.hypot(p.x - world.exit.x, p.y - world.exit.y) < 24) {
    const timeBonus = Math.max(0, 600 - Math.floor(world.wingTime / 60) * 10);
    const ghost = world.seenThisWing ? 0 : GHOST_BONUS;
    world.clearBonus = WING_CLEAR_BASE + timeBonus + ghost;
    world.score += world.clearBonus;
    world.status = 'wing-clear';
  }
  return world;
}

function loseLife(world) {
  world.lives--;
  world.alarm = false;
  if (world.lives <= 0) {
    world.status = 'game-over';
    return world;
  }
  // Respawn at the wing start; guards reset to patrol, suspicion cleared.
  const start = tileCenter(world.wing.player[0], world.wing.player[1]);
  world.player.x = start.x;
  world.player.y = start.y;
  world.player.dir = 0;
  world.guards.forEach((g, gi) => {
    const def = world.wing.guards[gi];
    const first = tileCenter(def.path[0][0], def.path[0][1]);
    g.x = first.x;
    g.y = first.y;
    g.waypoint = 1 % g.path.length;
    g.state = 'patrol';
    g.suspicion = 0;
    g.stuck = 0;
    g.lastSeen = null;
    g.investigateTarget = null;
  });
  return world;
}

// Highest suspicion across guards — drives the HUD eye-meter.
export function detectionLevel(world) {
  let m = 0;
  for (const g of world.guards) m = Math.max(m, g.suspicion);
  return m;
}

export function artifactsLeft(world) {
  return world.artifacts.filter((a) => !a.taken).length;
}
