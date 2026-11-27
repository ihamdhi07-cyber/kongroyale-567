// Full HTML5 Standard Gamepad Controller Driver (Xbox / PlayStation / Switch Pro / Mobile Backbone).
// Edge-triggered button presses prevent rapid-fire bouncing; analog deadzones keep 360° movement silky smooth.
// Mapping:
//   Left Stick: Move · Right Stick: Orbit Camera
//   A/Cross (0): Jump / Glider · B/Circle (1): Dodge / Dive · X/Square (2): Light Attack · Y/Triangle (3): Interact
//   LB/L1 (4): Shield / Perfect Parry · RB/R1 (5): Heavy Strike · LT/L2 (6): Stealth · RT/R2 (7): Sprint / Gallop
//   Select (8): World Map · Start (9): Pause/Settings · L3 (10): Wind Stag · R3 (11): Guiding Wind
//   D-Pad Up/Right/Down/Left (12/15/13/14): Resonance Spells 1-4

export class GamepadControls {
  constructor(eventBus = null) {
    this.events = eventBus;
    this.connected = false;
    this.controllerName = '';
    this._prevButtons = [];
  }

  _justPressed(pad, idx) {
    const now = Boolean(pad.buttons[idx]?.pressed);
    const prev = Boolean(this._prevButtons[idx]);
    return now && !prev;
  }

  sample(dt) {
    const out = {
      moveX: 0,
      moveY: 0,
      sprint: false,
      jump: false,
      guard: false,
      dive: false,
      stealthToggle: false,
      attackPressed: false,
      heavyPressed: false,
      dodgePressed: false,
      interactPressed: false,
      camYawDelta: 0,
      camPitchDelta: 0,
      camZoomDelta: 0,
    };

    if (typeof navigator === 'undefined' || !navigator.getGamepads) return out;
    const pads = navigator.getGamepads();
    let pad = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i] && pads[i].connected) {
        pad = pads[i];
        break;
      }
    }

    if (!pad) {
      this.connected = false;
      this.controllerName = '';
      this._prevButtons.length = 0;
      return out;
    }

    this.connected = true;
    this.controllerName = pad.id || 'Standard Gamepad';

    // Analog sticks with smooth circular deadzone
    const lx = pad.axes[0] || 0;
    const ly = pad.axes[1] || 0;
    if (Math.hypot(lx, ly) > 0.16) {
      out.moveX = lx;
      out.moveY = -ly;
    }

    const rx = pad.axes[2] || 0;
    const ry = pad.axes[3] || 0;
    if (Math.abs(rx) > 0.18) out.camYawDelta = rx * dt * 2.4;
    if (Math.abs(ry) > 0.18) out.camPitchDelta = ry * dt * 1.5;

    // Continuous holds
    out.jump = Boolean(pad.buttons[0]?.pressed);
    out.dive = Boolean(pad.buttons[1]?.pressed);
    out.guard = Boolean(pad.buttons[4]?.pressed);
    out.sprint = Boolean(pad.buttons[7]?.pressed || (pad.buttons[7]?.value || 0) > 0.35);

    // Edge-triggered actions
    out.dodgePressed = this._justPressed(pad, 1);
    out.attackPressed = this._justPressed(pad, 2);
    out.interactPressed = this._justPressed(pad, 3);
    out.heavyPressed = this._justPressed(pad, 5);
    out.stealthToggle = this._justPressed(pad, 6);

    // Emit canonical UI / Magic / Mount / Wind hotkeys via EventBus
    if (this.events) {
      if (this._justPressed(pad, 8)) this.events.emit('ui:toggle', 'map');
      if (this._justPressed(pad, 9)) this.events.emit('ui:escape');
      if (this._justPressed(pad, 10)) this.events.emit('mount:toggle');
      if (this._justPressed(pad, 11)) this.events.emit('world:guidingWind');
      if (this._justPressed(pad, 12)) this.events.emit('magic:castKey', 0);
      if (this._justPressed(pad, 15)) this.events.emit('magic:castKey', 1);
      if (this._justPressed(pad, 13)) this.events.emit('magic:castKey', 2);
      if (this._justPressed(pad, 14)) this.events.emit('magic:castKey', 3);
    }

    // Store button states for next frame edge detection
    this._prevButtons = pad.buttons.map((b) => Boolean(b?.pressed));
    return out;
  }
}
