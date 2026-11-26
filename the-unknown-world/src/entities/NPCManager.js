// Living Settlement & World NPC System:
// 6 named stylized 3D NPCs with distinct silhouettes, gentle daily schedules (strolling trails by day,
// gathering by the Crossroads Hearth at night), and interactive branching dialogue & quests.
import * as THREE from 'three';
import { patchWatercolorMaterial } from '../world/WatercolorShader.js';

const NPC_DEFS = [
  {
    id: 'elder-maren',
    name: 'Elder Maren',
    role: 'Keeper of the Crossroads',
    robeColor: 0x6b4f78,
    hatColor: 0xd9b86c,
    dayPos: [6, 374],
    nightPos: [4.5, 379],
    dialogue: {
      greeting:
        'Welcome, Wayfarer. The winds have carried strange harmonic chimes from the western groves all week. The ancient seals are stirring again.',
      options: [
        {
          label: 'Tell me about The Unknown Gate.',
          reply:
            'Beyond the Hidden Frontier to the southwest stands a ring of ancient stone older than the Forgotten Kingdom. Follow the Singing Obelisks west along the road, visit the Ancient Heart Tree, and attune three Regional Waystones to map its resonance.',
        },
        {
          label: 'How do I travel across all eight regions?',
          reply:
            'Every major landmark holds an ancient Waystone. Once you attune one, open your World Map [M] and click any awakened Waystone to fast-travel across the 8×8 km continent—or glide from mountain peaks on your Spirit Glider [Space in mid-air]!',
        },
      ],
    },
  },
  {
    id: 'herbalist-lyra',
    name: 'Herbalist Lyra',
    role: 'Meadow Apothecary',
    robeColor: 0x458059,
    hatColor: 0xe6d39c,
    dayPos: [-11, 376],
    nightPos: [-4.5, 382],
    questId: 'herbs-of-the-canopy',
    dialogue: {
      greeting:
        'The sunlit clover is blooming brightly today! If you are heading into Emerald Wilds, keep an eye out for glowing Silver Moonpetals and Golden Sunberries.',
      options: [
        {
          label: 'Accept Quest: Herbs of the Emerald Canopy',
          acceptQuest: 'herbs-of-the-canopy',
          reply:
            'Thank you, Wayfarer! Gather 3 Golden Sunberries and 2 Silver Moonpetals, then return to me. You can also cook warm Berry Stews right inside your Inventory [I] -> Crafting.',
        },
        {
          label: 'Any tips for surviving the Highland peaks?',
          reply:
            'Snowy summits drain your warmth slowly. Rest at the Crossroads Hearth or carry Berry Stew and Spiced Trout Roast before climbing toward the Skywatch Observatory.',
        },
      ],
    },
  },
  {
    id: 'blacksmith-torin',
    name: 'Blacksmith Torin',
    role: 'Relic Forger',
    robeColor: 0x9c4e38,
    hatColor: 0x5c534a,
    dayPos: [14, 392],
    nightPos: [3.8, 384.5],
    questId: 'forge-of-the-old-kingdom',
    dialogue: {
      greeting:
        'A fine heartwood staff you carry, traveler—yet against the bronze Stone Sentinels east of the river, you will want resonant crystal inlaid into it.',
      options: [
        {
          label: 'Accept Quest: Forge of the Old Kingdom',
          acceptQuest: 'forge-of-the-old-kingdom',
          reply:
            'Prove your mettle! Defeat a Bramble Stalker or Stone Sentinel, gather 2 Resonant Crystal Shards, and craft any gear or stew. With a Sentinel Core and crystals you can forge the Citadel Runeblade Staff!',
        },
        {
          label: 'Combat advice for a Wayfarer?',
          reply:
            'Watch when a guardian glows crimson—that is your cue to Dodge Roll [Ctrl / C] or raise your Runic Shield [Right-Click / L]. A Heavy Arcane Wave [Shift+Click / K] staggers foes around you!',
        },
      ],
    },
  },
  {
    id: 'cartographer-solen',
    name: 'Cartographer Solen',
    role: 'Horizon Mapper',
    robeColor: 0x3b6f8c,
    hatColor: 0xc2924e,
    dayPos: [-8, 396],
    nightPos: [-4.2, 376.5],
    dialogue: {
      greeting:
        'Eight distinct regions stretch across sixty-four square kilometres around us—and beyond the mist-rimmed frontiers lie another one hundred sixty-one square kilometres yet to be charted!',
      options: [
        {
          label: 'What landmarks should I seek first?',
          reply:
            'Start right in our valley: the Singing Obelisks lie just west along the forest trail, Sun-Mirror Terrace sits east across the Silver River stone bridge, and Meadow Seal Cairn lies just south. From there, seek the Ancient Heart Tree!',
        },
        {
          label: 'How do I read the World Map?',
          reply:
            'Press [M] to open your Watercolor Cartography Map. You can toggle Biome Regions, Elevation Contours, Rivers & Roads, Landmarks, and even preview the 15×15 km Outer Frontier Expansion blueprint.',
        },
      ],
    },
  },
  {
    id: 'fisherman-kael',
    name: 'Fisherman Kael',
    role: 'Silver River Angler',
    robeColor: 0x4b7a8a,
    hatColor: 0xdcc58c,
    dayPos: [62, 366],
    nightPos: [62, 366],
    dialogue: {
      greeting:
        'Peaceful water by the stone bridge today. Follow the Silver River southeast and it widens straight into the turquoise bays of Azure Coast.',
      options: [
        {
          label: 'What lies across the bridge?',
          reply:
            'Just past the eastern span stands Sun-Mirror Terrace—rotate its three ancient crystal prisms until all golden beams shine on the central altar. Further east rise the ruins of the Forgotten Kingdom.',
        },
        {
          label: 'Can I swim in the river and coast?',
          reply:
            'Aye! Wade right in and swim across any river or coastal lagoon. Just mind the sunken limestone ruins at The Drowned Archive out southeast.',
        },
      ],
    },
  },
  {
    id: 'mystic-veyra',
    name: 'Mystic Veyra',
    role: 'Forest Listener',
    robeColor: 0x76589c,
    hatColor: 0x8adff0,
    dayPos: [-135, 290],
    nightPos: [-135, 290],
    dialogue: {
      greeting:
        'Listen closely to the three standing stones behind me, Wayfarer. The shortest stone hums the deepest earth-note; the tallest sings to the canopy.',
      options: [
        {
          label: 'What lies deeper in Emerald Wilds?',
          reply:
            'Follow this mossy road northwest and you will see golden light filtering through the branches—The Ancient Heart Tree awaits, and far above the northern ridges sits Skywatch Observatory.',
        },
      ],
    },
  },
];

export class NPCManager {
  constructor(scene, terrain, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.events = eventBus;
    this.npcs = [];
    this.root = new THREE.Group();
    this.root.name = 'world-npcs';
    scene.add(this.root);

    this._spawnAll();
  }

  _buildNpcMesh(def) {
    const g = new THREE.Group();
    const robeMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: def.robeColor, roughness: 0.8 }),
      { rimStrength: 0.3, inkEdge: 0.22 }
    );
    const hatMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: def.hatColor, roughness: 0.78 })
    );
    const skinMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0xf0c9ab, roughness: 0.75 })
    );

    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.48, 1.38, 9), robeMat);
    robe.position.y = 0.7;
    robe.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skinMat);
    head.position.y = 1.62;
    head.castShadow = true;
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.36, 8), hatMat);
    hat.position.y = 1.94;
    hat.castShadow = true;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.06, 10), hatMat);
    brim.position.y = 1.78;

    // Subtle floating conversation / quest beacon above NPC
    const badgeMat = new THREE.MeshBasicMaterial({ color: def.questId ? 0xffd966 : 0x8beeff });
    const badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), badgeMat);
    badge.position.y = 2.48;

    g.add(robe, head, hat, brim, badge);
    return { group: g, badge };
  }

  _spawnAll() {
    for (const def of NPC_DEFS) {
      const { group, badge } = this._buildNpcMesh(def);
      const y = this.terrain.getHeight(def.dayPos[0], def.dayPos[1]);
      group.position.set(def.dayPos[0], y, def.dayPos[1]);
      this.root.add(group);
      this.npcs.push({
        def,
        group,
        badge,
        x: def.dayPos[0],
        y,
        z: def.dayPos[1],
        wanderPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  getInteractables(playerPos) {
    const out = [];
    for (const n of this.npcs) {
      if (Math.hypot(playerPos.x - n.x, playerPos.z - n.z) <= 4.2) {
        out.push({
          id: `npc_${n.def.id}`,
          type: 'npc',
          npc: n.def,
          label: `Speak with ${n.def.name} (${n.def.role})`,
          x: n.x,
          y: n.y,
          z: n.z,
          radius: 4.0,
        });
      }
    }
    return out;
  }

  update(dt, elapsed, playerPos, timeOfDay) {
    const isNight = timeOfDay < 6.0 || timeOfDay > 19.5;
    for (const n of this.npcs) {
      const anchor = isNight ? n.def.nightPos : n.def.dayPos;
      // Gentle daytime stroll around station
      const tx = anchor[0] + (isNight ? 0 : Math.sin(elapsed * 0.25 + n.wanderPhase) * 2.2);
      const tz = anchor[1] + (isNight ? 0 : Math.cos(elapsed * 0.21 + n.wanderPhase) * 2.2);
      const dx = tx - n.x;
      const dz = tz - n.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.25) {
        const step = Math.min(dist, dt * 1.4);
        n.x += (dx / dist) * step;
        n.z += (dz / dist) * step;
        n.group.rotation.y = Math.atan2(dx, dz);
      } else if (Math.hypot(playerPos.x - n.x, playerPos.z - n.z) < 7) {
        // Turn gently to face nearby Wayfarer
        n.group.rotation.y = Math.atan2(playerPos.x - n.x, playerPos.z - n.z);
      }

      n.y = this.terrain.getHeight(n.x, n.z);
      n.group.position.set(n.x, n.y + Math.abs(Math.sin(elapsed * 2 + n.wanderPhase)) * 0.03, n.z);
      n.badge.rotation.y += dt * 1.6;
      n.badge.position.y = 2.48 + Math.sin(elapsed * 3 + n.wanderPhase) * 0.08;
    }
  }
}
