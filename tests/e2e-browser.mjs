// Real Headless Chromium (WebGL2 via SwiftShader) End-to-End Visual & Functional Verification Suite.
// Launches the live game in Playwright + @sparticuz/chromium, asserts zero console/page errors,
// verifies WebGL2 rendering + chunk streaming + core gameplay flows, and saves visual screenshots to .verification/.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium as pwChromium } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';

const URL = process.env.TUW_URL || 'http://127.0.0.1:5173/';
const OUT_DIR = path.resolve(import.meta.dirname, '..', '.verification');
const AL_LIB = '/tmp/al2023/lib';

function ensureSharedLibs() {
  if (fs.existsSync(path.join(AL_LIB, 'libnss3.so'))) return;
  fs.mkdirSync('/tmp/al2023', { recursive: true });
  const brPath = path.resolve(import.meta.dirname, '..', 'node_modules/@sparticuz/chromium/bin/al2023.tar.br');
  const raw = zlib.brotliDecompressSync(fs.readFileSync(brPath));
  fs.writeFileSync('/tmp/al2023.tar', raw);
  execSync('tar -xf /tmp/al2023.tar -C /tmp/al2023');
}

/** Snaps camera cleanly and renders 1 crisp WebGL2 frame while RAF is paused so software GPU screenshots never stall */
async function snap(page, filename) {
  await page.evaluate(() => {
    const g = window.__tuw?.game;
    if (!g) return;
    g.loop.stop();
    g.cameraController.yaw = g.cameraController.targetYaw;
    g.cameraController.pitch = g.cameraController.targetPitch;
    g.cameraController.distance = g.cameraController.targetDistance;
    g.cameraController.initialized = false;
    g._tick(1 / 30, 12.0);
    if (g.started) g.hud._drawMinimap();
  });
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(OUT_DIR, filename), animations: 'allow', timeout: 25000 });
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  ensureSharedLibs();

  const execPath = await sparticuz.executablePath();
  const browser = await pwChromium.launch({
    executablePath: execPath,
    headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: `${AL_LIB}:/tmp:${process.env.LD_LIBRARY_PATH || ''}` },
    args: [
      ...sparticuz.args,
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  });

  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`CONSOLE_ERROR: ${msg.text()}`);
  });

  let failed = false;
  try {
    console.log('1/8 Opening live game:', URL);
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.__tuw && window.__tuw.ready === true, { timeout: 25000 });
    await snap(page, '01-title.png');

    console.log('2/8 Starting expedition at Crossroads Settlement...');
    await page.evaluate(() => {
      const g = window.__tuw.game;
      g.startNewGame();
      g.hud._bannerTimer = 0;
      g.hud.bannerEl.classList.add('hidden');
    });
    await snap(page, '02-crossroads.png');

    const diag = await page.evaluate(() => {
      const g = window.__tuw.game;
      const gl = g.renderer.webgl.getContext();
      return {
        webgl: gl ? gl.getParameter(gl.VERSION) : null,
        chunks: g.world.chunks.getStats(),
        draws: g.renderer.getStats().calls,
        tris: g.renderer.getStats().triangles,
        region: g.world.currentRegion?.name,
        gold: g.inventory.gold,
      };
    });
    console.log('    WebGL2 Diagnostics:', JSON.stringify(diag));
    assert.ok(diag.webgl && diag.webgl.includes('WebGL 2'), 'Expected live WebGL 2 context');
    assert.ok(diag.chunks.total >= 25, 'Expected streamed terrain chunks');
    assert.equal(diag.gold, 60);

    console.log('3/8 Verifying World Map & Custom Waypoint Pin...');
    await page.evaluate(() => {
      const g = window.__tuw.game;
      g.openModal('map');
      g.setWaypoint({ x: -980, z: -160, regionName: 'Emerald Wilds' });
      g.mapUI.render();
    });
    await snap(page, '03-map.png');
    await page.evaluate(() => window.__tuw.game.closeAllModals());

    console.log('4/8 Verifying Merchant Rowan Trading Shop...');
    await page.evaluate(() => {
      const g = window.__tuw.game;
      const rowan = g.npcs.npcs.find((n) => n.def.id === 'merchant-rowan').def;
      g.openModal('dialogue', rowan);
      g.dialogueUI.openShop(rowan);
    });
    await snap(page, '04-merchant-shop.png');
    await page.evaluate(() => window.__tuw.game.closeAllModals());

    console.log("5/8 Entering 3D Sanctuary (Crossroads Elder's Hall)...");
    await page.evaluate(() => {
      const g = window.__tuw.game;
      g.world.interiors.enter('elders-hall', g.player, g.cameraController);
      g.hud._bannerTimer = 0;
      g.hud.bannerEl.classList.add('hidden');
    });
    await snap(page, '05-sanctuary-interior.png');
    await page.evaluate(() => {
      const g = window.__tuw.game;
      g.world.interiors.exit(g.player, g.cameraController);
    });

    console.log('6/8 Sailing Coastal Skiff on Azure Coast...');
    await page.evaluate(() => {
      const g = window.__tuw.game;
      g.playerController.teleport(1185, 1425);
      g.world.chunks.primeAround(1185, 1425);
      g.world.boats.boardBoat('boat-tidehaven', g.player);
      g.cameraController.yaw = 0.55;
      g.cameraController.targetYaw = 0.55;
      g.cameraController.pitch = 0.3;
      g.cameraController.targetPitch = 0.3;
      g.cameraController.distance = 16;
      g.cameraController.targetDistance = 16;
      g.hud._bannerTimer = 0;
      g.hud.bannerEl.classList.add('hidden');
      for (let i = 0; i < 12; i++) {
        g.world.boats.update(1 / 30, i / 30, g.player, { moveX: 0, moveY: 1, sprint: false });
      }
    });
    await snap(page, '06-sailing-azure.png');

    console.log('7/8 Awakening The Unknown Gate in Hidden Frontier...');
    await page.evaluate(() => {
      const g = window.__tuw.game;
      g.world.boats.disembark(g.player);
      g.playerController.teleport(-1620, 1636);
      g.world.chunks.primeAround(-1620, 1636);
      g.inventory.addItem('resonance-key', 1, true);
      g.unknownGateAwakened = true;
      g.world.landmarks.awakenUnknownGate();
      g.world.particles.emitBurst(g.player.root.position, { count: 48, color: 0xffe88c, speed: 7, spreadY: 9, life: 2.0, gravity: 1.0 });
      g.cameraController.yaw = 0.0;
      g.cameraController.targetYaw = 0.0;
      g.cameraController.pitch = 0.22;
      g.cameraController.targetPitch = 0.22;
      g.cameraController.distance = 20;
      g.cameraController.targetDistance = 20;
      g.hud._bannerTimer = 0;
      g.hud.bannerEl.classList.add('hidden');
    });
    await snap(page, '07-unknown-gate.png');

    console.log('8/8 Verifying Mobile Landscape Touch Viewport (844x390)...');
    await page.setViewportSize({ width: 844, height: 390 });
    await page.evaluate(() => {
      const g = window.__tuw.game;
      g.renderer.resize();
      g.cameraController.resize(844 / 390);
      g.playerController.teleport(4, 398);
      g.player.facingYaw = Math.PI;
      g.world.chunks.primeAround(4, 398);
      g.cameraController.yaw = 0.18;
      g.cameraController.targetYaw = 0.18;
      g.cameraController.pitch = 0.28;
      g.cameraController.targetPitch = 0.28;
      g.cameraController.distance = 14.8;
      g.cameraController.targetDistance = 14.8;
      g.hud._bannerTimer = 0;
      g.hud.bannerEl.classList.add('hidden');
      g.hud.toastStack.innerHTML = '';
      g.setTouchMode('on');
    });
    await snap(page, '08-mobile-touch.png');

    assert.equal(errors.length, 0, `Browser reported errors:\n${errors.join('\n')}`);
    console.log('\n✅ ALL 8 REAL CHROMIUM WEBGL2 CHECKS PASSED WITH ZERO CONSOLE/PAGE ERRORS!');
  } catch (err) {
    failed = true;
    console.error('❌ E2E step failed:', err);
  } finally {
    await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 2500))]);
    process.exit(failed || errors.length > 0 ? 1 : 0);
  }
}

run().catch((err) => {
  console.error('❌ Browser verification failed:', err);
  process.exit(1);
});
