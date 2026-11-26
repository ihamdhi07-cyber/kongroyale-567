// Unified InputManager combining Desktop Keyboard/Mouse, Mobile TouchControls, and optional Gamepad API.
import { KeyboardControls } from './KeyboardControls.js';
import { TouchControls } from './TouchControls.js';

export class InputManager {
  constructor(canvas, eventBus) {
    this.keyboard = new KeyboardControls(canvas, eventBus);
    this.touch = new TouchControls(canvas);
    this.gameplayEnabled = false;
  }

  setGameplayEnabled(flag) {
    this.gameplayEnabled = Boolean(flag);
    this.keyboard.enabled = this.gameplayEnabled;
  }

  setTouchVisible(flag) {
    this.touch.setVisible(flag);
  }

  sample(dt) {
    const kb = this.keyboard.sample(dt);
    const tc = this.touch.sample();

    if (!this.gameplayEnabled) {
      return {
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
    }

    // Optional Gamepad support
    let gx = 0, gy = 0, gSprint = false, gJump = false, gYaw = 0, gPitch = 0;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads && pads[0];
    if (pad) {
      if (Math.abs(pad.axes[0]) > 0.16) gx = pad.axes[0];
      if (Math.abs(pad.axes[1]) > 0.16) gy = -pad.axes[1];
      if (Math.abs(pad.axes[2]) > 0.18) gYaw = pad.axes[2] * dt * 2.2;
      if (Math.abs(pad.axes[3]) > 0.18) gPitch = pad.axes[3] * dt * 1.4;
      gJump = Boolean(pad.buttons[0]?.pressed);
      gSprint = Boolean(pad.buttons[10]?.pressed || pad.buttons[7]?.pressed);
    }

    return {
      moveX: kb.moveX || tc.moveX || gx,
      moveY: kb.moveY || tc.moveY || gy,
      sprint: kb.sprint || tc.sprint || gSprint,
      jump: kb.jump || tc.jump || gJump,
      guard: kb.guard || tc.guard,
      dive: kb.dive || tc.dive,
      stealthToggle: kb.stealthToggle || tc.stealthToggle,
      attackPressed: kb.attackPressed || tc.attackPressed,
      heavyPressed: kb.heavyPressed || tc.heavyPressed,
      dodgePressed: kb.dodgePressed || tc.dodgePressed,
      interactPressed: kb.interactPressed || tc.interactPressed,
      camYawDelta: kb.camYawDelta + tc.camYawDelta + gYaw,
      camPitchDelta: kb.camPitchDelta + tc.camPitchDelta + gPitch,
      camZoomDelta: kb.camZoomDelta + tc.camZoomDelta,
    };
  }
}
