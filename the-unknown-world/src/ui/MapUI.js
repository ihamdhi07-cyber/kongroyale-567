// Interactive Multi-Layer Watercolor Cartography World Map (Part 2.4 of Master Brief).
// Supports toggleable layers:
//   - Geographical Biomes (8 regions)
//   - Elevation Contours
//   - Roads & Silver River Water System
//   - Landmarks & Points of Interest (fog-of-war hides undiscovered secrets)
//   - 15 x 15 km Ultimate Expansion Blueprint Overlay (showing 64 km² core + 161 km² planned frontier)
//   - Click any attuned Waystone to Fast Travel seamlessly across the continent!
import { WORLD_CONFIG, REGIONS, LANDMARKS, ROADS, RIVERS, EXPANSION_ZONES } from '../world/WorldSpec.js';

export class MapUI {
  constructor(game) {
    this.game = game;
    this.layers = {
      biomes: true,
      elevation: true,
      waterRoads: true,
      landmarks: true,
      expansion15km: false,
    };
    this._baseCache = new Map();
    this._buildDOM();
  }

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.id = 'map-modal';
    this.el.className = 'modal-overlay hidden';
    this.el.innerHTML = `
      <div class="modal-card map-card">
        <div class="modal-header">
          <div>
            <div class="modal-eyebrow">CARTOGRAPHY &amp; FAST TRAVEL</div>
            <h2 class="modal-title">The Unknown World — <span id="map-scope-label">8×8 km Playable Realm (64 km²)</span></h2>
          </div>
          <button class="modal-close" type="button">✕</button>
        </div>

        <div class="map-toolbar">
          <label class="map-toggle"><input type="checkbox" data-layer="biomes" checked /> Regions</label>
          <label class="map-toggle"><input type="checkbox" data-layer="elevation" checked /> Elevation</label>
          <label class="map-toggle"><input type="checkbox" data-layer="waterRoads" checked /> Rivers &amp; Roads</label>
          <label class="map-toggle"><input type="checkbox" data-layer="landmarks" checked /> Landmarks</label>
          <label class="map-toggle highlight"><input type="checkbox" data-layer="expansion15km" /> 15×15 km Expansion Plan</label>
          <span class="map-stat" id="map-explore-pct">Explored: 0%</span>
        </div>

        <div class="map-body">
          <div class="map-canvas-wrap">
            <canvas id="world-map-canvas" width="560" height="560"></canvas>
          </div>
          <div class="map-sidebar">
            <h3>Waystones, Outposts &amp; Pins</h3>
            <p class="map-hint">Click any attuned Waystone (✦) to fast-travel, or click anywhere else on the map to drop/clear a custom Compass Waypoint pin.</p>
            <div class="map-waypoint-bar" id="map-waypoint-bar"></div>
            <div class="map-landmark-list" id="map-landmark-list"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.el);

    this.canvas = this.el.querySelector('#world-map-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.scopeLabel = this.el.querySelector('#map-scope-label');
    this.pctLabel = this.el.querySelector('#map-explore-pct');
    this.listEl = this.el.querySelector('#map-landmark-list');

    this.el.querySelector('.modal-close').addEventListener('click', () => this.game.closeAllModals());
    for (const cb of this.el.querySelectorAll('input[data-layer]')) {
      cb.addEventListener('change', () => {
        this.layers[cb.dataset.layer] = cb.checked;
        this.render();
      });
    }

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
      const py = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
      const [wx, wz] = this._canvasToWorld(px, py);

      // Check click on any attuned waystone
      for (const lm of LANDMARKS) {
        if (!lm.hasWaystone || !this.game.exploration.attunedWaystones.has(lm.id)) continue;
        const [lx, ly] = this._worldToCanvas(lm.x, lm.z);
        if (Math.hypot(lx - px, ly - py) <= 18) {
          this.game.fastTravelTo(lm.id);
          return;
        }
      }

      // Check click on existing custom waypoint pin to clear it
      if (this.game.waypoint) {
        const [wpx, wpy] = this._worldToCanvas(this.game.waypoint.x, this.game.waypoint.z);
        if (Math.hypot(wpx - px, wpy - py) <= 16) {
          this.game.setWaypoint(null);
          this.render();
          return;
        }
      }

      // Drop custom waypoint pin anywhere inside the 8x8 km playable continent
      if (Math.abs(wx) <= WORLD_CONFIG.PLAYABLE_HALF_M && Math.abs(wz) <= WORLD_CONFIG.PLAYABLE_HALF_M) {
        const reg = this.game.world.terrain.biomes.getRegionAt(wx, wz);
        this.game.setWaypoint({ x: Math.round(wx), z: Math.round(wz), regionName: reg.name });
        this.render();
      } else {
        this.game.hud.showToast({
          title: 'Outer Expansion Reserve',
          text: `${Math.round(wx)}m E, ${Math.round(wz)}m S — charted inside the 15×15 km expansion blueprint.`,
        });
      }
    });
  }

  _spanHalf() {
    return this.layers.expansion15km ? WORLD_CONFIG.ULTIMATE_HALF_M : WORLD_CONFIG.PLAYABLE_HALF_M;
  }

  _worldToCanvas(x, z) {
    const h = this._spanHalf();
    const s = this.canvas.width;
    return [((x + h) / (2 * h)) * s, ((z + h) / (2 * h)) * s];
  }

  _canvasToWorld(px, py) {
    const h = this._spanHalf();
    const s = this.canvas.width;
    return [(px / s) * 2 * h - h, (py / s) * 2 * h - h];
  }

  _getBakedBase(expansionMode, showBiomes, showElev) {
    const key = `${expansionMode}_${showBiomes}_${showElev}`;
    if (this._baseCache.has(key)) return this._baseCache.get(key);

    const res = 140;
    const off = document.createElement('canvas');
    off.width = res;
    off.height = res;
    const octx = off.getContext('2d');
    const img = octx.createImageData(res, res);
    const half = expansionMode ? WORLD_CONFIG.ULTIMATE_HALF_M : WORLD_CONFIG.PLAYABLE_HALF_M;
    const terrain = this.game.world.terrain;

    for (let iy = 0; iy < res; iy++) {
      const wz = (iy / (res - 1)) * 2 * half - half;
      for (let ix = 0; ix < res; ix++) {
        const wx = (ix / (res - 1)) * 2 * half - half;
        const h = terrain.getHeight(wx, wz);
        let r = 212, g = 204, b = 182;

        if (h < 0) {
          const depth = Math.min(1, -h / 12);
          r = Math.round(78 - depth * 42);
          g = Math.round(186 - depth * 72);
          b = Math.round(196 - depth * 54);
        } else if (showBiomes) {
          const col = terrain.getVertexColor(wx, wz, h, 0.92);
          r = Math.round(col[0] * 245);
          g = Math.round(col[1] * 245);
          b = Math.round(col[2] * 238);
        }

        if (showElev && h >= 0) {
          // Subtle topographic contour lines every 14m
          const contour = Math.abs((h % 14) - 7) < 0.7;
          if (contour) {
            r = Math.round(r * 0.84);
            g = Math.round(g * 0.84);
            b = Math.round(b * 0.84);
          }
        }

        // Dim outer 161 km² planned expansion ring subtly
        if (expansionMode && (Math.abs(wx) > WORLD_CONFIG.PLAYABLE_HALF_M || Math.abs(wz) > WORLD_CONFIG.PLAYABLE_HALF_M)) {
          r = Math.round(r * 0.58 + 75);
          g = Math.round(g * 0.62 + 78);
          b = Math.round(b * 0.7 + 72);
        }

        const idx = (iy * res + ix) * 4;
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    this._baseCache.set(key, off);
    return off;
  }

  open() {
    this.el.classList.remove('hidden');
    this.render();
  }

  close() {
    this.el.classList.add('hidden');
  }

  render() {
    const ctx = this.ctx;
    const S = this.canvas.width;
    this.scopeLabel.textContent = this.layers.expansion15km
      ? '15×15 km Ultimate Architecture (225 km²)'
      : '8×8 km Playable Realm (64 km²)';
    this.pctLabel.textContent = `Explored: ${this.game.exploration.getExplorationPercent()}%`;

    // 1. Base biome/elevation map
    const base = this._getBakedBase(this.layers.expansion15km, this.layers.biomes, this.layers.elevation);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(base, 0, 0, S, S);

    // 2. Rivers & Roads
    if (this.layers.waterRoads) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Silver River
      ctx.strokeStyle = 'rgba(66, 184, 198, 0.9)';
      ctx.lineWidth = this.layers.expansion15km ? 3 : 5;
      for (const rv of RIVERS) {
        ctx.beginPath();
        rv.points.forEach(([x, z], i) => {
          const [px, py] = this._worldToCanvas(x, z);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }

      // Roads
      ctx.strokeStyle = 'rgba(232, 206, 154, 0.85)';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2;
      for (const road of ROADS) {
        ctx.beginPath();
        road.forEach(([x, z], i) => {
          const [px, py] = this._worldToCanvas(x, z);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // 3. Soft Watercolor Fog-of-War overlay over unexplored cells inside 8x8 km
    const exp = this.game.exploration;
    const cellW = (WORLD_CONFIG.PLAYABLE_SIZE_M / exp.gridSize);
    ctx.fillStyle = 'rgba(225, 218, 200, 0.42)';
    for (let cz = 0; cz < exp.gridSize; cz++) {
      for (let cx = 0; cx < exp.gridSize; cx++) {
        if (exp.fogGrid[cz * exp.gridSize + cx]) continue;
        const wx = -WORLD_CONFIG.PLAYABLE_HALF_M + cx * cellW;
        const wz = -WORLD_CONFIG.PLAYABLE_HALF_M + cz * cellW;
        const [x0, y0] = this._worldToCanvas(wx, wz);
        const [x1, y1] = this._worldToCanvas(wx + cellW, wz + cellW);
        ctx.fillRect(x0, y0, x1 - x0 + 0.5, y1 - y0 + 0.5);
      }
    }

    // 4. Playable 8x8 km border frame when viewing 15x15 km Expansion Plan
    if (this.layers.expansion15km) {
      const [bx0, by0] = this._worldToCanvas(-WORLD_CONFIG.PLAYABLE_HALF_M, -WORLD_CONFIG.PLAYABLE_HALF_M);
      const [bx1, by1] = this._worldToCanvas(WORLD_CONFIG.PLAYABLE_HALF_M, WORLD_CONFIG.PLAYABLE_HALF_M);
      ctx.strokeStyle = '#ffdf78';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);
      ctx.setLineDash([]);

      ctx.fillStyle = '#2a3342';
      ctx.font = 'bold 11px Georgia, serif';
      ctx.textAlign = 'center';
      for (const ez of EXPANSION_ZONES) {
        const [ex, ey] = this._worldToCanvas(ez.x, ez.z);
        ctx.fillText(`${ez.name} (${ez.areaKm2} km²)`, ex, ey);
      }
    }

    // 5. Region labels
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px Georgia, serif';
    for (const r of REGIONS) {
      const [rx, ry] = this._worldToCanvas(r.cx, r.cz);
      ctx.fillStyle = 'rgba(28, 36, 48, 0.78)';
      ctx.fillText(r.name.toUpperCase(), rx, ry);
    }

    // 6. Landmarks & Waystones
    if (this.layers.landmarks) {
      for (const lm of LANDMARKS) {
        const discovered = exp.discoveredLandmarks.has(lm.id);
        const attuned = exp.attunedWaystones.has(lm.id);
        if (!discovered && !lm.hasWaystone) continue; // Keep secret shrines hidden until discovered!
        const [lx, ly] = this._worldToCanvas(lm.x, lm.z);

        ctx.beginPath();
        ctx.arc(lx, ly, attuned ? 7.5 : 5, 0, Math.PI * 2);
        ctx.fillStyle = attuned ? '#4ae8f5' : discovered ? '#ffd76a' : 'rgba(65,78,96,0.55)';
        ctx.fill();
        ctx.strokeStyle = '#1f2836';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        if (discovered) {
          ctx.fillStyle = '#18212e';
          ctx.font = '10px system-ui, sans-serif';
          ctx.fillText(lm.name, lx, ly - 10);
        }
      }

      // Moored Sailboats (navy diamond) & Solved/Active Puzzles
      for (const b of this.game.world.boats?.boats || []) {
        const [bx, by] = this._worldToCanvas(b.group.position.x, b.group.position.z);
        ctx.fillStyle = '#235c88';
        ctx.fillRect(bx - 4, by - 4, 8, 8);
        ctx.strokeStyle = '#fff5dd';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(bx - 4, by - 4, 8, 8);
      }

      for (const pz of this.game.puzzles?.puzzles || []) {
        const solved = this.game.puzzles.solved.has(pz.id);
        const [zx, zy] = this._worldToCanvas(pz.cx, pz.cz);
        ctx.beginPath();
        ctx.arc(zx, zy, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = solved ? '#62e082' : '#d89cf5';
        ctx.fill();
      }
    }

    // 6b. Custom Waypoint Pin
    const wpBar = this.el.querySelector('#map-waypoint-bar');
    if (this.game.waypoint) {
      const [wx, wy] = this._worldToCanvas(this.game.waypoint.x, this.game.waypoint.z);
      ctx.beginPath();
      ctx.arc(wx, wy, 9, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff6b4a';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wx, wy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe082';
      ctx.fill();

      if (wpBar) {
        wpBar.innerHTML = `
          <div class="landmark-row attuned">
            <div><div class="lm-name">◎ Pin: ${this.game.waypoint.regionName}</div><div class="lm-meta">${this.game.waypoint.x}m, ${this.game.waypoint.z}m</div></div>
            <button class="btn-mini danger" id="clear-wp-btn" type="button">Clear</button>
          </div>
        `;
        wpBar.querySelector('#clear-wp-btn').addEventListener('click', () => {
          this.game.setWaypoint(null);
          this.render();
        });
      }
    } else if (wpBar) {
      wpBar.innerHTML = '';
    }

    // 7. Player Marker Arrow
    const pos = this.game.player.root.position;
    const [px, py] = this._worldToCanvas(pos.x, pos.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-this.game.player.facingYaw + Math.PI);
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fillStyle = '#ff5942';
    ctx.fill();
    ctx.strokeStyle = '#fff9ee';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    // Populate Sidebar Waystones & Landmarks List
    this.listEl.innerHTML = '';
    for (const lm of LANDMARKS) {
      if (!lm.hasWaystone && !exp.discoveredLandmarks.has(lm.id)) continue;
      const discovered = exp.discoveredLandmarks.has(lm.id);
      const attuned = exp.attunedWaystones.has(lm.id);
      const row = document.createElement('div');
      row.className = `landmark-row ${attuned ? 'attuned' : discovered ? 'discovered' : 'uncharted'}`;
      row.innerHTML = `
        <div>
          <div class="lm-name">${attuned ? '✦ ' : discovered ? '◆ ' : '? '}${discovered ? lm.name : 'Uncharted Waystone'}</div>
          <div class="lm-meta">${Math.round(Math.hypot(lm.x - pos.x, lm.z - pos.z))} m away</div>
        </div>
        ${
          attuned
            ? `<button class="btn-mini" data-travel="${lm.id}" type="button">Travel</button>`
            : `<span class="lm-tag">${discovered ? 'Found' : 'Explore'}</span>`
        }
      `;
      this.listEl.appendChild(row);
    }

    for (const btn of this.listEl.querySelectorAll('button[data-travel]')) {
      btn.addEventListener('click', () => this.game.fastTravelTo(btn.dataset.travel));
    }
  }
}
