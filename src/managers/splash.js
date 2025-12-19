/**
 * Splash Manager
 * Handles splash screen display, progress updates, and sample preloading
 */

import { registerSynthSounds } from '@strudel/webaudio';
import { loadSnippets } from './snippetManager.js';

/**
 * Skip splash screen entirely - immediately show all UI elements
 * Used when showSplash setting is false
 * @returns {void}
 */
export function skipSplash() {
  const splash = document.getElementById('splash-modal');
  const bannerBar = document.querySelector('.banner-bar');
  const metronomeSection = document.querySelector('.metronome-section');
  const screen = document.querySelector('.screen');

  // Immediately show all elements (no animation)
  // Note: top-bar-btn buttons are NOT shown by default - they appear on hover
  if (bannerBar) bannerBar.classList.add('visible');
  if (metronomeSection) metronomeSection.classList.add('visible');
  if (screen) screen.classList.add('visible');

  // Remove splash immediately
  if (splash) {
    splash.style.display = 'none';
    splash.remove();
  }
}

/**
 * Dismiss splash screen with logo animation
 * @returns {void}
 */
export function dismissSplash() {
  const splash = document.getElementById('splash-modal');
  const splashContent = document.querySelector('.splash-content');
  const splashLogo = document.getElementById('splash-logo-animate');
  const bannerBar = document.querySelector('.banner-bar');
  const metronomeSection = document.querySelector('.metronome-section');

  if (!splash) return;

  // Step 1: Start logo animation (0.6s) and fade content
  if (splashLogo) {
    splashLogo.classList.add('animating');
  }
  if (splashContent) {
    splashContent.classList.add('fade-out');
  }

  // Step 2: After 0.2s, fade out splash background (0.4s)
  setTimeout(() => {
    splash.classList.add('fade-out');
  }, 200);

  // Step 3: After animation completes (0.6s), show main UI elements
  // Note: top-bar-btn buttons are NOT shown by default - they appear on hover
  setTimeout(() => {
    if (bannerBar) {
      bannerBar.classList.add('visible');
    }
    if (metronomeSection) {
      metronomeSection.classList.add('visible');
    }
    // Show screen area
    const screen = document.querySelector('.screen');
    if (screen) {
      screen.classList.add('visible');
    }
  }, 600);

  // Step 4: Clean up splash after all animations (1s total)
  setTimeout(() => {
    splash.style.display = 'none';
    splash.remove();
  }, 1000);
}

/**
 * Update splash screen progress bar
 * @param {number} percent - Progress percentage (0-100)
 * @returns {void}
 */
export function updateSplashProgress(percent) {
  const progressFill = document.querySelector('.splash-progress-fill');
  const progressBar = document.querySelector('.splash-progress-bar');
  const statusText = document.querySelector('.splash-status');

  if (!progressFill || !progressBar) return;

  // Remove indeterminate animation if present
  progressBar.classList.remove('splash-progress-indeterminate');

  // Update width
  progressFill.style.width = percent + '%';

  // Update status text
  if (percent >= 100 && statusText) {
    statusText.textContent = 'Ready!';
  }
}

/**
 * Initialize with splash screen timing coordination
 * @param {string} snippetUrl - URL for snippets (optional)
 * @returns {Promise<void>}
 */
export async function initializeWithSplash(snippetUrl = '') {
  const minDisplayTime = 1200; // 1.2 seconds minimum
  const completionDisplayTime = 200; // Brief delay to show "Ready!" state

  // Start minimum timer immediately
  const minTimer = new Promise(resolve => setTimeout(resolve, minDisplayTime));

  try {
    // Wait for both sample loading AND minimum display time
    await Promise.all([prebake(snippetUrl), minTimer]);

    // Show completion state
    updateSplashProgress(100);
    const statusText = document.querySelector('.splash-status');
    if (statusText) {
      statusText.textContent = 'Ready!';
    }

    // Brief delay to show completion
    await new Promise(resolve => setTimeout(resolve, completionDisplayTime));

    // Dismiss splash with fade-out
    dismissSplash();
  } catch (error) {
    console.error('Sample loading failed:', error);

    // Update splash to show error (don't dismiss)
    const statusText = document.querySelector('.splash-status');
    if (statusText) {
      statusText.textContent = 'Error loading samples. Check console.';
    }
    // Don't dismiss splash on error - user needs to see error message
  }
}

/**
 * Pre-load samples (matches official REPL prebake pattern)
 * @param {string} snippetUrl - URL for snippets (optional)
 * @returns {Promise<void>}
 */
export async function prebake(snippetUrl = '') {
  const baseCDN = 'https://strudel.b-cdn.net';

  let completed = 0;
  const total = 9; // synths, zzfx, piano, vcsl, tidal-drums, uzu-drumkit, mridangam, dirt-samples, snippets

  const trackProgress = () => {
    completed++;
    updateSplashProgress((completed / total) * 100);
  };

  // Helper to wrap loading tasks - failures don't break the loading process
  const safeLoad = (name, loadFn) => {
    return loadFn()
      .then((result) => {
        trackProgress();
        console.log(`✓ ${name} loaded`);
        return result;
      })
      .catch((error) => {
        trackProgress(); // Still count as progress
        console.warn(`⚠ ${name} failed to load (non-critical):`, error.message);
        return null; // Continue despite failure
      });
  };

  // Create parallel loading tasks - all wrapped to be non-blocking
  const loadingTasks = [
    // Register synth sounds (sawtooth, square, triangle, etc.)
    safeLoad('Synth sounds', () => Promise.resolve(registerSynthSounds())),

    // Register ZZFX sounds (chiptune-style synthesizer)
    safeLoad('ZZFX sounds', async () => {
      const { registerZZFXSounds } = await import('@strudel/webaudio');
      return registerZZFXSounds();
    }),

    // Load piano samples (Salamander Grand Piano)
    safeLoad('Piano samples', async () => {
      const { samples } = await import('@strudel/webaudio');
      return samples(`${baseCDN}/piano.json`, `${baseCDN}/piano/`, { prebake: true });
    }),

    // Load VCSL samples (strings, violin, cello, etc.)
    safeLoad('VCSL samples', async () => {
      const { samples } = await import('@strudel/webaudio');
      return samples(`${baseCDN}/vcsl.json`, `${baseCDN}/VCSL/`, { prebake: true });
    }),

    // Load tidal-drum-machines
    safeLoad('Tidal drum machines', async () => {
      const { samples } = await import('@strudel/webaudio');
      return samples(`${baseCDN}/tidal-drum-machines.json`, `${baseCDN}/tidal-drum-machines/machines/`, {
        prebake: true,
        tag: 'drum-machines',
      });
    }),

    // Load uzu-drumkit
    safeLoad('Uzu drumkit', async () => {
      const { samples } = await import('@strudel/webaudio');
      return samples(`${baseCDN}/uzu-drumkit.json`, `${baseCDN}/uzu-drumkit/`, {
        prebake: true,
        tag: 'drum-machines',
      });
    }),

    // Load mridangam (Indian percussion)
    safeLoad('Mridangam samples', async () => {
      const { samples } = await import('@strudel/webaudio');
      return samples(`${baseCDN}/mridangam.json`, `${baseCDN}/mrid/`, {
        prebake: true,
        tag: 'drum-machines'
      });
    }),

    // Load dirt-samples (main TidalCycles library)
    safeLoad('Dirt samples', async () => {
      const { samples } = await import('@strudel/webaudio');
      return samples('github:tidalcycles/dirt-samples');
    }),

    // Load snippets
    safeLoad('Snippets', async () => {
      if (snippetUrl) {
        return loadSnippets(snippetUrl);
      }
      console.log('No snippet URL configured - skipping');
      return null;
    }),
  ];

  await Promise.all(loadingTasks);

  // Load drum machine aliases after samples are loaded
  // This provides convenient names like 'RolandTR909' instead of 'RolandTR909:0'
  try {
    const { aliasBank } = await import('@strudel/webaudio');
    await aliasBank(`${baseCDN}/tidal-drum-machines-alias.json`);
    console.log('✓ Drum machine aliases loaded');
  } catch (error) {
    console.warn('⚠ Drum machine aliases failed to load (non-critical):', error.message);
  }
}
