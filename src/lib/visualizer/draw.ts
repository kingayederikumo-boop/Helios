import type { Levels } from "@/lib/audio/engine";

export type BodyHit = { name: string; x: number; y: number; r: number };

export const bodyHits: BodyHit[] = [];

export function hitBody(x: number, y: number): BodyHit | null {
  for (let i = bodyHits.length - 1; i >= 0; i--) {
    const body = bodyHits[i];
    if (!body) continue;
    const dx = x - body.x;
    const dy = y - body.y;
    if (dx * dx + dy * dy <= (body.r + 8) * (body.r + 8)) return body;
  }
  return null;
}

const TAU = Math.PI * 2;
let tilt = 0.4;

type Star = { x: number; y: number; r: number; a: number; tw: number; band: boolean };
type Rock = { orbit: number; phase: number; speed: number; size: number; lift: number };

type Planet = {
  name: string;
  orbit: number;
  size: number;
  period: number;
  color: string;
  band: keyof Pick<Levels, "bass" | "low" | "mid" | "high" | "air">;
  phase: number;
  kind: "plain" | "earth" | "jupiter" | "saturn";
  moons?: number;
};

const PLANETS: Planet[] = [
  { name: "Mercury", orbit: 0.18, size: 0.02, period: 9, color: "#c9bfb2", band: "high", phase: 0.4, kind: "plain" },
  { name: "Venus", orbit: 0.27, size: 0.03, period: 15, color: "#e7d3a4", band: "mid", phase: 1.7, kind: "plain" },
  { name: "Earth", orbit: 0.36, size: 0.032, period: 22, color: "#6e97a6", band: "mid", phase: 2.5, kind: "earth", moons: 1 },
  { name: "Mars", orbit: 0.45, size: 0.024, period: 30, color: "#c56a3c", band: "low", phase: 0.9, kind: "plain" },
  { name: "Jupiter", orbit: 0.62, size: 0.062, period: 46, color: "#d7b07a", band: "bass", phase: 3.4, kind: "jupiter", moons: 2 },
  { name: "Saturn", orbit: 0.76, size: 0.05, period: 58, color: "#e6d2a2", band: "low", phase: 4.8, kind: "saturn" },
  { name: "Uranus", orbit: 0.88, size: 0.034, period: 74, color: "#c5ddd6", band: "air", phase: 5.5, kind: "plain" },
  { name: "Neptune", orbit: 0.98, size: 0.032, period: 88, color: "#7d8fa3", band: "high", phase: 1.15, kind: "plain" },
];

const stars = makeStars();
const rocks = makeRocks();
const shocks: number[] = [];
let seenBeats = 0;

export type FrameAudio = {
  freq: Uint8Array;
  time: Uint8Array;
  waveMin: Float32Array;
  waveMax: Float32Array;
  waveHead: number;
  levels: Levels;
  playing: boolean;
};

export function drawSolar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  bottomInset: number,
  audio: FrameAudio,
  reduced: boolean,
): void {
  const levels = audio.levels;
  const playing = audio.playing;
  const top = 64;
  const usableH = Math.max(180, h - bottomInset - top);
  const cx = w * 0.5;
  const cy = top + usableH * 0.5;
  tilt = h > w ? 0.68 : 0.4;
  const maxR = Math.min(w * 0.44, (usableH * 0.46) / tilt);
  const energy = levels.energy;
  const motion = reduced ? 0.22 : 1;

  if (playing && levels.beatCount !== seenBeats) {
    seenBeats = levels.beatCount;
    shocks.push(time);
  }
  while (shocks.length > 5) shocks.shift();

  paintSky(ctx, w, h, cx, cy, time, levels, playing);
  paintStars(ctx, w, h, time, levels, playing, reduced);

  const sunR = Math.max(16, maxR * 0.085) * (1 + levels.bass * 0.28 + levels.beat * 0.08);

  for (const planet of PLANETS) {
    const orbitR = planet.orbit * maxR;
    const hot = levels[planet.band];
    ctx.beginPath();
    ctx.ellipse(cx, cy, orbitR, orbitR * tilt, 0, 0, TAU);
    ctx.strokeStyle = `rgba(243, 238, 230, ${0.1 + hot * 0.22})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const placed = PLANETS.map((planet) => {
    const ang = planet.phase + time * motion * (TAU / planet.period) * (0.55 + energy * 0.9);
    const orbitR = planet.orbit * maxR;
    const hot = levels[planet.band];
    const radius = Math.max(3.5, planet.size * maxR) * (1 + hot * 0.42 + (planet.band === "bass" ? levels.beat * 0.12 : 0));
    return {
      planet,
      ang,
      x: cx + Math.cos(ang) * orbitR,
      y: cy + Math.sin(ang) * orbitR * tilt,
      radius,
      hot,
      depth: Math.sin(ang),
    };
  });

  bodyHits.length = 0;

  const back = placed.filter((p) => p.depth <= 0).sort((a, b) => a.depth - b.depth);
  const front = placed.filter((p) => p.depth > 0).sort((a, b) => a.depth - b.depth);

  paintRocks(ctx, cx, cy, maxR, time, motion, levels, playing, false);
  for (const body of back) paintPlanet(ctx, body.x, body.y, body.radius, body.planet, body.hot, time, audio);

  paintSun(ctx, cx, cy, sunR, audio);
  paintShocks(ctx, cx, cy, maxR, time, reduced);

  paintRocks(ctx, cx, cy, maxR, time, motion, levels, playing, true);
  for (const body of front) paintPlanet(ctx, body.x, body.y, body.radius, body.planet, body.hot, time, audio);
  paintComet(ctx, cx, cy, maxR, time, motion, energy, playing);
  paintTravelingWave(ctx, cx, cy, maxR * 0.52, audio);

  for (const body of placed) {
    bodyHits.push({ name: body.planet.name, x: body.x, y: body.y, r: body.radius });
  }

  const vignette = ctx.createRadialGradient(cx, cy, maxR * 0.2, cx, cy * 0.9, Math.max(w, h) * 0.72);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function paintSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  time: number,
  levels: Levels,
  playing: boolean,
): void {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75);
  const warm = playing ? 18 + levels.bass * 28 : 14;
  g.addColorStop(0, `rgb(${28 + warm}, ${18 + warm * 0.45}, ${12 + levels.mid * 10})`);
  g.addColorStop(0.38, "#0c0e13");
  g.addColorStop(1, "#05060a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w * 0.5, h * 0.42);
  ctx.rotate(-0.55 + Math.sin(time * 0.05) * 0.02);
  ctx.scale(1, 0.16);
  const band = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.62);
  band.addColorStop(0, "rgba(243, 230, 210, 0.075)");
  band.addColorStop(0.55, "rgba(224, 161, 90, 0.03)");
  band.addColorStop(1, "rgba(243, 230, 210, 0)");
  ctx.fillStyle = band;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.62, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function paintStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  levels: Levels,
  playing: boolean,
  reduced: boolean,
): void {
  for (const star of stars) {
    const tw = reduced ? 1 : 0.65 + 0.35 * Math.sin(time * star.tw + star.a * 6);
    const audioLift = playing ? (star.band ? levels.air : levels.high) * 0.55 : 0;
    const alpha = Math.min(1, star.a * tw + audioLift);
    ctx.fillStyle = `rgba(243, 238, 230, ${alpha})`;
    ctx.beginPath();
    ctx.arc(star.x * w, star.y * h, star.r, 0, TAU);
    ctx.fill();
  }
}

function paintSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sunR: number,
  audio: FrameAudio,
): void {
  const { levels } = audio;
  const glowR = sunR * (3.1 + levels.bass * 1.6);
  const glow = ctx.createRadialGradient(cx, cy, sunR * 0.2, cx, cy, glowR);
  glow.addColorStop(0, `rgba(255, 214, 150, ${0.45 + levels.bass * 0.35})`);
  glow.addColorStop(0.35, `rgba(224, 140, 64, ${0.16 + levels.mid * 0.12})`);
  glow.addColorStop(1, "rgba(224, 120, 40, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, glowR, 0, TAU);
  ctx.fill();

  const core = ctx.createRadialGradient(cx - sunR * 0.28, cy - sunR * 0.32, sunR * 0.08, cx, cy, sunR);
  core.addColorStop(0, "#fff8ee");
  core.addColorStop(0.28, "#ffe0a8");
  core.addColorStop(0.62, "#f0a04a");
  core.addColorStop(1, "#b55222");
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, TAU);
  ctx.fillStyle = core;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx - sunR * 0.22, cy - sunR * 0.26, sunR * 0.28, 0, TAU);
  ctx.fillStyle = "rgba(255, 250, 240, 0.55)";
  ctx.fill();
}

const waveX = new Float32Array(512);
const waveY = new Float32Array(512);
const waveIX = new Float32Array(512);
const waveIY = new Float32Array(512);

function paintTravelingWave(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  audio: FrameAudio,
): void {
  const mins = audio.waveMin;
  const maxs = audio.waveMax;
  const count = Math.min(mins.length, maxs.length, waveX.length);
  if (count < 2) return;

  const amp = radius * 0.42;
  const head = audio.waveHead;

  for (let i = 0; i < count; i++) {
    const index = (head + i) % count;
    const ang = (i / count) * TAU - Math.PI / 2;
    const min = mins[index] ?? 0;
    const max = maxs[index] ?? 0;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang) * tilt;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const x = cx + dx * radius;
    const y = cy + dy * radius;
    waveX[i] = x + nx * max * amp;
    waveY[i] = y + ny * max * amp;
    waveIX[i] = x + nx * min * amp;
    waveIY[i] = y + ny * min * amp;
  }

  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * tilt, 0, 0, TAU);
  ctx.strokeStyle = "rgba(243, 238, 230, 0.16)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(waveX[0] ?? 0, waveY[0] ?? 0);
  for (let i = 1; i < count; i++) ctx.lineTo(waveX[i] ?? 0, waveY[i] ?? 0);
  for (let i = count - 1; i >= 0; i--) ctx.lineTo(waveIX[i] ?? 0, waveIY[i] ?? 0);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 214, 150, 0.32)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(waveX[0] ?? 0, waveY[0] ?? 0);
  for (let i = 1; i < count; i++) ctx.lineTo(waveX[i] ?? 0, waveY[i] ?? 0);
  ctx.strokeStyle = "rgba(255, 236, 214, 0.95)";
  ctx.lineWidth = 1.75;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(waveIX[0] ?? 0, waveIY[0] ?? 0);
  for (let i = 1; i < count; i++) ctx.lineTo(waveIX[i] ?? 0, waveIY[i] ?? 0);
  ctx.strokeStyle = "rgba(224, 161, 90, 0.7)";
  ctx.lineWidth = 1.25;
  ctx.stroke();

  const last = count - 1;
  ctx.beginPath();
  ctx.arc(waveX[last] ?? 0, waveY[last] ?? 0, 3.2, 0, TAU);
  ctx.fillStyle = "#fff6ea";
  ctx.fill();
}

function paintShocks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  maxR: number,
  time: number,
  reduced: boolean,
): void {
  if (reduced) return;
  for (let i = shocks.length - 1; i >= 0; i--) {
    const born = shocks[i] ?? time;
    const age = time - born;
    if (age > 1.35) {
      shocks.splice(i, 1);
      continue;
    }
    const p = age / 1.35;
    const rad = maxR * (0.12 + p * 0.95);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rad, rad * tilt, 0, 0, TAU);
    ctx.strokeStyle = `rgba(224, 161, 90, ${(1 - p) * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function paintRocks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  maxR: number,
  time: number,
  motion: number,
  levels: Levels,
  playing: boolean,
  front: boolean,
): void {
  for (const rock of rocks) {
    const ang = rock.phase + time * rock.speed * motion * (0.7 + levels.high * 0.8);
    const depth = Math.sin(ang);
    const isFront = depth > 0;
    if (isFront !== front) continue;
    const orbit = rock.orbit * maxR;
    const x = cx + Math.cos(ang) * orbit;
    const y = cy + Math.sin(ang) * orbit * tilt + rock.lift * maxR;
    const alpha = (0.25 + (playing ? levels.high * 0.7 : 0)) * (isFront ? 1 : 0.45);
    ctx.fillStyle = `rgba(196, 176, 146, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, rock.size, 0, TAU);
    ctx.fill();
  }
}

function paintPlanet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  planet: Planet,
  hot: number,
  time: number,
  audio: FrameAudio,
): void {
  if (hot > 0.08) {
    ctx.beginPath();
    ctx.arc(x, y, radius * (1.7 + hot), 0, TAU);
    ctx.fillStyle = `rgba(224, 176, 120, ${hot * 0.18})`;
    ctx.fill();
  }

  if (planet.kind === "saturn") paintSaturnRings(ctx, x, y, radius, false, audio, time);

  if (planet.kind === "jupiter") paintJupiter(ctx, x, y, radius);
  else if (planet.kind === "earth") paintEarth(ctx, x, y, radius, time);
  else paintSphere(ctx, x, y, radius, planet.color);

  if (planet.kind === "saturn") paintSaturnRings(ctx, x, y, radius, true, audio, time);

  if (planet.name === "Venus") {
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.18, 0, TAU);
    ctx.strokeStyle = "rgba(231, 211, 164, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (planet.moons) {
    for (let m = 0; m < planet.moons; m++) {
      const spin = time * (1.4 + m * 0.6) + m * 2;
      const dist = radius * (2.3 + m * 0.85);
      const mx = x + Math.cos(spin) * dist;
      const my = y + Math.sin(spin) * dist * 0.55;
      paintSphere(ctx, mx, my, Math.max(1.4, radius * 0.16), m === 0 ? "#d9d3c8" : "#c4bfb4");
    }
  }
}

function paintSphere(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string): void {
  const g = ctx.createRadialGradient(x - radius * 0.38, y - radius * 0.42, radius * 0.1, x, y, radius);
  g.addColorStop(0, mix(color, "#fff6ea", 0.62));
  g.addColorStop(0.55, color);
  g.addColorStop(1, mix(color, "#120c09", 0.55));
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
}

function paintEarth(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, time: number): void {
  paintSphere(ctx, x, y, radius, "#3f7590");
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();
  ctx.fillStyle = "#8d9a62";
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.15 + Math.sin(time * 0.15) * radius * 0.05, y - radius * 0.1, radius * 0.42, radius * 0.28, 0.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#c4a574";
  ctx.beginPath();
  ctx.ellipse(x + radius * 0.28, y + radius * 0.22, radius * 0.22, radius * 0.16, -0.4, 0, TAU);
  ctx.fill();
  ctx.restore();
  const gloss = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.05, x, y, radius);
  gloss.addColorStop(0, "rgba(255, 250, 240, 0.35)");
  gloss.addColorStop(0.5, "rgba(255, 250, 240, 0)");
  gloss.addColorStop(1, "rgba(8, 12, 16, 0.35)");
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, radius + 1.5, 0, TAU);
  ctx.strokeStyle = "rgba(170, 210, 214, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function paintJupiter(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  const stripes = ["#edd9b0", "#d09a58", "#f0e2c4", "#c47a42", "#e7c892", "#b86a38"];
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.clip();
  for (let i = 0; i < stripes.length; i++) {
    const stripe = stripes[i] ?? "#d7b07a";
    ctx.fillStyle = stripe;
    const slice = (radius * 2) / stripes.length;
    ctx.fillRect(x - radius, y - radius + i * slice, radius * 2, slice + 0.6);
  }
  ctx.beginPath();
  ctx.ellipse(x + radius * 0.22, y + radius * 0.12, radius * 0.28, radius * 0.16, 0.3, 0, TAU);
  ctx.fillStyle = "#a84832";
  ctx.fill();
  ctx.restore();
  const gloss = ctx.createRadialGradient(x - radius * 0.36, y - radius * 0.4, radius * 0.08, x + radius * 0.2, y + radius * 0.2, radius);
  gloss.addColorStop(0, "rgba(255, 248, 236, 0.38)");
  gloss.addColorStop(0.55, "rgba(255, 248, 236, 0)");
  gloss.addColorStop(1, "rgba(40, 18, 8, 0.38)");
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

function paintSaturnRings(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  front: boolean,
  audio: FrameAudio,
  time: number,
): void {
  const rx = radius * 2.15;
  const ry = radius * 0.72;
  const rot = -0.45;
  const wobble = ((audio.time[40] ?? 128) - 128) / 128;
  const width = Math.max(2, radius * (0.28 + (audio.playing ? Math.abs(wobble) * 0.2 + audio.levels.mid * 0.12 : 0.04)));
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, front ? 0 : Math.PI, front ? Math.PI : TAU);
  ctx.strokeStyle = front ? "rgba(236, 220, 180, 0.85)" : "rgba(196, 170, 120, 0.4)";
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.78, ry * 0.78, rot, front ? 0 : Math.PI, front ? Math.PI : TAU);
  ctx.strokeStyle = "rgba(7, 8, 12, 0.75)";
  ctx.lineWidth = Math.max(1, radius * 0.07);
  ctx.stroke();
  void time;
}

function paintComet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  maxR: number,
  time: number,
  motion: number,
  energy: number,
  playing: boolean,
): void {
  const ang = time * 0.42 * motion + 0.6;
  const orbit = maxR * 0.7;
  const x = cx + Math.cos(ang) * orbit;
  const y = cy + Math.sin(ang) * orbit * tilt;
  const tail = 14 + (playing ? energy * 36 : 6);
  for (let i = 12; i >= 1; i--) {
    const a = ang - i * 0.07;
    const px = cx + Math.cos(a) * orbit;
    const py = cy + Math.sin(a) * orbit * tilt;
    ctx.fillStyle = `rgba(243, 230, 210, ${((13 - i) / 13) * 0.28})`;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(0.6, (tail / 18) * (1 - i / 14)), 0, TAU);
    ctx.fill();
  }
  paintSphere(ctx, x, y, 2.4 + energy * 1.6, "#f3eee6");
}

function makeStars(): Star[] {
  const out: Star[] = [];
  let seed = 42;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 140; i++) {
    out.push({
      x: rnd(),
      y: rnd(),
      r: rnd() * 1.15 + 0.25,
      a: 0.2 + rnd() * 0.65,
      tw: 0.6 + rnd() * 2.2,
      band: false,
    });
  }
  for (let i = 0; i < 90; i++) {
    const x = rnd();
    const y = 0.42 + (x - 0.5) * 0.22 + (rnd() - 0.5) * 0.08;
    out.push({
      x,
      y: Math.min(0.96, Math.max(0.04, y)),
      r: rnd() * 0.9 + 0.2,
      a: 0.15 + rnd() * 0.4,
      tw: 0.8 + rnd() * 1.5,
      band: true,
    });
  }
  return out;
}

function makeRocks(): Rock[] {
  const out: Rock[] = [];
  let seed = 99;
  const rnd = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 100; i++) {
    out.push({
      orbit: 0.5 + rnd() * 0.055,
      phase: rnd() * TAU,
      speed: 0.18 + rnd() * 0.28,
      size: rnd() * 1.35 + 0.45,
      lift: (rnd() - 0.5) * 0.03,
    });
  }
  return out;
}

function mix(hex: string, target: string, t: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
