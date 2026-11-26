// Procedural Anime Watercolor & Gouache PBR Texture Synthesizer.
// Generates seamless tileable gouache brushwork textures, cold-press watercolor paper grain,
// stone masonry, painted bark, and Sobel normal maps on offscreen HTMLCanvasElement.
import * as THREE from 'three';
import { mulberry32 } from './Noise.js';

function makeCanvas(size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function finalizeTexture(canvas, { repeat = 1, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Derives a smooth tangent-space normal map from a grayscale height canvas using Sobel gradients */
function heightCanvasToNormal(heightCanvas, strength = 2.2) {
  const s = heightCanvas.width;
  const hctx = heightCanvas.getContext('2d');
  const src = hctx.getImageData(0, 0, s, s).data;
  const out = makeCanvas(s);
  const octx = out.getContext('2d');
  const img = octx.createImageData(s, s);
  const dst = img.data;

  const sample = (x, y) => {
    const wx = ((x % s) + s) % s;
    const wy = ((y % s) + s) % s;
    return src[(wy * s + wx) * 4] / 255;
  };

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const dz = 1.0;
      const inv = 1 / Math.hypot(dx, dy, dz);

      const i = (y * s + x) * 4;
      dst[i] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      dst[i + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      dst[i + 2] = Math.round((dz * inv * 0.5 + 0.5) * 255);
      dst[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

/** Draws tiled soft gouache brush dabs wrapping seamlessly across canvas edges */
function paintWrappedDabs(ctx, size, count, rng, drawDab) {
  for (let i = 0; i < count; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const params = drawDab(rng);
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const px = x + ox * size;
        const py = y + oy * size;
        if (px < -80 || px > size + 80 || py < -80 || py > size + 80) continue;
        params.paint(ctx, px, py);
      }
    }
  }
}

export class ArtTextures {
  constructor() {
    this.paperGrain = this._buildPaperGrain(256);
    const terrain = this._buildGouacheTerrain(512);
    this.terrainMap = terrain.albedo;
    this.terrainNormal = terrain.normal;
    this.stoneMap = this._buildPaintedStone(256);
    this.woodMap = this._buildPaintedWood(256);
    this.barkMap = this._buildPaintedBark(256);
    this.softOrb = this._buildSoftOrb(64);
    this.contactShadow = this._buildContactShadow(64);
  }

  _buildSoftOrb(size) {
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const half = size * 0.5;
    const g = ctx.createRadialGradient(half, half, 0, half, half, half);
    g.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    g.addColorStop(0.32, 'rgba(255, 252, 240, 0.85)');
    g.addColorStop(0.7, 'rgba(255, 244, 210, 0.25)');
    g.addColorStop(1.0, 'rgba(255, 244, 210, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  _buildContactShadow(size) {
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const half = size * 0.5;
    const g = ctx.createRadialGradient(half, half, half * 0.1, half, half, half);
    g.addColorStop(0.0, 'rgba(24, 34, 54, 0.54)');
    g.addColorStop(0.58, 'rgba(28, 38, 62, 0.26)');
    g.addColorStop(1.0, 'rgba(28, 38, 62, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  _buildPaperGrain(size) {
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const rng = mulberry32(8811);

    // Cold-press watercolor paper tooth + gentle fibrous weave
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const wave =
          Math.sin(x * 0.24 + Math.sin(y * 0.12) * 1.4) * 0.25 +
          Math.cos(y * 0.29 + Math.cos(x * 0.15) * 1.3) * 0.25;
        const grain = (rng() - 0.5) * 0.55;
        const v = Math.round(Math.max(0, Math.min(255, (0.52 + wave * 0.14 + grain * 0.22) * 255)));
        const idx = (y * size + x) * 4;
        img.data[idx] = v;
        img.data[idx + 1] = v;
        img.data[idx + 2] = v;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return finalizeTexture(c, { repeat: 1, srgb: false });
  }

  _buildGouacheTerrain(size) {
    const alb = makeCanvas(size);
    const actx = alb.getContext('2d');
    const hgt = makeCanvas(size);
    const hctx = hgt.getContext('2d');
    const rng = mulberry32(4192);

    // Neutral bright painterly base so vertex biome colors tint cleanly without muddying
    actx.fillStyle = '#e7e7e2';
    actx.fillRect(0, 0, size, size);
    hctx.fillStyle = '#808080';
    hctx.fillRect(0, 0, size, size);

    // Layer 1: Broad wet-on-wet watercolor blooms
    paintWrappedDabs(actx, size, 120, rng, (r) => {
      const rad = 22 + r() * 44;
      const shade = 216 + Math.floor(r() * 36);
      const warm = r() > 0.5 ? 5 : -4;
      return {
        paint(ctx, px, py) {
          const g = ctx.createRadialGradient(px, py, rad * 0.1, px, py, rad);
          g.addColorStop(0, `rgba(${shade + warm}, ${shade + 2}, ${shade - warm}, 0.24)`);
          g.addColorStop(0.75, `rgba(${shade - 6}, ${shade - 4}, ${shade}, 0.12)`);
          g.addColorStop(1, 'rgba(230,230,226,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, rad, 0, Math.PI * 2);
          ctx.fill();
        },
      };
    });

    // Layer 2: Crisp gouache brush strokes (paired albedo + height relief)
    for (let i = 0; i < 420; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const len = 10 + rng() * 24;
      const wid = 3 + rng() * 8;
      const ang = (rng() - 0.5) * 1.1 + 0.35;
      const v = 205 + Math.floor(rng() * 48);
      const hv = 95 + Math.floor(rng() * 75);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const px = x + ox * size;
          const py = y + oy * size;
          if (px < -40 || px > size + 40 || py < -40 || py > size + 40) continue;
          actx.save();
          actx.translate(px, py);
          actx.rotate(ang);
          actx.fillStyle = `rgba(${v}, ${v}, ${Math.min(255, v - 3)}, 0.32)`;
          actx.beginPath();
          actx.ellipse(0, 0, len * 0.5, wid * 0.5, 0, 0, Math.PI * 2);
          actx.fill();
          actx.restore();

          hctx.save();
          hctx.translate(px, py);
          hctx.rotate(ang);
          hctx.fillStyle = `rgba(${hv}, ${hv}, ${hv}, 0.38)`;
          hctx.beginPath();
          hctx.ellipse(0, 0, len * 0.5, wid * 0.5, 0, 0, Math.PI * 2);
          hctx.fill();
          hctx.restore();
        }
      }
    }

    // Layer 3: Subtle fine grassy gouache flecks
    for (let i = 0; i < 550; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const v = rng() > 0.45 ? 248 : 192;
      actx.fillStyle = `rgba(${v},${v},${v - 4},0.22)`;
      actx.fillRect(x, y, 2 + rng() * 3, 1.5);
    }

    const normalCanvas = heightCanvasToNormal(hgt, 1.85);
    return {
      albedo: finalizeTexture(alb, { repeat: 8, srgb: true }),
      normal: finalizeTexture(normalCanvas, { repeat: 8, srgb: false }),
    };
  }

  _buildPaintedStone(size) {
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const rng = mulberry32(9902);
    ctx.fillStyle = '#c4baa6';
    ctx.fillRect(0, 0, size, size);

    const rows = 8;
    const rh = size / rows;
    for (let r = 0; r < rows; r++) {
      const cols = 4 + (r % 2);
      const cw = size / cols;
      const offset = (r % 2) * (cw * 0.5);
      for (let col = -1; col <= cols; col++) {
        const bx = col * cw + offset;
        const by = r * rh;
        const tone = 180 + Math.floor(rng() * 44);
        const warm = Math.floor(rng() * 14);
        ctx.fillStyle = `rgb(${tone + warm}, ${tone + Math.floor(warm * 0.5)}, ${tone - 10})`;
        ctx.fillRect(bx + 2, by + 2, cw - 4, rh - 4);
        // Gouache highlight edge
        ctx.fillStyle = 'rgba(255,248,232,0.22)';
        ctx.fillRect(bx + 3, by + 3, cw - 6, 4);
        // Cool watercolor mortar shadow
        ctx.strokeStyle = 'rgba(72,78,104,0.45)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx + 1, by + 1, cw - 2, rh - 2);
      }
    }
    // Moss accents
    for (let i = 0; i < 65; i++) {
      ctx.fillStyle = `rgba(98, 138, 86, ${0.14 + rng() * 0.18})`;
      ctx.beginPath();
      ctx.arc(rng() * size, rng() * size, 3 + rng() * 9, 0, Math.PI * 2);
      ctx.fill();
    }
    return finalizeTexture(c, { repeat: 2, srgb: true });
  }

  _buildPaintedWood(size) {
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const rng = mulberry32(6613);
    ctx.fillStyle = '#9c714a';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 64; i++) {
      const y = (i / 64) * size;
      const shade = 120 + Math.floor(rng() * 46);
      ctx.fillStyle = `rgba(${shade + 25}, ${shade - 4}, ${shade - 36}, 0.45)`;
      ctx.fillRect(0, y, size, 4 + rng() * 5);
    }
    for (let p = 0; p < 6; p++) {
      ctx.fillStyle = 'rgba(54,36,28,0.42)';
      ctx.fillRect(0, (p / 6) * size, size, 2);
    }
    return finalizeTexture(c, { repeat: 2, srgb: true });
  }

  _buildPaintedBark(size) {
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    const rng = mulberry32(7135);
    ctx.fillStyle = '#735742';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 95; i++) {
      const x = rng() * size;
      const w = 3 + rng() * 9;
      const v = 80 + Math.floor(rng() * 55);
      ctx.fillStyle = `rgba(${v + 18}, ${v + 4}, ${v - 14}, 0.55)`;
      ctx.fillRect(x, 0, w, size);
    }
    return finalizeTexture(c, { repeat: 2, srgb: true });
  }
}
