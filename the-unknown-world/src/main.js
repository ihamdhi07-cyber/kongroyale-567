import * as THREE from "three";
import { heightAt, clampWorld, seeded } from "./world.js";
import "./style.css";
import { createPhysics } from "./physics.js";
import { SaveManager } from "./save/SaveManager.js";
import { Exploration, cellAt } from "./gameplay/Exploration.js";
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
const initial = saved?.position || { x: 0, z: 9 };
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
scene.add(new THREE.HemisphereLight("#e4eed5", "#65755a", 2.3));
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
const groundGeo = new THREE.PlaneGeometry(500, 500, 150, 150);
groundGeo.rotateX(-Math.PI / 2);
const pos = groundGeo.attributes.position,
  colors = [],
  c = new THREE.Color();
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i),
    z = pos.getZ(i),
    h = heightAt(x, z);
  pos.setY(i, h);
  const path = Math.abs(x - 5 * Math.sin(z * 0.025)) < 4.8;
  c.set(path ? "#9b9c70" : h > 1.5 ? "#809d72" : "#74976b");
  c.offsetHSL(0, 0, 0.025 * Math.sin(x * 0.1 + z * 0.13));
  colors.push(c.r, c.g, c.b);
}
groundGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
groundGeo.computeVertexNormals();
const ground = new THREE.Mesh(
  groundGeo,
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
);
ground.receiveShadow = true;
scene.add(ground);
const physics = await createPhysics(groundGeo, {
  ...initial,
  y: heightAt(initial.x, initial.z),
});
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
  if (Math.abs(x - 5 * Math.sin(z * 0.025)) < 9 || Math.hypot(x, z + 22) < 11)
    x += 25;
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
const state = {
  x: initial.x,
  z: initial.z,
  y: heightAt(initial.x, initial.z),
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
  if (exploration.discoveries.has("waystone")) {
    $(".objective strong").textContent = "The waystone discovered";
    $(".objective p").textContent =
      "Keep wandering. The world is yours to explore.";
  } else {
    $(".objective strong").textContent = "Follow the golden light";
    $(".objective p").textContent = "Find the old waystone in the clearing.";
  }
}
updateObjective();
async function saveGame() {
  if (!saveAvailable) return;
  try {
    await saves.save(exploration.snapshot(state.x, state.z));
    showSaveStatus("JOURNEY SAVED ON THIS DEVICE");
  } catch (error) {
    showSaveStatus(`Save failed: ${error.message}`);
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
    map.append(cell);
  }
  $("#mapCount").textContent =
    `${exploration.explored.size} / 100 areas explored`;
}
function toggleMap() {
  if (!state.started && $("#mapPanel").hidden) return;
  $("#mapPanel").hidden = !$("#mapPanel").hidden;
  if (!$("#mapPanel").hidden) {
    renderMap();
    keys.clear();
    resetJoy();
  }
}
$("#mapButton").addEventListener("click", toggleMap);
$("#closeMap").addEventListener("click", toggleMap);
const keys = new Set();
let jump = false,
  joystick = { x: 0, y: 0 };
window.addEventListener("keydown", (e) => {
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code,
    )
  )
    e.preventDefault();
  keys.add(e.code);
  if (e.code === "Space" && !e.repeat) jump = true;
  if (e.code === "KeyE" && !e.repeat && state.started && $("#mapPanel").hidden)
    interact();
  if (e.code === "KeyM" && !e.repeat) toggleMap();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => keys.clear());
function interact() {
  if (Math.hypot(state.x - stone.position.x, state.z - stone.position.z) < 5) {
    exploration.discover("waystone");
    saveGame();
    $("#notice").hidden = false;
    $("#notice").innerHTML =
      "<small>DISCOVERY RECORDED</small><strong>The Waystone</strong><p>Someone walked this path before you.</p>";
    setTimeout(() => ($("#notice").hidden = true), 5000);
    updateObjective();
  }
}
$("#zoomTouch").addEventListener("click", () => {
  state.distance = state.distance > 15 ? 10 : 26;
});
$("#interactTouch").addEventListener("click", interact);
$("#jumpTouch").addEventListener("click", () => (jump = true));
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
  stick.style.transform = "";
}
joy.addEventListener("pointerup", resetJoy);
joy.addEventListener("pointercancel", resetJoy);
$("#start").onclick = () => {
  state.started = true;
  exploration.visit(state.x, state.z);
  saveGame();
  $("#overlay").hidden = true;
};
$("#newGame").onclick = () => {
  if (!confirm("Start a new journey? This replaces the save on this device."))
    return;
  state.x = 0;
  state.z = 9;
  state.y = heightAt(0, 9);
  physics.teleport(state.x, state.y, state.z);
  exploration = new Exploration();
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
  saveTimer = 0;
const target = new THREE.Vector3(),
  desired = new THREE.Vector3();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - previous) / 1000, 0.05);
  previous = now;
  elapsed += dt;
  if (state.started && $("#mapPanel").hidden) {
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
    const l = Math.hypot(x, z);
    if (l > 0.05) {
      x /= Math.max(1, l);
      z /= Math.max(1, l);
      const s = Math.sin(state.yaw),
        c = Math.cos(state.yaw),
        wx = x * c + z * s,
        wz = -x * s + z * c;
      const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 12 : 8;
      moveX = clampWorld(state.x + wx * speed * dt) - state.x;
      moveZ = clampWorld(state.z + wz * speed * dt) - state.z;
      player.rotation.y = Math.atan2(wx, wz);
      left.rotation.x = Math.sin(elapsed * 10) * 0.5;
      right.rotation.x = -left.rotation.x;
    } else {
      left.rotation.x *= 0.8;
      right.rotation.x *= 0.8;
    }
    const next = physics.move(moveX, moveZ, dt, jump);
    jump = false;
    state.x = next.x;
    state.y = next.y;
    state.z = next.z;
    exploration.visit(state.x, state.z);
    saveTimer += dt;
    if (saveTimer >= 10) {
      saveTimer = 0;
      saveGame();
    }
  }
  player.position.set(state.x, state.y, state.z);
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
  sun.position.set(state.x - 45, state.y + 80, state.z + 35);
  sun.target.position.copy(player.position);
  rune.rotation.y += dt;
  $("#prompt").hidden =
    !state.started || Math.hypot(state.x, state.z + 22) >= 5;
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
    }),
  };
}
