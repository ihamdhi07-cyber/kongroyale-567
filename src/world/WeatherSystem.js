// Dynamic Anime Watercolor Sky Dome, Painted Cumulus Clouds, Day/Night Cycle,
// 5 Weather States (Clear, Clouds, Mist, Rain, Snow), plus Sun-Motes & Dusk Fireflies.
import * as THREE from 'three';
import { WATERCOLOR_UNIFORMS } from './WatercolorShader.js';
import { clamp, lerp } from './Noise.js';

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPos;
}
`;

const SKY_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uZenith;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uNightFactor;
uniform float uTime;
varying vec3 vDir;

float hash31(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, 0.0, 1.0);

  // 3-stop anime watercolor sky wash
  vec3 sky = mix(uHorizon, uMid, smoothstep(0.0, 0.28, h));
  sky = mix(sky, uZenith, smoothstep(0.24, 0.85, h));

  // Warm sun disc & painterly atmospheric glow
  float sunCos = max(dot(d, normalize(uSunDir)), 0.0);
  float halo = pow(sunCos, 6.0) * 0.32 + pow(sunCos, 42.0) * 0.55;
  float disc = smoothstep(0.9972, 0.9988, sunCos);
  sky += uSunColor * (halo + disc * 1.4) * (1.0 - uNightFactor * 0.85);

  // Moon & gentle starfield at twilight / night
  if (uNightFactor > 0.05) {
    vec3 moonDir = normalize(vec3(-uSunDir.x, max(0.25, -uSunDir.y + 0.45), -uSunDir.z));
    float mCos = max(dot(d, moonDir), 0.0);
    float moonDisc = smoothstep(0.9985, 0.9993, mCos);
    float moonGlow = pow(mCos, 24.0) * 0.35;
    sky += vec3(0.84, 0.91, 1.0) * (moonDisc + moonGlow) * uNightFactor;

    vec3 starCell = floor(d * 185.0);
    float st = hash31(starCell);
    float twinkle = 0.65 + 0.35 * sin(uTime * 2.5 + st * 40.0);
    float starMask = smoothstep(0.9945, 0.999, st) * smoothstep(0.08, 0.35, h) * uNightFactor * twinkle;
    sky += vec3(0.95, 0.97, 1.0) * starMask * 1.25;
  }

  gl_FragColor = vec4(sky, 1.0);
}
`;

export const WEATHER_STATES = ['clear', 'clouds', 'mist', 'rain', 'snow'];

export class WeatherSystem {
  constructor(sceneManager, spriteMap = null) {
    this.sceneManager = sceneManager;
    this.scene = sceneManager.scene;
    this.spriteMap = spriteMap;

    // 0..24 hours (start at gorgeous late-morning golden sunlight 9.4h)
    this.timeOfDay = 9.4;
    this.daySpeed = 0.065; // ~6 minutes per full day-night cycle
    this.weather = 'clear';
    this._weatherTimer = 140;
    this.weatherOverride = null;

    this.state = {
      sunDir: new THREE.Vector3(0.55, 0.72, 0.42).normalize(),
      zenithColor: new THREE.Color(0x4b96d8),
      midColor: new THREE.Color(0x96d2ec),
      horizonColor: new THREE.Color(0xfce7bc),
      fogColor: new THREE.Color(0xc7e4ea),
      fogDensity: 0.00145,
      nightFactor: 0,
      weather: 'clear',
    };

    this._buildSkyDome();
    this._buildPaintedClouds();
    this._buildParticles();
  }

  _buildSkyDome() {
    this.skyUniforms = {
      uZenith: { value: this.state.zenithColor.clone() },
      uMid: { value: this.state.midColor.clone() },
      uHorizon: { value: this.state.horizonColor.clone() },
      uSunDir: { value: this.state.sunDir.clone() },
      uSunColor: { value: new THREE.Color(0xfff1c4) },
      uNightFactor: { value: 0 },
      uTime: { value: 0 },
    };
    const geo = new THREE.SphereGeometry(2800, 32, 20);
    const mat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.skyMesh = new THREE.Mesh(geo, mat);
    this.skyMesh.renderOrder = -10;
    this.scene.add(this.skyMesh);
  }

  _buildPaintedClouds() {
    this.cloudGroup = new THREE.Group();
    const puffGeo = new THREE.IcosahedronGeometry(1, 2);
    this.cloudMat = new THREE.MeshLambertMaterial({
      color: 0xfffaf0,
      emissive: 0x5c6f94,
      emissiveIntensity: 0.22,
      transparent: true,
      opacity: 0.92,
      fog: true,
    });

    this.clouds = [];
    for (let i = 0; i < 28; i++) {
      const cluster = new THREE.Group();
      const angle = (i / 28) * Math.PI * 2 + (i % 3) * 0.21;
      const dist = 360 + (i % 5) * 190;
      const cx = Math.cos(angle) * dist;
      const cz = Math.sin(angle) * dist;
      const cy = 195 + (i % 4) * 38;
      cluster.position.set(cx, cy, cz);

      const lobes = 4 + (i % 3);
      for (let l = 0; l < lobes; l++) {
        const m = new THREE.Mesh(puffGeo, this.cloudMat);
        const rx = (l - (lobes - 1) * 0.5) * 24;
        const ry = Math.sin((l / lobes) * Math.PI) * 14;
        const rz = ((l * 13) % 7 - 3) * 6;
        const sx = 22 + (l % 2) * 14;
        const sy = 14 + (l % 3) * 7;
        m.position.set(rx, ry, rz);
        m.scale.set(sx, sy, sx * 0.85);
        cluster.add(m);
      }
      this.cloudGroup.add(cluster);
      this.clouds.push({ group: cluster, baseAngle: angle, dist, cy, speed: 0.002 + (i % 4) * 0.0008 });
    }
    this.scene.add(this.cloudGroup);
  }

  _buildParticles() {
    // Ambient golden sun-motes / fireflies
    const moteCount = 260;
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 90;
      motePos[i * 3 + 1] = 1 + Math.random() * 22;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    this.moteMat = new THREE.PointsMaterial({
      color: 0xffe89e,
      map: this.spriteMap || null,
      size: 0.55,
      transparent: true,
      opacity: 0.72,
      alphaTest: 0.02,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.motes = new THREE.Points(moteGeo, this.moteMat);
    this.scene.add(this.motes);

    // Rain / Snow precipitation particles
    const precipCount = 700;
    const precipPos = new Float32Array(precipCount * 3);
    for (let i = 0; i < precipCount; i++) {
      precipPos[i * 3] = (Math.random() - 0.5) * 75;
      precipPos[i * 3 + 1] = Math.random() * 40;
      precipPos[i * 3 + 2] = (Math.random() - 0.5) * 75;
    }
    const precipGeo = new THREE.BufferGeometry();
    precipGeo.setAttribute('position', new THREE.BufferAttribute(precipPos, 3));
    this.precipMat = new THREE.PointsMaterial({
      color: 0xdff2ff,
      map: this.spriteMap || null,
      size: 0.42,
      transparent: true,
      opacity: 0,
      alphaTest: 0.02,
      depthWrite: false,
    });
    this.precip = new THREE.Points(precipGeo, this.precipMat);
    this.scene.add(this.precip);
  }

  setWeather(weather) {
    if (weather === 'auto') {
      this.weatherOverride = null;
      return;
    }
    if (WEATHER_STATES.includes(weather)) {
      this.weatherOverride = weather;
      this.weather = weather;
    }
  }

  advanceTime(hours) {
    this.timeOfDay = (this.timeOfDay + hours + 24) % 24;
  }

  getTimeString() {
    const h = Math.floor(this.timeOfDay);
    const m = Math.floor((this.timeOfDay - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  update(dt, elapsed, playerPos, region, playerElevation = 14) {
    this.timeOfDay = (this.timeOfDay + dt * this.daySpeed) % 24;

    // Automatic weather evolution unless player pinned a weather state in Settings
    // (Exclude indoor sanctuary rooms at y >= 400m from alpine snow checks!)
    if (!this.weatherOverride) {
      const isAlpine = playerElevation > 60 && playerElevation < 350;
      if (isAlpine || region?.id === 'highland-reach') {
        this.weather = 'snow';
      } else {
        if (this.weather === 'snow') {
          this.weather = 'clear';
        }
        this._weatherTimer -= dt;
        if (this._weatherTimer <= 0) {
          this._weatherTimer = 110 + Math.random() * 90;
          const pool = ['clear', 'clear', 'clouds', 'mist', 'rain'];
          this.weather = pool[Math.floor(Math.random() * pool.length)];
        }
      }
    }
    this.state.weather = this.weather;

    // Sun angle from 24-hour clock (sunrise ~6:00, zenith ~12:30, sunset ~19:00)
    const sunAngle = ((this.timeOfDay - 6) / 24) * Math.PI * 2;
    const sunElev = Math.sin(sunAngle);
    const sunAz = Math.cos(sunAngle);
    this.state.sunDir.set(sunAz * 0.72, Math.max(-0.35, sunElev), 0.45).normalize();

    const dayAmount = clamp((sunElev + 0.14) / 0.42, 0, 1);
    const goldenAmount = clamp(1 - Math.abs(sunElev - 0.14) * 3.8, 0, 1) * dayAmount;
    const nightFactor = 1 - dayAmount;
    this.state.nightFactor = nightFactor;

    // Anime Watercolor & Gouache Time-of-Day Palettes
    const dayZenith = new THREE.Color(0x4b96d8);
    const dayMid = new THREE.Color(0x98d5ee);
    const dayHorizon = new THREE.Color(0xfce8bf);

    const goldenZenith = new THREE.Color(0x466db3);
    const goldenMid = new THREE.Color(0xe5a28c);
    const goldenHorizon = new THREE.Color(0xffcf87);

    const nightZenith = new THREE.Color(0x111a38);
    const nightMid = new THREE.Color(0x22335e);
    const nightHorizon = new THREE.Color(0x3a4d78);

    const zenith = dayZenith.clone().lerp(goldenZenith, goldenAmount).lerp(nightZenith, nightFactor);
    const mid = dayMid.clone().lerp(goldenMid, goldenAmount).lerp(nightMid, nightFactor);
    const horizon = dayHorizon.clone().lerp(goldenHorizon, goldenAmount).lerp(nightHorizon, nightFactor);

    // Subtle biome fog tint
    const regionFog = region
      ? new THREE.Color(region.fogColor[0], region.fogColor[1], region.fogColor[2])
      : new THREE.Color(0xc7e4ea);
    const fogCol = regionFog.clone().lerp(horizon, 0.35).lerp(nightHorizon, nightFactor * 0.85);

    // Weather adjustments
    let fogDensity = 0.00135;
    let sunIntensity = lerp(0.45, 2.3, dayAmount);
    let cloudStrength = 0.22;
    let windStrength = 0.55;

    if (this.weather === 'clouds') {
      fogDensity = 0.00165;
      sunIntensity *= 0.84;
      cloudStrength = 0.38;
      windStrength = 0.75;
    } else if (this.weather === 'mist') {
      fogDensity = 0.0029;
      sunIntensity *= 0.78;
      fogCol.lerp(new THREE.Color(0xe3eff2), 0.35 * dayAmount);
      cloudStrength = 0.28;
    } else if (this.weather === 'rain') {
      fogDensity = 0.0024;
      sunIntensity *= 0.62;
      zenith.lerp(new THREE.Color(0x52647c), 0.55);
      horizon.lerp(new THREE.Color(0x889aac), 0.55);
      fogCol.lerp(new THREE.Color(0x7c8fa2), 0.5);
      cloudStrength = 0.45;
      windStrength = 1.25;
    } else if (this.weather === 'snow') {
      fogDensity = 0.0022;
      sunIntensity *= 0.8;
      fogCol.lerp(new THREE.Color(0xdbe8f5), 0.45 * dayAmount);
      windStrength = 0.95;
    }

    this.state.zenithColor.copy(zenith);
    this.state.midColor.copy(mid);
    this.state.horizonColor.copy(horizon);
    this.state.fogColor.copy(fogCol);
    this.state.fogDensity = fogDensity;

    // Sync scene lighting & fog
    this.sceneManager.sunDir.copy(this.state.sunDir);
    this.sceneManager.sunLight.intensity = sunIntensity;
    this.sceneManager.sunLight.color
      .setHex(0xfff1cf)
      .lerp(new THREE.Color(0xffb878), goldenAmount * 0.75)
      .lerp(new THREE.Color(0x95b4e8), nightFactor);

    this.sceneManager.hemiLight.intensity = lerp(0.38, 0.96, dayAmount);
    this.sceneManager.hemiLight.color.copy(mid);
    this.sceneManager.hemiLight.groundColor.setHex(0x5d725b).lerp(new THREE.Color(0x222c44), nightFactor);

    this.scene.fog.color.copy(fogCol);
    this.scene.fog.density = fogDensity;
    this.scene.background.copy(fogCol);

    // Sync sky dome & clouds centered around player
    this.skyMesh.position.copy(playerPos);
    this.skyUniforms.uZenith.value.copy(zenith);
    this.skyUniforms.uMid.value.copy(mid);
    this.skyUniforms.uHorizon.value.copy(horizon);
    this.skyUniforms.uSunDir.value.copy(this.state.sunDir);
    this.skyUniforms.uNightFactor.value = nightFactor;
    this.skyUniforms.uTime.value = elapsed;

    this.cloudGroup.position.set(playerPos.x, 0, playerPos.z);
    this.cloudMat.color.setHex(0xfffbf2).lerp(new THREE.Color(0xffd7b0), goldenAmount * 0.6).lerp(new THREE.Color(0x3a4a70), nightFactor);
    this.cloudMat.opacity = this.weather === 'clear' ? 0.85 : 0.96;
    for (const c of this.clouds) {
      const a = c.baseAngle + elapsed * c.speed;
      c.group.position.set(Math.cos(a) * c.dist, c.cy, Math.sin(a) * c.dist);
    }

    // Sync global WatercolorShader uniforms
    WATERCOLOR_UNIFORMS.uWcTime.value = elapsed;
    WATERCOLOR_UNIFORMS.uWcSunDir.value.copy(this.state.sunDir);
    WATERCOLOR_UNIFORMS.uWcCloudStrength.value = cloudStrength;
    WATERCOLOR_UNIFORMS.uWcNightFactor.value = nightFactor;
    WATERCOLOR_UNIFORMS.uWcWindStrength.value = windStrength;

    // Update ambient sun-motes / dusk fireflies
    this.motes.position.set(playerPos.x, playerPos.y, playerPos.z);
    this.moteMat.color.setHex(nightFactor > 0.4 ? 0xffe478 : 0xfff5c8);
    this.moteMat.size = nightFactor > 0.4 ? 0.56 : 0.34;
    this.moteMat.opacity = nightFactor > 0.3 ? 0.88 : 0.45;
    const mAttr = this.motes.geometry.attributes.position;
    for (let i = 0; i < mAttr.count; i++) {
      let y = mAttr.getY(i) + Math.sin(elapsed * 1.4 + i) * dt * 0.6;
      if (y > 22) y = 1;
      if (y < 0.8) y = 18;
      mAttr.setY(i, y);
    }
    mAttr.needsUpdate = true;

    // Update Rain / Snow precipitation
    const isRain = this.weather === 'rain';
    const isSnow = this.weather === 'snow';
    this.precip.visible = isRain || isSnow;
    if (this.precip.visible) {
      this.precip.position.set(playerPos.x, playerPos.y, playerPos.z);
      this.precipMat.opacity = isRain ? 0.58 : 0.82;
      this.precipMat.size = isRain ? 0.28 : 0.46;
      this.precipMat.color.setHex(isRain ? 0xcbe5f8 : 0xffffff);
      const pAttr = this.precip.geometry.attributes.position;
      const fallSpeed = isRain ? 34 : 5.2;
      for (let i = 0; i < pAttr.count; i++) {
        let y = pAttr.getY(i) - fallSpeed * dt;
        let x = pAttr.getX(i) + (isSnow ? Math.sin(elapsed * 1.5 + i) * dt * 1.4 : dt * 3.5);
        if (y < -4) y += 42;
        if (x > 37.5) x -= 75;
        pAttr.setXY(i, x, y);
      }
      pAttr.needsUpdate = true;
    }

    return this.state;
  }
}
