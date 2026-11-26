// Shared Anime Watercolor & Gouache 3D + Stylized PBR Material Shader Patch.
// Patches Three.js MeshStandardMaterial via onBeforeCompile so every surface retains full PBR shadows,
// lights, roughness, and normals while adding:
//   1. Soft-stepped gouache lighting response & warm sunlight / cool periwinkle-violet watercolor shadows
//   2. Subtle cold-press watercolor paper grain blended across midtones
//   3. Painterly fresnel ink-wash edge accent + sunlit golden rim glow
//   4. Drifting world-space cloud shadows rolling over valleys & forests
//   5. Optional vertex wind animation for trees, foliage puffs, and meadow grass.
import * as THREE from 'three';

const _fallbackPaper = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255]), 2, 2);
_fallbackPaper.wrapS = THREE.RepeatWrapping;
_fallbackPaper.wrapT = THREE.RepeatWrapping;
_fallbackPaper.needsUpdate = true;

export const WATERCOLOR_UNIFORMS = {
  uWcTime: { value: 0 },
  uWcSunDir: { value: new THREE.Vector3(0.55, 0.72, 0.42).normalize() },
  uWcWarmTint: { value: new THREE.Color(1.06, 1.01, 0.90) },
  uWcCoolShadow: { value: new THREE.Color(0.68, 0.76, 0.98) },
  uWcRimColor: { value: new THREE.Color(1.0, 0.94, 0.78) },
  uWcPaperMap: { value: _fallbackPaper },
  uWcCloudStrength: { value: 0.24 },
  uWcNightFactor: { value: 0.0 },
  uWcWindStrength: { value: 0.6 },
};

/**
 * Patches a THREE.MeshStandardMaterial in-place with the Anime Watercolor & Gouache 3D shader.
 * Safe for static, instanced, vertex-colored, and textured meshes.
 */
export function patchWatercolorMaterial(material, opts = {}) {
  const {
    wind = false,
    windAmp = 0.25,
    windFreq = 1.6,
    windHeightScale = 0.14,
    paperStrength = 0.09,
    rimStrength = 0.26,
    inkEdge = 0.18,
    gouacheSteps = 0.35,
    cloudShadow = 1.0,
    subsurface = 0.0,
  } = opts;

  const keyParts = [
    'wc-v1',
    wind ? `w${windAmp}` : 'nw',
    paperStrength.toFixed(2),
    rimStrength.toFixed(2),
    inkEdge.toFixed(2),
    gouacheSteps.toFixed(2),
    cloudShadow.toFixed(1),
    subsurface.toFixed(2),
  ];
  material.customProgramCacheKey = () => keyParts.join('_');

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, WATERCOLOR_UNIFORMS);

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        uniform float uWcTime;
        uniform float uWcWindStrength;
        varying vec3 vWcWorldPos;
        varying vec3 vWcWorldNormal;
        `
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        ${
          wind
            ? /* glsl */ `
          {
            vec4 wcPre = vec4(transformed, 1.0);
            #ifdef USE_INSTANCING
              wcPre = instanceMatrix * wcPre;
            #endif
            vec4 wcW = modelMatrix * wcPre;
            float swayMask = clamp(max(0.0, position.y) * ${windHeightScale.toFixed(4)}, 0.0, 1.6);
            float phase = wcW.x * 0.17 + wcW.z * 0.13 + uWcTime * ${windFreq.toFixed(3)};
            float gust = sin(phase) * 0.7 + cos(phase * 1.73 + wcW.y * 0.4) * 0.3;
            float amp = ${windAmp.toFixed(4)} * uWcWindStrength * swayMask * swayMask;
            transformed.x += gust * amp;
            transformed.z += cos(phase * 0.85) * amp * 0.65;
          }
        `
            : ''
        }
        `
      )
      .replace(
        '#include <project_vertex>',
        /* glsl */ `
        #include <project_vertex>
        {
          vec4 wcWp = vec4(transformed, 1.0);
          vec3 wcN = objectNormal;
          #ifdef USE_INSTANCING
            wcWp = instanceMatrix * wcWp;
            wcN = mat3(instanceMatrix) * wcN;
          #endif
          wcWp = modelMatrix * wcWp;
          vWcWorldPos = wcWp.xyz;
          vWcWorldNormal = normalize(mat3(modelMatrix) * wcN);
        }
        `
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        uniform float uWcTime;
        uniform vec3 uWcSunDir;
        uniform vec3 uWcWarmTint;
        uniform vec3 uWcCoolShadow;
        uniform vec3 uWcRimColor;
        uniform sampler2D uWcPaperMap;
        uniform float uWcCloudStrength;
        uniform float uWcNightFactor;
        varying vec3 vWcWorldPos;
        varying vec3 vWcWorldNormal;

        float wcCloudPattern(vec2 p) {
          vec2 q = p * 0.0042 + vec2(uWcTime * 0.011, uWcTime * 0.006);
          float a = sin(q.x * 2.1 + cos(q.y * 1.7)) * 0.5 + 0.5;
          float b = cos(q.y * 2.9 - sin(q.x * 2.3)) * 0.5 + 0.5;
          return smoothstep(0.46, 0.82, a * b);
        }
        `
      )
      .replace(
        '#include <tonemapping_fragment>',
        /* glsl */ `
        {
          vec3 N = normalize(vWcWorldNormal);
          vec3 V = normalize(cameraPosition - vWcWorldPos);
          vec3 L = normalize(uWcSunDir);
          float ndl = dot(N, L);
          float wrapLit = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);

          // Soft gouache brushwork stepping (blends smoothly between PBR and anime painted cel ramps)
          float stepBand = smoothstep(0.28, 0.34, wrapLit) * 0.45 + smoothstep(0.62, 0.69, wrapLit) * 0.55;
          float gouacheGain = mix(1.0, 0.86 + stepBand * 0.24, ${gouacheSteps.toFixed(3)});
          gl_FragColor.rgb *= gouacheGain;

          // Warm golden-sun highlight vs cool periwinkle-violet watercolor shadow wash
          vec3 shift = mix(uWcCoolShadow, uWcWarmTint, smoothstep(0.22, 0.74, wrapLit));
          gl_FragColor.rgb *= mix(vec3(1.0), shift, 0.42);

          // Optional sunlit foliage subsurface translucency (luminous chartreuse-lime glow)
          ${
            subsurface > 0.001
              ? /* glsl */ `
          float backLit = pow(clamp(dot(V, -L), 0.0, 1.0), 2.5) * (0.45 + 0.55 * (1.0 - wrapLit));
          gl_FragColor.rgb += gl_FragColor.rgb * vec3(0.75, 1.05, 0.32) * backLit * ${subsurface.toFixed(3)} * (1.0 - uWcNightFactor * 0.85);
          `
              : ''
          }

          // Drifting painted cumulus cloud shadows across open terrain
          ${
            cloudShadow > 0.01
              ? /* glsl */ `
          float cl = wcCloudPattern(vWcWorldPos.xz) * uWcCloudStrength * ${cloudShadow.toFixed(2)} * (1.0 - uWcNightFactor * 0.7);
          gl_FragColor.rgb *= mix(vec3(1.0), vec3(0.74, 0.81, 0.96), cl);
          `
              : ''
          }

          // Subtle cold-press watercolor paper grain (fades gently at far distance to prevent shimmer)
          float camDist = length(cameraPosition - vWcWorldPos);
          float grainFade = 1.0 - smoothstep(25.0, 160.0, camDist);
          vec2 pUv = vWcWorldPos.xz * 0.085 + vWcWorldPos.y * 0.04;
          float paper = texture2D(uWcPaperMap, pUv).r;
          gl_FragColor.rgb *= 1.0 + (paper - 0.5) * ${(paperStrength * 2.0).toFixed(3)} * grainFade;

          // Painterly Fresnel: luminous sunlit rim on lit edge + subtle watercolor ink-wash pooling on shadow edge
          float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
          float sunSide = smoothstep(0.15, 0.75, wrapLit);
          gl_FragColor.rgb += uWcRimColor * fresnel * sunSide * ${rimStrength.toFixed(3)} * (1.0 - uWcNightFactor * 0.6);
          gl_FragColor.rgb *= 1.0 - fresnel * (1.0 - sunSide * 0.65) * ${inkEdge.toFixed(3)};
        }
        #include <tonemapping_fragment>
        `
      );
  };

  material.needsUpdate = true;
  return material;
}
