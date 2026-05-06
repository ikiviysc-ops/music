const NOTE_FREQS = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
};

const CHORDS = [
  ['C4', 'E4', 'G4', 'B4'],
  ['A3', 'C4', 'E4', 'G4'],
  ['F3', 'A3', 'C4', 'E4'],
  ['G3', 'B3', 'D4', 'G4'],
  ['D4', 'F4', 'A4', 'C5'],
  ['E3', 'G3', 'B3', 'D4'],
];

const MELODY_NOTES = ['C5', 'D5', 'E5', 'G5', 'A5', 'E5', 'D5', 'C5', 'B4', 'G4', 'A4', 'E4'];

class AmbientMusicEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.elapsedAtPause = 0;
    this.activeNodes = [];
    this.chordIndex = 0;
    this.melodyIndex = 0;
    this.chordTimer = null;
    this.melodyTimer = null;
    this.analyser = null;
    this._duration = 0;
    this._loopDuration = 180;
    this._onTimeUpdate = null;
    this._onEnded = null;
    this._onPlay = null;
    this._onPause = null;
    this.timeUpdateInterval = null;
  }

  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createReverb() {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 3;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  _createDelay() {
    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.4;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.3;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    delay.connect(filter);
    filter.connect(feedback);
    feedback.connect(delay);
    return { input: delay, wet: feedback };
  }

  _startPadChord(notes, duration) {
    const now = this.ctx.currentTime;
    const attack = 2.0;
    const release = 2.0;
    const sustainDuration = duration - attack - release;

    notes.forEach((note, i) => {
      const freq = NOTE_FREQS[note];
      if (!freq) return;

      for (let d = -1; d <= 1; d += 2) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq + d * 0.5;

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = freq * 1.001 + d * 0.3;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + attack);
        gain.gain.setValueAtTime(0.06, now + attack + sustainDuration);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800 + i * 200;
        filter.Q.value = 0.5;

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);
        osc2.start(now);
        osc2.stop(now + duration + 0.1);

        this.activeNodes.push(osc, osc2);
      }
    });
  }

  _startMelodyNote(note, duration) {
    const now = this.ctx.currentTime;
    const freq = NOTE_FREQS[note];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2.001;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.02, now + duration * 0.3);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.melodyGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);
    osc2.start(now);
    osc2.stop(now + duration + 0.1);

    this.activeNodes.push(osc, osc2);
  }

  _startBass(note, duration) {
    const now = this.ctx.currentTime;
    const freq = NOTE_FREQS[note];
    if (!freq) return;

    const bassFreq = freq / 2;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = bassFreq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.3);
    gain.gain.setValueAtTime(0.08, now + duration - 1);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);

    this.activeNodes.push(osc);
  }

  _scheduleChordProgression() {
    const chordDuration = 8;
    const chord = CHORDS[this.chordIndex % CHORDS.length];
    this._startPadChord(chord, chordDuration);
    this._startBass(chord[0], chordDuration);

    this.chordTimer = setTimeout(() => {
      if (!this.isPlaying) return;
      this.chordIndex++;
      this._scheduleChordProgression();
    }, (chordDuration - 2) * 1000);
  }

  _scheduleMelody() {
    const noteDuration = 2 + Math.random() * 3;
    const note = MELODY_NOTES[this.melodyIndex % MELODY_NOTES.length];

    if (Math.random() > 0.3) {
      this._startMelodyNote(note, noteDuration);
    }

    this.melodyIndex++;
    this.melodyTimer = setTimeout(() => {
      if (!this.isPlaying) return;
      this._scheduleMelody();
    }, noteDuration * 800);
  }

  _startTimeUpdates() {
    this.timeUpdateInterval = setInterval(() => {
      if (!this.isPlaying) return;
      const elapsed = this._getElapsed();
      if (elapsed >= this._loopDuration) {
        this._onEnded && this._onEnded();
        this.pause();
        return;
      }
      this._onTimeUpdate && this._onTimeUpdate();
    }, 250);
  }

  _getElapsed() {
    if (!this.isPlaying) return this.elapsedAtPause;
    return this.elapsedAtPause + (this.ctx.currentTime - this.startTime);
  }

  get currentTime() {
    return this._getElapsed();
  }

  set currentTime(val) {
    this.elapsedAtPause = val;
    if (this.isPlaying) {
      this.startTime = this.ctx.currentTime;
    }
  }

  get duration() {
    return this._loopDuration;
  }

  addEventListener(event, callback) {
    switch (event) {
      case 'timeupdate': this._onTimeUpdate = callback; break;
      case 'ended': this._onEnded = callback; break;
      case 'play': this._onPlay = callback; break;
      case 'pause': this._onPause = callback; break;
    }
  }

  removeEventListener(event, callback) {
    switch (event) {
      case 'timeupdate': this._onTimeUpdate = null; break;
      case 'ended': this._onEnded = null; break;
      case 'play': this._onPlay = null; break;
      case 'pause': this._onPause = null; break;
    }
  }

  play() {
    this._ensureCtx();

    if (this.isPlaying) return Promise.resolve();

    this.isPlaying = true;
    this.startTime = this.ctx.currentTime;

    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;

      this.melodyGain = this.ctx.createGain();
      this.melodyGain.gain.value = 0.8;

      const reverb = this._createReverb();
      const reverbGain = this.ctx.createGain();
      reverbGain.gain.value = 0.4;

      const delay = this._createDelay();
      const delayGain = this.ctx.createGain();
      delayGain.gain.value = 0.2;

      this.masterGain.connect(this.ctx.destination);
      this.masterGain.connect(reverb);
      reverb.connect(reverbGain);
      reverbGain.connect(this.ctx.destination);

      this.melodyGain.connect(this.masterGain);
      this.melodyGain.connect(delay.input);
      delayGain.connect(this.ctx.destination);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.masterGain.connect(this.analyser);
    }

    this._scheduleChordProgression();
    setTimeout(() => {
      if (this.isPlaying) this._scheduleMelody();
    }, 2000);

    this._startTimeUpdates();
    this._onPlay && this._onPlay();

    return Promise.resolve();
  }

  pause() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.elapsedAtPause = this._getElapsed();

    clearTimeout(this.chordTimer);
    clearTimeout(this.melodyTimer);
    clearInterval(this.timeUpdateInterval);

    this.activeNodes.forEach(node => {
      try { node.stop(0); } catch (e) {}
    });
    this.activeNodes = [];

    this._onPause && this._onPause();
  }

  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}

let engine = null;

export function getMusicEngine() {
  if (!engine) {
    engine = new AmbientMusicEngine();
  }
  return engine;
}

export function playMusic() {
  const e = getMusicEngine();
  return e.play();
}

export function pauseMusic() {
  const e = getMusicEngine();
  e.pause();
}

export function toggleMusic() {
  const e = getMusicEngine();
  if (e.isPlaying) {
    e.pause();
  } else {
    return e.play();
  }
}

export function getFrequencyData() {
  const e = getMusicEngine();
  return e.getFrequencyData();
}
