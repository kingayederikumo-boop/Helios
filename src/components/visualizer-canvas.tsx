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

const SILENT = {
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
    let t = 0;

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

      t = now / 1000;

      // Background — deep space / nebula feel
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      bg.addColorStop(0, "#12081a");
      bg.addColorStop(0.5, "#07050f");
      bg.addColorStop(1, "#030208");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Soft nebula haze
      ctx.save();
      ctx.globalAlpha = 0.15 + levels.energy * 0.12;
      const haze = ctx.createRadialGradient(w * 0.3, h * 0.35, 0, w * 0.3, h * 0.35, w * 0.5);
      haze.addColorStop(0, "#ff4d2a");
      haze.addColorStop(0.4, "#7b2cbf");
      haze.addColorStop(1, "transparent");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      if (modeRef.current === "wave") {
        drawWave(ctx, w, h, live, levels, t);
      } else {
        drawOrb(ctx, w, h, styleRef.current, revolveRef.current, levels, t, playing);
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

function drawOrb(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: OrbStyle,
  revolve: boolean,
  levels: { bass: number; mid: number; high: number; air: number; energy: number; beat: number },
  t: number,
  playing: boolean,
) {
  const cx = w / 2;
  const cy = h / 2;
  const baseR = Math.min(w, h) * 0.22;
  const pulse = 1 + levels.bass * 0.18 + levels.beat * 0.12;
  const r = baseR * pulse;

  // Rotation speeds — multi-axis for blackhole ring
  const spin = revolve && playing ? t * (0.6 + levels.energy * 1.4) : t * 0.15;

  if (style === "blackhole") {
    drawBlackHole(ctx, cx, cy, r, spin, levels);
  } else if (style === "supernova") {
    drawSupernova(ctx, cx, cy, r, levels, t);
  } else if (style === "plasma") {
    drawPlasma(ctx, cx, cy, r, levels, t);
  } else if (style === "lightning") {
    drawLightningOrb(ctx, cx, cy, r, levels, t);
  } else {
    drawGlowOrb(ctx, cx, cy, r, levels, t);
  }
}

function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  spin: number,
  levels: { bass: number; mid: number; high: number; energy: number; beat: number },
) {
  // Accretion disk — multi-axis tilt
  const tiltX = Math.sin(spin * 0.7) * 0.55; // vertical-ish
  const tiltY = Math.cos(spin * 0.45) * 0.4; // horizontal-ish
  const tiltZ = Math.sin(spin * 0.3) * 0.35; // diagonal component

  ctx.save();
  ctx.translate(cx, cy);

  // Soft outer glow from disk
  const outer = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 2.8);
  outer.addColorStop(0, `rgba(255, 140, 40, ${0.25 + levels.energy * 0.25})`);
  outer.addColorStop(0.4, `rgba(255, 60, 20, ${0.12 + levels.mid * 0.1})`);
  outer.addColorStop(1, "transparent");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Accretion ring (elliptical + rotated for multi-axis feel)
  ctx.save();
  ctx.rotate(spin * 0.9);
  ctx.scale(1 + tiltX * 0.3, 0.35 + Math.abs(tiltY) * 0.4 + Math.abs(tiltZ) * 0.25);

  const ringGrad = ctx.createLinearGradient(-r * 2.2, 0, r * 2.2, 0);
  ringGrad.addColorStop(0, "transparent");
  ringGrad.addColorStop(0.2, `rgba(255, 180, 60, ${0.7 + levels.bass * 0.3})`);
  ringGrad.addColorStop(0.45, `rgba(255, 90, 20, ${0.95})`);
  ringGrad.addColorStop(0.55, `rgba(255, 220, 140, ${0.9})`);
  ringGrad.addColorStop(0.8, `rgba(255, 100, 30, ${0.7 + levels.mid * 0.3})`);
  ringGrad.addColorStop(1, "transparent");

  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = r * (0.18 + levels.bass * 0.12);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.9, r * 1.9, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Inner brighter ring
  ctx.lineWidth = r * 0.06;
  ctx.strokeStyle = `rgba(255, 240, 200, ${0.6 + levels.beat * 0.4})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.55, r * 1.55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Photon ring / lensing hint
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.12, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 200, 120, ${0.35 + levels.high * 0.3})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Event horizon
  const hole = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  hole.addColorStop(0, "#000000");
  hole.addColorStop(0.7, "#050308");
  hole.addColorStop(0.92, "#1a0a05");
  hole.addColorStop(1, "#000000");
  ctx.fillStyle = hole;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle inner shadow for depth
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.8)";
  ctx.lineWidth = r * 0.08;
  ctx.stroke();

  ctx.restore();
}

function drawSupernova(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  levels: { bass: number; mid: number; high: number; energy: number; beat: number },
  t: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer expanding shell
  for (let i = 4; i >= 0; i--) {
    const shellR = r * (1.3 + i * 0.35) * (1 + levels.energy * 0.15);
    const alpha = (0.08 - i * 0.015) + levels.mid * 0.04;
    const g = ctx.createRadialGradient(0, 0, shellR * 0.6, 0, 0, shellR);
    g.addColorStop(0, `rgba(255, 80, 20, ${alpha})`);
    g.addColorStop(0.5, `rgba(200, 40, 10, ${alpha * 0.6})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, shellR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Core
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  core.addColorStop(0, "#fff8e0");
  core.addColorStop(0.25, `rgba(255, 200, 80, ${0.9 + levels.beat * 0.1})`);
  core.addColorStop(0.55, `rgba(255, 80, 20, ${0.85})`);
  core.addColorStop(0.8, `rgba(180, 30, 10, 0.7)`);
  core.addColorStop(1, "rgba(40, 5, 5, 0.3)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Filaments
  ctx.globalAlpha = 0.35 + levels.high * 0.3;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + t * 0.4;
    const len = r * (1.1 + levels.energy * 0.6);
    ctx.strokeStyle = i % 2 === 0 ? "#ff6a2a" : "#ffcc60";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
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
  levels: { bass: number; mid: number; high: number; energy: number; beat: number },
  t: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.4);
  g.addColorStop(0, "#e0f7ff");
  g.addColorStop(0.3, `rgba(80, 200, 255, ${0.85 + levels.beat * 0.15})`);
  g.addColorStop(0.65, `rgba(30, 100, 255, 0.7)`);
  g.addColorStop(1, "rgba(10, 20, 60, 0.2)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
  ctx.fill();

  // Energy arcs
  ctx.globalAlpha = 0.5 + levels.high * 0.4;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * (1.2 + levels.energy);
    ctx.strokeStyle = "#a0f0ff";
    ctx.lineWidth = 1.5 + levels.mid * 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.7 + (i % 3) * 0.12), a, a + 0.8);
    ctx.stroke();
  }

  ctx.restore();
}

function drawLightningOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  levels: { bass: number; mid: number; high: number; energy: number; beat: number },
  t: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  const colors = ["#ff2a6d", "#7b2cbf", "#00f5d4", "#fee440", "#00bbf9"];
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.3);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.3, colors[Math.floor(t * 2) % colors.length] + "cc");
  g.addColorStop(0.7, "rgba(40, 10, 60, 0.8)");
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
  ctx.fill();

  // Lightning bolts
  if (levels.beat > 0.3 || levels.energy > 0.4) {
    ctx.globalAlpha = 0.7 + levels.beat * 0.3;
    ctx.strokeStyle = "#e0f7ff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      let x = 0;
      let y = 0;
      for (let s = 0; s < 5; s++) {
        x += Math.cos(a + (Math.random() - 0.5)) * (r * 0.25);
        y += Math.sin(a + (Math.random() - 0.5)) * (r * 0.25);
        ctx.lineTo(x, y);
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
  levels: { bass: number; mid: number; high: number; energy: number; beat: number },
  t: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.5);
  g.addColorStop(0, "#fff6e0");
  g.addColorStop(0.35, `rgba(255, 200, 60, ${0.9 + levels.beat * 0.1})`);
  g.addColorStop(0.7, `rgba(255, 140, 20, 0.6)`);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  engine: Engine | null,
  levels: { bass: number; mid: number; high: number; energy: number },
  t: number,
) {
  const cx = w / 2;
  const cy = h / 2;
  const amp = Math.min(w, h) * 0.18 * (0.6 + levels.energy * 0.8);

  ctx.save();
  ctx.translate(0, cy);

  // Main waveform
  ctx.beginPath();
  const points = 120;
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * w;
    const wave =
      Math.sin(i * 0.15 + t * 3) * amp * (0.4 + levels.mid) +
      Math.sin(i * 0.08 + t * 1.7) * amp * 0.3 * levels.bass +
      Math.sin(i * 0.3 + t * 5) * amp * 0.15 * levels.high;
    if (i === 0) ctx.moveTo(x, wave);
    else ctx.lineTo(x, wave);
  }

  const grad = ctx.createLinearGradient(0, -amp, 0, amp);
  grad.addColorStop(0, "#00f5d4");
  grad.addColorStop(0.5, "#7b2cbf");
  grad.addColorStop(1, "#ff2a6d");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.5 + levels.bass * 2;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Mirror
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * w;
    const wave =
      Math.sin(i * 0.15 + t * 3) * amp * (0.4 + levels.mid) +
      Math.sin(i * 0.08 + t * 1.7) * amp * 0.3 * levels.bass +
      Math.sin(i * 0.3 + t * 5) * amp * 0.15 * levels.high;
    if (i === 0) ctx.moveTo(x, -wave);
    else ctx.lineTo(x, -wave);
  }
  ctx.strokeStyle = grad;
  ctx.globalAlpha = 0.5;
  ctx.stroke();

  ctx.restore();
}
