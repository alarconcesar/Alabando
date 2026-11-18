import { Midi } from '@tonejs/midi';

export interface ParsedMidiNote {
  midi: number;
  time: number;
  duration: number;
  velocity: number;
}

export interface ParsedMidiData {
  duration: number;
  notes: ParsedMidiNote[];
}

export function parseMidiBuffer(buffer: ArrayBuffer): ParsedMidiData {
  const midi = new Midi(buffer);
  const notes: ParsedMidiNote[] = [];

  for (const track of midi.tracks) {
    for (const note of track.notes) {
      notes.push({
        midi: note.midi,
        time: note.time,
        duration: Math.max(0.06, note.duration),
        velocity: note.velocity,
      });
    }
  }

  notes.sort((a, b) => a.time - b.time);
  const lastEnd = notes.reduce((max, n) => Math.max(max, n.time + n.duration), 0);

  return {
    duration: Math.max(midi.duration, lastEnd),
    notes,
  };
}

interface ActiveVoice {
  stop: () => void;
}

export class WebAudioMidiPlayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private data: ParsedMidiData;
  private playing = false;
  private rate = 1;
  private transpose = 0;
  private songOffset = 0;
  private ctxStartTime = 0;
  private nextIndex = 0;
  private timer: number | null = null;
  private activeVoices = new Set<ActiveVoice>();
  private onProgress?: (currentTime: number, playing: boolean) => void;

  constructor(
    data: ParsedMidiData,
    onProgress?: (currentTime: number, playing: boolean) => void,
  ) {
    this.data = data;
    this.onProgress = onProgress;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.55;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private scheduleNote(note: ParsedMidiNote, when: number, durationSec: number): void {
    const ctx = this.ctx;
    const master = this.masterGain;
    if (!ctx || !master) return;

    const pitch = Math.max(21, Math.min(108, note.midi + this.transpose));
    const freq = this.midiToFreq(pitch);
    const vel = Math.max(0.15, Math.min(1, note.velocity));

    const voiceGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(5200, freq * 6.5), when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(500, freq * 2.2), when + Math.min(durationSec, 1.2));

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, when);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, when);

    const g2 = ctx.createGain();
    g2.gain.value = 0.22;

    const peak = 0.22 * vel;
    const attackEnd = when + 0.012;
    const releaseStart = when + Math.max(0.04, durationSec - 0.04);
    const endTime = releaseStart + 0.14;

    voiceGain.gain.setValueAtTime(0.0001, when);
    voiceGain.gain.linearRampToValueAtTime(peak, attackEnd);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * 0.45), releaseStart);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    osc1.connect(filter);
    osc2.connect(g2);
    g2.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(master);

    osc1.start(when);
    osc2.start(when);
    osc1.stop(endTime + 0.02);
    osc2.stop(endTime + 0.02);

    const voice: ActiveVoice = {
      stop: () => {
        try {
          const now = ctx.currentTime;
          voiceGain.gain.cancelScheduledValues(now);
          voiceGain.gain.setTargetAtTime(0.0001, now, 0.015);
          osc1.stop(now + 0.06);
          osc2.stop(now + 0.06);
        } catch {
          // already stopped
        }
      },
    };
    this.activeVoices.add(voice);
    osc1.onended = () => {
      this.activeVoices.delete(voice);
    };
  }

  private stopAllVoices(): void {
    for (const v of this.activeVoices) {
      v.stop();
    }
    this.activeVoices.clear();
  }

  private findStartIndex(songTime: number): number {
    const notes = this.data.notes;
    let lo = 0;
    let hi = notes.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (notes[mid].time < songTime - 0.01) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  getCurrentTime(): number {
    if (!this.playing || !this.ctx) return this.songOffset;
    const elapsed = (this.ctx.currentTime - this.ctxStartTime) * this.rate;
    return Math.min(this.data.duration, Math.max(0, this.songOffset + elapsed));
  }

  isPlaying(): boolean {
    return this.playing;
  }

  play(): void {
    if (this.playing) return;
    const ctx = this.ensureContext();
    if (this.songOffset >= this.data.duration - 0.05) {
      this.songOffset = 0;
    }
    this.playing = true;
    this.ctxStartTime = ctx.currentTime;
    this.nextIndex = this.findStartIndex(this.songOffset);
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 40);
    this.onProgress?.(this.songOffset, true);
  }

  pause(): void {
    if (!this.playing) return;
    this.songOffset = this.getCurrentTime();
    this.playing = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.stopAllVoices();
    this.onProgress?.(this.songOffset, false);
  }

  stop(): void {
    this.playing = false;
    this.songOffset = 0;
    this.nextIndex = 0;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.stopAllVoices();
    this.onProgress?.(0, false);
  }

  seek(timeSec: number): void {
    const clamped = Math.max(0, Math.min(this.data.duration, timeSec));
    const wasPlaying = this.playing;
    if (wasPlaying) {
      this.stopAllVoices();
    }
    this.songOffset = clamped;
    this.nextIndex = this.findStartIndex(clamped);
    if (this.ctx && wasPlaying) {
      this.ctxStartTime = this.ctx.currentTime;
    }
    this.onProgress?.(clamped, this.playing);
  }

  setRate(rate: number): void {
    if (this.playing && this.ctx) {
      this.songOffset = this.getCurrentTime();
      this.ctxStartTime = this.ctx.currentTime;
    }
    this.rate = rate;
  }

  setTranspose(semitones: number): void {
    this.transpose = semitones;
  }

  private tick(): void {
    if (!this.playing || !this.ctx) return;
    const currentSongTime = this.getCurrentTime();
    const lookaheadSong = 0.18 * this.rate;
    const horizon = currentSongTime + lookaheadSong;

    while (this.nextIndex < this.data.notes.length) {
      const note = this.data.notes[this.nextIndex];
      if (note.time > horizon) break;
      const delayReal = Math.max(0, (note.time - currentSongTime) / this.rate);
      const when = this.ctx.currentTime + delayReal;
      const durReal = Math.max(0.06, note.duration / this.rate);
      this.scheduleNote(note, when, durReal);
      this.nextIndex++;
    }

    this.onProgress?.(currentSongTime, true);

    if (currentSongTime >= this.data.duration && this.nextIndex >= this.data.notes.length) {
      this.stop();
    }
  }

  dispose(): void {
    this.stop();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
  }
}
