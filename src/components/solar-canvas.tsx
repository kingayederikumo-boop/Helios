import { memo, useEffect, useRef } from "react";
import type { Engine, Levels } from "@/lib/audio/engine";
import { drawSolar, hitBody } from "@/lib/visualizer/draw";

const SILENT_FREQ = new Uint8Array(new ArrayBuffer(1024));
const SILENT_TIME = new Uint8Array(new ArrayBuffer(2048));
const SILENT_WAVE = new Float32Array(480);

const SILENT_LEVELS: Levels = {
  bass: 0,
  low: 0,
  mid: 0,
  high: 0,
  air: 0,
  energy: 0,
  beat: 0,
  beatCount: 0,
};

type Hover = { name: string; x: number; y: number };

type Props = {
  engine: Engine | null;
  bottomInset: number;
  onHover: (hit: Hover | null) => void;
};

export const SolarCanvas = memo(function SolarCanvas({ engine, bottomInset, onHover }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(engine);
  const insetRef = useRef(bottomInset);
  const hoverRef = useRef(onHover);
  engineRef.current = engine;
  insetRef.current = bottomInset;
  hoverRef.current = onHover;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let frame = 0;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reducedQuery.matches;
    const onReduce = () => {
      reduced = reducedQuery.matches;
    };
    reducedQuery.addEventListener("change", onReduce);

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
      const current = engineRef.current;
      current?.sample();
      drawSolar(
        ctx,
        w,
        h,
        now / 1000,
        insetRef.current,
        {
          freq: current?.freq ?? SILENT_FREQ,
          time: current?.time ?? SILENT_TIME,
          waveMin: current?.waveMin ?? SILENT_WAVE,
          waveMax: current?.waveMax ?? SILENT_WAVE,
          waveHead: current?.waveHead ?? 0,
          levels: current?.levels ?? SILENT_LEVELS,
          playing: current?.playing ?? false,
        },
        reduced,
      );
    };

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      reducedQuery.removeEventListener("change", onReduce);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full touch-none"
      aria-hidden="true"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const hit = hitBody(event.clientX - rect.left, event.clientY - rect.top);
        hoverRef.current(hit ? { name: hit.name, x: hit.x, y: hit.y } : null);
      }}
      onPointerLeave={() => hoverRef.current(null)}
    />
  );
});
