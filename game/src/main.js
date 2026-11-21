// Nightshade: The Silent Gallery — entry point. Owns the screen state
// machine and the animation loop; world.js owns the simulation, render.js
// owns the drawing.
import { VIEW_W, VIEW_H, MAX_LIVES } from './config.js';
import { buildWing, stepWorld } from './world.js';
import {
  drawWorld,
  drawHUD,
  drawTitle,
  drawBriefing,
  drawPaused,
  drawWingClear,
  drawGameOver,
  drawWin,
} from './render.js';
import { createInput } from './input.js';
import { sfx } from './audio.js';
import { renderShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

if (shot) {
  // Deterministic screenshot mode: render one scene and stop.
  renderShot(ctx, shot, seed);
} else {
  const input = createInput(canvas);
  let screen = 'title'; // title | briefing | playing | paused | wing-clear | game-over | win
  let world = buildWing(0);
  let prevChase = false;
  let prevSuspicious = false;
  let prevLives = MAX_LIVES;

  function startWing(index, carry) {
    world = buildWing(index, carry);
    screen = 'briefing';
    prevLives = world.lives;
  }

  function frame() {
    const snap = input.poll();
    if (snap.confirm) sfx.unlock();

    if (screen === 'title') {
      drawTitle(ctx);
      if (snap.confirm) startWing(0, {});
    } else if (screen === 'briefing') {
      drawWorld(ctx, world);
      drawHUD(ctx, world);
      drawBriefing(ctx, world);
      if (snap.confirm) screen = 'playing';
    } else if (screen === 'playing') {
      if (snap.pause) {
        screen = 'paused';
      } else {
        const before = world.artifacts.filter((a) => a.taken).length;
        stepWorld(world, snap);
        const after = world.artifacts.filter((a) => a.taken).length;
        if (after > before) sfx.pickup();

        const chasing = world.guards.some((g) => g.state === 'chase');
        const suspicious = world.guards.some((g) => g.state === 'suspicious');
        if (chasing && !prevChase) sfx.spotted();
        else if (suspicious && !prevSuspicious) sfx.suspicious();
        prevChase = chasing;
        prevSuspicious = suspicious;

        if (world.lives < prevLives) sfx.caught();
        prevLives = world.lives;

        drawWorld(ctx, world);
        drawHUD(ctx, world);
        if (world.status === 'wing-clear') {
          sfx.wingClear();
          screen = 'wing-clear';
        } else if (world.status === 'game-over') {
          sfx.caught();
          screen = 'game-over';
        } else if (world.status === 'win') {
          screen = 'win';
        }
      }
    } else if (screen === 'paused') {
      drawWorld(ctx, world);
      drawHUD(ctx, world);
      drawPaused(ctx);
      if (snap.pause || snap.confirm) screen = 'playing';
    } else if (screen === 'wing-clear') {
      drawWorld(ctx, world);
      drawHUD(ctx, world);
      drawWingClear(ctx, world);
      if (snap.confirm) {
        if (world.wingIndex + 1 >= 3) {
          world.status = 'win';
          screen = 'win';
          sfx.win();
        } else {
          startWing(world.wingIndex + 1, {
            lives: world.lives,
            score: world.score,
            totalTime: world.totalTime,
          });
        }
      }
    } else if (screen === 'game-over') {
      drawWorld(ctx, world);
      drawHUD(ctx, world);
      drawGameOver(ctx, world);
      if (snap.confirm) startWing(0, {});
    } else if (screen === 'win') {
      drawWorld(ctx, world);
      drawHUD(ctx, world);
      drawWin(ctx, world);
      if (snap.confirm) startWing(0, {});
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
