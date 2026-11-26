// Responsive 3D Traversal & Physics Controller:
// Walking, Running, Sprinting, Jumping, Spirit Glider (+ updrafts), Steep-Slope Climbing,
// Swimming, Dodge Roll with i-frames, Static Obstacle Collision, Bridge Deck Support,
// and World Frontier Boundary Guidance.
import * as THREE from 'three';
import { WORLD_CONFIG } from '../world/WorldSpec.js';
import { clamp } from '../world/Noise.js';

export class PlayerController {
  constructor(player, world, cameraController, eventBus) {
    this.player = player;
    this.world = world;
    this.camera = cameraController;
    this.events = eventBus;

    this.walkSpeed = 6.2;
    this.sprintSpeed = 10.6;
    this.swimSpeed = 4.8;
    this.climbSpeed = 4.2;
    this.glideForwardSpeed = 11.4;
    this.gravity = 26;
    this.jumpSpeed = 11.2;

    this.dodgeTimer = 0;
    this.dodgeCooldown = 0;
    this.dodgeDir = new THREE.Vector3();
    this._jumpWasPressed = false;
    this._stepTimer = 0;
    this._normalTmp = { x: 0, y: 1, z: 0 };
    this._boundaryWarnCooldown = 0;
  }

  teleport(x, z) {
    const h = this._groundHeightAt(x, z);
    this.player.root.position.set(x, Math.max(h, WORLD_CONFIG.SEA_LEVEL + 0.2), z);
    this.player.velocity.set(0, 0, 0);
    this.player.grounded = true;
    this.player.gliding = false;
  }

  /** Accounts for the Silver River arched stone bridge deck so player walks cleanly across it */
  _groundHeightAt(x, z) {
    let h = this.world.terrain.getHeight(x, z);
    // Silver River Bridge at (80, 361), length 26m, width 6.2m, yaw 0.22
    const dx = x - 80;
    const dz = z - 361;
    if (Math.abs(dx) < 16 && Math.abs(dz) < 8) {
      const cos = Math.cos(-0.22);
      const sin = Math.sin(-0.22);
      const lx = dx * cos - dz * sin;
      const lz = dx * sin + dz * cos;
      if (Math.abs(lx) <= 13.5 && Math.abs(lz) <= 3.1) {
        h = Math.max(h, 2.28);
      }
    }
    return h;
  }

  update(dt, input) {
    const p = this.player;
    const pos = p.root.position;

    // Timers
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.attackTimer > 0) p.attackTimer = Math.max(0, p.attackTimer - dt);
    if (p.heavyTimer > 0) p.heavyTimer = Math.max(0, p.heavyTimer - dt);
    if (p.hurtTimer > 0) p.hurtTimer = Math.max(0, p.hurtTimer - dt);
    if (p.interactTimer > 0) p.interactTimer = Math.max(0, p.interactTimer - dt);
    if (this.dodgeCooldown > 0) this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    if (this._boundaryWarnCooldown > 0) this._boundaryWarnCooldown -= dt;

    p.guarding = Boolean(input.guard && p.grounded && !p.swimming && p.attackTimer <= 0 && !p.dodging);

    // Camera-relative movement direction
    const camYaw = this.camera.yaw;
    const forwardX = -Math.sin(camYaw);
    const forwardZ = -Math.cos(camYaw);
    const rightX = Math.cos(camYaw);
    const rightZ = -Math.sin(camYaw);

    let moveX = rightX * input.moveX + forwardX * input.moveY;
    let moveZ = rightZ * input.moveX + forwardZ * input.moveY;
    const moveMag = Math.hypot(moveX, moveZ);
    if (moveMag > 1e-4) {
      const clamped = Math.min(1, moveMag);
      moveX = (moveX / moveMag) * clamped;
      moveZ = (moveZ / moveMag) * clamped;
    }

    // Trigger Dodge Roll
    if (input.dodgePressed && this.dodgeCooldown <= 0 && p.stamina >= 18 && !p.swimming) {
      p.stamina = Math.max(0, p.stamina - 18);
      p.dodging = true;
      p.gliding = false;
      p.invulnTimer = 0.42;
      this.dodgeTimer = 0.36;
      this.dodgeCooldown = 0.72;
      if (moveMag > 0.1) {
        this.dodgeDir.set(moveX, 0, moveZ).normalize();
      } else {
        this.dodgeDir.set(Math.sin(p.facingYaw), 0, Math.cos(p.facingYaw));
      }
      this.events.emit('player:dodge');
    }

    // Terrain & Water check
    const groundY = this._groundHeightAt(pos.x, pos.z);
    const waterY = WORLD_CONFIG.SEA_LEVEL;
    const waterDepth = waterY - groundY;
    p.swimming = waterDepth > 1.15 && pos.y <= waterY + 0.15;

    // Slope steepness check (allows climbing steep Highland cliffs)
    this.world.terrain.getNormal(pos.x, pos.z, this._normalTmp);
    const slopeNormalY = this._normalTmp.y;
    const isSteep = slopeNormalY < 0.72 && !p.swimming && p.grounded && moveMag > 0.15;
    p.climbing = isSteep && p.stamina > 2;

    // Jump & Mid-air Spirit Glider toggle
    const jumpEdge = input.jump && !this._jumpWasPressed;
    this._jumpWasPressed = input.jump;

    if (jumpEdge) {
      if (p.grounded || p.swimming) {
        p.velocity.y = p.swimming ? this.jumpSpeed * 0.75 : this.jumpSpeed;
        p.grounded = false;
        p.swimming = false;
        p.gliding = false;
        this.events.emit('player:jump');
      } else if (!p.gliding && p.stamina > 8) {
        p.gliding = true;
        if (p.velocity.y < -2) p.velocity.y = -2;
        this.events.emit('player:glideStart');
      } else if (p.gliding) {
        p.gliding = false;
      }
    }

    // Compute horizontal velocity
    if (this.dodgeTimer > 0) {
      this.dodgeTimer -= dt;
      const dodgeSpeed = 14.2;
      p.velocity.x = this.dodgeDir.x * dodgeSpeed;
      p.velocity.z = this.dodgeDir.z * dodgeSpeed;
      p.facingYaw = Math.atan2(this.dodgeDir.x, this.dodgeDir.z);
      if (this.dodgeTimer <= 0) p.dodging = false;
    } else {
      const wantsSprint = input.sprint && moveMag > 0.25 && p.stamina > 1 && !p.guarding;
      let targetSpeed = this.walkSpeed;
      if (p.gliding) targetSpeed = this.glideForwardSpeed;
      else if (p.swimming) targetSpeed = this.swimSpeed;
      else if (p.climbing) targetSpeed = this.climbSpeed;
      else if (p.guarding) targetSpeed = 2.6;
      else if (wantsSprint) targetSpeed = this.sprintSpeed;

      targetSpeed *= p.speedMultiplier;

      // Slight attack lunge slow-down
      if (p.attackTimer > 0 || p.heavyTimer > 0) targetSpeed *= 0.45;

      const accel = p.grounded ? 16 : p.gliding ? 5.5 : 8.5;
      p.velocity.x += (moveX * targetSpeed - p.velocity.x) * Math.min(1, dt * accel);
      p.velocity.z += (moveZ * targetSpeed - p.velocity.z) * Math.min(1, dt * accel);

      // Smoothly orient character toward movement direction
      if (moveMag > 0.12) {
        const targetYaw = Math.atan2(moveX, moveZ);
        let diff = targetYaw - p.facingYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        p.facingYaw += diff * Math.min(1, dt * 13);
      }

      // Stamina consumption / recovery
      if (p.gliding) {
        p.stamina = Math.max(0, p.stamina - dt * 9.5 * p.glideEfficiency);
        if (p.stamina <= 0.5) p.gliding = false;
      } else if (p.climbing) {
        p.stamina = Math.max(0, p.stamina - dt * 13);
      } else if (wantsSprint) {
        p.stamina = Math.max(0, p.stamina - dt * 15);
      } else {
        const regen = p.guarding ? 8 : 22;
        p.stamina = Math.min(p.maxStamina, p.stamina + dt * regen);
      }
    }

    // Vertical physics (gravity, swimming buoyancy, Spirit Glider lift + Shattered Expanse updrafts)
    if (p.swimming) {
      const targetY = waterY - 0.55;
      p.velocity.y += (targetY - pos.y) * dt * 12;
      p.velocity.y *= 0.85;
      pos.y += p.velocity.y * dt;
      p.grounded = false;
      p.gliding = false;
    } else if (p.gliding) {
      const updraft = this.world.getUpdraftLiftAt(pos);
      if (updraft > 0) {
        p.velocity.y = Math.min(updraft * 0.65, p.velocity.y + updraft * dt);
      } else {
        // Smooth gentle glider sink
        p.velocity.y = Math.max(-3.1, p.velocity.y - this.gravity * 0.25 * dt);
      }
      pos.y += p.velocity.y * dt;
    } else {
      p.velocity.y -= this.gravity * dt;
      pos.y += p.velocity.y * dt;
    }

    // Horizontal integration + tree/rock/building static obstacle collision
    pos.x += p.velocity.x * dt;
    pos.z += p.velocity.z * dt;

    const playerRadius = 0.55;
    const colliders = this.world.getNearbyColliders(pos.x, pos.z, 8);
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      const dx = pos.x - c.x;
      const dz = pos.z - c.z;
      const minD = playerRadius + c.r;
      const d2 = dx * dx + dz * dz;
      if (d2 < minD * minD && d2 > 1e-6) {
        const d = Math.sqrt(d2);
        const push = minD - d;
        pos.x += (dx / d) * push;
        pos.z += (dz / d) * push;
      }
    }

    // Playable 8x8 km frontier perimeter guard (reserving the outer 15x15 km expansion cleanly)
    const limit = WORLD_CONFIG.PLAYABLE_HALF_M - 30;
    if (Math.abs(pos.x) > limit || Math.abs(pos.z) > limit) {
      pos.x = clamp(pos.x, -limit, limit);
      pos.z = clamp(pos.z, -limit, limit);
      if (this._boundaryWarnCooldown <= 0) {
        this._boundaryWarnCooldown = 6;
        this.events.emit('toast', {
          title: 'Outer Frontier Winds',
          text: 'The misty 15×15 km expansion frontiers lie beyond this ridge. Charted for future expeditions.',
        });
      }
    }

    // Ground snap & landing detection
    const newGroundY = this._groundHeightAt(pos.x, pos.z);
    if (!p.swimming) {
      if (pos.y <= newGroundY + 0.08 && p.velocity.y <= 0.5) {
        if (!p.grounded && p.velocity.y < -12) {
          this.events.emit('player:land', { impact: -p.velocity.y });
        }
        pos.y = newGroundY;
        p.velocity.y = 0;
        p.grounded = true;
        p.gliding = false;
      } else if (pos.y > newGroundY + 0.4) {
        p.grounded = false;
      }
    }

    p.visual.rotation.y = p.facingYaw;
    p.horizontalSpeed = Math.hypot(p.velocity.x, p.velocity.z);

    // Gentle warmth/nourishment survival rhythm (cools faster in Highland Reach snow, never punitive)
    const coldRate = this.world.weather.weather === 'snow' ? 0.55 : 0.14;
    p.warmth = Math.max(0, p.warmth - dt * coldRate);
    if (p.warmth > 50 && p.hp < p.maxHp && p.hurtTimer <= 0) {
      p.hp = Math.min(p.maxHp, p.hp + dt * 0.75);
    }

    // Surface-aware footstep audio triggers
    if (p.grounded && p.horizontalSpeed > 1.2 && !p.dodging) {
      this._stepTimer -= dt * (p.horizontalSpeed / 5.5);
      if (this._stepTimer <= 0) {
        this._stepTimer = 0.42;
        const surface = this.world.terrain.getSurfaceType(pos.x, pos.z);
        this.events.emit('player:step', { surface });
      }
    }
  }
}
