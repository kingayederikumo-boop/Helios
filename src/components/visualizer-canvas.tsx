import { memo, useEffect, useRef } from "react";
import type { Engine } from "@/lib/audio/engine";

export type VisualizerMode = "orb" | "wave";
export type OrbStyle = "blackhole" | "supernova" | "plasma" | "lightning" | "glow";

type Props = {
  engine: Engine | null;
  mode: VisualizerMode;
  orbStyle: OrbStyle;
  revolve: boolean;
  edgeColor: string;
  edgeGlow?: boolean;
};

type Levels = {
  bass: number;
  mid: number;
  high: number;
  air: number;
  energy: number;
  beat: number;
};

type Dust = { x: number; y: number; z: number; s: number; a: number };

const SILENT: Levels = { bass: 0, mid: 0, high: 0, air: 0, energy: 0, beat: 0 };

// Colour variants for the lightning-style energy orb (from your grid ref)
const LIGHTNING_COLORS = [
  "#ff2a6d",
  "#9b5de5",
  "#00f5d4",
  "#fee440",
  "#00bbf9",
  "#f15bb5",
  "#ff6b35",
  "#7b2cbf",
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return { r: 255, g: 107, b: 53 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function makeDust(w: number, h: number, count: number): Dust[] {
  const out: Dust[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * w,
      y: Math.random() * h,
      z: 0.2 + Math.random() * 0.8,
      s: 0.4 + Math.random() * 1.8,
      a: 0.15 + Math.random() * 0.55,
    });
  }
  return out;
}

export const VisualizerCanvas = memo(function VisualizerCanvas({
  engine,
  mode,
  orbStyle,
  revolve,
  edgeColor,
  edgeGlow = true,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(engine);
  const modeRef = useRef(mode);
  const styleRef = useRef(orbStyle);
  const revolveRef = useRef(revolve);
  const edgeColorRef = useRef(edgeColor);
  const edgeGlowRef = useRef(edgeGlow);
  const dustRef = useRef<Dust[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const colorIdxRef = useRef(0);

  engineRef.current = engine;
  modeRef.current = mode;
  styleRef.current = orbStyle;
  revolveRef.current = revolve;
  edgeColorRef.current = edgeColor;
  edgeGlowRef.current = edgeGlow;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let frame = 0;
    let lastBeat = 0;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const parent = canvas.parentElement;
      if (!parent) return;

      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w < 2 || h < 2) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.floor(w * dpr);
      const ph = Math.floor(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (sizeRef.current.w !== w || sizeRef.current.h !== h || dustRef.current.length === 0) {
        sizeRef.current = { w, h };
        dustRef.current = makeDust(w, h, 180);
      }

      const live = engineRef.current;
      live?.sample();
      const levels = live?.levels ?? SILENT;
      const playing = live?.playing ?? false;
      const t = now / 1000;
      const style = styleRef.current;

      // Cycle lightning colour on strong beats
      if (levels.beat > 0.55 && t - lastBeat > 0.25) {
        colorIdxRef.current = (colorIdxRef.current + 1) % LIGHTNING_COLORS.length;
        lastBeat = t;
      }

      paintBackground(ctx, w, h, style, levels, t);
      drawStarDust(ctx, dustRef.current, w, h, levels, t);

      if (modeRef.current === "wave") {
        drawWave(ctx, w, h, levels, t);
      } else {
        drawOrb(ctx, w, h, style, revolveRef.current, levels, t, playing, colorIdxRef.current);
      }

      if (edgeGlowRef.current) {
        drawEdgeLines(ctx, w, h, edgeColorRef.current, levels);
      }
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full touch-none"
      aria-hidden="true"
    />
  );
});

function paintBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: OrbStyle,
  levels: Levels,
  t: number,
) {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.max(w, h);

  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.95);
  if (style === "supernova") {
    bg.addColorStop(0, "#1a0806");
    bg.addColorStop(0.5, "#080308");
    bg.addColorStop(1, "#020105");
  } else if (style === "plasma") {
    bg.addColorStop(0, "#050c18");
    bg.addColorStop(0.5, "#03060e");
    bg.addColorStop(1, "#010208");
  } else if (style === "lightning") {
    bg.addColorStop(0, "#0a0612");
    bg.addColorStop(0.5, "#05030a");
    bg.addColorStop(1, "#020106");
  } else {
    bg.addColorStop(0, "#0a050c");
    bg.addColorStop(0.5, "#040208");
    bg.addColorStop(1, "#010105");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Nebula haze — denser near edges like the refs
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.22 + levels.energy * 0.25 + levels.beat * 0.1;
  const n1 = ctx.createRadialGradient(
    cx + Math.sin(t * 0.1) * 40,
    cy + Math.cos(t * 0.08) * 30,
    0,
    cx,
    cy,
    maxR * 0.6,
  );
  if (style === "supernova") {
    n1.addColorStop(0, "rgba(255, 80, 25, 0.55)");
    n1.addColorStop(0.4, "rgba(160, 30, 20, 0.25)");
  } else if (style === "plasma") {
    n1.addColorStop(0, "rgba(40, 160, 255, 0.45)");
    n1.addColorStop(0.4, "rgba(20, 60, 160, 0.2)");
  } else if (style === "lightning") {
    n1.addColorStop(0, "rgba(150, 50, 255, 0.4)");
    n1.addColorStop(0.4, "rgba(80, 20, 140, 0.2)");
  } else {
    n1.addColorStop(0, "rgba(255, 90, 30, 0.4)");
    n1.addColorStop(0.4, "rgba(100, 25, 60, 0.18)");
  }
  n1.addColorStop(1, "transparent");
  ctx.fillStyle = n1;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawStarDust(
  ctx: CanvasRenderingContext2D,
  dust: Dust[],
  w: number,
  h: number,
  levels: Levels,
  t: number,
) {
  const drift = 0.12 + levels.energy * 0.5;
  const pulse = 0.65 + levels.beat * 0.7 + levels.energy * 0.35;

  ctx.save();
  for (const p of dust) {
    p.x += (0.12 + p.z * 0.45) * drift;
    p.y += Math.sin(t * 0.35 + p.x * 0.01) * 0.1 * p.z;
    if (p.x > w + 4) p.x = -4;
    if (p.y > h + 4) p.y = -4;
    if (p.y < -4) p.y = h + 4;

    const alpha = Math.min(1, p.a * pulse * (0.45 + p.z));
    const size = p.s * (0.55 + p.z * 0.9) * (1 + levels.high * 0.4);

    ctx.globalAlpha = alpha * 0.4;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4);
    g.addColorStop(0, "rgba(255, 240, 210, 0.95)");
    g.addColorStop(0.35, "rgba(255, 170, 100, 0.35)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255, 250, 240, 0.95)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEdgeLines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  edgeColor: string,
  levels: Levels,
) {
  const { r, g, b } = hexToRgb(edgeColor);
  // Strong music coupling
  const intensity =
    0.35 + levels.energy * 0.5 + levels.beat * 0.45 + levels.bass * 0.3;
  const thickness = 2.5 + levels.bass * 6 + levels.beat * 4;
  const pad = 24 + levels.energy * 22 + levels.beat * 12;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  // Soft bloom bands
  let grad = ctx.createLinearGradient(0, 0, pad, 0);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.85 * intensity})`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},${0.3 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, pad, h);

  grad = ctx.createLinearGradient(w, 0, w - pad, 0);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.85 * intensity})`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},${0.3 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(w - pad, 0, pad, h);

  grad = ctx.createLinearGradient(0, 0, 0, pad * 0.85);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.6 * intensity})`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},${0.2 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, pad);

  grad = ctx.createLinearGradient(0, h, 0, h - pad * 0.85);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.6 * intensity})`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},${0.2 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - pad, w, pad);

  // Hard edge strokes that thicken with the beat
  ctx.shadowColor = `rgba(${r},${g},${b},1)`;
  ctx.shadowBlur = 20 + levels.energy * 32 + levels.beat * 20;
  ctx.strokeStyle = `rgba(${r},${g},${b},${0.9 + levels.beat * 0.1})`;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(2, h);
  ctx.moveTo(w - 2, 0);
  ctx.lineTo(w - 2, h);
  ctx.stroke();

  ctx.lineWidth = thickness * 0.65;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(w, 2);
  ctx.moveTo(0, h - 2);
  ctx.lineTo(w, h - 2);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawOrb(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: OrbStyle,
  revolve: boolean,
  levels: Levels,
  t: number,
  playing: boolean,
  colorIdx: number,
) {
  const cx = w / 2;
  const cy = h / 2;
  // Strong size pulse with bass + beat
  const pulse = 1 + levels.bass * 0.28 + levels.beat * 0.22 + levels.energy * 0.08;
  const r = Math.min(w, h) * 0.2 * pulse;

  const spinBase = revolve && playing ? 1 : 0.2;
  const spin = t * (0.4 + levels.energy * 1.2) * spinBase + levels.bass * 0.3;

  if (style === "blackhole") {
    drawBlackHole(ctx, cx, cy, r, spin, levels, revolve && playing);
  } else if (style === "supernova") {
    drawSupernova(ctx, cx, cy, r, levels, t);
  } else if (style === "plasma") {
    drawEnergyOrb(ctx, cx, cy, r, levels, t, "#40c8ff", "#2060ff", revolve && playing);
  } else if (style === "lightning") {
    const col = LIGHTNING_COLORS[colorIdx % LIGHTNING_COLORS.length];
    drawEnergyOrb(ctx, cx, cy, r, levels, t, col, "#ffffff", revolve && playing, true);
  } else {
    drawEnergyOrb(ctx, cx, cy, r, levels, t, "#ffc840", "#ff6a20", revolve && playing);
  }
}

/**
 * Interstellar-style black hole:
 * event horizon + photon ring + accretion disk that tilts on
 * horizontal, vertical, and diagonal axes and pulses with audio.
 */
function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  spin: number,
  levels: Levels,
  multiAxis: boolean,
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer gravitational glow — pulses
  const outer = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r * 3.6);
  outer.addColorStop(0, `rgba(255, 150, 50, ${0.22 + levels.energy * 0.35 + levels.beat * 0.15})`);
  outer.addColorStop(0.35, `rgba(255, 70, 20, ${0.12 + levels.mid * 0.15})`);
  outer.addColorStop(0.7, `rgba(120, 30, 10, ${0.05 + levels.bass * 0.08})`);
  outer.addColorStop(1, "transparent");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(0, 0, r * 3.6, 0, Math.PI * 2);
  ctx.fill();

  // --- Multi-axis accretion rings ---
  // Horizontal-ish (main disk)
  const tiltH = multiAxis ? Math.sin(spin * 0.55) * 0.7 : 0.4;
  const tiltV = multiAxis ? Math.cos(spin * 0.38) * 0.55 : 0.25;
  const tiltD = multiAxis ? Math.sin(spin * 0.28 + 1.1) * 0.5 : 0.2;

  // Primary disk — horizontal / slight vertical blend
  drawAccretionBand(ctx, r, spin * 0.95, 0.22 + Math.abs(tiltH) * 0.4 + Math.abs(tiltV) * 0.15, levels, 1);

  // Secondary disk — diagonal axis
  if (multiAxis) {
    drawAccretionBand(
      ctx,
      r,
      spin * 0.55 + Math.PI / 4,
      0.18 + Math.abs(tiltD) * 0.35,
      levels,
      0.55,
    );
  }

  // Tertiary — more vertical
  if (multiAxis) {
    drawAccretionBand(
      ctx,
      r,
      spin * 0.35 + Math.PI / 2.2,
      0.12 + Math.abs(tiltV) * 0.4,
      levels,
      0.35,
    );
  }

  // Photon ring
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 220, 150, ${0.5 + levels.high * 0.4 + levels.beat * 0.2})`;
  ctx.lineWidth = 2 + levels.high * 2.5 + levels.beat * 2;
  ctx.shadowColor = "rgba(255, 160, 50, 1)";
  ctx.shadowBlur = 14 + levels.energy * 16;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Event horizon
  const hole = ctx.createRadialGradient(-r * 0.12, -r * 0.08, 0, 0, 0, r);
  hole.addColorStop(0, "#000000");
  hole.addColorStop(0.72, "#000000");
  hole.addColorStop(0.9, "#0a0503");
  hole.addColorStop(1, "#1a0c06");
  ctx.fillStyle = hole;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Soft rim light
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.97, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 120, 40, ${0.2 + levels.energy * 0.2 + levels.beat * 0.15})`;
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  ctx.restore();
}

function drawAccretionBand(
  ctx: CanvasRenderingContext2D,
  r: number,
  rotation: number,
  scaleY: number,
  levels: Levels,
  alphaMul: number,
) {
  ctx.save();
  ctx.rotate(rotation);
  ctx.scale(1, Math.max(0.08, scaleY));

  for (let band = 0; band < 3; band++) {
    const bandR = r * (1.55 + band * 0.3);
    const lw = r * (0.16 - band * 0.03) * (1 + levels.bass * 0.5 + levels.beat * 0.25);
    const a = (0.65 - band * 0.14 + levels.energy * 0.25) * alphaMul;

    const g = ctx.createLinearGradient(-bandR * 1.3, 0, bandR * 1.3, 0);
    g.addColorStop(0, "transparent");
    g.addColorStop(0.12, `rgba(255, 110, 30, ${a * 0.5})`);
    g.addColorStop(0.32, `rgba(255, 170, 60, ${a})`);
    g.addColorStop(0.5, `rgba(255, 245, 190, ${a * 1.15})`);
    g.addColorStop(0.68, `rgba(255, 100, 30, ${a})`);
    g.addColorStop(0.88, `rgba(200, 50, 15, ${a * 0.5})`);
    g.addColorStop(1, "transparent");

    ctx.strokeStyle = g;
    ctx.lineWidth = lw;
    ctx.shadowColor = "rgba(255, 140, 40, 0.9)";
    ctx.shadowBlur = 12 + levels.energy * 16 + levels.beat * 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, bandR, bandR, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Hot inner edge
  ctx.lineWidth = r * (0.05 + levels.beat * 0.06);
  ctx.strokeStyle = `rgba(255, 245, 210, ${(0.7 + levels.beat * 0.3) * alphaMul})`;
  ctx.shadowBlur = 14 + levels.beat * 12;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.32, r * 1.32, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawSupernova(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  levels: Levels,
  t: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Expanding shells — size reacts to energy/beat
  for (let i = 5; i >= 0; i--) {
    const shellR = r * (1.1 + i * 0.4) * (1 + levels.energy * 0.25 + levels.beat * 0.12);
    const alpha = Math.max(0, 0.16 - i * 0.022) + levels.mid * 0.06 + levels.beat * 0.04;
    const g = ctx.createRadialGradient(0, 0, shellR * 0.5, 0, 0, shellR);
    g.addColorStop(0, `rgba(255, 120, 40, ${alpha})`);
    g.addColorStop(0.45, `rgba(255, 50, 15, ${alpha * 0.7})`);
    g.addColorStop(0.75, `rgba(120, 20, 40, ${alpha * 0.35})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, shellR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bright pulsing core
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.15, "rgba(255, 245, 200, 0.95)");
  core.addColorStop(0.35, `rgba(255, 190, 70, ${0.9 + levels.beat * 0.1})`);
  core.addColorStop(0.55, "rgba(255, 80, 25, 0.85)");
  core.addColorStop(0.8, "rgba(160, 25, 10, 0.55)");
  core.addColorStop(1, "rgba(40, 5, 5, 0.15)");
  ctx.fillStyle = core;
  ctx.shadowColor = "rgba(255, 100, 30, 1)";
  ctx.shadowBlur = 30 + levels.energy * 45 + levels.beat * 25;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Filaments
  ctx.globalAlpha = 0.4 + levels.high * 0.4 + levels.beat * 0.15;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + t * (0.4 + levels.energy * 0.6);
    const len = r * (1.25 + levels.energy * 0.8 + levels.beat * 0.3 + (i % 3) * 0.12);
    const grad = ctx.createLinearGradient(
      Math.cos(a) * r * 0.5,
      Math.sin(a) * r * 0.5,
      Math.cos(a) * len,
      Math.sin(a) * len,
    );
    grad.addColorStop(0, "rgba(255, 220, 120, 0.95)");
    grad.addColorStop(0.5, "rgba(255, 80, 30, 0.65)");
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5 + levels.bass * 2.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Single energy orb (plasma / lightning colour variant / glow).
 * Looks like one sphere from your multi-orb reference grid — not the whole grid.
 */
function drawEnergyOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  levels: Levels,
  t: number,
  primary: string,
  highlight: string,
  revolve: boolean,
  bolts = false,
) {
  ctx.save();
  ctx.translate(cx, cy);

  const { r: pr, g: pg, b: pb } = hexToRgb(primary);

  // Outer aura — pulses hard
  const auraR = r * (1.7 + levels.energy * 0.4 + levels.beat * 0.25);
  const aura = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, auraR);
  aura.addColorStop(0, `rgba(${pr},${pg},${pb},${0.45 + levels.energy * 0.3 + levels.beat * 0.2})`);
  aura.addColorStop(0.45, `rgba(${pr},${pg},${pb},${0.15 + levels.mid * 0.12})`);
  aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, auraR, 0, Math.PI * 2);
  ctx.fill();

  // Glass sphere body
  const body = ctx.createRadialGradient(-r * 0.25, -r * 0.3, 0, 0, 0, r * 1.05);
  body.addColorStop(0, highlight);
  body.addColorStop(0.22, `rgba(${pr},${pg},${pb},0.95)`);
  body.addColorStop(0.55, `rgba(${Math.floor(pr * 0.4)},${Math.floor(pg * 0.35)},${Math.floor(pb * 0.5)},0.9)`);
  body.addColorStop(0.85, `rgba(${Math.floor(pr * 0.15)},${Math.floor(pg * 0.1)},${Math.floor(pb * 0.2)},0.7)`);
  body.addColorStop(1, "rgba(5,2,10,0.3)");
  ctx.fillStyle = body;
  ctx.shadowColor = `rgba(${pr},${pg},${pb},0.95)`;
  ctx.shadowBlur = 22 + levels.energy * 40 + levels.beat * 20;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Specular highlight
  ctx.globalAlpha = 0.55;
  const hi = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 0, -r * 0.3, -r * 0.35, r * 0.45);
  hi.addColorStop(0, "rgba(255,255,255,0.85)");
  hi.addColorStop(1, "transparent");
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.arc(-r * 0.28, -r * 0.32, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Orbiting energy arcs
  if (revolve) {
    ctx.globalAlpha = 0.55 + levels.high * 0.4;
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2 + t * (1.2 + levels.energy);
      const rr = r * (0.6 + (i % 3) * 0.12);
      ctx.strokeStyle = i % 2 === 0 ? highlight : primary;
      ctx.lineWidth = 1.2 + levels.mid * 2.5 + levels.beat * 1.5;
      ctx.shadowColor = `rgba(${pr},${pg},${pb},0.8)`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, rr, a0, a0 + 0.7 + levels.bass * 0.5);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Lightning bolts on energy (lightning style only)
  if (bolts && (levels.beat > 0.3 || levels.energy > 0.4)) {
    ctx.globalAlpha = 0.7 + levels.beat * 0.3;
    ctx.lineWidth = 1.5 + levels.high * 2;
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(220, 240, 255, 0.9)";
    ctx.shadowBlur = 10;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + t * 2.5 + levels.beat;
      ctx.strokeStyle = i % 2 === 0 ? "#e8f7ff" : primary;
      ctx.beginPath();
      let x = Math.cos(a) * r * 0.12;
      let y = Math.sin(a) * r * 0.12;
      ctx.moveTo(x, y);
      for (let s = 0; s < 5; s++) {
        const jitter = Math.sin(t * 18 + i * 5 + s * 2) * r * 0.1;
        x += Math.cos(a + Math.sin(t * 6 + s) * 0.5) * (r * 0.22);
        y += Math.sin(a + Math.cos(t * 6 + s) * 0.5) * (r * 0.22);
        ctx.lineTo(x + jitter, y - jitter);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  levels: Levels,
  t: number,
) {
  const cy = h / 2;
  const amp = Math.min(w, h) * 0.2 * (0.45 + levels.energy * 1.0 + levels.beat * 0.3);
  const points = 160;

  ctx.save();
  ctx.translate(0, cy);

  ctx.globalAlpha = 0.18 + levels.energy * 0.2;
  const fillGrad = ctx.createLinearGradient(0, -amp * 1.5, 0, amp * 1.5);
  fillGrad.addColorStop(0, "#00f5d4");
  fillGrad.addColorStop(0.5, "#9b5de5");
  fillGrad.addColorStop(1, "#ff2a6d");
  ctx.fillStyle = fillGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * w;
    const wave =
      Math.sin(i * 0.12 + t * 3.2) * amp * (0.45 + levels.mid) +
      Math.sin(i * 0.06 + t * 1.6) * amp * 0.4 * levels.bass +
      Math.sin(i * 0.28 + t * 5.5) * amp * 0.2 * levels.high;
    ctx.lineTo(x, wave);
  }
  for (let i = points; i >= 0; i--) {
    const x = (i / points) * w;
    const wave =
      Math.sin(i * 0.12 + t * 3.2) * amp * (0.45 + levels.mid) +
      Math.sin(i * 0.06 + t * 1.6) * amp * 0.4 * levels.bass +
      Math.sin(i * 0.28 + t * 5.5) * amp * 0.2 * levels.high;
    ctx.lineTo(x, -wave * 0.85);
  }
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * w;
    const wave =
      Math.sin(i * 0.12 + t * 3.2) * amp * (0.45 + levels.mid) +
      Math.sin(i * 0.06 + t * 1.6) * amp * 0.4 * levels.bass +
      Math.sin(i * 0.28 + t * 5.5) * amp * 0.2 * levels.high;
    if (i === 0) ctx.moveTo(x, wave);
    else ctx.lineTo(x, wave);
  }
  const grad = ctx.createLinearGradient(0, -amp, w, amp);
  grad.addColorStop(0, "#00f5d4");
  grad.addColorStop(0.35, "#9b5de5");
  grad.addColorStop(0.7, "#ff2a6d");
  grad.addColorStop(1, "#fee440");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.5 + levels.bass * 3.5 + levels.beat * 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(155, 93, 229, 0.8)";
  ctx.shadowBlur = 14 + levels.energy * 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * w;
    const wave =
      Math.sin(i * 0.12 + t * 3.2) * amp * (0.45 + levels.mid) +
      Math.sin(i * 0.06 + t * 1.6) * amp * 0.4 * levels.bass +
      Math.sin(i * 0.28 + t * 5.5) * amp * 0.2 * levels.high;
    if (i === 0) ctx.moveTo(x, -wave * 0.85);
    else ctx.lineTo(x, -wave * 0.85);
  }
  ctx.stroke();

  ctx.restore();
}
