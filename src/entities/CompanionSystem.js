import * as THREE from 'three';

/**
 * Luma — Aelira's Floating Spirit Lantern Familiar.
 * Orbits gently beside Aelira's shoulder, illuminates caves/nighttime, and drifts
 * excitedly toward nearby undiscovered treasures, lore tablets, or Starfall shards!
 */
export class CompanionSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'LumaCompanion';

    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.19, 1),
      new THREE.MeshBasicMaterial({ color: 0xfff0aa })
    );
    this.core = core;
    this.group.add(core);

    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0x7ef2ff, transparent: true, opacity: 0.32 })
    );
    this.aura = aura;
    this.group.add(aura);

    // Expressive glowing spirit wing-ears
    const wingMat = new THREE.MeshBasicMaterial({ color: 0xffe48f, transparent: true, opacity: 0.82, side: THREE.DoubleSide });
    this.wingL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 4), wingMat);
    this.wingL.position.set(-0.22, 0.06, 0);
    this.wingL.rotation.z = 0.95;
    this.group.add(this.wingL);

    this.wingR = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 4), wingMat);
    this.wingR.position.set(0.22, 0.06, 0);
    this.wingR.rotation.z = -0.95;
    this.group.add(this.wingR);

    this.halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 10, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffe8a0,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.group.add(this.halo);

    this.position = new THREE.Vector3(4, 16, 398);
    this.group.position.copy(this.position);
    this.alertSecret = false;
    this.scene.add(this.group);
  }

  update(dt, elapsed, player, { timeOfDay = 0.39, isIndoors = false, secretTarget = null } = {}) {
    const pPos = player.root ? player.root.position : player.position;
    const rightX = Math.cos(player.facingYaw);
    const rightZ = -Math.sin(player.facingYaw);
    const backX = -Math.sin(player.facingYaw);
    const backZ = -Math.cos(player.facingYaw);

    const desired = new THREE.Vector3(
      pPos.x + rightX * 0.92 + backX * 0.52 + Math.cos(elapsed * 1.4) * 0.18,
      pPos.y + 2.15 + Math.sin(elapsed * 2.8) * 0.16,
      pPos.z + rightZ * 0.92 + backZ * 0.52 + Math.sin(elapsed * 1.4) * 0.18
    );

    this.alertSecret = false;
    if (secretTarget) {
      const dist = pPos.distanceTo(secretTarget);
      if (dist > 2.2 && dist < 24) {
        this.alertSecret = true;
        const dir = secretTarget.clone().sub(pPos).normalize();
        desired.copy(pPos).addScaledVector(dir, Math.min(3.4, dist * 0.45));
        desired.y = pPos.y + 2.25 + Math.sin(elapsed * 7.5) * 0.24;
      }
    }

    this.position.lerp(desired, Math.min(1, dt * 5.2));
    this.group.position.copy(this.position);
    this.core.rotation.y = elapsed * 2.4;
    this.wingL.rotation.z = 0.85 + Math.sin(elapsed * (this.alertSecret ? 14 : 6)) * 0.25;
    this.wingR.rotation.z = -0.85 - Math.sin(elapsed * (this.alertSecret ? 14 : 6)) * 0.25;

    // Brighten warmly at night or inside 3D sanctuaries
    const isNight = timeOfDay < 0.23 || timeOfDay > 0.77;
    this.halo.material.opacity = isIndoors ? 0.28 : isNight ? 0.32 : this.alertSecret ? 0.28 : 0.14;
    this.aura.material.color.setHex(this.alertSecret ? 0xffd76b : 0x7ef2ff);
    this.aura.scale.setScalar(0.95 + Math.sin(elapsed * (this.alertSecret ? 8 : 3)) * 0.14);
  }
}
