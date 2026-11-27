// Desktop Keyboard + Mouse Controls with camera orbit drag, wheel zoom, and clean key bindings.
export class KeyboardControls {
  constructor(canvas, eventBus) {
    this.canvas = canvas;
    this.events = eventBus;
    this.keys = new Set();

    this.camYawDelta = 0;
    this.camPitchDelta = 0;
    this.camZoomDelta = 0;

    this.attackPressed = false;
    this.heavyPressed = false;
    this.dodgePressed = false;
    this.interactPressed = false;
    this.stealthToggle = false;
    this.guardHeld = false;

    this._dragging = false;
    this._dragMoved = 0;
    this._lastX = 0;
    this._lastY = 0;
    this.enabled = true;

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const code = e.code;
      if (!this.keys.has(code)) {
        if (code === 'KeyE') this.interactPressed = true;
        if (code === 'KeyJ') this.attackPressed = true;
        if (code === 'KeyK') this.heavyPressed = true;
        if (code === 'KeyC' || code === 'ControlLeft') this.dodgePressed = true;
        if (code === 'KeyZ') this.stealthToggle = true;
        if (code === 'KeyH') this.events.emit('mount:toggle');
        if (code === 'KeyG') this.events.emit('fishing:action');
        if (code === 'Digit1') this.events.emit('magic:castKey', 0);
        if (code === 'Digit2') this.events.emit('magic:castKey', 1);
        if (code === 'Digit3') this.events.emit('magic:castKey', 2);
        if (code === 'Digit4') this.events.emit('magic:castKey', 3);
        if (code === 'KeyV') this.events.emit('camera:photoToggle');
        if (code === 'KeyM') this.events.emit('ui:toggle', 'map');
        if (code === 'KeyI') this.events.emit('ui:toggle', 'inventory');
        if (code === 'KeyT') this.events.emit('ui:toggle', 'quests');
        if (code === 'KeyU') this.events.emit('world:guidingWind');
        if (code === 'KeyO') this.events.emit('ui:toggle', 'homestead');
        if (code === 'KeyN') this.events.emit('ui:toggle', 'bounties');
        if (code === 'KeyP') this.events.emit('ui:toggle', 'progression');
        if (code === 'KeyB') this.events.emit('ui:toggle', 'codex');
        if (code === 'Escape') this.events.emit('ui:escape');
        if (code === 'Equal' || code === 'NumpadAdd') this.camZoomDelta -= 2.5;
        if (code === 'Minus' || code === 'NumpadSubtract') this.camZoomDelta += 2.5;
      }
      this.keys.add(code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this._dragging = false;
      this.guardHeld = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      if (e.button === 2 || e.button === 1) {
        this._dragging = true;
        this._dragMoved = 0;
        this._lastX = e.clientX;
        this._lastY = e.clientY;
        if (e.button === 2) this.guardHeld = true;
      } else if (e.button === 0) {
        if (e.shiftKey) this.heavyPressed = true;
        else this.attackPressed = true;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this._dragging) return;
      const dx = e.clientX - this._lastX;
      const dy = e.clientY - this._lastY;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      this._dragMoved += Math.abs(dx) + Math.abs(dy);
      if (this._dragMoved > 6) this.guardHeld = false;
      this.camYawDelta += dx * 0.0065;
      this.camPitchDelta += dy * 0.005;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2 || e.button === 1) {
        this._dragging = false;
        this.guardHeld = false;
      }
    });

    this.canvas.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.camZoomDelta += Math.sign(e.deltaY) * 1.85;
      },
      { passive: false }
    );
  }

  sample(dt) {
    let moveX = 0;
    let moveY = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveY += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveY -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;

    // Keyboard camera yaw & pitch adjustment (Q/Z or Q/V + R/F)
    let yawD = this.camYawDelta;
    let pitchD = this.camPitchDelta;
    const zoomD = this.camZoomDelta;
    if (this.keys.has('KeyQ')) yawD -= dt * 1.85;
    if (this.keys.has('KeyX')) yawD += dt * 1.85;
    if (this.keys.has('KeyR')) pitchD += dt * 1.1;
    if (this.keys.has('KeyF')) pitchD -= dt * 1.1;

    const out = {
      moveX,
      moveY,
      sprint: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
      jump: this.keys.has('Space'),
      guard: this.guardHeld || this.keys.has('KeyL'),
      dive: this.keys.has('KeyC') || this.keys.has('ControlLeft'),
      stealthToggle: this.stealthToggle,
      attackPressed: this.attackPressed,
      heavyPressed: this.heavyPressed,
      dodgePressed: this.dodgePressed,
      interactPressed: this.interactPressed,
      camYawDelta: yawD,
      camPitchDelta: pitchD,
      camZoomDelta: zoomD,
    };

    this.camYawDelta = 0;
    this.camPitchDelta = 0;
    this.camZoomDelta = 0;
    this.attackPressed = false;
    this.heavyPressed = false;
    this.dodgePressed = false;
    this.interactPressed = false;
    this.stealthToggle = false;
    return out;
  }
}
