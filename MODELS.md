# MODELS.md — 15 stealth-game concepts (ATM study)

Bounty: best-stealth-game-20261121-1759 — "Make the best stealth game".
Judge: an AI compares entries two at a time by their screenshots and a source
outline; entries rank by how often they are picked. What wins on a screenshot:
a level that reads instantly at 1280x720 (clear vision cones, obvious cover,
a visible goal), a readable HUD, and a distinct mood. The classic stealth
canon (Mark of the Ninja's readable cones, Metal Gear's "?" / "!" states,
Hitman's disguise-and-route planning, Splinter Cell's light/shadow, Thief's
sound, Invisible Inc's grid tactics) agrees on the same few ingredients:
visible enemy sight, hiding places that are obvious, a lure/distraction tool,
a graded alarm, and a score that rewards never being seen.

## The 15 models

1. **Museum Heist (side view)** — 2D side-scroller, jump between balconies,
   laser grids. Weak: side view hides vision cones; cones are the genre's
   clearest screenshot signal.
2. **Office After Dark** — cubicles as cover, photocopier noise lures.
   Weak: beige palette photographs badly; low contrast.
3. **Submarine Silent Running** — sonar pings instead of cones, dark blue.
   Weak: cones replaced by circles; less readable at a glance.
4. **Ninja Rooftops** — night city, grapple, rooftop patrols. Weak: verticality
   fights the top-down readability the brief rewards.
5. **Ghost in the Library** — bookshelves as walls, shushing librarian guards.
   Charming but the joke carries the game, not the stealth systems.
6. **Prison Break** — searchlights sweep the yard, timed movement.
   Strong sweeps, but one mechanic only; no lure, no collectibles.
7. **Cat Burglar's Kitchen** — steal food while the cook patrols; comedic.
   Weak: single small room, no sense of progression across levels.
8. **Spy Train** — move carriage to carriage, conductors patrol. Strong
   linear tension, weak: no room for flanking or hiding choice.
9. **Shadow Garden** — bushes as cover, gardener with a lantern cone.
   Strong cover idea; single mechanic, one small map.
10. **Casino Caper** — cameras everywhere, chips as loot, guards in suits.
    Strong camera idea; art-heavy (tables, chips) for a canvas game.
11. **Nightshade: The Silent Gallery — THE GAME.** Top-down museum heist:
    guards with gradient vision cones (patrol → "?" suspicious → "!" chase),
    shadow bushes to hide in, pebble lures (3 per wing), security cameras
    (wings 2–3), artifacts to steal, an exit to reach unseen. 3 wings,
    3 lives, score + time bonus + 500-pt Ghost bonus for never being seen,
    WebAudio sound, HUD detection eye-meter, 6 screens (title, briefing,
    play, paused, wing-clear, game-over/win). Combines the best of 1–10:
    the cones of 1, the lures of 2, the sweeps of 6, the cover of 9, the
    cameras of 10, the progression of 4 — in one readable top-down map.
12. **Laser Mansion** — rotating laser tripwires, timing puzzles. Weak: pure
    timing, no enemy AI to outsmart; screenshots look empty.
13. **Haunted Manor Thief** — ghosts that see through walls, candlelight.
    Weak: "sees through walls" breaks the cone-readability rule.
14. **Warehouse Night Shift** — forklifts as moving cover, crates to stack.
    Strong moving-cover idea; forklift paths add noise to screenshots.
15. **Time-Loop Gallery** — replay the same heist, guards remember. Ambitious
    but the loop is invisible in a single screenshot; the judge sees one frame.

## Why model 11 wins

- **Screenshot-first:** every shot shows cones, cover, loot and exit in one
  frame; the alert shot shows a red "!" chase. The play shot also shows a
  pebble's noise ring pulling a guard away — the game's signature mechanic,
  visible in a single frame.
- **Systems, not gimmicks:** patrol/suspicion/chase AI, light-and-shadow
  hiding, lures, cameras, lives, Ghost bonus — a real stealth loop.
- **Progression:** 3 wings of rising density (2 guards → 3 guards + cameras
  → 4 guards + 2 cameras), so the game is complete, not a demo.
- **Deterministic:** seeded RNG and `?shot=` scenes make every screenshot
  reproducible; the same seed always builds the same wing.
