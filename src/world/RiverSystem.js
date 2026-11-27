// A small traversable river inside the prototype. The shader is original and uses no external assets.
import * as THREE from "three";
import {
  WORLD_HALF,
  RIVER_LEVEL,
  RIVER_HALF_WIDTH,
  riverCenter,
  inRiver,
} from "../world.js";
export class RiverSystem {
  constructor(scene) {
    const segments = 160,
      positions = [],
      indices = [];
    for (let i = 0; i <= segments; i++) {
      const z = -WORLD_HALF + (i / segments) * WORLD_HALF * 2,
        center = riverCenter(z);
      positions.push(
        center - RIVER_HALF_WIDTH,
        RIVER_LEVEL,
        z,
        center + RIVER_HALF_WIDTH,
        RIVER_LEVEL,
        z,
      );
      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        { time: { value: 0 } },
      ]),
      fog: true,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader:
        `uniform float time; varying vec2 vWorld; varying float vWave;
        #include <fog_pars_vertex>
        void main(){ vec3 p=position; vWorld=p.xz; vWave=sin(p.z*.14+time*1.2)*cos(p.x*.22-time*.7); p.y+=vWave*.08; vec4 mvPosition=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mvPosition; #include <fog_vertex> }`.replace(
          " #include <fog_vertex>",
          "\n#include <fog_vertex>\n",
        ),
      fragmentShader: `varying vec2 vWorld; varying float vWave; uniform float time;
        #include <fog_pars_fragment>
        void main(){ float ripples=sin(vWorld.y*.40+vWorld.x*.25-time*1.8)*.5+.5; vec3 col=mix(vec3(.17,.37,.36),vec3(.50,.70,.65),clamp(.25+vWave*.15+ripples*.18,0.,1.)); gl_FragColor=vec4(col,.82);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }
  update(dt) {
    this.mesh.material.uniforms.time.value += dt;
  }
  contains(x, z) {
    return inRiver(x, z);
  }
  dispose(scene) {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
