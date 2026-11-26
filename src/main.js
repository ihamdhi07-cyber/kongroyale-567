import * as THREE from "three";
import {
  heightAt,
  clampWorld,
  seeded,
  riverCenter,
  inRiver,
  RIVER_LEVEL,
} from "./world.js";
import "./style.css";
import { createPhysics } from "./physics.js";
import { SaveManager } from "./save/SaveManager.js";
import { Exploration, cellAt } from "./gameplay/Exploration.js";
import { Journey, PLANTS } from "./gameplay/Journey.js";
import { Environment, DEFAULT_ENVIRONMENT } from "./world/Environment.js";
import { Wildlife } from "./world/Wildlife.js";
import { createGuide, guideMessage, GUIDE } from "./world/Guide.js";
import { CombatSystem, GUARDIAN_HOME } from "./gameplay/CombatSystem.js";
import { createGuardian } from "./world/Guardian.js";
import { EchoPuzzle, TABLET, SWITCHES } from "./gameplay/EchoPuzzle.js";
import { Progression } from "./gameplay/Progression.js";
import { createEchoGrove } from "./world/EchoGrove.js";
import { AudioManager } from "./audio/AudioManager.js";
import { TerrainChunks } from "./world/TerrainChunks.js";
import { RiverSystem } from "./world/RiverSystem.js";
import { Survival, BUSHES, CAMP } from "./gameplay/Survival.js";
import { createCampsite } from "./world/Campsite.js";
const $ = (s) => document.querySelector(s),
  canvas = $("#world");
const saves = new SaveManager();
let saved = null,
  saveAvailable = false,
  saveProblem = "";
try {
  await saves.open();
  saved = await saves.load();
  saveAvailable = true;
} catch (error) {
  saveProblem = `Saving unavailable: ${error.message}`;
}
let exploration = new Exploration(saved?.explored, saved?.discoveries);
let journey = new Journey(saved?.journey);
let combat = new CombatSystem(saved?.combat);
let puzzle = new EchoPuzzle(saved?.puzzle);
let progression = new Progression(saved?.progress);
let survival = new Survival(saved?.survival);
const audio = new AudioManager(saved?.audio);
const initial = saved?.position || { x: 0, z: 9 };
const initialY = inRiver(initial.x, initial.z)
  ? RIVER_LEVEL - 1.1
  : heightAt(initial.x, initial.z);
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#bbcbb9");
scene.fog = new THREE.FogExp2("#b8c9b8", 0.0065);
const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 700);
const ambient = new THREE.HemisphereLight("#e4eed5", "#65755a", 2.3);
scene.add(ambient);
const sun = new THREE.DirectionalLight("#fff2d1", 3);
sun.position.set(-45, 80, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, {
  left: -45,
  right: 45,
  top: 45,
  bottom: -45,
  near: 1,
  far: 180,
});
sun.shadow.bias = -0.0004;
scene.add(sun, sun.target);
const environment = new Environment(
  scene,
  renderer,
  sun,
  ambient,
  saved?.environment ?? DEFAULT_ENVIRONMENT,
);
const physics = await createPhysics(null, {
  ...initial,
  y: initialY,
});
const terrain = new TerrainChunks(scene, physics);
terrain.update(initial.x, initial.z);
const river = new RiverSystem(scene);
const rand = seeded(481),
  trunkMat = new THREE.MeshStandardMaterial({ color: "#756d52", roughness: 1 }),
  leafMats = ["#557b62", "#668b6c", "#759676", "#496f5d"].map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 1 }),
  ),
  trunkGeo = new THREE.CylinderGeometry(0.25, 0.48, 1, 6),
  crownGeo = new THREE.ConeGeometry(1, 1, 7),
  treeCount = 460,
  trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount),
  crowns = leafMats.map((m) => new THREE.InstancedMesh(crownGeo, m, treeCount)),
  counts = [0, 0, 0, 0],
  dummy = new THREE.Object3D();
for (let i = 0; i < treeCount; i++) {
  let x = (rand() - 0.5) * 480,
    z = (rand() - 0.5) * 480;
  if (
    Math.abs(x - 5 * Math.sin(z * 0.025)) < 9 ||
    Math.hypot(x, z + 22) < 11 ||
    PLANTS.some((p) => Math.hypot(x - p.x, z - p.z) < 4) ||
    Math.hypot(x - GUIDE.x, z - GUIDE.z) < 4 ||
    Math.hypot(x - GUARDIAN_HOME.x, z - GUARDIAN_HOME.z) < 8 ||
    Math.hypot(x - TABLET.x, z - TABLET.z) < 12 ||
    Math.hypot(x - CAMP.x, z - CAMP.z) < 5 ||
    BUSHES.some((b) => Math.hypot(x - b.x, z - b.z) < 4)
  )
    x += 25;
  if (Math.abs(x - riverCenter(z)) < 20) x = riverCenter(z) + 25;
  const y = heightAt(x, z),
    h = 5 + rand() * 7,
    r = 2.2 + rand() * 2;
  physics.addCylinder(x, y - 0.2, z, 0.48, h * 0.5 + 0.2);
  dummy.position.set(x, y + h * 0.25, z);
  dummy.scale.set(1, h * 0.5, 1);
  dummy.rotation.set(0, rand() * 6, 0);
  dummy.updateMatrix();
  trunks.setMatrixAt(i, dummy.matrix);
  const n = i % 4;
  dummy.position.set(x, y + h * 0.7, z);
  dummy.scale.set(r, h * 0.75, r);
  dummy.updateMatrix();
  crowns[n].setMatrixAt(counts[n]++, dummy.matrix);
}
trunks.castShadow = true;
scene.add(trunks);
crowns.forEach((m, i) => {
  m.count = counts[i];
  m.castShadow = true;
  scene.add(m);
});
// Procedural placeholder art, not final assets.
const stone = new THREE.Group();
stone.position.set(0, heightAt(0, -22), -22);
scene.add(stone);
physics.addCylinder(0, stone.position.y, -22, 2, 4);
physics.sync();
const stoneMat = new THREE.MeshStandardMaterial({
  color: "#777f73",
  roughness: 0.92,
});
const base = new THREE.Mesh(
  new THREE.CylinderGeometry(2, 2.3, 0.5, 7),
  stoneMat,
);
base.position.y = 0.25;
stone.add(base);
const pillar = new THREE.Mesh(
  new THREE.CylinderGeometry(0.7, 1, 3.8, 5),
  stoneMat,
);
pillar.position.y = 2.3;
pillar.castShadow = true;
stone.add(pillar);
const rune = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.38),
  new THREE.MeshStandardMaterial({
    color: "#f6d68b",
    emissive: "#d6a24c",
    emissiveIntensity: 1.4,
  }),
);
rune.position.set(0, 2.7, 0.78);
stone.add(rune);
const halo = new THREE.Mesh(
  new THREE.RingGeometry(1.5, 1.58, 48),
  new THREE.MeshBasicMaterial({
    color: "#e9cf8c",
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65,
  }),
);
halo.rotation.x = -Math.PI / 2;
halo.position.y = 0.55;
stone.add(halo);
// Temporary procedural glowleaf plants; each is a unique, non-respawning resource.
const plantMeshes = PLANTS.map((plant) => {
  const group = new THREE.Group();
  group.position.set(plant.x, heightAt(plant.x, plant.z), plant.z);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 1.2, 6),
    new THREE.MeshStandardMaterial({ color: "#536f4e" }),
  );
  stem.position.y = 0.6;
  group.add(stem);
  const blossom = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5),
    new THREE.MeshStandardMaterial({
      color: "#dbe99a",
      emissive: "#91b951",
      emissiveIntensity: 0.8,
    }),
  );
  blossom.position.y = 1.4;
  group.add(blossom);
  group.visible = !journey.gathered.has(plant.id);
  scene.add(group);
  return group;
});
function syncJourneyVisuals() {
  plantMeshes.forEach(
    (mesh, i) => (mesh.visible = !journey.gathered.has(PLANTS[i].id)),
  );
  rune.material.emissiveIntensity = journey.restored ? 3 : 1.4;
  halo.material.opacity = journey.restored ? 1 : 0.65;
}
syncJourneyVisuals();
const wildlife = new Wildlife(scene);
const guide = createGuide(scene);
const guardian = createGuardian(scene);
const grove = createEchoGrove(scene);
const campsite = createCampsite(scene);
campsite.update(survival, 0);
grove.update(puzzle.stage);
const player = new THREE.Group();
scene.add(player);
const mat = (color) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
function part(geo, color, x, y, z) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  player.add(m);
  return m;
}
part(new THREE.CapsuleGeometry(0.48, 1, 4, 8), "#dfd1ad", 0, 1.65, 0);
part(new THREE.SphereGeometry(0.38, 12, 8), "#d7aa83", 0, 2.65, 0);
part(new THREE.ConeGeometry(0.52, 0.55, 8), "#535f49", 0, 3.05, 0);
part(new THREE.BoxGeometry(0.75, 0.85, 0.25), "#68785b", 0, 1.8, 0.4);
const left = part(
    new THREE.CapsuleGeometry(0.17, 0.55, 4, 6),
    "#514d3d",
    -0.25,
    0.6,
    0,
  ),
  right = part(
    new THREE.CapsuleGeometry(0.17, 0.55, 4, 6),
    "#514d3d",
    0.25,
    0.6,
    0,
  );
// Placeholder blade pivots during attacks so input has visible feedback.
const bladePivot = new THREE.Group();
bladePivot.position.set(0.65, 1.55, 0.2);
const blade = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 1.3, 0.16),
  mat("#d9d7bb"),
);
blade.position.y = 0.55;
bladePivot.add(blade);
const grip = new THREE.Mesh(
  new THREE.BoxGeometry(0.4, 0.1, 0.16),
  mat("#6c5944"),
);
bladePivot.add(grip);
player.add(bladePivot);
const state = {
  x: initial.x,
  z: initial.z,
  y: initialY,
  swimming: false,
  yaw: 0,
  pitch: 0.58,
  distance: 22,
  started: false,
};
const saveStatus = $("#saveStatus");
function showSaveStatus(message) {
  saveStatus.textContent = message;
  $("#saveIndicator").textContent = message;
}
showSaveStatus(saveProblem || (saved ? "SAVED JOURNEY FOUND" : "NEW JOURNEY"));
$("#start").firstChild.textContent = saved
  ? "CONTINUE JOURNEY "
  : "BEGIN EXPLORING ";
$("#newGame").hidden = !saved && !saveProblem;
function updateObjective() {
  const title = $(".objective strong"),
    detail = $(".objective p");
  if (journey.restored) {
    title.textContent = "A light in the wilds";
    detail.textContent =
      "The waystone shines again. Your first journey is complete.";
  } else if (!exploration.discoveries.has("waystone")) {
    title.textContent = "Follow the golden light";
    detail.textContent = "Find the old waystone in the clearing.";
  } else if (journey.lantern) {
    title.textContent = "Return to the waystone";
    detail.textContent = "Use your wayfarer's light to restore its glow.";
  } else if (journey.leaves >= 3) {
    title.textContent = "Make a wayfarer's light";
    detail.textContent =
      "Open your bag and craft a light from three glowleaves.";
  } else {
    title.textContent = "Gather the glowleaves";
    detail.textContent = `Find the luminous plants near the clearing · ${journey.leaves} / 3`;
  }
}
updateObjective();
let pendingSaves = 0,
  saveSequence = 0;
window.addEventListener("beforeunload", (event) => {
  // Browsers may ignore this warning (especially on mobile), but never silently
  // report completion while a transaction is still pending.
  if (pendingSaves) {
    event.preventDefault();
    event.returnValue = "";
  }
});
async function saveGame() {
  if (!saveAvailable) return;
  const sequence = ++saveSequence;
  pendingSaves++;
  showSaveStatus("SAVING JOURNEY…");
  try {
    await saves.save({
      ...exploration.snapshot(state.x, state.z),
      journey: journey.snapshot(),
      environment: environment.snapshot(),
      combat: combat.snapshot(),
      puzzle: puzzle.snapshot(),
      progress: progression.snapshot(),
      audio: audio.snapshot(),
      survival: survival.snapshot(),
    });
    if (sequence === saveSequence)
      showSaveStatus("JOURNEY SAVED ON THIS DEVICE");
  } catch (error) {
    if (sequence === saveSequence)
      showSaveStatus(`Save failed: ${error.message}`);
  } finally {
    pendingSaves--;
  }
}
function renderMap() {
  const map = $("#mapGrid");
  map.replaceChildren();
  const current = cellAt(state.x, state.z);
  for (let i = 0; i < 100; i++) {
    const cell = document.createElement("div");
    cell.className = exploration.explored.has(i)
      ? "map-cell explored"
      : "map-cell";
    if (i === current) {
      cell.textContent = "◆";
      cell.classList.add("current");
    } else if (i === cellAt(0, -22) && exploration.discoveries.has("waystone"))
      cell.textContent = "✧";
    else if (i === cellAt(TABLET.x, TABLET.z) && puzzle.discovered)
      cell.textContent = "◇";
    map.append(cell);
  }
  $("#mapCount").textContent =
    `${exploration.explored.size} / 100 areas explored`;
}
function toggleMap() {
  if (
    (!state.started ||
      !$("#bagPanel").hidden ||
      !$("#settingsPanel").hidden ||
      !$("#journalPanel").hidden) &&
    $("#mapPanel").hidden
  )
    return;
  $("#mapPanel").hidden = !$("#mapPanel").hidden;
  if (!$("#mapPanel").hidden) {
    renderMap();
    keys.clear();
    resetJoy();
  }
}
$("#mapButton").addEventListener("click", toggleMap);
$("#closeMap").addEventListener("click", toggleMap);
function renderBag() {
  $("#leafCount").textContent = journey.leaves;
  $("#berryCount").textContent = survival.berries;
  $("#mealCount").textContent = survival.meals;
  $("#eatButton").disabled = survival.meals === 0 || combat.health >= 100;
  $("#lanternCount").textContent = journey.lantern ? "1" : "—";
  $("#craftButton").disabled = journey.leaves < 3 || journey.lantern;
  $("#craftInfo").textContent = journey.lantern
    ? "Your light is ready to restore the waystone."
    : "Craft a wayfarer's light from 3 glowleaves.";
}
function toggleBag() {
  if (
    (!state.started ||
      !$("#mapPanel").hidden ||
      !$("#settingsPanel").hidden ||
      !$("#journalPanel").hidden) &&
    $("#bagPanel").hidden
  )
    return;
  $("#bagPanel").hidden = !$("#bagPanel").hidden;
  if (!$("#bagPanel").hidden) {
    renderBag();
    keys.clear();
    resetJoy();
  }
}
$("#bagButton").addEventListener("click", toggleBag);
$("#closeBag").addEventListener("click", toggleBag);
function toggleSettings() {
  if (
    (!state.started ||
      !$("#mapPanel").hidden ||
      !$("#bagPanel").hidden ||
      !$("#journalPanel").hidden) &&
    $("#settingsPanel").hidden
  )
    return;
  $("#settingsPanel").hidden = !$("#settingsPanel").hidden;
  if (!$("#settingsPanel").hidden) {
    $("#qualitySelect").value = environment.quality;
    $("#weatherSelect").value = environment.weather;
    for (const key of ["master", "music", "effects", "ambience"])
      $("#" + key + "Volume").value = audio.settings[key];
    $("#muteAudio").checked = audio.settings.muted;
    keys.clear();
    resetJoy();
  }
}
function renderJournal() {
  $("#journalWaystone").textContent = journey.restored
    ? "Complete: the waystone shines again."
    : !exploration.discoveries.has("waystone")
      ? "Follow the path to the golden light."
      : journey.lantern
        ? "Return to the waystone with your light."
        : `Gather glowleaves and craft a light (${journey.leaves}/3).`;
  $("#journalGrove").hidden = !puzzle.discovered;
  $("#journalPuzzle").textContent =
    puzzle.stage === 3
      ? "Complete: the grove's secret has awakened."
      : `The tablet reads: Moon, then Sun, then Star. Sequence: ${puzzle.stage}/3.`;
  $("#journalXp").textContent = `${progression.xp} exploration XP`;
  $("#journalSkill").textContent = progression.swift
    ? "Unlocked: Fleetfoot — sprint speed increased."
    : "Discoveries grant XP. Hidden places may hold new abilities.";
}
function toggleJournal() {
  if (
    (!state.started ||
      !$("#mapPanel").hidden ||
      !$("#bagPanel").hidden ||
      !$("#settingsPanel").hidden) &&
    $("#journalPanel").hidden
  )
    return;
  $("#journalPanel").hidden = !$("#journalPanel").hidden;
  if (!$("#journalPanel").hidden) {
    renderJournal();
    keys.clear();
    resetJoy();
  }
}
$("#journalButton").addEventListener("click", toggleJournal);
$("#closeJournal").addEventListener("click", toggleJournal);
$("#settingsButton").addEventListener("click", toggleSettings);
$("#closeSettings").addEventListener("click", toggleSettings);
$("#qualitySelect").addEventListener("change", (event) => {
  environment.quality = event.target.value;
  environment.applyQuality();
  resize();
  saveGame();
});
$("#weatherSelect").addEventListener("change", (event) => {
  environment.weather = event.target.value;
  saveGame();
});
for (const key of ["master", "music", "effects", "ambience"]) {
  const slider = $("#" + key + "Volume");
  slider.addEventListener("input", () => {
    audio.settings[key] = Number(slider.value);
    audio.apply();
  });
  slider.addEventListener("change", saveGame);
}
$("#muteAudio").addEventListener("change", (event) => {
  audio.settings.muted = event.target.checked;
  audio.apply();
  saveGame();
});
function startAudio() {
  audio
    .start()
    .then(
      () => ($("#audioStatus").textContent = "Synthesized audio is active."),
    )
    .catch(
      (error) =>
        ($("#audioStatus").textContent = `Audio unavailable: ${error.message}`),
    );
}
$("#eatButton").addEventListener("click", () => {
  const health = survival.eat(combat.health);
  if (health !== null) {
    combat.health = health;
    audio.play("gather");
    renderBag();
    saveGame();
  }
});
$("#craftButton").addEventListener("click", () => {
  if (journey.craft()) {
    renderBag();
    updateObjective();
    saveGame();
  }
});
const keys = new Set();
let jump = false,
  joystick = { x: 0, y: 0 },
  touchBlock = false,
  touchSprint = false,
  dodgeX = 0,
  dodgeZ = 0;
function gameRunning() {
  return (
    state.started &&
    $("#mapPanel").hidden &&
    $("#bagPanel").hidden &&
    $("#settingsPanel").hidden &&
    $("#journalPanel").hidden
  );
}
function attack(type) {
  if (!gameRunning()) return;
  const result = combat.attack(type, state, player.rotation.y);
  if (!result) return;
  audio.play("hit");
  if (result.hit) {
    if (result.defeated) progression.award("guardian");
    notify(
      "GUARDIAN",
      result.defeated ? "The guardian falls" : "A strike lands",
      result.defeated
        ? "The clearing is quiet again."
        : "The guardian takes damage.",
    );
    saveGame();
  }
}
function dodge() {
  if (!gameRunning() || !combat.dodge()) return;
  // Roll away from the current facing when no directional movement is selected.
  let x =
    (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
    (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) +
    joystick.x;
  let z =
    (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
    (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) +
    joystick.y;
  const length = Math.hypot(x, z);
  if (length > 0.05) {
    x /= length;
    z /= length;
    dodgeX = x * Math.cos(state.yaw) + z * Math.sin(state.yaw);
    dodgeZ = -x * Math.sin(state.yaw) + z * Math.cos(state.yaw);
  } else {
    dodgeX = -Math.sin(player.rotation.y);
    dodgeZ = -Math.cos(player.rotation.y);
  }
}
window.addEventListener("keydown", (e) => {
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code,
    )
  )
    e.preventDefault();
  keys.add(e.code);
  if (e.code === "Space" && !e.repeat && gameRunning()) jump = true;
  if (
    e.code === "KeyE" &&
    !e.repeat &&
    state.started &&
    $("#mapPanel").hidden &&
    $("#bagPanel").hidden
  )
    interact();
  if (e.code === "KeyM" && !e.repeat) toggleMap();
  if (e.code === "KeyI" && !e.repeat) toggleBag();
  if (e.code === "KeyJ" && !e.repeat) toggleJournal();
  if (e.code === "KeyF" && !e.repeat) attack("light");
  if (e.code === "KeyG" && !e.repeat) attack("heavy");
  if (e.code === "KeyQ" && !e.repeat) dodge();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  keys.clear();
  touchBlock = false;
  touchSprint = false;
});
let noticeTimer;
function notify(label, title, description) {
  const notice = $("#notice");
  notice.replaceChildren();
  for (const [tag, text] of [
    ["small", label],
    ["strong", title],
    ["p", description],
  ]) {
    const element = document.createElement(tag);
    element.textContent = text;
    notice.append(element);
  }
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (notice.hidden = true), 5000);
}
function nearestInteraction() {
  let nearest = null,
    distance = 5;
  const stoneDistance = Math.hypot(
    state.x - stone.position.x,
    state.z - stone.position.z,
  );
  if (stoneDistance < distance) {
    nearest = { type: "stone" };
    distance = stoneDistance;
  }
  const guideDistance = Math.hypot(state.x - GUIDE.x, state.z - GUIDE.z);
  if (guideDistance < Math.min(distance, 3)) {
    nearest = { type: "guide" };
    distance = guideDistance;
  }
  const campDistance = Math.hypot(state.x - CAMP.x, state.z - CAMP.z);
  if (campDistance < Math.min(distance, 2.6)) {
    nearest = { type: "camp" };
    distance = campDistance;
  }
  BUSHES.forEach((bush) => {
    if (survival.picked.has(bush.id)) return;
    const d = Math.hypot(state.x - bush.x, state.z - bush.z);
    if (d < Math.min(distance, 2.3)) {
      nearest = { type: "berry", id: bush.id };
      distance = d;
    }
  });
  const tabletDistance = Math.hypot(state.x - TABLET.x, state.z - TABLET.z);
  if (tabletDistance < Math.min(distance, 2.6)) {
    nearest = { type: "tablet" };
    distance = tabletDistance;
  }
  SWITCHES.forEach((point) => {
    const d = Math.hypot(state.x - point.x, state.z - point.z);
    if (d < Math.min(distance, 2.3)) {
      nearest = { type: "switch", id: point.id };
      distance = d;
    }
  });
  PLANTS.forEach((plant) => {
    if (journey.gathered.has(plant.id)) return;
    const d = Math.hypot(state.x - plant.x, state.z - plant.z);
    if (d < Math.min(distance, 3)) {
      nearest = { type: "plant", id: plant.id };
      distance = d;
    }
  });
  return nearest;
}
function interact() {
  if (
    !state.started ||
    !$("#mapPanel").hidden ||
    !$("#bagPanel").hidden ||
    !$("#settingsPanel").hidden ||
    !$("#journalPanel").hidden
  )
    return;
  const target = nearestInteraction();
  if (!target) return;
  if (target.type === "berry") {
    if (!survival.gather(target.id)) return;
    audio.play("gather");
    notify(
      "MATERIAL GATHERED",
      "Wild berries",
      `Two berries can be cooked at the camp. You carry ${survival.berries}.`,
    );
  } else if (target.type === "camp") {
    const cooked = survival.cook();
    const rested = combat.health < 100;
    combat.health = 100;
    combat.stamina = 100;
    audio.play("gather");
    notify(
      "THE CAMPFIRE",
      cooked ? "A warm meal" : "A moment of rest",
      cooked
        ? "You cooked a berry meal and rested. Eat it from your satchel when hurt."
        : rested
          ? "You rest and recover your health and stamina."
          : "You rest by the fire. Bring two berries to cook a meal.",
    );
  } else if (target.type === "tablet") {
    puzzle.read();
    audio.play("puzzle");
    notify(
      "ANCIENT INSCRIPTION",
      "The Echo Grove",
      "When night yields to dawn, follow the sky: Moon, then Sun, then Star.",
    );
  } else if (target.type === "switch") {
    const result = puzzle.press(target.id);
    audio.play("puzzle");
    if (result === "locked")
      notify(
        "SILENT STONE",
        "An unread pattern",
        "Find and read the nearby inscription first.",
      );
    else if (result === "reset")
      notify(
        "THE GROVE FALLS QUIET",
        "The pattern resets",
        "Return to the inscription and listen to the order.",
      );
    else if (result === "solved") {
      progression.award("puzzle");
      notify(
        "DISCOVERY COMPLETE",
        "Fleetfoot awakened",
        "The grove grants you a faster sprint. Open your journal to review it.",
      );
    } else if (result === "complete")
      notify(
        "THE ECHO GROVE",
        "The stones are awake",
        "The pattern still shines in the clearing.",
      );
    else
      notify(
        "A STONE AWAKENS",
        target.id.toUpperCase(),
        `The pattern holds: ${puzzle.stage} of 3.`,
      );
    grove.update(puzzle.stage);
  } else if (target.type === "guide") {
    guide.rotation.y = Math.atan2(state.x - GUIDE.x, state.z - GUIDE.z);
    notify(
      "TRAVELER",
      GUIDE.name,
      guideMessage(
        exploration.discoveries.has("waystone"),
        journey.lantern,
        journey.restored,
      ),
    );
  } else if (target.type === "plant") {
    if (!journey.gather(target.id)) return;
    audio.play("gather");
    notify(
      "MATERIAL GATHERED",
      "Glowleaf",
      "A little of the forest's light, held in your hands.",
    );
  } else if (!exploration.discoveries.has("waystone")) {
    exploration.discover("waystone");
    progression.award("waystone");
    notify(
      "DISCOVERY RECORDED",
      "The Waystone",
      "Its inscription asks for a light made from three glowleaves.",
    );
  } else if (journey.restore()) {
    progression.award("restored");
    notify(
      "JOURNEY COMPLETE",
      "A light in the wilds",
      "The waystone glows once more. Someone may follow its light home.",
    );
  } else if (!journey.restored) {
    notify(
      "THE WAYSTONE",
      "A faded inscription",
      "Gather three glowleaves and craft a light in your bag.",
    );
  } else {
    notify(
      "THE WAYSTONE",
      "A light in the wilds",
      "The light will guide the next traveler.",
    );
  }
  syncJourneyVisuals();
  campsite.update(survival, 0);
  updateObjective();
  saveGame();
}
$("#sprintTouch").addEventListener("pointerdown", (event) => {
  touchSprint = true;
  event.currentTarget.setPointerCapture(event.pointerId);
});
$("#sprintTouch").addEventListener("pointerup", () => (touchSprint = false));
$("#sprintTouch").addEventListener(
  "pointercancel",
  () => (touchSprint = false),
);
$("#lightTouch").addEventListener("click", () => attack("light"));
$("#heavyTouch").addEventListener("click", () => attack("heavy"));
$("#dodgeTouch").addEventListener("click", dodge);
$("#blockTouch").addEventListener("pointerdown", (event) => {
  touchBlock = true;
  event.currentTarget.setPointerCapture(event.pointerId);
});
$("#blockTouch").addEventListener("pointerup", () => (touchBlock = false));
$("#blockTouch").addEventListener("pointercancel", () => (touchBlock = false));
$("#zoomTouch").addEventListener("click", () => {
  state.distance = state.distance > 15 ? 10 : 26;
});
$("#interactTouch").addEventListener("click", interact);
$("#jumpTouch").addEventListener("click", () => {
  if (gameRunning()) jump = true;
});
let drag = null;
canvas.addEventListener("pointerdown", (e) => {
  drag = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag) return;
  state.yaw -= (e.clientX - drag.x) * 0.006;
  state.pitch = THREE.MathUtils.clamp(
    state.pitch + (e.clientY - drag.y) * 0.004,
    0.25,
    1.15,
  );
  drag = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("pointerup", () => (drag = null));
canvas.addEventListener("pointercancel", () => (drag = null));
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    state.distance = THREE.MathUtils.clamp(
      state.distance + e.deltaY * 0.015,
      9,
      38,
    );
  },
  { passive: false },
);
const joy = $("#joystick"),
  stick = $("#stick");
function moveJoy(e) {
  const r = joy.getBoundingClientRect(),
    dx = e.clientX - (r.left + r.width / 2),
    dy = e.clientY - (r.top + r.height / 2),
    len = Math.hypot(dx, dy),
    max = r.width * 0.32,
    scale = Math.min(1, max / (len || 1));
  joystick = { x: (dx * scale) / max, y: (dy * scale) / max };
  stick.style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
}
joy.addEventListener("pointerdown", (e) => {
  joy.setPointerCapture(e.pointerId);
  moveJoy(e);
});
joy.addEventListener("pointermove", (e) => {
  if (joy.hasPointerCapture(e.pointerId)) moveJoy(e);
});
function resetJoy() {
  joystick = { x: 0, y: 0 };
  touchBlock = false;
  touchSprint = false;
  stick.style.transform = "";
}
joy.addEventListener("pointerup", resetJoy);
joy.addEventListener("pointercancel", resetJoy);
$("#start").onclick = () => {
  startAudio();
  state.started = true;
  exploration.visit(state.x, state.z);
  saveGame();
  $("#overlay").hidden = true;
};
$("#newGame").onclick = () => {
  if (!confirm("Start a new journey? This replaces the save on this device."))
    return;
  startAudio();
  state.x = 0;
  state.z = 9;
  state.y = heightAt(0, 9);
  terrain.update(state.x, state.z);
  physics.teleport(state.x, state.y, state.z);
  exploration = new Exploration();
  journey = new Journey();
  combat = new CombatSystem();
  puzzle = new EchoPuzzle();
  progression = new Progression();
  survival = new Survival();
  campsite.update(survival, 0);
  grove.update(0);
  environment.time = DEFAULT_ENVIRONMENT.time;
  syncJourneyVisuals();
  // Explicit confirmation allows recovery from an invalid save, but not an unavailable database.
  if (saves.db) saveAvailable = true;
  updateObjective();
  saveGame();
  state.started = true;
  $("#overlay").hidden = true;
};
$("#helpButton").onclick = () => {
  $("#overlay").hidden = false;
  state.started = false;
};
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();
let previous = performance.now(),
  elapsed = 0,
  saveTimer = 0,
  stepTimer = 0;
const target = new THREE.Vector3(),
  desired = new THREE.Vector3();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - previous) / 1000, 0.05);
  previous = now;
  elapsed += dt;
  const running = gameRunning();
  if (running) {
    let x =
        (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
        (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) +
        joystick.x,
      z =
        (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
        (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) +
        joystick.y;
    let moveX = 0,
      moveZ = 0;
    const swimming =
      river.contains(state.x, state.z) && state.y < RIVER_LEVEL + 1.3;
    const l = Math.hypot(x, z);
    if (l > 0.05) {
      x /= Math.max(1, l);
      z /= Math.max(1, l);
      const s = Math.sin(state.yaw),
        c = Math.cos(state.yaw),
        wx = x * c + z * s,
        wz = -x * s + z * c;
      const speed = swimming
        ? 4.5
        : keys.has("ShiftLeft") || keys.has("ShiftRight") || touchSprint
          ? progression.swift
            ? 14
            : 12
          : 8;
      moveX = clampWorld(state.x + wx * speed * dt) - state.x;
      moveZ = clampWorld(state.z + wz * speed * dt) - state.z;
      player.rotation.y = Math.atan2(wx, wz);
      left.rotation.x = Math.sin(elapsed * 10) * 0.5;
      right.rotation.x = -left.rotation.x;
    } else {
      left.rotation.x *= 0.8;
      right.rotation.x *= 0.8;
    }
    if (combat.dodgeTime > 0 && !swimming) {
      moveX = clampWorld(state.x + dodgeX * 14 * dt) - state.x;
      moveZ = clampWorld(state.z + dodgeZ * 14 * dt) - state.z;
    }
    terrain.update(state.x, state.z);
    const oldX = state.x,
      oldZ = state.z;
    if (jump) audio.play("jump");
    const next = physics.move(
      moveX,
      moveZ,
      dt,
      jump,
      swimming ? RIVER_LEVEL - 1.1 : null,
    );
    if (swimming && !state.swimming) {
      audio.play("splash");
      if (progression.award("river")) {
        notify(
          "DISCOVERY",
          "The wandering river",
          "A cool current cuts through the wilds. +25 exploration XP.",
        );
        saveGame();
      }
    }
    state.swimming = swimming;
    jump = false;
    stepTimer -= dt;
    if (
      next.grounded &&
      Math.hypot(next.x - oldX, next.z - oldZ) > 0.015 &&
      stepTimer <= 0
    ) {
      audio.play("step");
      stepTimer = 0.42;
    }
    state.x = next.x;
    state.y = next.y;
    state.z = next.z;
    const event = combat.update(dt, state, keys.has("KeyR") || touchBlock);
    if (event?.type === "respawn") {
      state.x = 0;
      state.z = 9;
      state.y = heightAt(0, 9);
      terrain.update(state.x, state.z);
      physics.teleport(state.x, state.y, state.z);
      notify(
        "YOU WERE OVERCOME",
        "Back at the path",
        "Your discoveries remain safe. You may avoid the guardian.",
      );
      saveGame();
    } else if (event?.type === "hurt") {
      audio.play("hurt");
      notify(
        "DAMAGE",
        "The guardian strikes",
        `You lost ${event.damage} health.`,
      );
      saveGame();
    }
    exploration.visit(state.x, state.z);
    saveTimer += dt;
    if (saveTimer >= 10) {
      saveTimer = 0;
      saveGame();
    }
  }
  player.position.set(state.x, state.y, state.z);
  $("#swimIndicator").hidden = !state.started || !state.swimming;
  bladePivot.rotation.z =
    combat.attackTime > 0 ? -1.2 : combat.blocking ? -0.65 : 0.2;
  target.set(state.x, state.y + 1.7, state.z);
  const horizontal = Math.cos(state.pitch) * state.distance;
  desired.set(
    state.x + Math.sin(state.yaw) * horizontal,
    state.y + 1.7 + Math.sin(state.pitch) * state.distance,
    state.z + Math.cos(state.yaw) * horizontal,
  );
  desired.y = Math.max(desired.y, heightAt(desired.x, desired.z) + 2);
  const direction = desired.clone().sub(target);
  const cameraDistance = direction.length();
  direction.normalize();
  const safeDistance = physics.cameraDistance(
    target,
    direction,
    cameraDistance,
  );
  desired.copy(target).addScaledVector(direction, safeDistance);
  // Move inward immediately when obstructed; smooth only the return outward.
  if (camera.position.distanceTo(target) > safeDistance)
    camera.position.copy(desired);
  else camera.position.lerp(desired, 1 - Math.exp(-dt * 5));
  camera.lookAt(target);
  $("#timeOfDay").textContent =
    `${environment.weather === "rain" ? "☂" : "☼"}  ${environment.update(dt, state, running)}`;
  if (running) {
    wildlife.update(dt, state);
    river.update(dt);
    campsite.update(survival, elapsed);
  }
  guardian.update(combat, state);
  $("#healthFill").style.width = `${combat.health}%`;
  $("#healthValue").textContent = Math.ceil(combat.health);
  $("#staminaFill").style.width = `${combat.stamina}%`;
  $("#staminaValue").textContent = Math.ceil(combat.stamina);
  $("#enemyVitals").hidden =
    combat.guardianHealth <= 0 ||
    Math.hypot(state.x - combat.enemyX, state.z - combat.enemyZ) > 16;
  $("#enemyFill").style.width = `${combat.guardianHealth}%`;
  $("#enemyValue").textContent = Math.ceil(combat.guardianHealth);
  rune.rotation.y += dt;
  const near = running ? nearestInteraction() : null;
  $("#prompt").hidden = !near;
  if (near)
    $("#prompt").innerHTML =
      `<kbd>E</kbd> &nbsp; ${near.type === "plant" ? "Gather glowleaf" : near.type === "guide" ? "Talk to Mira" : near.type === "camp" ? "Rest or cook" : near.type === "berry" ? "Gather berries" : near.type === "tablet" ? "Read inscription" : near.type === "switch" ? `Touch ${near.id} stone` : "Examine waystone"}`;
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

// Exposes read-only state for browser smoke tests in development builds only.
if (import.meta.env.DEV) {
  window.__tuw = {
    snapshot: () => ({
      x: state.x,
      y: state.y,
      z: state.z,
      yaw: state.yaw,
      pitch: state.pitch,
      distance: state.distance,
      chunks: terrain.chunks.size,
      swimming: state.swimming,
    }),
  };
}
