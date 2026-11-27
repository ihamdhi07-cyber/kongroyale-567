// Responsive 3D Traversal & Physics Controller:
// Walking, Running, Sprinting, Stealth Crouch, Jumping, Spirit Glider (+ updrafts), Steep-Slope Climbing,
// Surface Swimming & Underwater Diving (with Breath gauge), Sailing Delegation, Interior Room Movement,
// Dodge Roll with i-frames, Static Obstacle Collision, Bridge Deck Support, and Frontier Boundary Guidance.
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
    this.stealthSpeed = 3.2;
    this.sprintSpeed = 10.6;
    this.swimSpeed = 4.9;
    this.climbSpeed = 4.2;
    this.glideForwardSpeed = 11.4;
    this.gravity = 26;
    this.jumpSpeed = 11.2;

    this.dodgeTimer = 0;
    this.dodgeCooldown = 0;
    this.dodgeDir = new THREE.Vector3();
    this._jumpWasPressed = false;
    this._stepTimer = 0;
    this._bubbleTimer = 0;
    this._normalTmp = { x: 0, y: 1, z: 0 };
    this._boundaryWarnCooldown = 0;
  }

  teleport(x, z) {
    if (this.world.interiors?.currentInterior) {
      this.world.interiors.currentInterior = null;
      this.camera.setIndoorMode(false);
    }
    if (this.world.boats?.activeBoat) {
      this.world.boats.activeBoat = null;
      this.player.sailing = false;
    }
    const h = this._groundHeightAt(x, z);
    this.player.root.position.set(x, Math.max(h, WORLD_CONFIG.SEA_LEVEL + 0.2), z);
    this.player.velocity.set(0, 0, 0);
    this.player.grounded = true;
    this.player.gliding = false;
    this.player.diving = false;
    if (this.camera) {
      this.camera.cinematic = null;
      this.camera.initialized = false;
    }
  }

  /** Accounts for the Silver River arched stone bridge & Tidehaven Harbor Pier */
  _groundHeightAt(x, z) {
    if (this.world.interiors?.currentInterior) {
      return this.world.interiors.currentInterior.roomY;
    }
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
    // Tidehaven Harbor Pier around (1194, 1170)
    if (Math.hypot(x - 1194, z - 1170) < 14) {
      h = Math.max(h, 3.45);
    }
    return h;
  }

  update(dt, input) {
    const p = this.player;
    const pos = p.root.position;

    // Timers always tick
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.attackTimer > 0) p.attackTimer = Math.max(0, p.attackTimer - dt);
    if (p.heavyTimer > 0) p.heavyTimer = Math.max(0, p.heavyTimer - dt);
    if (p.hurtTimer > 0) p.hurtTimer = Math.max(0, p.hurtTimer - dt);
    if (p.interactTimer > 0) p.interactTimer = Math.max(0, p.interactTimer - dt);
    if (this.dodgeCooldown > 0) this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    if (this._boundaryWarnCooldown > 0) this._boundaryWarnCooldown -= dt;

    // When helming a sailboat, BoatSystem drives position & steering
    if (p.sailing) {
      p.breath = Math.min(p.maxBreath, p.breath + dt * 30);
      p.stamina = Math.min(p.maxStamina, p.stamina + dt * 20);
      return;
    }

    const inside = Boolean(this.world.interiors?.currentInterior);

    // Toggle Stealth Crouch cleanly
    if (input.stealthToggle && p.grounded && !p.swimming && !p.diving) {
      p.stealth = !p.stealth;
    }
    if (!p.grounded || p.swimming || input.sprint || p.attackTimer > 0 || p.heavyTimer > 0) {
      if (input.sprint || !p.grounded || p.swimming) p.stealth = false;
    }

    p.guarding = Boolean(input.guard && p.grounded && !p.swimming && !p.diving && p.attackTimer <= 0 && !p.dodging);

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

    // Trigger Dodge Roll (or break stealth cleanly)
    if (input.dodgePressed && this.dodgeCooldown <= 0 && p.stamina >= 18 && !p.swimming && !p.diving) {
      p.stamina = Math.max(0, p.stamina - 18);
      p.dodging = true;
      p.gliding = false;
      p.stealth = false;
      p.invulnTimer = 0.42;
      this.dodgeTimer = 0.36;
      this.dodgeCooldown = 0.72;
      if (moveMag > 0.1) {
        this.dodgeDir.set(moveX, 0, moveZ).normalize();
      } else {
        this.dodgeDir.set(Math.sin(p.facingYaw), 0, Math.cos(p.facingYaw));
      }
      this.world.particles?.emitBurst(pos, { count: 9, color: 0xe8dec6, speed: 3.2, spreadY: 1.4, life: 0.4 });
      this.events.emit('player:dodge');
    }

    // Terrain & Water / Underwater Diving Check
    const groundY = this._groundHeightAt(pos.x, pos.z);
    const waterY = WORLD_CONFIG.SEA_LEVEL;
    const waterDepth = inside ? 0 : waterY - groundY;
    const inWater = !inside && waterDepth > 1.15 && pos.y <= waterY + 0.15;
    p.swimming = inWater;

    // Underwater Diving: hold Dive (C / Shift / Stealth) in deep water to descend to seabed treasures!
    if (inWater && waterDepth > 2.2 && input.dive && p.breath > 8) {
      p.diving = true;
    } else if (!inWater || input.jump || p.breath <= 2) {
      p.diving = false;
    }

    if (p.diving) {
      p.breath = Math.max(0, p.breath - dt * 11.5);
      this._bubbleTimer -= dt;
      if (this._bubbleTimer <= 0) {
        this._bubbleTimer = 0.24;
        this.world.particles?.emitBurst(
          { x: pos.x, y: pos.y + 1.2, z: pos.z },
          { count: 3, color: 0xbaf8ff, speed: 0.7, spreadY: 2.2, life: 0.8, gravity: -3.2 }
        );
      }
    } else {
      p.breath = Math.min(p.maxBreath, p.breath + dt * 32);
    }

    // Slope steepness check (allows climbing steep Highland cliffs)
    if (!inside) {
      this.world.terrain.getNormal(pos.x, pos.z, this._normalTmp);
    } else {
      this._normalTmp.y = 1;
    }
    const slopeNormalY = this._normalTmp.y;
    const isSteep = !inside && slopeNormalY < 0.72 && !p.swimming && p.grounded && moveMag > 0.15;
    p.climbing = isSteep && p.stamina > 2;

    // Jump & Mid-air Spirit Glider toggle
    const jumpEdge = input.jump && !this._jumpWasPressed;
    this._jumpWasPressed = input.jump;

    if (jumpEdge && !p.diving) {
      if (p.grounded || p.swimming) {
        const jumpPower = p.mounted ? this.jumpSpeed * 1.24 : p.swimming ? this.jumpSpeed * 0.75 : this.jumpSpeed;
        p.velocity.y = jumpPower;
        p.grounded = false;
        p.swimming = false;
        p.gliding = false;
        p.stealth = false;
        this.events.emit('player:jump');
      } else if (!inside && !p.mounted && !p.gliding && p.stamina > 8) {
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
      const wantsSprint = input.sprint && moveMag > 0.25 && p.stamina > 1 && !p.guarding && !p.diving;
      let targetSpeed = this.walkSpeed;
      if (p.mounted) targetSpeed = wantsSprint ? 17.6 : 12.2;
      else if (p.gliding) targetSpeed = this.glideForwardSpeed;
      else if (p.diving) targetSpeed = this.swimSpeed * 0.9;
      else if (p.swimming) targetSpeed = this.swimSpeed;
      else if (p.climbing) targetSpeed = this.climbSpeed;
      else if (p.guarding) targetSpeed = 2.6;
      else if (p.stealth) targetSpeed = this.stealthSpeed;
      else if (wantsSprint) targetSpeed = this.sprintSpeed;

      targetSpeed *= p.speedMultiplier;
      if (p.attackTimer > 0 || p.heavyTimer > 0) targetSpeed *= 0.45;

      const accel = p.grounded ? 16 : p.gliding ? 5.5 : 8.5;
      p.velocity.x += (moveX * targetSpeed - p.velocity.x) * Math.min(1, dt * accel);
      p.velocity.z += (moveZ * targetSpeed - p.velocity.z) * Math.min(1, dt * accel);

      if (moveMag > 0.12) {
        const targetYaw = Math.atan2(moveX, moveZ);
        let diff = targetYaw - p.facingYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        p.facingYaw += diff * Math.min(1, dt * 13);
      }

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

    // Vertical physics (gravity, swimming buoyancy, underwater dive, Spirit Glider + updrafts)
    if (p.diving) {
      const seabedY = groundY + 0.65;
      const targetDiveY = Math.max(seabedY, waterY - 4.2);
      p.velocity.y += (targetDiveY - pos.y) * dt * 6;
      p.velocity.y *= 0.85;
      pos.y = Math.max(seabedY, pos.y + p.velocity.y * dt);
      p.grounded = false;
    } else if (p.swimming) {
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
        p.velocity.y = Math.max(-3.1, p.velocity.y - this.gravity * 0.25 * dt);
      }
      pos.y += p.velocity.y * dt;
    } else {
      p.velocity.y -= this.gravity * dt;
      pos.y += p.velocity.y * dt;
    }

    // Horizontal integration + collision
    pos.x += p.velocity.x * dt;
    pos.z += p.velocity.z * dt;

    if (inside) {
      this.world.interiors.constrainPlayer(pos);
      p.velocity.y = 0;
      p.grounded = true;
    } else {
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

      // Playable 8x8 km frontier perimeter guard
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
      if (!p.swimming && !p.diving) {
        if (pos.y <= newGroundY + 0.08 && p.velocity.y <= 0.5) {
          if (!p.grounded && p.velocity.y < -12) {
            this.events.emit('player:land', { impact: -p.velocity.y });
            this.world.particles?.emitBurst(pos, { count: 10, color: 0xe6dec2, speed: 3.6, spreadY: 1.6, life: 0.45 });
          }
          pos.y = newGroundY;
          p.velocity.y = 0;
          p.grounded = true;
          p.gliding = false;
        } else if (pos.y > newGroundY + 0.4) {
          p.grounded = false;
        }
      }
    }

    p.visual.rotation.y = p.facingYaw;
    p.horizontalSpeed = Math.hypot(p.velocity.x, p.velocity.z);

    // Warmth survival rhythm (Frostcrest Coat resists Highland snow chill; indoors warms up!)
    if (inside) {
      p.warmth = Math.min(p.maxWarmth, p.warmth + dt * 4.5);
    } else {
      const resist = Math.max(0.2, 1 - (p.warmthBonus || 0) / 80);
      const coldRate = (this.world.weather.weather === 'snow' ? 0.58 : 0.13) * resist;
      p.warmth = Math.max(0, p.warmth - dt * coldRate);
    }
    if (p.warmth > 50 && p.hp < p.maxHp && p.hurtTimer <= 0) {
      p.hp = Math.min(p.maxHp, p.hp + dt * 0.75);
    }

    // Surface-aware footstep audio triggers (suppressed while sneaking in stealth)
    if (p.grounded && p.horizontalSpeed > 1.2 && !p.dodging && !p.stealth) {
      this._stepTimer -= dt * (p.horizontalSpeed / 5.5);
      if (this._stepTimer <= 0) {
        this._stepTimer = 0.42;
        const surface = inside ? 'stone' : this.world.terrain.getSurfaceType(pos.x, pos.z);
        this.events.emit('player:step', { surface });
      }
    }
  }
}
