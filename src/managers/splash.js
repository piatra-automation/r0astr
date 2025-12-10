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
  const siteLogo = document.querySelector('.site-logo');
  const heroSection = document.querySelector('.hero-section');
  const bannerSubtitle = document.querySelector('.banner-subtitle');
  const screen = document.querySelector('.screen');

  // Immediately show all elements (no animation)
  if (siteLogo) siteLogo.classList.add('visible');
  if (heroSection) heroSection.classList.add('visible');
  if (bannerSubtitle) bannerSubtitle.classList.add('visible');
  if (screen) screen.classList.add('visible');
  document.querySelectorAll('.top-bar-btn').forEach(btn => btn.classList.add('visible'));

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
  const siteLogo = document.querySelector('.site-logo');
  const heroSection = document.querySelector('.hero-section');

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

  // Step 3: After animation completes (0.6s), show fixed logo, hero, and load button
  setTimeout(() => {
    if (siteLogo) {
      siteLogo.classList.add('visible');
    }
    if (heroSection) {
      heroSection.classList.add('visible');
    }
    // Show banner subtitle
    const bannerSubtitle = document.querySelector('.banner-subtitle');
    if (bannerSubtitle) {
      bannerSubtitle.classList.add('visible');
    }
    // Show screen area
    const screen = document.querySelector('.screen');
    if (screen) {
      screen.classList.add('visible');
    }
    // Show all top bar buttons
    document.querySelectorAll('.top-bar-btn').forEach(btn => {
      btn.classList.add('visible');
    });
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

  // Create parallel loading tasks
  const loadingTasks = [
    // Register synth sounds (sawtooth, square, triangle, etc.)
    Promise.resolve(registerSynthSounds()).then((result) => {
      trackProgress();
      return result;
    }),
    // Register ZZFX sounds (chiptune-style synthesizer)
    import('@strudel/webaudio').then(({ registerZZFXSounds }) =>
      registerZZFXSounds()
    ).then((result) => {
      trackProgress();
      return result;
    }),
    // Load piano samples (Salamander Grand Piano)
    import('@strudel/webaudio').then(({ samples }) =>
      samples(`${baseCDN}/piano.json`, `${baseCDN}/piano/`, { prebake: true })
    ).then((result) => {
      trackProgress();
      return result;
    }),
    // Load VCSL samples (strings, violin, cello, etc.)
    import('@strudel/webaudio').then(({ samples }) =>
      samples(`${baseCDN}/vcsl.json`, `${baseCDN}/VCSL/`, { prebake: true })
    ).then((result) => {
      trackProgress();
      return result;
    }),
    // Load tidal-drum-machines
    import('@strudel/webaudio').then(({ samples }) =>
      samples(`${baseCDN}/tidal-drum-machines.json`, `${baseCDN}/tidal-drum-machines/machines/`, {
        prebake: true,
        tag: 'drum-machines',
      })
    ).then((result) => {
      trackProgress();
      return result;
    }),
    // Load uzu-drumkit
    import('@strudel/webaudio').then(({ samples }) =>
      samples(`${baseCDN}/uzu-drumkit.json`, `${baseCDN}/uzu-drumkit/`, {
        prebake: true,
        tag: 'drum-machines',
      })
    ).then((result) => {
      trackProgress();
      return result;
    }),
    // Load mridangam (Indian percussion)
    import('@strudel/webaudio').then(({ samples }) =>
      samples(`${baseCDN}/mridangam.json`, `${baseCDN}/mrid/`, {
        prebake: true,
        tag: 'drum-machines'
      })
    ).then((result) => {
      trackProgress();
      return result;
    }),
    // Load dirt-samples (main TidalCycles library)
    import('@strudel/webaudio').then(({ samples }) =>
      samples('github:tidalcycles/dirt-samples')
    ).then((result) => {
      trackProgress();
      return result;
    }),
    // Load snippets (non-blocking - errors handled gracefully)
    (async () => {
      if (snippetUrl) {
        console.log('Loading snippets during splash:', snippetUrl);
        try {
          await loadSnippets(snippetUrl);
          console.log('✓ Snippets loaded during splash');
        } catch (error) {
          console.warn('Snippet loading failed during splash (non-critical):', error.message);
          // Gracefully continue - snippets are optional
        }
      } else {
        console.log('No snippet URL configured - skipping snippet loading');
      }
      trackProgress();
    })(),
  ];

  await Promise.all(loadingTasks);

  // Load drum machine aliases after samples are loaded
  // This provides convenient names like 'RolandTR909' instead of 'RolandTR909:0'
  const { aliasBank } = await import('@strudel/webaudio');
  await aliasBank(`${baseCDN}/tidal-drum-machines-alias.json`);
  console.log('✓ Drum machine aliases loaded');
}
