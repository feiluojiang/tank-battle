type Ctx = AudioContext;

const N: Record<string, number> = {
  E2: 82, F2: 87, G2: 98, A2: 110,
  E3: 165, F3: 175, G3: 196, A3: 220, B3: 247,
  C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494,
  C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880,
};

const STEP = 0.18;
const STEPS = 32;

const MEL: Array<string | 0> = [
  "A4", "C5", "E5", "C5", "A4", "E5", "A5", "E5",
  "G4", "B4", "D5", "B4", "G4", "D5", "G5", "D5",
  "F4", "A4", "C5", "A4", "F4", "C5", "F5", "C5",
  "E4", "G4", "B4", "G4", "E4", "C5", "E5", "G5",
];

const BASS: Array<string | 0> = [
  "A2", 0, "A2", 0, "A2", 0, "A2", 0,
  "G2", 0, "G2", 0, "G2", 0, "G2", 0,
  "F2", 0, "F2", 0, "F2", 0, "F2", 0,
  "E2", 0, "E2", 0, "E2", 0, "E2", 0,
];

const DRUM: number[] = [
  1, 0, 2, 0, 1, 0, 2, 0,
  1, 0, 2, 0, 1, 0, 2, 0,
  1, 0, 2, 0, 1, 0, 2, 0,
  1, 0, 2, 0, 1, 0, 2, 0,
];

export class BgmPlayer {
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private playing = false;

  start(ctx: Ctx, out: GainNode, noise: AudioBuffer) {
    if (this.playing) return;
    this.playing = true;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.08;
    const tick = () => {
      if (!this.playing) return;
      while (this.nextTime < ctx.currentTime + 0.12) {
        this.scheduleStep(ctx, out, noise, this.nextTime, this.step);
        this.nextTime += STEP;
        this.step = (this.step + 1) % STEPS;
      }
    };
    this.timer = window.setInterval(tick, 25);
    tick();
  }

  stop() {
    this.playing = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private scheduleStep(ctx: Ctx, out: GainNode, noise: AudioBuffer, t: number, step: number) {
    const m = MEL[step];
    if (m) this.blip(ctx, out, N[m], STEP * 0.9, "square", 0.08, t);
    const b = BASS[step];
    if (b) this.blip(ctx, out, N[b], STEP * 1.6, "triangle", 0.16, t);
    const d = DRUM[step];
    if (d === 1) this.kick(ctx, out, t);
    else if (d === 2) this.snare(ctx, out, noise, t);
  }

  private blip(
    ctx: Ctx, out: GainNode, freq: number, dur: number,
    type: OscillatorType, vol: number, t: number,
  ) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private kick(ctx: Ctx, out: GainNode, t: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  private snare(ctx: Ctx, out: GainNode, noise: AudioBuffer, t: number) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    src.connect(filter).connect(g).connect(out);
    src.start(t);
    src.stop(t + 0.1);
  }
}
