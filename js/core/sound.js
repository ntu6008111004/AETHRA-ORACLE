/**
 * AETHRA ORACLE — Sound Identity & Audio Engine
 * Pure procedural Web Audio API with fallback to pre-rendered WAV assets.
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = typeof localStorage !== 'undefined' ? localStorage.getItem('aethra_sound_muted') === 'true' : false;
    this.volume = typeof localStorage !== 'undefined' ? parseFloat(localStorage.getItem('aethra_sound_volume') || '0.7') : 0.7;
    this.audioBuffers = new Map();
    this.initialized = false;
    this.lastHoverTime = 0;
    this.globalListenersAttached = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API not supported in this environment.');
    }
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aethra_sound_muted', this.isMuted ? 'true' : 'false');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aethra:sound-toggle', { detail: { isMuted: this.isMuted } }));
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aethra_sound_volume', this.volume.toString());
    }
  }

  // Pure Web Audio procedural harmonics generator
  play(type = 'ui-select') {
    if (this.isMuted) return false;
    this.init();

    if (!this.audioCtx) {
      this.playFallbackAudio(type);
      return true;
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;

    switch (type) {
      case 'ui-select': {
        // Soft warm harmonic tap
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);

        gain.gain.setValueAtTime(this.volume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'ui-hover': {
        // Ultra-soft celestial harmonic tap
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1320, now);
        gain.gain.setValueAtTime(this.volume * 0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }

      case 'navigation-open': {
        // Gentle celestial chime
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          gain.gain.setValueAtTime(this.volume * 0.15, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.35);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.35);
        });
        break;
      }

      case 'oracle-open': {
        // Atmospheric deep bell chime
        [329.63, 493.88, 659.25].forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(this.volume * 0.18, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.8);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.8);
        });
        break;
      }

      case 'tarot-shuffle': {
        // Soft tactile card sliding noise
        const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.3);
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.1;
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        noise.start(now);
        noise.stop(now + 0.3);
        break;
      }

      case 'tarot-flip': {
        // Paper flip snap
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.09);

        gain.gain.setValueAtTime(this.volume * 0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }

      case 'iching-coin': {
        // Bronze coin spin ping
        [2150, 3420, 4800].forEach(freq => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(this.volume * 0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.28);
        });
        break;
      }

      case 'reading-complete': {
        // Warm resonant celestial chord (C4, G4, E5, B5)
        [261.63, 392.00, 659.25, 987.77].forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.03);
          gain.gain.setValueAtTime(this.volume * 0.18, now + idx * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 1.2);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + idx * 0.03);
          osc.stop(now + idx * 0.03 + 1.2);
        });
        break;
      }

      case 'tab-switch': {
        // Dual-tone melodic slide
        [587.33, 880.00].forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          gain.gain.setValueAtTime(this.volume * 0.12, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.15);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.15);
        });
        break;
      }

      case 'input-focus': {
        // Subtle crystal harmonic
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.50, now);
        gain.gain.setValueAtTime(this.volume * 0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case 'toggle-switch': {
        // Snappy celestial harmonic tick
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.exponentialRampToValueAtTime(987, now + 0.04);

        gain.gain.setValueAtTime(this.volume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'error-alert': {
        // Low muted harmonic pulse
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(146.83, now + 0.15);

        gain.gain.setValueAtTime(this.volume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      default:
        this.playFallbackAudio(type);
    }
    return true;
  }

  playFallbackAudio(type) {
    if (typeof Audio !== 'undefined') {
      try {
        const audio = new Audio(`./assets/audio/${type}.wav`);
        audio.volume = this.volume;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  }

  // Attach global event delegation so all interactive items play sound seamlessly
  attachGlobalListeners() {
    if (this.globalListenersAttached || typeof document === 'undefined') return;
    this.globalListenersAttached = true;

    // 1. Global Click Sound
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, .editorial-card, select, input[type="checkbox"], input[type="radio"], summary, [role="button"], [tabindex="0"], .tradition-tag, .suggestion-tag, .nav-link, .header-btn, .btn');
      if (!target) return;

      const soundType = target.getAttribute('data-sound') || (
        target.tagName === 'SELECT' || target.type === 'checkbox' || target.type === 'radio' ? 'toggle-switch' :
        target.classList.contains('tarot-card-slot') ? 'tarot-flip' :
        target.id === 'iching-toss-trigger' ? 'iching-coin' :
        target.id === 'tarot-shuffle-trigger' ? 'tarot-shuffle' :
        target.classList.contains('nav-link') || target.classList.contains('mobile-nav-link') ? 'tab-switch' :
        'ui-select'
      );

      this.play(soundType);
    }, { capture: true, passive: true });

    // 2. Global Hover Sound (Debounced)
    document.addEventListener('mouseover', (e) => {
      const now = Date.now();
      if (now - this.lastHoverTime < 80) return; // Debounce 80ms
      const target = e.target.closest('button, a, .editorial-card, .tarot-card-slot, .header-btn, .suggestion-tag');
      if (target) {
        this.lastHoverTime = now;
        this.play('ui-hover');
      }
    }, { passive: true });

    // 3. Global Input Focus Sound
    document.addEventListener('focusin', (e) => {
      if (e.target.matches('input[type="text"], input[type="date"], input[type="time"], textarea, select')) {
        this.play('input-focus');
      }
    }, { passive: true });
  }
}

export const SoundManager = new SoundEngine();
