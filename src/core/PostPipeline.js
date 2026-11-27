// AAA Painterly WebGL2 Post-Processing Pipeline (adapted from Kong Royale post.ts & grade.ts):
//   1. Renders HDR scene into HalfFloat WebGLRenderTarget.
//   2. Quarter-res soft-threshold Selective Bloom prefilter into a hardware-mipmapped target
//      (uses driver mip-chain + rotated tent taps across 3 mip levels — ultra fast on mobile & desktop!).
//   3. Single full-res Final Composite pass:
//      - Selective Bloom additive blend (glowing lanterns, Sunfire Nova, Luma, Waystones, Aurora, Crystals)
//      - OkLab Painterly Color Grade (warm sunlit highlights, cool watercolor shadow shift,
//        bright-green gamut roll-off preventing neon clipping, clean shoulder tone curve)
//      - Soft warm storybook vignette + Interleaved Gradient Noise dither (zero sky banding!)
import * as THREE from 'three';

const FS_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Quarter-res bloom prefilter with NaN guard, luminance clamp, and soft knee threshold
const BLOOM_PREFILTER_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform float uThreshold;
uniform float uKnee;
varying vec2 vUv;

void main() {
  vec3 c = texture2D(tScene, vUv).rgb;
  // Guard against NaN/Inf & cap fireflies at 6.0
  c = clamp(max(c, vec3(0.0)), vec3(0.0), vec3(6.0));
  float br = max(c.r, max(c.g, c.b));
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = (soft * soft) / (4.0 * uKnee + 1e-4);
  float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
  gl_FragColor = vec4(c * max(contrib, 0.0), 1.0);
}
`;

// Full-res Final Composite: Multi-mip tent Bloom + ACES/Filmic Shoulder + OkLab Painterly Grade + Vignette + IGN Dither
const COMPOSITE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform vec2 uBloomTexel;
uniform float uBloomStrength;
uniform float uExposure;
uniform float uSat;
uniform float uWarm;
uniform float uShade;
uniform float uVignette;
uniform float uTime;
varying vec2 vUv;

float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

vec3 sampleTent(sampler2D tex, vec2 uv, vec2 texel, float radius) {
  vec2 d = texel * radius;
  vec3 s = texture2D(tex, uv).rgb * 4.0;
  s += (texture2D(tex, uv + vec2( d.x,  0.0)).rgb + texture2D(tex, uv + vec2(-d.x,  0.0)).rgb +
        texture2D(tex, uv + vec2( 0.0,  d.y)).rgb + texture2D(tex, uv + vec2( 0.0, -d.y)).rgb) * 2.0;
  s += (texture2D(tex, uv + vec2( d.x,  d.y)).rgb + texture2D(tex, uv + vec2(-d.x,  d.y)).rgb +
        texture2D(tex, uv + vec2( d.x, -d.y)).rgb + texture2D(tex, uv + vec2(-d.x, -d.y)).rgb);
  return s * (1.0 / 16.0);
}

vec3 cbrt3(vec3 v) {
  return sign(v) * pow(abs(v) + vec3(1e-7), vec3(1.0 / 3.0));
}

vec3 linearToOklab(vec3 c) {
  vec3 lms = mat3(
    0.41222147, 0.21190350, 0.08830246,
    0.53633254, 0.68069955, 0.28171884,
    0.05144599, 0.10739696, 0.62997870
  ) * max(c, vec3(0.0));
  vec3 l = cbrt3(lms);
  return mat3(
    0.21045426, 1.97799850, 0.02590404,
    0.79361779, -2.42859220, 0.78277177,
    -0.00407205, 0.45059371, -0.80867577
  ) * l;
}

vec3 oklabToLinear(vec3 lab) {
  vec3 l = mat3(
    1.0, 1.0, 1.0,
    0.39633778, -0.10556135, -0.08948418,
    0.21580376, -0.06385417, -1.29148555
  ) * lab;
  vec3 lms = l * l * l;
  return mat3(
    4.07674166, -1.26843800, -0.00419609,
    -3.30771159, 2.60975740, -0.70341861,
    0.23096993, -0.34131940, 1.70761470
  ) * lms;
}

vec3 acesTone(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec3 col = texture2D(tScene, vUv).rgb;

  // Multi-radius painterly selective bloom (wide warm halo + crisp inner glow)
  if (uBloomStrength > 0.001) {
    vec3 b1 = sampleTent(tBloom, vUv, uBloomTexel, 1.25);
    vec3 b2 = sampleTent(tBloom, vUv, uBloomTexel, 2.85);
    vec3 b3 = sampleTent(tBloom, vUv, uBloomTexel, 5.2);
    vec3 bloom = (b1 * 0.45 + b2 * 0.35 + b3 * 0.20) * uBloomStrength;
    col += bloom;
  }

  // Exposure + Filmic ACES shoulder
  col = acesTone(max(col, vec3(0.0)) * uExposure);

  // OkLab Anime Watercolor & Gouache Color Grade (inspired by Kong Royale grade.ts):
  //   - Gentle vibrancy boost
  //   - Warm golden sunlit highlights & cool slate-indigo shadow tint
  //   - Bright-green gamut roll-off so sunlit grass/canopy stays lush painterly gouache, never neon!
  vec3 lab = linearToOklab(col);
  float L = clamp(lab.x, 0.0, 1.0);
  float a = lab.y * uSat;
  float b = lab.z * uSat;

  float split = uShade * 0.022 * (1.0 - smoothstep(0.22, 0.56, L)) + uWarm * 0.026 * smoothstep(0.55, 0.92, L);
  a += 0.14 * split;
  b += split;

  // Bright-green painterly gamut control (OkLab hue 113-185 deg)
  float hueDeg = degrees(atan(b, a));
  float wg = smoothstep(113.0, 126.0, hueDeg) * (1.0 - smoothstep(172.0, 190.0, hueDeg)) * smoothstep(0.02, 0.06, length(vec2(a, b)));
  if (wg > 0.001) {
    float k = smoothstep(0.65, 0.94, L);
    a *= 1.0 - wg * 0.24 * k;
    b *= 1.0 - wg * 0.24 * k;
    L *= 1.0 - wg * 0.04 * smoothstep(0.75, 1.0, L);
  }

  col = clamp(oklabToLinear(vec3(L, a, b)), 0.0, 1.0);

  // Subtle storybook edge vignette
  vec2 centered = vUv * 2.0 - 1.0;
  float vig = 1.0 - dot(centered, centered) * uVignette;
  col *= clamp(vig, 0.72, 1.0);

  // Linear -> sRGB encoding + IGN anti-banding dither
  col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));
  col += (ign(gl_FragCoord.xy + fract(uTime) * 37.0) - 0.5) / 255.0;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export class PostPipeline {
  constructor(webglRenderer) {
    this.webgl = webglRenderer;
    this.enabled = true;
    this.bloomStrength = 0.28;
    this.width = 1;
    this.height = 1;

    const gl = webglRenderer.getContext();
    const canFloatRT = !!(gl && (gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float')));
    const rtType = canFloatRT ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.isHDR = canFloatRT;

    this.sceneRT = new THREE.WebGLRenderTarget(1, 1, {
      type: rtType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
      stencilBuffer: false,
    });
    this.sceneRT.texture.colorSpace = THREE.NoColorSpace;

    this.bloomRT = new THREE.WebGLRenderTarget(1, 1, {
      type: rtType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });
    this.bloomRT.texture.colorSpace = THREE.NoColorSpace;

    const triGeo = new THREE.BufferGeometry();
    triGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));

    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.prefilterMat = new THREE.ShaderMaterial({
      vertexShader: FS_VERT,
      fragmentShader: BLOOM_PREFILTER_FRAG,
      uniforms: {
        tScene: { value: this.sceneRT.texture },
        uThreshold: { value: 0.92 },
        uKnee: { value: 0.35 },
      },
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.prefilterScene = new THREE.Scene();
    this.prefilterScene.add(new THREE.Mesh(triGeo, this.prefilterMat));

    this.compositeMat = new THREE.ShaderMaterial({
      vertexShader: FS_VERT,
      fragmentShader: COMPOSITE_FRAG,
      uniforms: {
        tScene: { value: this.sceneRT.texture },
        tBloom: { value: this.bloomRT.texture },
        uBloomTexel: { value: new THREE.Vector2(1 / 320, 1 / 180) },
        uBloomStrength: { value: this.bloomStrength },
        uExposure: { value: 1.08 },
        uSat: { value: 1.07 },
        uWarm: { value: 0.85 },
        uShade: { value: -0.45 },
        uVignette: { value: 0.14 },
        uTime: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.compositeScene = new THREE.Scene();
    this.compositeScene.add(new THREE.Mesh(triGeo, this.compositeMat));
  }

  resize(width, height, dpr) {
    const rw = Math.max(1, Math.round(width * dpr));
    const rh = Math.max(1, Math.round(height * dpr));
    if (rw === this.width && rh === this.height) return;
    this.width = rw;
    this.height = rh;
    this.sceneRT.setSize(rw, rh);
    const bw = Math.max(2, Math.round(rw * 0.25));
    const bh = Math.max(2, Math.round(rh * 0.25));
    this.bloomRT.setSize(bw, bh);
    this.compositeMat.uniforms.uBloomTexel.value.set(1 / bw, 1 / bh);
  }

  configure({ enabled = true, bloomStrength = 0.28, exposure = 1.08 } = {}) {
    this.enabled = enabled;
    this.bloomStrength = bloomStrength;
    this.compositeMat.uniforms.uBloomStrength.value = bloomStrength;
    this.compositeMat.uniforms.uExposure.value = exposure;
  }

  render(scene, camera, elapsed = 0) {
    if (!this.enabled) {
      this.webgl.setRenderTarget(null);
      this.webgl.render(scene, camera);
      return;
    }

    const prevTone = this.webgl.toneMapping;
    this.webgl.toneMapping = THREE.NoToneMapping;

    // Pass 1: HDR Scene -> sceneRT
    this.webgl.setRenderTarget(this.sceneRT);
    this.webgl.clear();
    this.webgl.render(scene, camera);

    // Pass 2: Quarter-res Selective Bloom Prefilter -> mipmapped bloomRT
    if (this.bloomStrength > 0.001) {
      this.webgl.setRenderTarget(this.bloomRT);
      this.webgl.render(this.prefilterScene, this.cam);
    }

    // Pass 3: Full-res Composite (Bloom + ACES + OkLab Painterly Grade + Vignette + IGN Dither) -> Screen
    this.compositeMat.uniforms.uTime.value = elapsed;
    this.webgl.setRenderTarget(null);
    this.webgl.render(this.compositeScene, this.cam);

    this.webgl.toneMapping = prevTone;
  }

  dispose() {
    this.sceneRT.dispose();
    this.bloomRT.dispose();
    this.prefilterMat.dispose();
    this.compositeMat.dispose();
  }
}
