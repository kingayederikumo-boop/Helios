import { memo, useEffect, useRef } from "react";
import type { Engine } from "@/lib/audio/engine";
import { VISUALIZER_IMAGES, type VisualizerImageKey } from "@/lib/visualizer-images";

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

function loadImages(): Record<VisualizerImageKey, HTMLImageElement> {
  const map = {} as Record<VisualizerImageKey, HTMLImageElement>;
  (Object.keys(VISUALIZER_IMAGES) as VisualizerImageKey[]).forEach((key) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = VISUALIZER_IMAGES[key];
    map[key] = img;
  });
  return map;
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
  const imagesRef = useRef<Record<VisualizerImageKey, HTMLImageElement> | null>(null);

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

    if (!imagesRef.current) imagesRef.current = loadImages();

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
        drawOrbFromImage(
          ctx,
          w,
          h,
          style,
          revolveRef.current,
          levels,
          t,
          playing,
          imagesRef.current,
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
    p.x += (0.15 + p.z * 0.4) * drift;
    p.y += Math.sin(t * 0.4 + p.x * 0.01) * 0.08 * p.z;
    if (p.x > w + 4) p.x = -4;
    if (p.y > h + 4) p.y = -4;
    if (p.y < -4) p.y = h + 4;

    const alpha = Math.min(1, p.a * pulse * (0.5 + p.z));
    const size = p.s * (0.6 + p.z * 0.8) * (1 + levels.high * 0.35);

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
  const pad = 28 + levels.energy * 18;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  let grad = ctx.createLinearGradient(0, 0, pad, 0);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.75 * intensity})`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},${0.25 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, pad, h);

  grad = ctx.createLinearGradient(w, 0, w - pad, 0);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.75 * intensity})`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},${0.25 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(w - pad, 0, pad, h);

  grad = ctx.createLinearGradient(0, 0, 0, pad);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.55 * intensity})`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},${0.18 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, pad);

  grad = ctx.createLinearGradient(0, h, 0, h - pad);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.55 * intensity})`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},${0.18 * intensity})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - pad, w, pad);

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

function drawOrbFromImage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: OrbStyle,
  revolve: boolean,
  levels: Levels,
  t: number,
  playing: boolean,
  images: Record<VisualizerImageKey, HTMLImageElement> | null,
) {
  const cx = w / 2;
  const cy = h / 2;
  const baseR = Math.min(w, h) * 0.28;
  const pulse = 1 + levels.bass * 0.2 + levels.beat * 0.14;
  const r = baseR * pulse;

  const spin =
    revolve && playing
      ? t * (0.5 + levels.energy * 1.4)
      : t * (0.1 + levels.energy * 0.12);

  const imgKey = style as VisualizerImageKey;
  const img = images?.[imgKey];
  const ready = img && img.complete && img.naturalWidth > 0;

  // Soft outer glow matching style
  ctx.save();
  ctx.translate(cx, cy);
  const aura = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.2);
  if (style === "plasma") {
    aura.addColorStop(0, `rgba(80, 200, 255, ${0.35 + levels.energy * 0.3})`);
    aura.addColorStop(0.5, `rgba(30, 100, 255, ${0.12 + levels.mid * 0.1})`);
  } else if (style === "lightning") {
    aura.addColorStop(0, `rgba(180, 80, 255, ${0.35 + levels.energy * 0.3})`);
    aura.addColorStop(0.5, `rgba(100, 30, 180, ${0.12 + levels.mid * 0.1})`);
  } else if (style === "glow") {
    aura.addColorStop(0, `rgba(255, 200, 80, ${0.4 + levels.energy * 0.3})`);
    aura.addColorStop(0.5, `rgba(255, 120, 30, ${0.14 + levels.mid * 0.1})`);
  } else {
    aura.addColorStop(0, `rgba(255, 120, 40, ${0.35 + levels.energy * 0.3})`);
    aura.addColorStop(0.5, `rgba(200, 50, 20, ${0.12 + levels.mid * 0.1})`);
  }
  aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Draw the reference image as the orb body
  if (ready && img) {
    ctx.save();
    // Multi-axis tilt for blackhole when revolving
    if (style === "blackhole" && revolve && playing) {
      const tilt = Math.sin(spin * 0.4) * 0.25;
      ctx.rotate(spin * 0.35);
      ctx.transform(1, tilt * 0.3, 0, 0.85 + Math.abs(tilt) * 0.15, 0, 0);
    } else if (revolve && playing) {
      ctx.rotate(spin * 0.25);
    }

    // Circular clip so it reads as an orb
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();

    // Cover the circle with the image (object-fit: cover)
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max((r * 2) / iw, (r * 2) / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);

    // Subtle vignette on top of image
    const vig = ctx.createRadialGradient(0, 0, r * 0.45, 0, 0, r);
    vig.addColorStop(0, "transparent");
    vig.addColorStop(0.75, "transparent");
    vig.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();

    // Bright rim
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.15 + levels.high * 0.25})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    // Fallback while loading
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, "#fff6e0");
    g.addColorStop(0.4, "#ff8a30");
    g.addColorStop(1, "#1a0805");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Extra accretion rings for blackhole (multi-axis)
  if (style === "blackhole") {
    const multi = revolve && playing;
    const tiltH = multi ? Math.sin(spin * 0.55) * 0.55 : 0.3;
    const scaleY = 0.3 + Math.abs(tiltH) * 0.35;

    ctx.save();
    ctx.rotate(spin * 0.9);
    ctx.scale(1, scaleY);
    for (let band = 0; band < 2; band++) {
      const bandR = r * (1.15 + band * 0.22);
      const g = ctx.createLinearGradient(-bandR, 0, bandR, 0);
      const a = 0.55 - band * 0.15 + levels.energy * 0.25;
      g.addColorStop(0, "transparent");
      g.addColorStop(0.25, `rgba(255, 140, 40, ${a})`);
      g.addColorStop(0.5, `rgba(255, 230, 160, ${a * 1.1})`);
      g.addColorStop(0.75, `rgba(255, 100, 30, ${a})`);
      g.addColorStop(1, "transparent");
      ctx.strokeStyle = g;
      ctx.lineWidth = r * (0.1 - band * 0.03) * (1 + levels.bass * 0.4);
      ctx.shadowColor = "rgba(255, 140, 40, 0.85)";
      ctx.shadowBlur = 12 + levels.energy * 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, bandR, bandR, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    if (multi) {
      ctx.save();
      ctx.rotate(spin * 0.45 + 0.8);
      ctx.scale(1, 0.22);
      ctx.globalAlpha = 0.4 + levels.mid * 0.25;
      ctx.strokeStyle = "rgba(255, 180, 80, 0.7)";
      ctx.lineWidth = r * 0.08;
      ctx.shadowColor = "rgba(255, 140, 40, 0.8)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.35, r * 1.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Beat flash ring for all styles
  if (levels.beat > 0.2) {
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.05 + levels.beat * 0.08), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.15 + levels.beat * 0.35})`;
    ctx.lineWidth = 2 + levels.beat * 3;
    ctx.shadowColor = "rgba(255,255,255,0.6)";
    ctx.shadowBlur = 12;
    ctx.stroke();
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
