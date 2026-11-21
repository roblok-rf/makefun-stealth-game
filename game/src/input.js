// Keyboard + mouse input. Keys are tracked as a live set; the game loop
// polls it each frame. Mouse clicks throw pebbles toward the clicked point.
export function createInput(canvas) {
  const keys = new Set();
  let mouse = { x: 0, y: 0, clicked: false };

  const KEYMAP = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ShiftLeft: 'sneak',
    ShiftRight: 'sneak',
    KeyQ: 'pebble',
    KeyP: 'pause',
    Escape: 'pause',
    Enter: 'confirm',
    Space: 'confirm',
  };

  function onKeyDown(e) {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (['up', 'down', 'left', 'right', 'confirm'].includes(action)) e.preventDefault();
    if (!e.repeat) keys.add(action);
  }
  function onKeyUp(e) {
    const action = KEYMAP[e.code];
    if (action) keys.delete(action);
  }
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  }
  function onMouseDown(e) {
    onMouseMove(e);
    mouse.clicked = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    // Snapshot consumed by one step of the game loop.
    poll() {
      const snap = {
        up: keys.has('up'),
        down: keys.has('down'),
        left: keys.has('left'),
        right: keys.has('right'),
        sneak: keys.has('sneak'),
        confirm: keys.has('confirm'),
        pause: keys.has('pause'),
        throwPebble: keys.has('pebble') || mouse.clicked,
        pebbleX: mouse.x,
        pebbleY: mouse.y - 80, // HUD offset: mouse is in canvas space
      };
      // Edge-triggered keys are consumed once.
      keys.delete('pebble');
      keys.delete('pause');
      keys.delete('confirm');
      mouse.clicked = false;
      return snap;
    },
  };
}
