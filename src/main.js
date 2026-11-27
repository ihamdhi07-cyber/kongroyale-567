// Entry point for THE UNKNOWN WORLD — boots WebGL2 engine, world streaming, gameplay & studio UI.
import './styles/main.css';
import { Game } from './core/Game.js';

async function boot() {
  const canvas = document.getElementById('game-canvas');
  const loader = document.getElementById('boot-loader');
  const loaderStatus = document.getElementById('boot-status');

  try {
    loaderStatus.textContent = 'Painting watercolor textures & preparing 8×8 km realm…';
    const game = new Game(canvas);
    await game.init();
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => loader.remove(), 450);
    }
  } catch (err) {
    console.error('[THE UNKNOWN WORLD] Boot error:', err);
    if (loaderStatus) {
      loaderStatus.textContent = `Unable to initialize WebGL2 game engine: ${err.message}`;
    }
  }
}

boot();
