// Shared constants for Nightshade: The Silent Gallery.
export const TILE = 32; // px per grid cell
export const COLS = 40; // 40 * 32 = 1280
export const ROWS = 20; // 20 * 32 = 640
export const HUD_H = 80; // HUD bar above the playfield
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = HUD_H + ROWS * TILE; // 720

export const PLAYER_SPEED = 3.4; // px per frame at 60fps
export const PLAYER_SNEAK_SPEED = 2.0;
export const GUARD_SPEED = 1.7;
export const GUARD_CHASE_SPEED = 2.9;
export const CONE_RANGE = 165; // px
export const CONE_HALF_ANGLE = Math.PI / 5; // 36 degrees
export const CAMERA_RANGE = 190;
export const CAMERA_HALF_ANGLE = Math.PI / 6; // 30 degrees
export const DETECT_RATE = 0.016; // detection meter gain per frame while seen
export const SNEAK_DETECT_MULT = 0.5; // sneaking halves how fast guards spot you
export const DETECT_DECAY = 0.006; // meter decay per frame while unseen
export const SUSPICIOUS_AT = 0.45; // "?" state
export const SPOTTED_AT = 1.0; // "!" state — full alarm
export const CATCH_RADIUS = 20; // guard touches player
export const PEBBLES_PER_WING = 3;
export const PEBBLE_NOISE_RADIUS = 170; // guards within this hear it
export const MAX_LIVES = 3;
export const GHOST_BONUS = 500;
export const ARTIFACT_SCORE = 100;
export const WING_CLEAR_BASE = 250;

export const COLORS = {
  floor: '#232838',
  floorAlt: '#262c3e',
  wall: '#12141d',
  wallTop: '#3a4157',
  bush: '#14301f',
  bushLeaf: '#1e4d2c',
  exit: '#1f7a4d',
  exitGlow: '#37d67a',
  artifact: '#f5c542',
  artifactGlow: '#ffe9a3',
  player: '#4ade80',
  playerDark: '#166534',
  guard: '#e5484d',
  guardBody: '#8a2f33',
  cone: 'rgba(229, 72, 77, 0.20)',
  coneSuspicious: 'rgba(245, 197, 66, 0.30)',
  coneAlert: 'rgba(229, 72, 77, 0.38)',
  cameraCone: 'rgba(96, 165, 250, 0.20)',
  hudBg: '#0d0f16',
  hudText: '#e8e6df',
  hudMuted: '#8b93a7',
  title: '#f5c542',
};
