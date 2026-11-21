# TRANSCRIPT.md — build notes

Fresh rebuild for the make.fun bounty best-stealth-game-20261121-1759
("Make the best stealth game"), built in a session that started after the
competition opened (Sun 22 Nov 00:59 +07), so the run record falls inside
the window.

## What was built

"Nightshade: The Silent Gallery" — a top-down stealth game in plain static
files (game/index.html + game/src/*.js, no build step, no network requests):

- Guards with gradient vision cones and a three-state AI: patrol → "?"
  suspicious (walks to the last-seen spot) → "!" chase, with a per-guard
  suspicion meter that rises in the cone and drains out of sight.
- Bushes to hide in (guards only spot you at point-blank range inside one),
  pebble lures (3 per wing; nearby guards investigate the noise), security
  cameras in wings 2–3 whose blue sweeping cones raise a wing-wide alarm.
- 3 wings (2 guards / 3 artifacts → 3 guards + 1 camera / 4 artifacts →
  4 guards + 2 cameras / 5 artifacts), 3 lives, score + time bonus +
  500-pt Ghost bonus for a wing cleared unseen.
- 6 screens: title, briefing, play, paused, wing-clear, game-over/win.
- WebAudio synthesized sound (no audio files), HUD with detection eye-meter,
  lives, artifacts, pebbles, timer and Ghost indicator.
- Deterministic `?shot=start|play|alert|win&seed=1` scenes that set
  window.__shotReady when rendered; 4 screenshots at 1280×720 JPEG.
- main.ts (Node 22 stdlib only) verifies the game in Node — a Wing 1 win
  path that clears with the Ghost bonus, plus a 3000-frame random-input
  soak with no errors — then writes the dossier via vendor/makefun-game.ts.

## ATM study

The bounty brief and the stealth canon agree: what wins a screenshot
comparison is a level that reads instantly — visible cones, obvious cover,
a visible goal. The 15 concepts in MODELS.md combine the best of the
genre (Mark of the Ninja's readable cones, Metal Gear's "?" / "!" states,
Splinter Cell's light and shadow, Hitman's route planning) into model 11,
this game. The live leaderboard on the bounty page is client-rendered and
did not expose entries to a text fetch, so the study leaned on the brief
itself and the genre's known winners.

## Verification

- `node main.ts` (with screenshots present): Wing 1 win path clears with
  score 1650 (incl. +500 Ghost), Wing 2 soak 3000 frames with no errors,
  4 JPEG screenshots under the 256 KiB cap, dossier written.
- Patrol-leg validation in buildWing: every guard patrol leg (including the
  closing leg back to the first waypoint) is checked for line of sight at
  build time — 0 warnings across all 3 wings after the level fixes.
- Guard-vision unit checks in Node: canSee true in-cone on open floor,
  false behind the guard, false through a wall, false for a hidden player
  at 100 px, true at 40 px; a chased guard catches the player and costs
  a life; a pebble throw sends a nearby guard to investigate.
- 3000-frame random-input soaks on all 3 wings run with no errors (blind
  random walkers get caught, as expected — they walk straight into cones).
- Screenshots re-rendered headless (Chrome for Testing via Playwright)
  from the game's own ?shot= scenes; each verified under 256 KiB.
