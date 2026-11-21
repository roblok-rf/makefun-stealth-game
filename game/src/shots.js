// Deterministic screenshot scenes for ?shot= URLs. Each scene builds a
// fresh world from the seeded wing layout, drives it to a fixed state, and
// renders exactly one frame. The parent screenshot script waits for
// window.__shotReady before capturing.
import { buildWing, stepWorld } from './world.js';
import {
  drawWorld,
  drawHUD,
  drawTitle,
  drawWin,
} from './render.js';

function scriptedSteps(world, steps, input) {
  for (let i = 0; i < steps; i++) stepWorld(world, input);
  return world;
}

export function renderShot(ctx, name, seed) {
  void seed; // scenes are deterministic per wing layout; seed is accepted for the URL contract
  if (name === 'start') {
    drawTitle(ctx);
  } else if (name === 'play') {
    const world = buildWing(0);
    // Sneak right along the hall, then down toward the first artifact,
    // and toss a pebble to pull the nearest guard away — the shot shows
    // the cone, the bushes, the pebble's noise ring and the HUD at once.
    scriptedSteps(world, 70, { right: true });
    scriptedSteps(world, 40, { down: true, right: true });
    stepWorld(world, { throwPebble: true, pebbleX: world.guards[0].x + 60, pebbleY: world.guards[0].y + 40 });
    scriptedSteps(world, 30, {});
    drawWorld(ctx, world);
    drawHUD(ctx, world);
  } else if (name === 'alert') {
    const world = buildWing(0);
    // Put the player in the open, right in front of the first guard, fully seen.
    const g = world.guards[0];
    world.player.x = g.x + 90;
    world.player.y = g.y;
    world.player.dir = Math.PI;
    g.angle = 0;
    g.suspicion = 1;
    g.state = 'chase';
    g.lastSeen = { x: world.player.x, y: world.player.y };
    world.seenThisWing = true;
    world.alarm = true;
    scriptedSteps(world, 12, {});
    drawWorld(ctx, world);
    drawHUD(ctx, world);
  } else if (name === 'win') {
    const world = buildWing(2);
    for (const a of world.artifacts) a.taken = true;
    world.exitActive = true;
    world.score = 2450;
    world.seenThisWing = false;
    world.status = 'win';
    drawWorld(ctx, world);
    drawHUD(ctx, world);
    drawWin(ctx, world);
  } else {
    drawTitle(ctx);
  }
  window.__shotReady = true;
}
