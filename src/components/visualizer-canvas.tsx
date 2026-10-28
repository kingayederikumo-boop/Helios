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

type Dust = {
  x: number;
  y: number;
  z: number;
  s: number;
  a: number;
};

const SILENT: Levels = {
  bass: 0,
  mid: 0,
  high: 0,
  air: 0,
  energy: 0,
  beat: 0,
};

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

      paintBackground(ctx, w, h, style, levels, t);
      drawStarDust(ctx, dustRef.current, w, h, levels, t);

      if (modeRef.current === "wave") {
        drawWave(ctx, w, h, levels, t);
      } else {
        drawOrb(ctx, w, h, style, revolveRef.current, levels, t, playing);
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

  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.9);
  if (style === "supernova") {
    bg.addColorStop(0, "#1c0a08");
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

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  ctx.globalAlpha = 0.28 + levels.energy * 0.22 + levels.beat * 0.1;
  const n1x = cx + Math.sin(t * 0.12) * w * 0.08;
  const n1y = cy + Math.cos(t * 0.09) * h * 0.06;
  const n1 = ctx.createRadialGradient(n1x, n1y, 0, n1x, n1y, maxR * 0.55);
  if (style === "supernova") {
    n1.addColorStop(0, "rgba(255, 90, 30, 0.6)");
    n1.addColorStop(0.35, "rgba(180, 40, 20, 0.28)");
    n1.addColorStop(1, "transparent");
  } else if (style === "plasma") {
    n1.addColorStop(0, "rgba(40, 140, 255, 0.5)");
    n1.addColorStop(0.4, "rgba(20, 60, 180, 0.22)");
    n1.addColorStop(1, "transparent");
  } else if (style === "lightning") {
    n1.addColorStop(0, "rgba(160, 60, 255, 0.45)");
    n1.addColorStop(0.4, "rgba(80, 20, 140, 0.22)");
    n1.addColorStop(1, "transparent");
  } else {
    n1.addColorStop(0, "rgba(255, 100, 40, 0.4)");
    n1.addColorStop(0.4, "rgba(120, 30, 80, 0.2)");
    n1.addColorStop(1, "transparent");
  }
  ctx.fillStyle = n1;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.14 + levels.mid * 0.14;
  const n2x = cx - w * 0.22 + Math.cos(t * 0.08) * 20;
  const n2y = cy + h * 0.18;
  const n2 = ctx.createRadialGradient(n2x, n2y, 0, n2x, n2y, maxR * 0.4);
  n2.addColorStop(0, style === "plasma" ? "rgba(0, 220, 255, 0.4)" : "rgba(255, 60, 100, 0.35)");
  n2.addColorStop(1, "transparent");
  ctx.fillStyle = n2;
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
  const drift = 0.15 + levels.energy * 0.45;
  const pulse = 0.7 + levels.beat * 0.6 + levels.energy * 0.3;

  ctx.save();
  for (const p of dust) {
    // Slow drift + depth parallax
    p.x += (0.15 + p.z * 0.4) * drift;
    p.y += Math.sin(t * 0.4 + p.x * 0.01) * 0.08 * p.z;
    if (p.x > w + 4) p.x = -4;
    if (p.y > h + 4) p.y = -4;
    if (p.y < -4) p.y = h + 4;

    const alpha = Math.min(1, p.a * pulse * (0.5 + p.z));
    const size = p.s * (0.6 + p.z * 0.8) * (1 + levels.high * 0.35);

    // Soft glow core
    ctx.globalAlpha = alpha * 0.35;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3.5);
    g.addColorStop(0, "rgba(255, 240, 210, 0.9)");
    g.addColorStop(0.4, "rgba(255, 180, 120, 0.35)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255, 250, 240, 0.95)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 0.55, 0, Math.PI * 2);
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
  const intensity = 0.45 + levels.energy * 0.4 + levels.beat * 0.35 + levels.bass * 0.2;
  const thickness = 3 + levels.bass * 5 + levels.beat * 3;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  // Outer soft bloom along all edges
  const pad = 28 + levels.energy * 18;
  const bloom = ctx.createLinearGradient(0, 0, pad, 0);
  bloom.addColorStop(0, `rgba(${r},${g},${b},${0.55 * intensity})`);
  bloom.addColorStop(1, "transparent");

  // Left
  let grad = ctx.createLinearGradient(0, 0, pad, 0);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.75 * intensity})`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},${0.25 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, pad, h);

  // Right
  grad = ctx.createLinearGradient(w, 0, w - pad, 0);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.75 * intensity})`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},${0.25 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(w - pad, 0, pad, h);

  // Top
  grad = ctx.createLinearGradient(0, 0, 0, pad);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.55 * intensity})`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},${0.18 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, pad);

  // Bottom
  grad = ctx.createLinearGradient(0, h, 0, h - pad);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.55 * intensity})`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},${0.18 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - pad, w, pad);

  // Hard bright edge strokes
  ctx.shadowColor = `rgba(${r},${g},${b},0.95)`;
  ctx.shadowBlur = 18 + levels.energy * 28 + levels.beat * 16;
  ctx.strokeStyle = `rgba(${r},${g},${b},${0.85 + levels.beat * 0.15})`;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(2, h);
  ctx.moveTo(w - 2, 0);
  ctx.lineTo(w - 2, h);
  ctx.stroke();

  ctx.lineWidth = thickness * 0.7;
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
) {
  const cx = w / 2;
  const cy = h / 2;
  const baseR = Math.min(w, h) * 0.2;
  const pulse = 1 + levels.bass * 0.22 + levels.beat * 0.16;
  const r = baseR * pulse;

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
  const tiltH = multiAxis ? Math.sin(spin * 0.55) * 0.65 : 0.35;
  const tiltV = multiAxis ? Math.cos(spin * 0.38) * 0.5 : 0.2;
  const tiltD = multiAxis ? Math.sin(spin * 0.28 + 1.2) * 0.4 : 0.15;
  const scaleY = 0.28 + Math.abs(tiltH) * 0.35 + Math.abs(tiltV) * 0.2 + Math.abs(tiltD) * 0.15;

  ctx.save();
  ctx.translate(cx, cy);

  const outer = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 3.4);
  outer.addColorStop(0, `rgba(255, 150, 50, ${0.28 + levels.energy * 0.32})`);
  outer.addColorStop(0.35, `rgba(255, 70, 25, ${0.14 + levels.mid * 0.14})`);
  outer.addColorStop(0.7, `rgba(120, 30, 10, ${0.06 + levels.bass * 0.08})`);
  outer.addColorStop(1, "transparent");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(0, 0, r * 3.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(spin * 0.85);
  ctx.scale(1, scaleY);

  for (let band = 0; band < 3; band++) {
    const bandR = r * (1.65 + band * 0.28);
    const lw = r * (0.16 - band * 0.03) * (1 + levels.bass * 0.4);
    const g = ctx.createLinearGradient(-bandR * 1.3, 0, bandR * 1.3, 0);
    const a = 0.6 - band * 0.12 + levels.energy * 0.22;
    g.addColorStop(0, "transparent");
    g.addColorStop(0.15, `rgba(255, 120, 30, ${a * 0.55})`);
    g.addColorStop(0.35, `rgba(255, 180, 70, ${a})`);
    g.addColorStop(0.5, `rgba(255, 240, 180, ${a * 1.15})`);
    g.addColorStop(0.65, `rgba(255, 100, 30, ${a})`);
    g.addColorStop(0.85, `rgba(200, 50, 15, ${a * 0.55})`);
    g.addColorStop(1, "transparent");
    ctx.strokeStyle = g;
    ctx.lineWidth = lw;
    ctx.shadowColor = "rgba(255, 140, 40, 0.7)";
    ctx.shadowBlur = 10 + levels.energy * 14;
    ctx.beginPath();
    ctx.ellipse(0, 0, bandR, bandR, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.lineWidth = r * (0.06 + levels.beat * 0.05);
  ctx.strokeStyle = `rgba(255, 245, 210, ${0.75 + levels.beat * 0.25})`;
  ctx.shadowColor = "rgba(255, 180, 60, 0.95)";
  ctx.shadowBlur = 16 + levels.energy * 20;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.38, r * 1.38, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  if (multiAxis) {
    ctx.save();
    ctx.rotate(spin * 0.5 + Math.PI / 5);
    ctx.scale(1, 0.22 + Math.abs(tiltD) * 0.25);
    ctx.globalAlpha = 0.4 + levels.mid * 0.25;
    const g2 = ctx.createLinearGradient(-r * 2, 0, r * 2, 0);
    g2.addColorStop(0, "transparent");
    g2.addColorStop(0.3, "rgba(255, 90, 20, 0.7)");
    g2.addColorStop(0.5, "rgba(255, 200, 100, 0.9)");
    g2.addColorStop(0.7, "rgba(255, 80, 20, 0.7)");
    g2.addColorStop(1, "transparent");
    ctx.strokeStyle = g2;
    ctx.lineWidth = r * 0.12;
    ctx.shadowColor = "rgba(255, 120, 40, 0.8)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.85, r * 1.85, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r * 1.08, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 210, 140, ${0.5 + levels.high * 0.4})`;
  ctx.lineWidth = 2 + levels.high * 2.5;
  ctx.shadowColor = "rgba(255, 160, 60, 1)";
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const hole = ctx.createRadialGradient(-r * 0.15, -r * 0.1, 0, 0, 0, r);
  hole.addColorStop(0, "#000000");
  hole.addColorStop(0.75, "#000000");
  hole.addColorStop(0.9, "#0a0503");
  hole.addColorStop(1, "#1a0c06");
  ctx.fillStyle = hole;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.97, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 120, 40, ${0.18 + levels.energy * 0.18})`;
  ctx.lineWidth = r * 0.07;
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

  for (let i = 5; i >= 0; i--) {
    const shellR = r * (1.15 + i * 0.38) * (1 + levels.energy * 0.2 + levels.beat * 0.08);
    const alpha = Math.max(0, 0.16 - i * 0.02) + levels.mid * 0.06;
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

  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.05);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.15, "rgba(255, 245, 200, 0.95)");
  core.addColorStop(0.35, `rgba(255, 190, 70, ${0.9 + levels.beat * 0.1})`);
  core.addColorStop(0.55, "rgba(255, 80, 25, 0.85)");
  core.addColorStop(0.8, "rgba(160, 25, 10, 0.55)");
  core.addColorStop(1, "rgba(40, 5, 5, 0.15)");
  ctx.fillStyle = core;
  ctx.shadowColor = "rgba(255, 100, 30, 1)";
  ctx.shadowBlur = 36 + levels.energy * 45;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 0.45 + levels.high * 0.4;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + t * (0.35 + levels.energy * 0.5);
    const len = r * (1.2 + levels.energy * 0.7 + (i % 3) * 0.15);
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

  const aura = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.9);
  aura.addColorStop(0, `rgba(100, 220, 255, ${0.4 + levels.energy * 0.3})`);
  aura.addColorStop(0.5, `rgba(30, 100, 255, ${0.18 + levels.mid * 0.12})`);
  aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
  ctx.fill();

  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 0, 0, 0, r * 1.15);
  g.addColorStop(0, "#f0ffff");
  g.addColorStop(0.25, `rgba(100, 220, 255, ${0.9 + levels.beat * 0.1})`);
  g.addColorStop(0.55, "rgba(40, 120, 255, 0.85)");
  g.addColorStop(0.85, "rgba(15, 40, 120, 0.6)");
  g.addColorStop(1, "rgba(5, 10, 40, 0.2)");
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(60, 180, 255, 0.95)";
  ctx.shadowBlur = 28 + levels.energy * 35;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 0.6 + levels.high * 0.4;
  for (let i = 0; i < 10; i++) {
    const a0 = (i / 10) * Math.PI * 2 + t * (1.1 + levels.energy * 0.8);
    const rr = r * (0.65 + (i % 4) * 0.1);
    ctx.strokeStyle = i % 2 === 0 ? "#a8f0ff" : "#60c0ff";
    ctx.lineWidth = 1.4 + levels.mid * 2.5;
    ctx.shadowColor = "rgba(120, 220, 255, 0.8)";
    ctx.shadowBlur = 8;
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

  const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.8);
  aura.addColorStop(0, `rgba(255,255,255,${0.55 + levels.beat * 0.3})`);
  aura.addColorStop(0.25, col + "aa");
  aura.addColorStop(0.6, "rgba(40, 10, 60, 0.5)");
  aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.3, col + "ee");
  core.addColorStop(0.7, "rgba(30, 5, 50, 0.85)");
  core.addColorStop(1, "rgba(10, 0, 20, 0.3)");
  ctx.fillStyle = core;
  ctx.shadowColor = col;
  ctx.shadowBlur = 24 + levels.energy * 40;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (levels.beat > 0.25 || levels.energy > 0.35) {
    ctx.globalAlpha = 0.7 + levels.beat * 0.3;
    ctx.lineWidth = 1.5 + levels.high * 2;
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(200, 240, 255, 0.9)";
    ctx.shadowBlur = 10;
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
  _t: number,
) {
  ctx.save();
  ctx.translate(cx, cy);

  const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.1);
  aura.addColorStop(0, `rgba(255, 240, 180, ${0.45 + levels.beat * 0.28})`);
  aura.addColorStop(0.35, `rgba(255, 180, 50, ${0.28 + levels.energy * 0.22})`);
  aura.addColorStop(0.7, "rgba(255, 100, 20, 0.12)");
  aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
  ctx.fill();

  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 0, 0, 0, r * 1.2);
  g.addColorStop(0, "#fffef5");
  g.addColorStop(0.3, "rgba(255, 220, 100, 0.95)");
  g.addColorStop(0.6, "rgba(255, 150, 40, 0.8)");
  g.addColorStop(0.85, "rgba(200, 80, 15, 0.45)");
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(255, 160, 40, 0.95)";
  ctx.shadowBlur = 32 + levels.energy * 40;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 0.55;
  const hi = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 0, -r * 0.3, -r * 0.35, r * 0.5);
  hi.addColorStop(0, "rgba(255,255,255,0.75)");
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

  ctx.globalAlpha = 0.18 + levels.energy * 0.18;
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
  ctx.shadowColor = "rgba(155, 93, 229, 0.75)";
  ctx.shadowBlur = 14 + levels.energy * 16;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 0.5;
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
