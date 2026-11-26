// Procedural Skeletal Animation State Machine for the Wayfarer protagonist.
// Smoothly blends idle breathing, walk/run stride cycles, jumping, climbing, swimming,
// Spirit Glider deployment, dodge roll, light/heavy staff attacks, shield guard, and hurt recoil.
import { lerp } from '../world/Noise.js';

export class PlayerAnimation {
  constructor(player) {
    this.player = player;
    this.cycle = 0;
  }

  update(dt, elapsed) {
    const p = this.player;
    const parts = p.parts;
    const blend = Math.min(1, dt * 14);

    // Determine primary animation state
    let state = 'idle';
    if (p.hurtTimer > 0) state = 'hurt';
    else if (p.heavyTimer > 0) state = 'heavy';
    else if (p.attackTimer > 0) state = 'attack';
    else if (p.dodging) state = 'dodge';
    else if (p.gliding) state = 'glide';
    else if (p.swimming) state = 'swim';
    else if (p.climbing) state = 'climb';
    else if (!p.grounded) state = p.velocity.y > 0.5 ? 'jump' : 'fall';
    else if (p.guarding) state = 'guard';
    else if (p.interactTimer > 0) state = 'interact';
    else if (p.horizontalSpeed > 6.2) state = 'run';
    else if (p.horizontalSpeed > 0.45) state = 'walk';
    p.state = state;

    // Advance locomotion phase proportionally to movement speed (prevents foot sliding!)
    const strideFreq = state === 'run' ? 11.5 : state === 'walk' ? 7.8 : state === 'swim' ? 6.5 : 4.0;
    this.cycle += dt * strideFreq * (state === 'idle' ? 0.5 : 1);

    // Target joint angles
    let lLegX = 0, rLegX = 0;
    let lArmX = 0, rArmX = 0, lArmZ = 0.08, rArmZ = -0.08;
    let torsoX = 0, torsoY = 0, hipsY = 0.88;
    let visualSpinX = 0;
    let scarfX = 0.35 + Math.min(0.9, p.horizontalSpeed * 0.08) + Math.sin(elapsed * 5.2) * 0.14;

    if (state === 'idle') {
      hipsY = 0.88 + Math.sin(elapsed * 2.2) * 0.025;
      lArmX = Math.sin(elapsed * 1.8) * 0.05;
      rArmX = -0.15 + Math.cos(elapsed * 1.8) * 0.05;
    } else if (state === 'walk' || state === 'run') {
      const amp = state === 'run' ? 0.92 : 0.58;
      const s = Math.sin(this.cycle);
      lLegX = s * amp;
      rLegX = -s * amp;
      lArmX = -s * amp * 0.85;
      rArmX = s * amp * 0.55 - 0.25;
      torsoX = state === 'run' ? 0.22 : 0.09;
      hipsY = 0.88 + Math.abs(Math.cos(this.cycle)) * (state === 'run' ? 0.11 : 0.05);
    } else if (state === 'jump' || state === 'fall') {
      lLegX = state === 'jump' ? 0.45 : -0.2;
      rLegX = state === 'jump' ? -0.35 : 0.32;
      lArmZ = 0.55;
      rArmZ = -0.55;
      torsoX = state === 'jump' ? -0.08 : 0.12;
    } else if (state === 'glide') {
      lArmX = -2.65;
      rArmX = -2.65;
      lArmZ = 0.35;
      rArmZ = -0.35;
      lLegX = -0.25 + Math.sin(elapsed * 3.5) * 0.08;
      rLegX = -0.35 - Math.sin(elapsed * 3.5) * 0.08;
      torsoX = 0.32;
      scarfX = 1.25 + Math.sin(elapsed * 10) * 0.22;
    } else if (state === 'climb') {
      const s = Math.sin(this.cycle * 1.3);
      lArmX = -1.6 + s * 0.6;
      rArmX = -1.6 - s * 0.6;
      lLegX = -s * 0.65;
      rLegX = s * 0.65;
      torsoX = 0.25;
    } else if (state === 'swim') {
      const s = Math.sin(this.cycle);
      torsoX = 1.15;
      hipsY = 0.55;
      lArmX = -1.4 + s * 0.7;
      rArmX = -1.4 - s * 0.7;
      lLegX = s * 0.5;
      rLegX = -s * 0.5;
    } else if (state === 'dodge') {
      visualSpinX = 1.15;
      torsoX = 0.65;
      hipsY = 0.62;
    } else if (state === 'attack') {
      const t = 1 - p.attackTimer / 0.34;
      torsoY = lerp(-0.9, 1.1, t);
      rArmX = -1.35;
      rArmZ = lerp(-0.9, 0.8, t);
      lArmX = 0.35;
    } else if (state === 'heavy') {
      const t = 1 - p.heavyTimer / 0.58;
      torsoY = t * Math.PI * 2;
      rArmX = -1.45;
      rArmZ = -0.9;
      lArmZ = 0.9;
    } else if (state === 'guard') {
      rArmX = -1.1;
      lArmX = -1.0;
      torsoX = -0.05;
    } else if (state === 'interact') {
      torsoX = 0.28;
      lArmX = -0.75;
    } else if (state === 'hurt') {
      torsoX = -0.35;
      lArmZ = 0.6;
      rArmZ = -0.6;
    }

    parts.leftLeg.rotation.x = lerp(parts.leftLeg.rotation.x, lLegX, blend);
    parts.rightLeg.rotation.x = lerp(parts.rightLeg.rotation.x, rLegX, blend);
    parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, lArmX, blend);
    parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, rArmX, blend);
    parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, lArmZ, blend);
    parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, rArmZ, blend);
    parts.torso.rotation.x = lerp(parts.torso.rotation.x, torsoX, blend);
    parts.torso.rotation.y = state === 'heavy' ? torsoY : lerp(parts.torso.rotation.y, torsoY, blend);
    parts.hips.position.y = lerp(parts.hips.position.y, hipsY, blend);
    parts.scarfTail.rotation.x = lerp(parts.scarfTail.rotation.x, scarfX, blend);
    p.visual.rotation.x = lerp(p.visual.rotation.x, visualSpinX, blend);

    // Toggle Spirit Glider, Shield Ward & Attack Slash Arc VFX
    parts.glider.visible = p.gliding;
    p.shieldMesh.visible = p.guarding;
    if (p.guarding) {
      p.shieldMesh.rotation.y += dt * 1.4;
    }

    if (p.attackTimer > 0 || p.heavyTimer > 0) {
      const isHeavy = p.heavyTimer > 0;
      const ratio = isHeavy ? p.heavyTimer / 0.58 : p.attackTimer / 0.34;
      p.slashMat.opacity = Math.sin(ratio * Math.PI) * 0.85;
      const sc = isHeavy ? 1.85 : 1.05;
      p.slashMesh.scale.set(sc, 1, sc);
      p.slashMesh.rotation.y = (1 - ratio) * (isHeavy ? Math.PI * 2.5 : 2.2) - 0.8;
    } else {
      p.slashMat.opacity = 0;
    }
  }
}
