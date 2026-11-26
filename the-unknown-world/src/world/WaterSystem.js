// Custom GLSL Anime Watercolor & Gouache Water System (Ocean, Azure Coast, Rivers & Lakes).
// Features animated stylized waves, turquoise-to-indigo watercolor absorption, dancing Voronoi caustics,
// crisp gouache shoreline foam, Fresnel sky reflection, and sunlit water sparkle.
import * as THREE from 'three';
import { WORLD_CONFIG } from './WorldSpec.js';

const WATER_VERT = /* glsl */ `
uniform float uTime;
varying vec3 vWorldPos;
varying float vWaveH;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float w1 = sin(wp.x * 0.09 + uTime * 1.45) * cos(wp.z * 0.08 - uTime * 1.1) * 0.14;
  float w2 = sin((wp.x * 0.21 - wp.z * 0.18) + uTime * 2.2) * 0.06;
  float h = w1 + w2;
  wp.y += h;
  vWaveH = h;
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const WATER_FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSkyHorizon;
uniform vec3 uSkyZenith;
uniform vec3 uShallowColor;
uniform vec3 uDeepColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uNightFactor;

varying vec3 vWorldPos;
varying float vWaveH;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Painterly Voronoi caustic web
float caustics(vec2 uv) {
  vec2 g = floor(uv);
  vec2 f = fract(uv);
  float minD = 1.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 lattice = vec2(float(x), float(y));
      float h = hash21(g + lattice);
      vec2 offset = 0.5 + 0.42 * sin(uTime * 1.25 + 6.2831 * vec2(h, fract(h * 17.3)));
      float d = length(lattice + offset - f);
      minD = min(minD, d);
    }
  }
  return smoothstep(0.32, 0.72, minD);
}

void main() {
  vec2 p = vWorldPos.xz;
  float dist = length(cameraPosition - vWorldPos);

  // Dual scrolling painterly ripple normal
  float r1 = noise2(p * 0.26 + vec2(uTime * 0.35, -uTime * 0.22));
  float r2 = noise2(p * 0.54 + vec2(-uTime * 0.28, uTime * 0.41));
  float rx = noise2(p * 0.26 + vec2(0.25 + uTime * 0.35, -uTime * 0.22)) - r1;
  float rz = noise2(p * 0.26 + vec2(uTime * 0.35, 0.25 - uTime * 0.22)) - r1;
  vec3 N = normalize(vec3(-rx * 0.95, 1.0, -rz * 0.95));

  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uSunDir);

  // Watercolor palette blend (shallow aquamarine <-> deeper Prussian cerulean)
  float band = clamp(0.45 + r1 * 0.35 + vWaveH * 1.8, 0.0, 1.0);
  vec3 waterCol = mix(uDeepColor, uShallowColor, band);

  // Dancing golden-aqua caustics visible near camera
  float causFade = 1.0 - smoothstep(35.0, 175.0, dist);
  float c = caustics(p * 0.16 + vec2(uTime * 0.09, -uTime * 0.07));
  waterCol += vec3(0.22, 0.36, 0.34) * c * causFade * (1.0 - uNightFactor * 0.7);

  // Painterly gouache white foam crests & swirling streaks
  float foamNoise = noise2(p * 0.42 + vec2(uTime * 0.22, uTime * 0.15));
  float crestFoam = smoothstep(0.76, 0.88, r2 * 0.55 + foamNoise * 0.55 + vWaveH * 1.1) * 0.45;
  waterCol = mix(waterCol, vec3(0.95, 0.98, 0.97), crestFoam * (1.0 - uNightFactor * 0.45));

  // Fresnel sky reflection
  float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.2);
  vec3 skyRefl = mix(uSkyHorizon, uSkyZenith, 0.38);
  waterCol = mix(waterCol, skyRefl, clamp(fresnel * 0.72 + 0.08, 0.0, 0.82));

  // Crisp anime sun glitter sparkles
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 96.0);
  float sparkle = smoothstep(0.65, 0.95, spec * (0.65 + r2 * 0.75));
  waterCol += vec3(1.0, 0.96, 0.82) * (spec * 0.9 + sparkle * 0.85) * (1.0 - uNightFactor * 0.8);

  // Night dim
  waterCol *= mix(1.0, 0.34, uNightFactor);

  // Distance fog matching SceneManager.scene.fog (FogExp2)
  float fogF = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  waterCol = mix(waterCol, uFogColor, clamp(fogF, 0.0, 1.0));

  float alpha = mix(0.82, 0.96, clamp(fresnel + crestFoam * 0.4, 0.0, 1.0));
  gl_FragColor = vec4(waterCol, alpha);
}
`;

export class WaterSystem {
  constructor(scene) {
    this.uniforms = {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.55, 0.72, 0.42).normalize() },
      uSkyHorizon: { value: new THREE.Color(0xfce6bd) },
      uSkyZenith: { value: new THREE.Color(0x4d99da) },
      uShallowColor: { value: new THREE.Color(0x45c4c4) },
      uDeepColor: { value: new THREE.Color(0x1f678f) },
      uFogColor: { value: new THREE.Color(0xc7e4ea) },
      uFogDensity: { value: 0.00145 },
      uNightFactor: { value: 0.0 },
    };

    const geo = new THREE.PlaneGeometry(2400, 2400, 96, 96);
    geo.rotateX(-Math.PI / 2);

    this.material = new THREE.ShaderMaterial({
      vertexShader: WATER_VERT,
      fragmentShader: WATER_FRAG,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.position.y = WORLD_CONFIG.SEA_LEVEL;
    this.mesh.renderOrder = 2;
    scene.add(this.mesh);
  }

  update(dt, elapsed, playerPos, envState) {
    this.uniforms.uTime.value = elapsed;
    // Snap water plane to 16m grid around player so vertices never swim when moving across 8x8 km
    const snap = 16;
    this.mesh.position.x = Math.round(playerPos.x / snap) * snap;
    this.mesh.position.z = Math.round(playerPos.z / snap) * snap;

    if (envState) {
      this.uniforms.uSunDir.value.copy(envState.sunDir);
      this.uniforms.uSkyHorizon.value.copy(envState.horizonColor);
      this.uniforms.uSkyZenith.value.copy(envState.zenithColor);
      this.uniforms.uFogColor.value.copy(envState.fogColor);
      this.uniforms.uFogDensity.value = envState.fogDensity;
      this.uniforms.uNightFactor.value = envState.nightFactor;
    }
  }
}
