# Nightshade: The Silent Gallery

A top-down stealth game for the make.fun bounty
**best-stealth-game-20261121-1759** ("Make the best stealth game").

You are Nightshade, a thief in a sleeping art gallery. Steal every artifact
in each wing, then slip out the green exit — unseen. Three wings, three
lives, one rule: never be seen.

## How to play

```
node serve.ts        # serves game/ on http://localhost:8080
```

Open http://localhost:8080 in a desktop browser. No build step, no network
requests — plain static files.

| Key | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Shift | Sneak (slower, guards spot you half as fast) |
| Q or mouse click | Throw a pebble (3 per wing) — guards investigate the clink |
| P | Pause |
| Enter | Start / continue |

## The stealth loop

- **Vision cones.** Guards patrol fixed routes. Step into a red cone and
  their suspicion rises: `?` means they are coming to look, `!` means they
  are chasing you. Break line of sight (or duck into a bush) and it drains.
- **Bushes.** Dark green thickets hide you — a guard only spots you in a
  bush at point-blank range. Cameras are not fooled by bushes.
- **Cameras (wings 2–3).** Blue cones sweep the hall. Being seen by one
  puts every guard on alert.
- **Pebbles.** Toss one to pull nearby guards toward the noise while you
  slip past.
- **Caught.** A guard touching you costs a life and sends you back to the
  wing entrance. Lose all three lives and the gallery wins.
- **Score.** 100 pts per artifact, a wing-clear bonus, a time bonus — and
  **+500 Ghost bonus** per wing cleared without ever being seen.

## Design notes

- 3 wings of rising density: 2 guards → 3 guards + 1 camera → 4 guards +
  2 cameras, with 3, 4 and 5 artifacts.
- Deterministic: wings are built from fixed layouts and a seeded RNG, so
  the same seed always builds the same gallery. `?shot=start|play|alert|win`
  with `?seed=` renders the four deterministic screenshot scenes.
- Sound is synthesized WebAudio (footsteps, pickups, alarm) — no audio files.
- `node main.ts` verifies the game in Node (a Wing 1 win path and a 3000-frame
  random-input soak) and writes the submission dossier to `/output`
  (or `$MAKEFUN_OUTPUT_DIR`).

## Files

- `game/index.html` + `game/src/*.js` — the game (config, levels, world,
  render, input, audio, shots, main, random)
- `screenshots/` — 4 real renders, 1280×720 JPEG
- `main.ts` — dossier builder + verifier (Node 22 stdlib only)
- `serve.ts` — local static server
- `MODELS.md` — the 15 ATM concepts; model 11 is this game
- `TRANSCRIPT.md` — build notes
- `vendor/makefun-game.ts` — make.fun library, copied unchanged from the kit
