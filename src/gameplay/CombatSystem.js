// Small, optional encounter: stamina, directional attacks, dodging, defense and a leashed enemy.
export const GUARDIAN_HOME = Object.freeze({ x: 38, z: -48 });
export const DEFAULT_COMBAT = Object.freeze({
  health: 100,
  guardianHealth: 100,
});
export function validCombat(value) {
  return (
    !!value &&
    Number.isFinite(value.health) &&
    value.health > 0 &&
    value.health <= 100 &&
    Number.isFinite(value.guardianHealth) &&
    value.guardianHealth >= 0 &&
    value.guardianHealth <= 100
  );
}
export class CombatSystem {
  constructor(saved = DEFAULT_COMBAT) {
    this.health = saved.health;
    this.stamina = 100;
    this.guardianHealth = saved.guardianHealth;
    this.enemyX = GUARDIAN_HOME.x;
    this.enemyZ = GUARDIAN_HOME.z;
    this.attackCooldown = 0;
    this.enemyCooldown = 1;
    this.dodgeTime = 0;
    this.attackTime = 0;
    this.blocking = false;
  }
  attack(type, player, facing) {
    const heavy = type === "heavy";
    if (
      !["light", "heavy"].includes(type) ||
      this.attackCooldown > 0 ||
      this.dodgeTime > 0
    )
      return null;
    const cost = heavy ? 28 : 12;
    if (this.stamina < cost) return null;
    this.stamina -= cost;
    this.attackCooldown = heavy ? 1 : 0.5;
    this.attackTime = heavy ? 0.35 : 0.22;
    const dx = this.enemyX - player.x,
      dz = this.enemyZ - player.z,
      distance = Math.hypot(dx, dz);
    if (
      this.guardianHealth <= 0 ||
      distance > (heavy ? 4 : 3.4) ||
      distance < 0.001 ||
      (dx * Math.sin(facing) + dz * Math.cos(facing)) / distance < 0.2
    )
      return { hit: false };
    this.guardianHealth = Math.max(0, this.guardianHealth - (heavy ? 50 : 25));
    return { hit: true, defeated: this.guardianHealth === 0 };
  }
  dodge() {
    if (this.dodgeTime > 0 || this.stamina < 25) return false;
    this.stamina -= 25;
    this.dodgeTime = 0.4;
    return true;
  }
  update(dt, player, block) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.attackTime = Math.max(0, this.attackTime - dt);
    this.dodgeTime = Math.max(0, this.dodgeTime - dt);
    this.blocking = block && this.stamina > 0 && this.dodgeTime === 0;
    this.stamina = Math.max(
      0,
      Math.min(100, this.stamina + (this.blocking ? -12 : 18) * dt),
    );
    if (this.guardianHealth <= 0) return null;
    this.enemyCooldown = Math.max(0, this.enemyCooldown - dt);
    let dx = player.x - this.enemyX,
      dz = player.z - this.enemyZ,
      distance = Math.hypot(dx, dz);
    const playerFromHome = Math.hypot(
      player.x - GUARDIAN_HOME.x,
      player.z - GUARDIAN_HOME.z,
    );
    if (playerFromHome > 24) {
      dx = GUARDIAN_HOME.x - this.enemyX;
      dz = GUARDIAN_HOME.z - this.enemyZ;
      distance = Math.hypot(dx, dz);
      if (distance > 0.1) {
        this.enemyX += (dx / distance) * Math.min(distance, 3 * dt);
        this.enemyZ += (dz / distance) * Math.min(distance, 3 * dt);
      }
      return null;
    }
    if (distance < 15 && distance > 2.5) {
      this.enemyX += (dx / distance) * Math.min(distance - 2.5, 2.8 * dt);
      this.enemyZ += (dz / distance) * Math.min(distance - 2.5, 2.8 * dt);
    }
    if (distance <= 3 && this.enemyCooldown === 0) {
      this.enemyCooldown = 1.5;
      if (this.dodgeTime > 0) return { type: "dodged" };
      const damage = this.blocking ? 5 : 20;
      this.health = Math.max(0, this.health - damage);
      if (this.health === 0) {
        this.health = 100;
        this.stamina = 100;
        this.guardianHealth = 100;
        this.enemyX = GUARDIAN_HOME.x;
        this.enemyZ = GUARDIAN_HOME.z;
        return { type: "respawn" };
      }
      return { type: "hurt", damage };
    }
    return null;
  }
  snapshot() {
    return { health: this.health, guardianHealth: this.guardianHealth };
  }
}
