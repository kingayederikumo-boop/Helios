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

/** Particle on an orbital ring (black hole / galaxy style) */
type RingParticle = {
  angle: number;
  radius: number; // normalized 0–1 across the disk
  speed: number;
  size: number;
  alpha: number;
  plane: number; // which tilt plane 0,1,2
};

const SILENT: Levels = { bass: 0, mid: 0, high: 0, air: 0, energy: 0, beat: 0 };

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
      s: 0.4 + Math.random() * 1.6,
      a: 0.12 + Math.random() * 0.5,
    });
  }
  return out;
}

function makeRingParticles(count: number): RingParticle[] {
  const out: RingParticle[] = [];
  for (let i = 0; i < count; i++) {
    // Prefer denser mid-disk (accretion look)
    const u = Math.random();
    const radius = 0.35 + Math.pow(u, 0.7) * 0.65;
    out.push({
      angle: Math.random() * Math.PI * 2,
      radius,
      speed: (0.4 + Math.random() * 0.9) * (1.2 - radius * 0.4),
      size: 0.6 + Math.random() * 1.8,
      alpha: 0.25 + Math.random() * 0.75,
      plane: i % 3,
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
  const ringRef = useRef<RingParticle[]>([]);
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

    if (ringRef.current.length === 0) {
      ringRef.current = makeRingParticles(1400);
    }

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
        dustRef.current = makeDust(w, h, 160);
      }

      const live = engineRef.current;
      live?.sample();
      const levels = live?.levels ?? SILENT;
      const playing = live?.playing ?? false;
      const t = now / 1000;
      const style = styleRef.current;

      if (levels.beat > 0.55 && t - lastBeat > 0.22) {
        colorIdxRef.current = (colorIdxRef.current + 1) % LIGHTNING_COLORS.length;
        lastBeat = t;
      }

      paintBackground(ctx, w, h, style, levels, t);
      drawStarDust(ctx, dustRef.current, w, h, levels, t);

      if (modeRef.current === "wave") {
        drawWave(ctx, w, h, levels, t);
      } else {
        drawOrb(
          ctx,
          w,
          h,
          style,
          revolveRef.current,
          levels,
          t,
          playing,
          colorIdxRef.current,
          ringRef.current,
        );
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
  bg.addColorStop(0, style === "plasma" ? "#040a14" : style === "lightning" ? "#080510" : "#060308");
  bg.addColorStop(0.55, "#030208");
  bg.addColorStop(1, "#010104");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.15 + levels.energy * 0.2;
  const n1 = ctx.createRadialGradient(
    cx + Math.sin(t * 0.08) * 30,
    cy,
    0,
    cx,
    cy,
    maxR * 0.55,
  );
  if (style === "supernova") {
    n1.addColorStop(0, "rgba(255, 70, 20, 0.45)");
  } else if (style === "plasma") {
    n1.addColorStop(0, "rgba(40, 140, 255, 0.35)");
  } else if (style === "lightning") {
    n1.addColorStop(0, "rgba(120, 50, 255, 0.35)");
  } else {
    n1.addColorStop(0, "rgba(40, 180, 255, 0.3)");
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
  const drift = 0.1 + levels.energy * 0.45;
  const pulse = 0.6 + levels.beat * 0.65 + levels.energy * 0.3;

  ctx.save();
  for (const p of dust) {
    p.x += (0.1 + p.z * 0.4) * drift;
    p.y += Math.sin(t * 0.3 + p.x * 0.01) * 0.08 * p.z;
    if (p.x > w + 4) p.x = -4;
    if (p.y > h + 4) p.y = -4;
    if (p.y < -4) p.y = h + 4;

    const alpha = Math.min(1, p.a * pulse * (0.4 + p.z));
    const size = p.s * (0.5 + p.z * 0.85) * (1 + levels.high * 0.35);

    ctx.globalAlpha = alpha * 0.35;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3.5);
    g.addColorStop(0, "rgba(200, 230, 255, 0.9)");
    g.addColorStop(0.4, "rgba(120, 180, 255, 0.3)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(230, 245, 255, 0.95)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 0.45, 0, Math.PI * 2);
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
  const intensity =
    0.35 + levels.energy * 0.5 + levels.beat * 0.45 + levels.bass * 0.3;
  const thickness = 2.5 + levels.bass * 6 + levels.beat * 4;
  const pad = 24 + levels.energy * 22 + levels.beat * 12;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

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
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.55 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, pad);

  grad = ctx.createLinearGradient(0, h, 0, h - pad * 0.85);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.55 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - pad, w, pad);

  ctx.shadowColor = `rgba(${r},${g},${b},1)`;
  ctx.shadowBlur = 18 + levels.energy * 30 + levels.beat * 18;
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
  rings: RingParticle[],
) {
  const cx = w / 2;
  const cy = h / 2;
  const pulse = 1 + levels.bass * 0.26 + levels.beat * 0.2 + levels.energy * 0.08;
  const r = Math.min(w, h) * 0.18 * pulse;

  if (style === "blackhole") {
    drawParticleBlackHole(ctx, cx, cy, r, levels, t, revolve && playing, rings);
  } else if (style === "supernova") {
    drawSupernova(ctx, cx, cy, r, levels, t);
  } else if (style === "plasma") {
    drawVolumetricOrb(ctx, cx, cy, r, levels, t, "#40d0ff", "#2060ff", revolve && playing);
  } else if (style === "lightning") {
    const col = LIGHTNING_COLORS[colorIdx % LIGHTNING_COLORS.length];
    drawVolumetricOrb(ctx, cx, cy, r, levels, t, col, "#ffffff", revolve && playing, true);
  } else {
    drawVolumetricOrb(ctx, cx, cy, r, levels, t, "#ffc840", "#ff6a20", revolve && playing);
  }
}

/**
 * Particle accretion disk — matches the cyan ring / galaxy refs.
 * Three orbital planes (horizontal, diagonal, vertical-ish) that
 * spin and expand with the music.
 */
function drawParticleBlackHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  levels: Levels,
  t: number,
  multiAxis: boolean,
  particles: RingParticle[],
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Soft outer glow
  const outer = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 3.8);
  outer.addColorStop(0, `rgba(80, 200, 255, ${0.12 + levels.energy * 0.25 + levels.beat * 0.1})`);
  outer.addColorStop(0.4, `rgba(40, 120, 255, ${0.06 + levels.mid * 0.1})`);
  outer.addColorStop(1, "transparent");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(0, 0, r * 3.8, 0, Math.PI * 2);
  ctx.fill();

  // Plane tilt factors driven by time + audio
  const spin = t * (0.55 + levels.energy * 1.1);
  const tiltH = multiAxis ? 0.22 + Math.sin(spin * 0.45) * 0.28 : 0.32;
  const tiltD = multiAxis ? 0.18 + Math.cos(spin * 0.32) * 0.25 : 0.15;
  const tiltV = multiAxis ? 0.12 + Math.sin(spin * 0.28 + 1) * 0.2 : 0.1;

  const diskScale = 1 + levels.bass * 0.35 + levels.beat * 0.2;
  const baseR = r * 2.4 * diskScale;

  // Draw particles as additive points
  ctx.globalCompositeOperation = "lighter";

  for (const p of particles) {
    // Orbital motion
    const speedMul = multiAxis ? 1 : 0.35;
    p.angle += 0.012 * p.speed * speedMul * (1 + levels.energy * 0.8);

    const planeTilt =
      p.plane === 0 ? tiltH : p.plane === 1 ? tiltD : tiltV;
    const planeRot =
      p.plane === 0
        ? spin * 0.3
        : p.plane === 1
          ? spin * 0.22 + Math.PI / 4
          : spin * 0.18 + Math.PI / 2.1;

    const rad = baseR * p.radius;
    // 3D-ish projection: rotate in plane then squash Y
    const lx = Math.cos(p.angle) * rad;
    const ly = Math.sin(p.angle) * rad * planeTilt;

    const cosR = Math.cos(planeRot);
    const sinR = Math.sin(planeRot);
    const x = lx * cosR - ly * sinR;
    const y = lx * sinR + ly * cosR;

    // Brightness: denser/brighter near inner edge + beat flash
    const inner = 1 - p.radius;
    const bright =
      p.alpha *
      (0.35 + inner * 0.55 + levels.energy * 0.35 + levels.beat * 0.25);

    // Cyan → white hot core of disk
    const heat = Math.min(1, inner * 1.3 + levels.beat * 0.3);
    const cr = Math.floor(120 + heat * 135);
    const cg = Math.floor(200 + heat * 55);
    const cb = 255;

    const sz = p.size * (0.7 + levels.high * 0.5 + levels.beat * 0.3);

    ctx.globalAlpha = Math.min(1, bright);
    ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
    ctx.beginPath();
    ctx.arc(x, y, sz * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Soft bloom on brighter particles
    if (bright > 0.55) {
      ctx.globalAlpha = bright * 0.25;
      ctx.beginPath();
      ctx.arc(x, y, sz * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  // Event horizon
  const hole = ctx.createRadialGradient(-r * 0.1, -r * 0.08, 0, 0, 0, r);
  hole.addColorStop(0, "#000000");
  hole.addColorStop(0.75, "#000000");
  hole.addColorStop(0.92, "#050a12");
  hole.addColorStop(1, "#0a1520");
  ctx.fillStyle = hole;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Photon ring
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.06, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(180, 230, 255, ${0.45 + levels.high * 0.4 + levels.beat * 0.2})`;
  ctx.lineWidth = 1.5 + levels.high * 2 + levels.beat * 1.5;
  ctx.shadowColor = "rgba(100, 200, 255, 0.9)";
  ctx.shadowBlur = 12 + levels.energy * 14;
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

  for (let i = 5; i >= 0; i--) {
    const shellR = r * (1.1 + i * 0.42) * (1 + levels.energy * 0.28 + levels.beat * 0.12);
    const alpha = Math.max(0, 0.15 - i * 0.02) + levels.mid * 0.05 + levels.beat * 0.04;
    const g = ctx.createRadialGradient(0, 0, shellR * 0.45, 0, 0, shellR);
    g.addColorStop(0, `rgba(255, 120, 40, ${alpha})`);
    g.addColorStop(0.5, `rgba(255, 50, 15, ${alpha * 0.65})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, shellR, 0, Math.PI * 2);
    ctx.fill();
  }

  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.2, "rgba(255, 240, 180, 0.95)");
  core.addColorStop(0.45, `rgba(255, 160, 50, ${0.9 + levels.beat * 0.1})`);
  core.addColorStop(0.75, "rgba(200, 40, 15, 0.7)");
  core.addColorStop(1, "rgba(40, 5, 5, 0.2)");
  ctx.fillStyle = core;
  ctx.shadowColor = "rgba(255, 100, 30, 1)";
  ctx.shadowBlur = 28 + levels.energy * 40 + levels.beat * 22;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 0.4 + levels.high * 0.4;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + t * (0.4 + levels.energy * 0.5);
    const len = r * (1.3 + levels.energy * 0.7 + levels.beat * 0.25);
    const grad = ctx.createLinearGradient(
      Math.cos(a) * r * 0.4,
      Math.sin(a) * r * 0.4,
      Math.cos(a) * len,
      Math.sin(a) * len,
    );
    grad.addColorStop(0, "rgba(255, 220, 120, 0.9)");
    grad.addColorStop(0.5, "rgba(255, 80, 30, 0.55)");
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4 + levels.bass * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Volumetric energy orb — soft particle cloud body like the green/red
 * organic forms in the multi-window ref, not a flat glass ball.
 */
function drawVolumetricOrb(
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

  // Outer volume
  const auraR = r * (1.85 + levels.energy * 0.45 + levels.beat * 0.3);
  const aura = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, auraR);
  aura.addColorStop(0, `rgba(${pr},${pg},${pb},${0.5 + levels.energy * 0.3 + levels.beat * 0.2})`);
  aura.addColorStop(0.4, `rgba(${pr},${pg},${pb},${0.18 + levels.mid * 0.12})`);
  aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, auraR, 0, Math.PI * 2);
  ctx.fill();

  // Dense particle cloud forming the orb body
  ctx.globalCompositeOperation = "lighter";
  const count = 220;
  for (let i = 0; i < count; i++) {
    // Spherical distribution (rejection-ish via radius bias)
    const u = Math.random();
    const v = Math.random();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const rad = r * Math.cbrt(Math.random()) * (0.85 + levels.bass * 0.15);

    // Slow swirl
    const swirl = t * (0.6 + levels.energy * 0.8) * (revolve ? 1 : 0.25);
    const x = rad * Math.sin(phi) * Math.cos(theta + swirl);
    const y = rad * Math.sin(phi) * Math.sin(theta + swirl) * 0.85;
    // Depth shade
    const z = rad * Math.cos(phi);
    const depth = (z / r + 1) * 0.5;

    const alpha = (0.15 + depth * 0.55) * (0.5 + levels.energy * 0.5 + levels.beat * 0.25);
    const sz = (0.8 + depth * 1.4) * (1 + levels.high * 0.4);

    ctx.globalAlpha = Math.min(1, alpha);
    ctx.fillStyle = depth > 0.65 ? highlight : primary;
    ctx.beginPath();
    ctx.arc(x, y, sz * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  // Core glow
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.55);
  core.addColorStop(0, `rgba(255,255,255,${0.55 + levels.beat * 0.3})`);
  core.addColorStop(0.4, `rgba(${pr},${pg},${pb},0.45)`);
  core.addColorStop(1, "transparent");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting arcs when revolving
  if (revolve) {
    ctx.globalAlpha = 0.5 + levels.high * 0.4;
    for (let i = 0; i < 6; i++) {
      const a0 = (i / 6) * Math.PI * 2 + t * (1.1 + levels.energy);
      const rr = r * (0.7 + (i % 3) * 0.1);
      ctx.strokeStyle = i % 2 === 0 ? highlight : primary;
      ctx.lineWidth = 1.2 + levels.mid * 2 + levels.beat;
      ctx.shadowColor = `rgba(${pr},${pg},${pb},0.8)`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, rr, a0, a0 + 0.65 + levels.bass * 0.4);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  if (bolts && (levels.beat > 0.28 || levels.energy > 0.4)) {
    ctx.globalAlpha = 0.65 + levels.beat * 0.3;
    ctx.lineWidth = 1.4 + levels.high * 2;
    ctx.shadowColor = "rgba(220,240,255,0.9)";
    ctx.shadowBlur = 10;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + t * 2.5 + levels.beat;
      ctx.strokeStyle = i % 2 === 0 ? "#e8f7ff" : primary;
      ctx.beginPath();
      let x = Math.cos(a) * r * 0.1;
      let y = Math.sin(a) * r * 0.1;
      ctx.moveTo(x, y);
      for (let s = 0; s < 5; s++) {
        const jitter = Math.sin(t * 16 + i * 5 + s * 2) * r * 0.1;
        x += Math.cos(a + Math.sin(t * 5 + s) * 0.5) * (r * 0.2);
        y += Math.sin(a + Math.cos(t * 5 + s) * 0.5) * (r * 0.2);
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
