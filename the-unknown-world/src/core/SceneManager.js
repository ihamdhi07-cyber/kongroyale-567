// Scene graph & lighting rig with warm golden sun + cool periwinkle sky hemisphere bounce
// and a player-tracking directional shadow frustum for crisp painterly shadows across the 8x8 km world.
import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8bcbe6);
    this.scene.fog = new THREE.FogExp2(0xc7e4ea, 0.00145);

    // Warm sunlit sky + cool mossy-periwinkle ground bounce (signature watercolor palette)
    this.hemiLight = new THREE.HemisphereLight(0xaad9f8, 0x5c7258, 0.92);
    this.scene.add(this.hemiLight);

    // Main directional sun / moon light
    this.sunLight = new THREE.DirectionalLight(0xfff0ce, 2.25);
    this.sunLight.position.set(120, 165, 95);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 420;
    const d = 110;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.04;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Soft cool violet-blue fill rim from opposite sun direction (keeps shaded sides luminous like gouache)
    this.fillLight = new THREE.DirectionalLight(0x88a8e8, 0.42);
    this.fillLight.position.set(-90, 55, -80);
    this.scene.add(this.fillLight);

    this.sunDir = new THREE.Vector3(0.55, 0.72, 0.42).normalize();
  }

  applyQuality(preset) {
    this.sunLight.castShadow = preset.shadows;
    if (preset.shadows && this.sunLight.shadow.mapSize.x !== preset.shadowMapSize) {
      this.sunLight.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
      if (this.sunLight.shadow.map) {
        this.sunLight.shadow.map.dispose();
        this.sunLight.shadow.map = null;
      }
    }
  }

  /** Keeps directional shadow frustum texel-snapped around the player so shadows never shimmer */
  updateShadowAnchor(playerPos) {
    const snap = 4;
    const ax = Math.round(playerPos.x / snap) * snap;
    const az = Math.round(playerPos.z / snap) * snap;
    const ay = playerPos.y;
    this.sunLight.target.position.set(ax, ay, az);
    this.sunLight.position.set(
      ax + this.sunDir.x * 185,
      ay + Math.max(35, this.sunDir.y * 185),
      az + this.sunDir.z * 185
    );
    this.sunLight.target.updateMatrixWorld();
  }
}
