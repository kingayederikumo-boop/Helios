export type Levels = {
  bass: number;
  low: number;
  mid: number;
  high: number;
  air: number;
  energy: number;
  beat: number;
  beatCount: number;
};

const ARP = [293.66, 349.23, 392, 440, 523.25, 440, 392, 349.23];
const BASS = [73.42, 58.27, 87.31, 65.41];
const BPM = 100;
const BEAT = 60 / BPM;

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

const WAVE_POINTS = 480;
const WAVE_RATE = 240;

export class Engine {
  readonly freq = new Uint8Array(new ArrayBuffer(1024));
  readonly time = new Uint8Array(new ArrayBuffer(2048));
  readonly waveMin = new Float32Array(WAVE_POINTS);
  readonly waveMax = new Float32Array(WAVE_POINTS);
  waveHead = 0;
  levels: Levels = {
    bass: 0,
    low: 0,
    mid: 0,
    high: 0,
    air: 0,
    energy: 0,
    beat: 0,
    beatCount: 0,
  };
  playing = false;
  mode: "idle" | "file" | "demo" = "idle";
  onEnded: (() => void) | null = null;

  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private master: GainNode | null = null;
  private mediaGain: GainNode | null = null;
  private demoGain: GainNode | null = null;
  private mediaNode: MediaElementAudioSourceNode | null = null;
  private readonly audio: HTMLAudioElement;
  private objectUrl: string | null = null;
  private volume = 0.85;
  private pads: OscillatorNode[] = [];
  private demoRunning = false;
  private nextKick = 0;
  private nextArp = 0;
  private beatEnv = 0;
  private bassFollow = 0;
  private lastBeatAt = 0;
  private waveClock = 0;
  private waveCarry = 0;
  private smooth: Levels = {
    bass: 0,
    low: 0,
    mid: 0,
    high: 0,
    air: 0,
    energy: 0,
    beat: 0,
    beatCount: 0,
  };
  private disposed = false;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";
    this.audio.setAttribute("playsinline", "true");
    this.audio.crossOrigin = "anonymous";
    this.audio.addEventListener("ended", () => {
      if (this.mode === "file") this.onEnded?.();
    });
    document.addEventListener("visibilitychange", this.onVisible);
  }

  /** Call synchronously inside a click, tap, or key handler. */
  unlock(): void {
    if (this.disposed) return;
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
  }

  setVolume(value: number): void {
    this.volume = clamp01(value);
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const curved = this.volume * this.volume;
    master.gain.setTargetAtTime(curved, ctx.currentTime, 0.03);
  }

  getVolume(): number {
    return this.volume;
  }

  currentTime(): number {
    return this.mode === "file" ? this.audio.currentTime : 0;
  }

  duration(): number {
    if (this.mode !== "file") return 0;
    const d = this.audio.duration;
    return Number.isFinite(d) ? d : 0;
  }

  seek(time: number): void {
    if (this.mode !== "file") return;
    const d = this.duration();
    const next = d > 0 ? Math.min(Math.max(0, time), Math.max(0, d - 0.05)) : Math.max(0, time);
    this.audio.currentTime = next;
  }

  async playBlob(blob: Blob): Promise<void> {
    this.unlock();
    this.stopDemo();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = URL.createObjectURL(blob);
    this.audio.src = this.objectUrl;
    this.mode = "file";
    this.audio.load();
    await this.audio.play();
    this.playing = true;
  }

  playDemo(): void {
    this.unlock();
    this.audio.pause();
    const ctx = this.ensure();
    this.stopPads();
    this.demoRunning = true;
    this.mode = "demo";
    this.playing = true;
    this.demoGain?.gain.setTargetAtTime(1, ctx.currentTime, 0.04);
    this.startPads(ctx);
    const now = ctx.currentTime + 0.05;
    this.nextKick = now;
    this.nextArp = now;
    this.scheduleDemo();
  }

  pause(): void {
    if (this.mode === "file") this.audio.pause();
    if (this.mode === "demo") {
      this.demoRunning = false;
      const ctx = this.ctx;
      if (ctx && this.demoGain) this.demoGain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      this.stopPads();
    }
    this.playing = false;
  }

  async resume(): Promise<void> {
    this.unlock();
    if (this.mode === "file") {
      await this.audio.play();
      this.playing = true;
      return;
    }
    if (this.mode === "demo") {
      this.playDemo();
    }
  }

  sample(): void {
    const analyser = this.analyser;
    if (!analyser || !this.playing) {
      this.decay();
      this.pushWave(true);
      return;
    }
    if (this.demoRunning) this.scheduleDemo();
    analyser.getByteFrequencyData(this.freq);
    analyser.getByteTimeDomainData(this.time);
    this.pushWave(false);
    const bass = this.avg(1, 5);
    const low = this.avg(5, 14);
    const mid = this.avg(14, 60);
    const high = this.avg(60, 160);
    const air = this.avg(160, 320);
    const energy = bass * 0.34 + low * 0.22 + mid * 0.22 + high * 0.14 + air * 0.08;
    this.smooth.bass = approach(this.smooth.bass, bass);
    this.smooth.low = approach(this.smooth.low, low);
    this.smooth.mid = approach(this.smooth.mid, mid);
    this.smooth.high = approach(this.smooth.high, high);
    this.smooth.air = approach(this.smooth.air, air);
    this.smooth.energy = approach(this.smooth.energy, energy);

    this.bassFollow = this.bassFollow * 0.97 + bass * 0.03;
    const now = performance.now();
    if (bass > 0.32 && bass > this.bassFollow * 1.42 && now - this.lastBeatAt > 220) {
      this.beatEnv = 1;
      this.lastBeatAt = now;
      this.smooth.beatCount += 1;
    }
    this.beatEnv *= 0.9;
    this.smooth.beat = this.beatEnv;
    this.levels = { ...this.smooth };
  }

  dispose(): void {
    this.disposed = true;
    document.removeEventListener("visibilitychange", this.onVisible);
    this.stopDemo();
    this.audio.pause();
    this.audio.src = "";
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    void this.ctx?.close();
    this.ctx = null;
  }

  private onVisible = (): void => {
    if (document.visibilityState !== "visible" || !this.playing) return;
    if (this.ctx?.state === "suspended") void this.ctx.resume();
    if (this.mode === "file" && this.audio.paused) void this.audio.play().catch(() => undefined);
    if (this.mode === "demo" && this.ctx) {
      this.nextKick = this.ctx.currentTime + 0.05;
      this.nextArp = this.nextKick;
    }
  };

  private ensure(): AudioContext {
    if (this.ctx) return this.ctx;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error("This browser cannot play audio");
    const ctx = new Ctor({ latencyHint: "interactive" });
    const master = ctx.createGain();
    master.gain.value = this.volume * this.volume;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.72;
    const mediaGain = ctx.createGain();
    const demoGain = ctx.createGain();
    demoGain.gain.value = 0;
    mediaGain.connect(analyser);
    demoGain.connect(analyser);
    analyser.connect(master);
    master.connect(ctx.destination);
    const mediaNode = ctx.createMediaElementSource(this.audio);
    mediaNode.connect(mediaGain);
    this.ctx = ctx;
    this.master = master;
    this.analyser = analyser;
    this.mediaGain = mediaGain;
    this.demoGain = demoGain;
    this.mediaNode = mediaNode;
    return ctx;
  }

  private stopDemo(): void {
    this.demoRunning = false;
    const ctx = this.ctx;
    if (ctx && this.demoGain) this.demoGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
    this.stopPads();
  }

  private stopPads(): void {
    for (const osc of this.pads) {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
      osc.disconnect();
    }
    this.pads = [];
  }

  private startPads(ctx: AudioContext): void {
    const dest = this.demoGain;
    if (!dest) return;
    const voices: Array<[number, number, OscillatorType]> = [
      [73.42, 0.045, "sine"],
      [110, 0.03, "sine"],
      [146.83, 0.02, "triangle"],
      [220, 0.012, "sine"],
    ];
    for (const [freq, gainValue, type] of voices) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = gainValue;
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      this.pads.push(osc);
    }
  }

  private scheduleDemo(): void {
    const ctx = this.ctx;
    const dest = this.demoGain;
    if (!ctx || !dest || !this.demoRunning) return;
    const horizon = ctx.currentTime + 0.25;
    if (this.nextKick < ctx.currentTime - 0.2) this.nextKick = ctx.currentTime + 0.02;
    if (this.nextArp < ctx.currentTime - 0.2) this.nextArp = ctx.currentTime + 0.02;

    while (this.nextKick < horizon) {
      const t = this.nextKick;
      const bar = Math.floor(t / (BEAT * 4));
      this.voiceKick(ctx, dest, t);
      const bassFreq = BASS[((bar % BASS.length) + BASS.length) % BASS.length] ?? 73.42;
      this.voiceBass(ctx, dest, t, bassFreq);
      this.nextKick += BEAT;
    }

    while (this.nextArp < horizon) {
      const t = this.nextArp;
      const step = Math.floor(t / (BEAT / 2));
      const freq = ARP[((step % ARP.length) + ARP.length) % ARP.length] ?? 392;
      this.voiceArp(ctx, dest, t, freq);
      this.voiceHat(ctx, dest, t);
      this.nextArp += BEAT / 2;
    }
  }

  private voiceKick(ctx: AudioContext, dest: GainNode, time: number): void {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.7, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.3);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private voiceBass(ctx: AudioContext, dest: GainNode, time: number, freq: number): void {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.16, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + BEAT * 0.95);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + BEAT);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private voiceArp(ctx: AudioContext, dest: GainNode, time: number, freq: number): void {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.07, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.22);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private voiceHat(ctx: AudioContext, dest: GainNode, time: number): void {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 7200;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.035, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.05);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  private pushWave(silent: boolean): void {
    const now = this.ctx ? this.ctx.currentTime : performance.now() / 1000;
    if (this.waveClock === 0) this.waveClock = now;
    let elapsed = now - this.waveClock;
    this.waveClock = now;
    if (elapsed < 0) elapsed = 0;
    if (elapsed > 0.08) elapsed = 0.08;
    this.waveCarry += elapsed * WAVE_RATE;
    const steps = Math.min(this.waveMin.length, Math.floor(this.waveCarry));
    if (steps <= 0) return;
    this.waveCarry -= steps;

    const sampleRate = this.ctx?.sampleRate ?? 48000;
    const fresh = silent ? 0 : Math.min(this.time.length, Math.max(1, Math.round(elapsed * sampleRate)));
    const origin = this.time.length - fresh;

    for (let s = 0; s < steps; s++) {
      let min = 0;
      let max = 0;
      if (fresh > 0) {
        const from = origin + Math.floor((s / steps) * fresh);
        const to = origin + Math.floor(((s + 1) / steps) * fresh);
        for (let i = from; i < to; i++) {
          const v = ((this.time[i] ?? 128) - 128) / 128;
          if (v > max) max = v;
          if (v < min) min = v;
        }
      }
      this.waveMin[this.waveHead] = min;
      this.waveMax[this.waveHead] = max;
      this.waveHead = (this.waveHead + 1) % WAVE_POINTS;
    }
  }

  private avg(from: number, to: number): number {
    let sum = 0;
    const end = Math.min(to, this.freq.length);
    const start = Math.max(0, from);
    for (let i = start; i < end; i++) sum += this.freq[i] ?? 0;
    const n = Math.max(1, end - start);
    return sum / n / 255;
  }

  private decay(): void {
    this.smooth.bass = approach(this.smooth.bass, 0, 0.08);
    this.smooth.low = approach(this.smooth.low, 0, 0.08);
    this.smooth.mid = approach(this.smooth.mid, 0, 0.08);
    this.smooth.high = approach(this.smooth.high, 0, 0.08);
    this.smooth.air = approach(this.smooth.air, 0, 0.08);
    this.smooth.energy = approach(this.smooth.energy, 0, 0.08);
    this.beatEnv *= 0.9;
    this.smooth.beat = this.beatEnv;
    this.levels = { ...this.smooth };
  }
}

function approach(current: number, target: number, release = 0.12): number {
  const k = target > current ? 0.38 : release;
  return current + (target - current) * k;
}
