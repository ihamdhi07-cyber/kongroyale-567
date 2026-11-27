// Unified InputManager combining Desktop Keyboard/Mouse, Mobile TouchControls, and full HTML5 Gamepad API.
import { KeyboardControls } from './KeyboardControls.js';
import { TouchControls } from './TouchControls.js';
import { GamepadControls } from './GamepadControls.js';

export class InputManager {
  constructor(canvas, eventBus) {
    this.keyboard = new KeyboardControls(canvas, eventBus);
    this.touch = new TouchControls(canvas);
    this.gamepad = new GamepadControls(eventBus);
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
    const gp = this.gamepad.sample(dt);

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

    return {
      moveX: kb.moveX || tc.moveX || gp.moveX,
      moveY: kb.moveY || tc.moveY || gp.moveY,
      sprint: kb.sprint || tc.sprint || gp.sprint,
      jump: kb.jump || tc.jump || gp.jump,
      guard: kb.guard || tc.guard || gp.guard,
      dive: kb.dive || tc.dive || gp.dive,
      stealthToggle: kb.stealthToggle || tc.stealthToggle || gp.stealthToggle,
      attackPressed: kb.attackPressed || tc.attackPressed || gp.attackPressed,
      heavyPressed: kb.heavyPressed || tc.heavyPressed || gp.heavyPressed,
      dodgePressed: kb.dodgePressed || tc.dodgePressed || gp.dodgePressed,
      interactPressed: kb.interactPressed || tc.interactPressed || gp.interactPressed,
      camYawDelta: kb.camYawDelta + tc.camYawDelta + gp.camYawDelta,
      camPitchDelta: kb.camPitchDelta + tc.camPitchDelta + gp.camPitchDelta,
      camZoomDelta: kb.camZoomDelta + tc.camZoomDelta + gp.camZoomDelta,
    };
  }
}
