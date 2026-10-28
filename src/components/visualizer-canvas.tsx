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
};

type Levels = {
  bass: number;
  mid: number;
  high: number;
  air: number;
  energy: number;
  beat: number;
};

const SILENT: Levels = {
  bass: 0,
  mid: 0,
  high: 0,
  air: 0,
  energy: 0,
  beat: 0,
};

export const VisualizerCanvas = memo(function VisualizerCanvas({
  engine,
  mode,
  orbStyle,
  revolve,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(engine);
  const modeRef = useRef(mode);
  const styleRef = useRef(orbStyle);
  const revolveRef = useRef(revolve);
  engineRef.current = engine;
  modeRef.current = mode;
  styleRef.current = orbStyle;
  revolveRef.current = revolve;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let frame = 0;

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

      const live = engineRef.current;
      live?.sample();
      const levels = live?.levels ?? SILENT;
      const playing = live?.playing ?? false;
      const t = now / 1000;
      const style = styleRef.current;

      paintBackground(ctx, w, h, style, levels, t);

      if (modeRef.current === "wave") {
        drawWave(ctx, w, h, levels, t);
      } else {
        drawOrb(ctx, w, h, style, revolveRef.current, levels, t, playing);
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

  // Deep space base
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.85);
  if (style === "supernova") {
    bg.addColorStop(0, "#1a0a08");
    bg.addColorStop(0.45, "#0a0408");
    bg.addColorStop(1, "#020105");
  } else if (style === "plasma") {
    bg.addColorStop(0, "#060e1a");
    bg.addColorStop(0.5, "#040810");
    bg.addColorStop(1, "#010208");
  } else if (style === "lightning") {
    bg.addColorStop(0, "#0c0614");
    bg.addColorStop(0.5, "#06030c");
    bg.addColorStop(1, "#020106");
  } else {
    bg.addColorStop(0, "#0c0610");
    bg.addColorStop(0.5, "#05030a");
    bg.addColorStop(1, "#020108");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Nebula clouds — style-tinted, audio-reactive
  const energy = levels.energy;
  const beat = levels.beat;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  // Large soft nebula
  ctx.globalAlpha = 0.22 + energy * 0.18 + beat * 0.08;
  const n1x = cx + Math.sin(t * 0.12) * w * 0.08;
  const n1y = cy + Math.cos(t * 0.09) * h * 0.06;
  const n1 = ctx.createRadialGradient(n1x, n1y, 0, n1x, n1y, maxR * 0.55);
  if (style === "supernova") {
    n1.addColorStop(0, "rgba(255, 90, 30, 0.55)");
    n1.addColorStop(0.35, "rgba(180, 40, 20, 0.25)");
    n1.addColorStop(1, "transparent");
  } else if (style === "plasma") {
    n1.addColorStop(0, "rgba(40, 140, 255, 0.45)");
    n1.addColorStop(0.4, "rgba(20, 60, 180, 0.2)");
    n1.addColorStop(1, "transparent");
  } else if (style === "lightning") {
    n1.addColorStop(0, "rgba(160, 60, 255, 0.4)");
    n1.addColorStop(0.4, "rgba(80, 20, 140, 0.2)");
    n1.addColorStop(1, "transparent");
  } else {
    n1.addColorStop(0, "rgba(255, 100, 40, 0.35)");
    n1.addColorStop(0.4, "rgba(120, 30, 80, 0.18)");
    n1.addColorStop(1, "transparent");
  }
  ctx.fillStyle = n1;
  ctx.fillRect(0, 0, w, h);

  // Secondary haze
  ctx.globalAlpha = 0.12 + levels.mid * 0.12;
  const n2x = cx - w * 0.22 + Math.cos(t * 0.08) * 20;
  const n2y = cy + h * 0.18;
  const n2 = ctx.createRadialGradient(n2x, n2y, 0, n2x, n2y, maxR * 0.4);
  n2.addColorStop(0, style === "plasma" ? "rgba(0, 220, 255, 0.35)" : "rgba(255, 60, 100, 0.3)");
  n2.addColorStop(1, "transparent");
  ctx.fillStyle = n2;
  ctx.fillRect(0, 0, w, h);

  // Subtle stars
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.35 + energy * 0.2;
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 97) % 1000) / 1000 * w;
    const sy = ((i * 53) % 1000) / 1000 * h;
    const tw = 0.4 + Math.sin(t * 2 + i) * 0.3 + beat * 0.4;
    ctx.fillStyle = `rgba(255,255,255,${0.3 + tw * 0.4})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.6 + (i % 3) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

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
) {
  const cx = w / 2;
  const cy = h / 2;
  const baseR = Math.min(w, h) * 0.2;
  const pulse = 1 + levels.bass * 0.22 + levels.beat * 0.16;
  const r = baseR * pulse;

  // Always a gentle drift; full multi-axis when revolve + playing
  const spin =
    revolve && playing
      ? t * (0.55 + levels.energy * 1.6)
      : t * (0.12 + levels.energy * 0.15);

  if (style === "blackhole") drawBlackHole(ctx, cx, cy, r, spin, levels, revolve && playing);
  else if (style === "supernova") drawSupernova(ctx, cx, cy, r, levels, t);
  else if (style === "plasma") drawPlasma(ctx, cx, cy, r, levels, t);
  else if (style === "lightning") drawLightningOrb(ctx, cx, cy, r, levels, t);
  else drawGlowOrb(ctx, cx, cy, r, levels, t);
}

function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  spin: number,
  levels: Levels,
  multiAxis: boolean,
) {
  // Multi-axis tilt: horizontal, vertical, diagonal components
  const tiltH = multiAxis ? Math.sin(spin * 0.55) * 0.65 : 0.35;
  const tiltV = multiAxis ? Math.cos(spin * 0.38) * 0.5 : 0.2;
  const tiltD = multiAxis ? Math.sin(spin * 0.28 + 1.2) * 0.4 : 0.15;
  const scaleY = 0.28 + Math.abs(tiltH) * 0.35 + Math.abs(tiltV) * 0.2 + Math.abs(tiltD) * 0.15;

  ctx.save();
  ctx.translate(cx, cy);

  // Outer gravitational glow
  const outer = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 3.2);
  outer.addColorStop(0, `rgba(255, 150, 50, ${0.2 + levels.energy * 0.28})`);
  outer.addColorStop(0.35, `rgba(255, 70, 25, ${0.1 + levels.mid * 0.12})`);
  outer.addColorStop(0.7, `rgba(120, 30, 10, ${0.05 + levels.bass * 0.06})`);
  outer.addColorStop(1, "transparent");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(0, 0, r * 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Accretion disk — layered for depth
  ctx.save();
  ctx.rotate(spin * 0.85);
  ctx.scale(1, scaleY);

  // Outer disk band
  for (let band = 0; band < 3; band++) {
    const bandR = r * (1.65 + band * 0.28);
    const lw = r * (0.14 - band * 0.03) * (1 + levels.bass * 0.35);
    const g = ctx.createLinearGradient(-bandR * 1.3, 0, bandR * 1.3, 0);
    const a = 0.55 - band * 0.12 + levels.energy * 0.2;
    g.addColorStop(0, "transparent");
    g.addColorStop(0.15, `rgba(255, 120, 30, ${a * 0.5})`);
    g.addColorStop(0.35, `rgba(255, 180, 70, ${a})`);
    g.addColorStop(0.5, `rgba(255, 240, 180, ${a * 1.1})`);
    g.addColorStop(0.65, `rgba(255, 100, 30, ${a})`);
    g.addColorStop(0.85, `rgba(200, 50, 15, ${a * 0.5})`);
    g.addColorStop(1, "transparent");
    ctx.strokeStyle = g;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(0, 0, bandR, bandR, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Hot inner ring
  ctx.lineWidth = r * (0.05 + levels.beat * 0.04);
  ctx.strokeStyle = `rgba(255, 245, 210, ${0.7 + levels.beat * 0.3})`;
  ctx.shadowColor = "rgba(255, 180, 60, 0.8)";
  ctx.shadowBlur = 12 + levels.energy * 16;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.38, r * 1.38, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Secondary disk at different tilt (diagonal axis feel)
  if (multiAxis) {
    ctx.save();
    ctx.rotate(spin * 0.5 + Math.PI / 5);
    ctx.scale(1, 0.22 + Math.abs(tiltD) * 0.25);
    ctx.globalAlpha = 0.35 + levels.mid * 0.2;
    const g2 = ctx.createLinearGradient(-r * 2, 0, r * 2, 0);
    g2.addColorStop(0, "transparent");
    g2.addColorStop(0.3, "rgba(255, 90, 20, 0.6)");
    g2.addColorStop(0.5, "rgba(255, 200, 100, 0.8)");
    g2.addColorStop(0.7, "rgba(255, 80, 20, 0.6)");
    g2.addColorStop(1, "transparent");
    ctx.strokeStyle = g2;
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.85, r * 1.85, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Photon ring (lensing)
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.08, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 210, 140, ${0.45 + levels.high * 0.35})`;
  ctx.lineWidth = 1.5 + levels.high * 2;
  ctx.shadowColor = "rgba(255, 160, 60, 0.9)";
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Event horizon — pure black with soft edge
  const hole = ctx.createRadialGradient(-r * 0.15, -r * 0.1, 0, 0, 0, r);
  hole.addColorStop(0, "#000000");
  hole.addColorStop(0.75, "#000000");
  hole.addColorStop(0.9, "#0a0503");
  hole.addColorStop(1, "#1a0c06");
  ctx.fillStyle = hole;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Soft rim light on horizon
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.97, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 120, 40, ${0.15 + levels.energy * 0.15})`;
  ctx.lineWidth = r * 0.06;
  ctx.stroke();

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

  // Expanding shock shells
  for (let i = 5; i >= 0; i--) {
    const shellR = r * (1.15 + i * 0.38) * (1 + levels.energy * 0.2 + levels.beat * 0.08);
    const alpha = Math.max(0, 0.14 - i * 0.02) + levels.mid * 0.05;
    const g = ctx.createRadialGradient(0, 0, shellR * 0.55, 0, 0, shellR);
    g.addColorStop(0, `rgba(255, 120, 40, ${alpha})`);
    g.addColorStop(0.45, `rgba(255, 50, 15, ${alpha * 0.7})`);
    g.addColorStop(0.75, `rgba(120, 20, 40, ${alpha * 0.35})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, shellR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bright core
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.05);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.15, `rgba(255, 245, 200, ${0.95})`);
  core.addColorStop(0.35, `rgba(255, 190, 70, ${0.9 + levels.beat * 0.1})`);
  core.addColorStop(0.55, `rgba(255, 80, 25, 0.85)`);
  core.addColorStop(0.8, `rgba(160, 25, 10, 0.55)`);
  core.addColorStop(1, "rgba(40, 5, 5, 0.15)");
  ctx.fillStyle = core;
  ctx.shadowColor = "rgba(255, 100, 30, 0.9)";
  ctx.shadowBlur = 30 + levels.energy * 40;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Filaments / rays
  ctx.globalAlpha = 0.4 + levels.high * 0.35;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + t * (0.35 + levels.energy * 0.5);
    const len = r * (1.2 + levels.energy * 0.7 + (i % 3) * 0.15);
    const grad = ctx.createLinearGradient(
      Math.cos(a) * r * 0.5,
      Math.sin(a) * r * 0.5,
      Math.cos(a) * len,
      Math.sin(a) * len,
    );
    grad.addColorStop(0, "rgba(255, 220, 120, 0.9)");
    grad.addColorStop(0.5, "rgba(255, 80, 30, 0.6)");
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5 + levels.bass * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlasma(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  levels: Levels,
  t: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer aura
  const aura = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.8);
  aura.addColorStop(0, `rgba(100, 220, 255, ${0.35 + levels.energy * 0.25})`);
  aura.addColorStop(0.5, `rgba(30, 100, 255, ${0.15 + levels.mid * 0.1})`);
  aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Core sphere
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 0, 0, 0, r * 1.15);
  g.addColorStop(0, "#f0ffff");
  g.addColorStop(0.25, `rgba(100, 220, 255, ${0.9 + levels.beat * 0.1})`);
  g.addColorStop(0.55, "rgba(40, 120, 255, 0.85)");
  g.addColorStop(0.85, "rgba(15, 40, 120, 0.6)");
  g.addColorStop(1, "rgba(5, 10, 40, 0.2)");
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(60, 180, 255, 0.8)";
  ctx.shadowBlur = 24 + levels.energy * 30;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Orbiting energy arcs
  ctx.globalAlpha = 0.55 + levels.high * 0.4;
  for (let i = 0; i < 10; i++) {
    const a0 = (i / 10) * Math.PI * 2 + t * (1.1 + levels.energy * 0.8);
    const rr = r * (0.65 + (i % 4) * 0.1);
    ctx.strokeStyle = i % 2 === 0 ? "#a8f0ff" : "#60c0ff";
    ctx.lineWidth = 1.2 + levels.mid * 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, rr, a0, a0 + 0.7 + levels.bass * 0.4);
    ctx.stroke();
  }

  ctx.restore();
}

function drawLightningOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  levels: Levels,
  t: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  const palette = ["#ff2a6d", "#9b5de5", "#00f5d4", "#fee440", "#00bbf9", "#f15bb5"];
  const col = palette[Math.floor(t * 1.5) % palette.length];

  // Glow
  const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.7);
  aura.addColorStop(0, `rgba(255,255,255,${0.5 + levels.beat * 0.3})`);
  aura.addColorStop(0.25, col + "99");
  aura.addColorStop(0.6, "rgba(40, 10, 60, 0.45)");
  aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
  ctx.fill();

  // Core
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.3, col + "ee");
  core.addColorStop(0.7, "rgba(30, 5, 50, 0.85)");
  core.addColorStop(1, "rgba(10, 0, 20, 0.3)");
  ctx.fillStyle = core;
  ctx.shadowColor = col;
  ctx.shadowBlur = 20 + levels.energy * 35;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Lightning bolts on energy
  if (levels.beat > 0.25 || levels.energy > 0.35) {
    ctx.globalAlpha = 0.65 + levels.beat * 0.35;
    ctx.lineWidth = 1.5 + levels.high * 2;
    ctx.lineJoin = "round";
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + t * 3 + levels.beat;
      ctx.strokeStyle = i % 2 === 0 ? "#e8f7ff" : col;
      ctx.beginPath();
      let x = Math.cos(a) * r * 0.15;
      let y = Math.sin(a) * r * 0.15;
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        const jitter = (Math.sin(t * 20 + i * 7 + s * 3) * 0.5 + 0.5) * r * 0.12;
        x += Math.cos(a + Math.sin(t * 8 + s) * 0.6) * (r * 0.2);
        y += Math.sin(a + Math.cos(t * 8 + s) * 0.6) * (r * 0.2);
        ctx.lineTo(x + jitter, y - jitter);
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawGlowOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  levels: Levels,
  t: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2);
  aura.addColorStop(0, `rgba(255, 240, 180, ${0.4 + levels.beat * 0.25})`);
  aura.addColorStop(0.35, `rgba(255, 180, 50, ${0.25 + levels.energy * 0.2})`);
  aura.addColorStop(0.7, "rgba(255, 100, 20, 0.1)");
  aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
  ctx.fill();

  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 0, 0, 0, r * 1.2);
  g.addColorStop(0, "#fffef5");
  g.addColorStop(0.3, `rgba(255, 220, 100, ${0.95})`);
  g.addColorStop(0.6, `rgba(255, 150, 40, 0.8)`);
  g.addColorStop(0.85, "rgba(200, 80, 15, 0.45)");
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(255, 160, 40, 0.85)";
  ctx.shadowBlur = 28 + levels.energy * 35;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Soft highlight
  ctx.globalAlpha = 0.5;
  const hi = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 0, -r * 0.3, -r * 0.35, r * 0.5);
  hi.addColorStop(0, "rgba(255,255,255,0.7)");
  hi.addColorStop(1, "transparent");
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.arc(-r * 0.25, -r * 0.3, r * 0.45, 0, Math.PI * 2);
  ctx.fill();

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
  const amp = Math.min(w, h) * 0.2 * (0.5 + levels.energy * 0.9 + levels.beat * 0.25);
  const points = 160;

  ctx.save();
  ctx.translate(0, cy);

  // Glow under wave
  ctx.globalAlpha = 0.15 + levels.energy * 0.15;
  const glow = ctx.createLinearGradient(0, -amp * 1.5, 0, amp * 1.5);
  glow.addColorStop(0, "#00f5d4");
  glow.addColorStop(0.5, "#9b5de5");
  glow.addColorStop(1, "#ff2a6d");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * w;
    const wave =
      Math.sin(i * 0.12 + t * 3.2) * amp * (0.45 + levels.mid) +
      Math.sin(i * 0.06 + t * 1.6) * amp * 0.35 * levels.bass +
      Math.sin(i * 0.28 + t * 5.5) * amp * 0.18 * levels.high;
    ctx.lineTo(x, wave);
  }
  for (let i = points; i >= 0; i--) {
    const x = (i / points) * w;
    const wave =
      Math.sin(i * 0.12 + t * 3.2) * amp * (0.45 + levels.mid) +
      Math.sin(i * 0.06 + t * 1.6) * amp * 0.35 * levels.bass +
      Math.sin(i * 0.28 + t * 5.5) * amp * 0.18 * levels.high;
    ctx.lineTo(x, -wave * 0.85);
  }
  ctx.closePath();
  ctx.fill();

  // Main stroke
  ctx.globalAlpha = 1;
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * w;
    const wave =
      Math.sin(i * 0.12 + t * 3.2) * amp * (0.45 + levels.mid) +
      Math.sin(i * 0.06 + t * 1.6) * amp * 0.35 * levels.bass +
      Math.sin(i * 0.28 + t * 5.5) * amp * 0.18 * levels.high;
    if (i === 0) ctx.moveTo(x, wave);
    else ctx.lineTo(x, wave);
  }
  const grad = ctx.createLinearGradient(0, -amp, w, amp);
  grad.addColorStop(0, "#00f5d4");
  grad.addColorStop(0.35, "#9b5de5");
  grad.addColorStop(0.7, "#ff2a6d");
  grad.addColorStop(1, "#fee440");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.5 + levels.bass * 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(155, 93, 229, 0.6)";
  ctx.shadowBlur = 10 + levels.energy * 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Mirror line
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * w;
    const wave =
      Math.sin(i * 0.12 + t * 3.2) * amp * (0.45 + levels.mid) +
      Math.sin(i * 0.06 + t * 1.6) * amp * 0.35 * levels.bass +
      Math.sin(i * 0.28 + t * 5.5) * amp * 0.18 * levels.high;
    if (i === 0) ctx.moveTo(x, -wave * 0.85);
    else ctx.lineTo(x, -wave * 0.85);
  }
  ctx.stroke();

  ctx.restore();
}
