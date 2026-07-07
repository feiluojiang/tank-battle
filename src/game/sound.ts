import type { GameEvent } from "./constants";
import { BgmPlayer } from "./music";

type Ctx = AudioContext;

export class SoundManager {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private bgm: BgmPlayer | null = null;
  private bgmWanted = false;
  enabled = true;

  private ensure(): Ctx | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.5 : 0;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.master);
      this.noiseBuffer = this.makeNoise(this.ctx);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  resume() {
    this.ensure();
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(v ? 0.5 : 0, this.ctx.currentTime, 0.01);
    }
    if (v) {
      if (this.bgmWanted) this.startBgm();
    } else {
      this.bgm?.stop();
    }
  }

  startBgm() {
    this.bgmWanted = true;
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.musicGain || !this.noiseBuffer) return;
    if (!this.bgm) this.bgm = new BgmPlayer();
    this.bgm.start(ctx, this.musicGain, this.noiseBuffer);
  }

  stopBgm() {
    this.bgmWanted = false;
    this.bgm?.stop();
  }

  private makeNoise(ctx: Ctx): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * 1);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    freqEnd?: number,
    delay = 0,
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(
    dur: number,
    vol: number,
    freq: number,
    type: BiquadFilterType = "highpass",
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private noiseSweep(
    dur: number,
    vol: number,
    freqStart: number,
    freqEnd: number,
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(freqStart, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, freqEnd), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private seq(freqs: number[], step: number, type: OscillatorType, vol: number) {
    freqs.forEach((f, i) => this.tone(f, step * 0.85, type, vol, undefined, i * step));
  }

  play(ev: GameEvent) {
    if (!this.enabled) return;
    switch (ev) {
      case "shoot":
        this.tone(1000, 0.11, "square", 0.32, 140);
        this.noise(0.03, 0.18, 3000, "highpass");
        break;
      case "hitBrick":
        this.noise(0.05, 0.4, 2400, "bandpass");
        this.tone(520, 0.03, "square", 0.18);
        break;
      case "hitSteel":
        this.tone(1900, 0.04, "square", 0.22, 1300);
        this.noise(0.03, 0.22, 5000, "highpass");
        break;
      case "explosion":
        this.noiseSweep(0.4, 0.6, 4200, 300);
        this.tone(220, 0.4, "square", 0.28, 50);
        break;
      case "playerHit":
        this.noiseSweep(0.55, 0.6, 3800, 200);
        this.tone(440, 0.55, "square", 0.32, 60);
        break;
      case "grenade":
        this.noiseSweep(0.7, 0.7, 5000, 150);
        this.tone(150, 0.7, "square", 0.3, 40);
        break;
      case "powerup":
        this.seq([523, 659, 784, 1046], 0.07, "square", 0.28);
        break;
      case "bonus":
        this.tone(660, 0.09, "square", 0.26, undefined, 0);
        this.tone(990, 0.12, "square", 0.26, undefined, 0.1);
        break;
      case "gameover":
        this.seq([523, 440, 349, 262, 196], 0.2, "square", 0.3);
        break;
      case "win":
        this.seq([523, 659, 784, 1046, 1318], 0.11, "square", 0.3);
        break;
      case "start":
        this.tone(440, 0.13, "square", 0.3, undefined, 0);
        this.tone(660, 0.18, "square", 0.3, undefined, 0.14);
        break;
    }
  }
}
