// Wing layouts for Nightshade. Coordinates are grid cells (40 x 20);
// the world converts them to pixels. Walls are [x, y, w, h] rectangles,
// bushes are [x, y, w, h] rectangles you can hide in. Guards patrol the
// listed waypoints (tile centres); cameras sit at a cell and sweep.
export const WINGS = [
  {
    name: 'Wing 1 — The Marble Hall',
    brief:
      'The gallery sleeps. Two guards walk the marble hall; three artifacts wait ' +
      'in the open. Stick to the shadows, toss a pebble to pull a guard away, ' +
      'and slip out the green exit once every artifact is yours.',
    walls: [
      [12, 1, 2, 7],
      [24, 12, 2, 7],
      [4, 10, 7, 1],
      [32, 6, 4, 1],
      [17, 3, 1, 4],
    ],
    bushes: [
      [6, 3, 3, 2],
      [18, 14, 4, 2],
      [30, 15, 3, 2],
      [20, 4, 2, 2],
      [34, 10, 3, 2],
    ],
    artifacts: [
      [36, 2],
      [3, 17],
      [20, 10],
    ],
    exit: [37, 17],
    player: [2, 2],
    guards: [
      // Patrol loops are axis-aligned rectangles whose every leg is clear of
      // walls — guards walk straight lines and cannot path around corners.
      { path: [[6, 3], [6, 8], [10, 8], [10, 3]], pause: 40 },
      { path: [[30, 2], [37, 2], [37, 14], [30, 14]], pause: 50 },
    ],
    cameras: [],
  },
  {
    name: 'Wing 2 — The Sculpture Court',
    brief:
      'The court is wired. A security camera sweeps the central hall and a third ' +
      'guard joins the patrol. Cameras cannot be dodged by bushes — wait for the ' +
      'sweep to pass, or the whole wing will know where you are.',
    walls: [
      [8, 1, 2, 6],
      [8, 13, 2, 6],
      [19, 8, 2, 5],
      [29, 1, 2, 6],
      [29, 13, 2, 6],
      [14, 14, 6, 1],
      [14, 4, 6, 1],
    ],
    bushes: [
      [4, 9, 3, 2],
      [22, 2, 3, 2],
      [22, 16, 3, 2],
      [35, 9, 3, 2],
      [12, 9, 2, 2],
    ],
    artifacts: [
      [2, 18],
      [37, 2],
      [20, 1],
      [37, 18],
    ],
    exit: [20, 18],
    player: [2, 2],
    guards: [
      { path: [[4, 3], [4, 16], [6, 16], [6, 3]], pause: 35 },
      { path: [[33, 8], [37, 8], [37, 16], [33, 16]], pause: 45 },
      { path: [[15, 13], [23, 13]], pause: 30 },
    ],
    cameras: [{ x: 20, y: 1, baseAngle: Math.PI / 2, sweep: 1.1, speed: 0.011 }],
  },
  {
    name: 'Wing 3 — The Vault Gallery',
    brief:
      'The vault wing: four guards, two cameras, five artifacts, and nowhere ' +
      'to hide that is not already watched. Chain your pebbles, count the ' +
      'camera sweeps, and take the Ghost bonus home — never be seen.',
    walls: [
      [6, 1, 2, 5],
      [6, 14, 2, 5],
      [16, 7, 2, 6],
      [24, 1, 2, 5],
      [24, 14, 2, 5],
      [32, 7, 2, 6],
      [11, 9, 5, 1],
      [25, 9, 5, 1],
    ],
    bushes: [
      [3, 9, 2, 2],
      [12, 2, 3, 2],
      [12, 16, 3, 2],
      [20, 3, 2, 2],
      [20, 15, 2, 2],
      [28, 2, 3, 2],
      [28, 16, 3, 2],
      [36, 9, 2, 2],
    ],
    artifacts: [
      [2, 18],
      [37, 1],
      [20, 9],
      [10, 18],
      [30, 18],
    ],
    exit: [37, 9],
    player: [2, 1],
    guards: [
      { path: [[3, 3], [3, 16], [4, 16], [4, 3]], pause: 30 },
      { path: [[12, 3], [12, 8], [14, 8], [14, 3]], pause: 35 },
      { path: [[21, 6], [21, 10], [23, 10], [23, 6]], pause: 35 },
      { path: [[34, 3], [34, 16], [37, 16], [37, 3]], pause: 30 },
    ],
    cameras: [
      { x: 20, y: 1, baseAngle: Math.PI / 2, sweep: 1.0, speed: 0.013 },
      { x: 20, y: 18, baseAngle: -Math.PI / 2, sweep: 1.0, speed: 0.013 },
    ],
  },
];
