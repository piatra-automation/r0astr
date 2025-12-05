/**
 * Pattern Capture Manager
 *
 * Real-time rhythm recording system that captures keyboard input
 * synchronized with Strudel's scheduler and converts to mini-notation.
 *
 * Features:
 * - Cycle-accurate timing via scheduler.now()
 * - Key press duration capture (down + up events)
 * - Configurable quantization grid (8/16/32 notes)
 * - Multi-cycle pattern recording
 * - Mini-notation generation
 */

export class PatternCapture {
  constructor(scheduler) {
    this.scheduler = scheduler;

    // Capture state
    this.captureMode = false;
    this.startCycle = 0;
    this.capturedEvents = [];
    this.keysPressed = new Set(); // Track currently held keys

    // Configuration
    this.quantizeGrid = 16; // 16th note resolution for duration tracking
    this.maxCycles = 8; // Maximum recording length
    this.chunkSize = 2; // Cycle length per layer (configurable via UI)
    this.durationMode = false; // false = trigger mode, true = duration mode

    // Key mapping (QWERTY keyboard to musical notes)
    // Two rows: bottom row = lower octave, top row = upper octave
    this.keyMap = {
      // Bottom row (C major scale, lower octave)
      'a': 'c3',  // C
      's': 'd3',  // D
      'd': 'e3',  // E
      'f': 'f3',  // F
      'g': 'g3',  // G
      'h': 'a3',  // A
      'j': 'b3',  // B
      'k': 'c4',  // C (octave up)

      // Top row (C major scale, higher octave)
      'q': 'c4',  // C
      'w': 'd4',  // D
      'e': 'e4',  // E
      'r': 'f4',  // F
      't': 'g4',  // G
      'y': 'a4',  // A
      'u': 'b4',  // B
      'i': 'c5',  // C (octave up)

      // Extra keys for chromatics/bass
      'z': 'c2',  // Bass C
      'x': 'd2',  // Bass D
      'c': 'e2',  // Bass E
      'v': 'f2',  // Bass F
    };

    // Callbacks
    this.onCaptureStart = null;
    this.onCaptureStop = null;
    this.onKeyCapture = null;
  }

  /**
   * Start capturing keyboard input
   * Resets state and records start cycle from scheduler
   */
  startCapture() {
    if (!this.scheduler) {
      console.error('PatternCapture: No scheduler available');
      return false;
    }

    this.startCycle = this.scheduler.now();
    this.capturedEvents = [];
    this.keysPressed.clear(); // Clear any stuck keys
    this.captureMode = true;

    console.log(`[PatternCapture] Started at cycle ${this.startCycle.toFixed(4)}`);
    this.onCaptureStart?.();

    return true;
  }

  /**
   * Capture key down event with cycle-accurate timing
   * Records start time for duration tracking
   * Ignores key repeat events
   * @param {string} key - Key pressed
   * @param {number} timestamp - performance.now() timestamp
   */
  captureKeyDown(key, timestamp) {
    if (!this.captureMode) return;

    // Ignore if key is already being held (key repeat)
    if (this.keysPressed.has(key)) {
      return;
    }

    // Mark key as pressed
    this.keysPressed.add(key);

    const currentCycle = this.scheduler.now();
    const relativeCycle = currentCycle - this.startCycle;

    const event = {
      key,
      startCycle: relativeCycle,
      endCycle: null, // Set on keyUp
      timestamp,
    };

    this.capturedEvents.push(event);
    this.onKeyCapture?.(event);

    console.log(`[PatternCapture] Key ${key} down at cycle ${relativeCycle.toFixed(4)}`);
  }

  /**
   * Handle key release - record end time for duration
   * @param {string} key - Key released
   * @param {number} timestamp - performance.now() timestamp
   */
  captureKeyUp(key, timestamp) {
    // ALWAYS remove from pressed keys set (even if not capturing anymore)
    this.keysPressed.delete(key);

    if (!this.captureMode) return;

    // Find the most recent event for this key without endCycle
    const event = this.capturedEvents
      .filter(e => e.key === key && e.endCycle === null)
      .pop();

    if (event) {
      const currentCycle = this.scheduler.now();
      const relativeCycle = currentCycle - this.startCycle;
      event.endCycle = relativeCycle;

      const duration = event.endCycle - event.startCycle;
      console.log(`[PatternCapture] Key ${key} up at cycle ${relativeCycle.toFixed(4)}, duration: ${duration.toFixed(4)}`);
    }
  }

  /**
   * Stop capturing and return generated pattern
   * @returns {string} Mini-notation pattern string
   */
  stopCapture() {
    if (!this.captureMode) return null;

    this.captureMode = false;
    this.keysPressed.clear(); // Clear held keys
    const pattern = this.generatePattern();

    console.log(`[PatternCapture] Stopped. Generated: ${pattern}`);
    this.onCaptureStop?.(pattern);

    return pattern;
  }

  /**
   * Quantize cycle position to grid
   * @param {number} cyclePosition - Position within cycle (0-1)
   * @returns {number} Quantized position
   */
  quantize(cyclePosition) {
    return Math.round(cyclePosition * this.quantizeGrid) / this.quantizeGrid;
  }

  /**
   * Generate Strudel pattern from captured events
   * Two modes: trigger mode (unit notes) or duration mode (held notes)
   * @returns {string} Stack pattern with notes at quantized positions
   */
  generatePattern() {
    if (this.capturedEvents.length === 0) {
      return 'note("~")'; // Silent pattern
    }

    // Check if we're in duration mode
    if (this.durationMode) {
      return this.generateDurationPattern();
    } else {
      return this.generateTriggerPattern();
    }
  }

  /**
   * Generate pattern with duration tracking (~@offset note@duration)
   * Each note gets its own line
   * @returns {string} Stack of note lines with offset and duration
   */
  generateDurationPattern() {
    // Filter only completed events (with endCycle)
    const completedEvents = this.capturedEvents.filter(e => e.endCycle !== null);

    if (completedEvents.length === 0) {
      return 'note("~")';
    }

    // Normalize to start from 0
    const minStart = Math.min(...completedEvents.map(e => e.startCycle));

    const noteLines = completedEvents.map(event => {
      const note = this.keyMap[event.key];
      if (!note) return null;

      // Normalize start and calculate duration
      const startCycle = event.startCycle - minStart;
      const duration = event.endCycle - event.startCycle;

      // Quantize to 16th notes
      const offset16th = Math.round(startCycle * this.quantizeGrid);
      const duration16th = Math.max(1, Math.round(duration * this.quantizeGrid));

      // Generate pattern: ~@offset note@duration
      if (offset16th === 0) {
        // No offset needed
        return `note("${note}@${duration16th}")`;
      } else {
        return `note("~@${offset16th} ${note}@${duration16th}")`;
      }
    });

    const validLines = noteLines.filter(l => l !== null);

    if (validLines.length === 0) {
      return 'note("~")';
    }

    if (validLines.length === 1) {
      return validLines[0];
    }

    // Stack multiple notes
    return `stack(\n  ${validLines.join(',\n  ')}\n)`;
  }

  /**
   * Generate trigger-mode pattern (original chunked approach)
   * @returns {string} Chunked pattern with layers
   */
  generateTriggerPattern() {
    // Normalize all events to start from cycle 0
    const minCycle = Math.min(...this.capturedEvents.map(e => e.startCycle));
    const normalizedEvents = this.capturedEvents.map(e => ({
      ...e,
      cycle: e.startCycle - minCycle
    }));

    // Group events into chunks based on configured chunk size
    const CHUNK_SIZE = this.chunkSize;
    const layers = [];

    // Determine how many chunks we need
    const maxCycle = Math.max(...normalizedEvents.map(e => e.cycle));
    const numChunks = Math.ceil((maxCycle + 0.001) / CHUNK_SIZE); // +0.001 to handle edge cases

    for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
      const chunkStart = chunkIdx * CHUNK_SIZE;
      const chunkEnd = chunkStart + CHUNK_SIZE;

      // Get events in this chunk
      const chunkEvents = normalizedEvents.filter(e =>
        e.cycle >= chunkStart && e.cycle < chunkEnd
      );

      if (chunkEvents.length === 0) continue;

      // Create grid for chunk (slots = chunk size * 8 eighths per cycle)
      const totalSlots = CHUNK_SIZE * this.quantizeGrid;
      const grid = Array(totalSlots).fill(null);

      chunkEvents.forEach(event => {
        const note = this.keyMap[event.key];
        if (!note) return;

        // Position relative to chunk start
        const relativeCycle = event.cycle - chunkStart;
        const slot = Math.round(relativeCycle * this.quantizeGrid);

        if (slot >= 0 && slot < totalSlots) {
          if (!grid[slot]) {
            grid[slot] = [];
          }
          grid[slot].push(note);
        }
      });

      // Build pattern string for this layer
      const parts = grid.map(slot => {
        if (!slot) {
          return '~';
        } else if (slot.length === 1) {
          return slot[0];
        } else {
          return `[${slot.join(' ')}]`;
        }
      });

      const pattern = parts.join(' ');

      // Use .slow() only if chunk size > 1
      if (CHUNK_SIZE > 1) {
        layers.push(`note("${pattern}").slow(${CHUNK_SIZE})`);
      } else {
        layers.push(`note("${pattern}")`);
      }
    }

    // If single layer, return it directly
    if (layers.length === 1) {
      return layers[0];
    }

    // Multiple layers - stack them
    return `stack(\n  ${layers.join(',\n  ')}\n)`;
  }


  /**
   * Check if a key is mapped
   * @param {string} key - Key to check
   * @returns {boolean}
   */
  isMappedKey(key) {
    return key in this.keyMap;
  }

  /**
   * Get current capture state info
   * @returns {Object} State information
   */
  getState() {
    return {
      capturing: this.captureMode,
      events: this.capturedEvents.length,
      duration: this.captureMode
        ? this.scheduler.now() - this.startCycle
        : 0,
      maxCycles: this.maxCycles,
    };
  }

  /**
   * Update configuration
   * @param {Object} config - Configuration updates
   */
  updateConfig(config) {
    if (config.quantizeGrid) {
      this.quantizeGrid = config.quantizeGrid;
    }
    if (config.maxCycles) {
      this.maxCycles = config.maxCycles;
    }
    if (config.chunkSize) {
      this.chunkSize = config.chunkSize;
      console.log(`[PatternCapture] Chunk size updated to ${this.chunkSize} cycles`);
    }
    if (config.durationMode !== undefined) {
      this.durationMode = config.durationMode;
      console.log(`[PatternCapture] Duration mode: ${this.durationMode ? 'ON' : 'OFF'}`);
    }
    if (config.keyMap) {
      this.keyMap = { ...this.keyMap, ...config.keyMap };
    }
  }

  /**
   * Clear captured events (without stopping capture)
   */
  clearEvents() {
    this.capturedEvents = [];
    console.log('[PatternCapture] Events cleared');
  }
}
