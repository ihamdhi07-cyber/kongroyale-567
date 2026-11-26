// Responsive Mobile & Tablet Touch Controls:
// Virtual Movement Joystick (left), Swipe Camera Orbit & Pinch Zoom (canvas),
// Ergonomic Thumb Action Cluster (Jump/Glide, Attack, Heavy, Dodge, Guard, Contextual Interact).
export class TouchControls {
  constructor(canvas) {
    this.canvas = canvas;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.visible = this.isTouchDevice;

    this.moveX = 0;
    this.moveY = 0;
    this.sprint = false;
    this.jump = false;
    this.guard = false;
    this.dive = false;
    this.stealthToggle = false;
    this.attackPressed = false;
    this.heavyPressed = false;
    this.dodgePressed = false;
    this.interactPressed = false;
    this.camYawDelta = 0;
    this.camPitchDelta = 0;
    this.camZoomDelta = 0;

    this._joyTouchId = null;
    this._camTouchId = null;
    this._camLastX = 0;
    this._camLastY = 0;
    this._pinchDist = 0;

    this._buildUI();
    this._bindTouch();
  }

  _buildUI() {
    this.root = document.createElement('div');
    this.root.id = 'touch-controls';
    this.root.className = this.visible ? 'touch-layer' : 'touch-layer hidden';
    this.root.innerHTML = `
      <div class="touch-joy-zone" id="touch-joy-zone">
        <div class="touch-joy-base" id="touch-joy-base">
          <div class="touch-joy-knob" id="touch-joy-knob"></div>
        </div>
      </div>
      <div class="touch-actions">
        <button class="touch-btn touch-interact hidden" id="tbtn-interact" type="button">✦ Interact</button>
        <div class="touch-cluster">
          <button class="touch-btn touch-sm" id="tbtn-stealth" type="button">Stealth</button>
          <button class="touch-btn touch-sm" id="tbtn-heavy" type="button">Heavy</button>
          <button class="touch-btn touch-sm" id="tbtn-dodge" type="button">Dodge</button>
          <button class="touch-btn touch-sm" id="tbtn-guard" type="button">Shield</button>
          <button class="touch-btn touch-lg touch-attack" id="tbtn-attack" type="button">Strike</button>
          <button class="touch-btn touch-lg touch-jump" id="tbtn-jump" type="button">Jump / Glide</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.root);

    this.joyZone = this.root.querySelector('#touch-joy-zone');
    this.joyKnob = this.root.querySelector('#touch-joy-knob');
    this.interactBtn = this.root.querySelector('#tbtn-interact');

    const bindTap = (id, fn) => {
      const el = this.root.querySelector(id);
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fn(true);
      });
      el.addEventListener('pointerup', () => fn(false));
      el.addEventListener('pointercancel', () => fn(false));
    };

    bindTap('#tbtn-attack', (d) => { if (d) this.attackPressed = true; });
    bindTap('#tbtn-heavy', (d) => { if (d) this.heavyPressed = true; });
    bindTap('#tbtn-dodge', (d) => { if (d) this.dodgePressed = true; this.dive = d; });
    bindTap('#tbtn-stealth', (d) => { if (d) this.stealthToggle = true; });
    bindTap('#tbtn-jump', (d) => { this.jump = d; });
    bindTap('#tbtn-guard', (d) => { this.guard = d; });
    bindTap('#tbtn-interact', (d) => { if (d) this.interactPressed = true; });
  }

  _bindTouch() {
    const maxR = 46;
    const updateJoy = (clientX, clientY) => {
      const rect = this.joyZone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const d = Math.hypot(dx, dy);
      const clamped = Math.min(d, maxR);
      const nx = d > 1 ? (dx / d) * (clamped / maxR) : 0;
      const ny = d > 1 ? (dy / d) * (clamped / maxR) : 0;
      this.moveX = nx;
      this.moveY = -ny;
      this.sprint = clamped >= maxR * 0.86;
      this.joyKnob.style.transform = `translate(${nx * maxR}px, ${ny * maxR}px)`;
    };

    const resetJoy = () => {
      this._joyTouchId = null;
      this.moveX = 0;
      this.moveY = 0;
      this.sprint = false;
      this.joyKnob.style.transform = 'translate(0px, 0px)';
    };

    this.joyZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this._joyTouchId = e.pointerId;
      this.joyZone.setPointerCapture(e.pointerId);
      updateJoy(e.clientX, e.clientY);
    });
    this.joyZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this._joyTouchId) return;
      updateJoy(e.clientX, e.clientY);
    });
    this.joyZone.addEventListener('pointerup', (e) => {
      if (e.pointerId === this._joyTouchId) resetJoy();
    });
    this.joyZone.addEventListener('pointercancel', resetJoy);

    // Canvas swipe-to-rotate camera + 2-finger pinch zoom
    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          this._camTouchId = e.touches[0].identifier;
          this._camLastX = e.touches[0].clientX;
          this._camLastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          this._pinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      },
      { passive: true }
    );

    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 1 && e.touches[0].identifier === this._camTouchId) {
          const dx = e.touches[0].clientX - this._camLastX;
          const dy = e.touches[0].clientY - this._camLastY;
          this._camLastX = e.touches[0].clientX;
          this._camLastY = e.touches[0].clientY;
          this.camYawDelta += dx * 0.008;
          this.camPitchDelta += dy * 0.006;
        } else if (e.touches.length === 2) {
          const d = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          if (this._pinchDist > 0) {
            this.camZoomDelta += (this._pinchDist - d) * 0.06;
          }
          this._pinchDist = d;
        }
      },
      { passive: true }
    );

    this.canvas.addEventListener('touchend', () => {
      this._pinchDist = 0;
    });
  }

  setVisible(flag) {
    this.visible = Boolean(flag);
    this.root.classList.toggle('hidden', !this.visible);
  }

  setInteractPrompt(target) {
    if (!this.visible) return;
    if (target) {
      this.interactBtn.textContent = `✦ ${target.label}`;
      this.interactBtn.classList.remove('hidden');
    } else {
      this.interactBtn.classList.add('hidden');
    }
  }

  sample() {
    const out = {
      moveX: this.moveX,
      moveY: this.moveY,
      sprint: this.sprint,
      jump: this.jump,
      guard: this.guard,
      dive: this.dive,
      stealthToggle: this.stealthToggle,
      attackPressed: this.attackPressed,
      heavyPressed: this.heavyPressed,
      dodgePressed: this.dodgePressed,
      interactPressed: this.interactPressed,
      camYawDelta: this.camYawDelta,
      camPitchDelta: this.camPitchDelta,
      camZoomDelta: this.camZoomDelta,
    };
    this.attackPressed = false;
    this.heavyPressed = false;
    this.dodgePressed = false;
    this.interactPressed = false;
    this.stealthToggle = false;
    this.camYawDelta = 0;
    this.camPitchDelta = 0;
    this.camZoomDelta = 0;
    return out;
  }
}
