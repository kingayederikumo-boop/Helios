import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Engine } from "@/lib/audio/engine";
import { listTracks, loadTrackBlob, type Track } from "@/lib/library/tracks";

export const Route = createFileRoute("/play")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: VisualizerScreen,
});

type VisualizerMode = "orb" | "wave";
type OrbStyle = "blackhole" | "supernova" | "plasma" | "lightning" | "glow";

function VisualizerScreen() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const engineRef = useRef<Engine | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Visualizer settings (persisted later)
  const [mode, setMode] = useState<VisualizerMode>("orb");
  const [orbStyle, setOrbStyle] = useState<OrbStyle>("blackhole");
  const [revolve, setRevolve] = useState(true);
  const [edgeGlow, setEdgeGlow] = useState(true);
  const [edgeColor, setEdgeColor] = useState("#ff6b35");

  useEffect(() => {
    const engine = new Engine();
    engineRef.current = engine;

    void (async () => {
      const tracks = await listTracks();
      const found = tracks.find((t) => t.id === id) ?? tracks[0] ?? null;
      setTrack(found);
      if (found) {
        try {
          const blob = await loadTrackBlob(found);
          if (blob) {
            engine.unlock();
            await engine.playBlob(blob);
            setPlaying(true);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not play");
        }
      }
    })();

    const timer = window.setInterval(() => {
      const live = engineRef.current;
      if (!live) return;
      setTime(live.currentTime());
      setDuration(live.duration());
      setPlaying(live.playing);
    }, 200);

    return () => {
      window.clearInterval(timer);
      engine.dispose();
      engineRef.current = null;
    };
  }, [id]);

  function toggle() {
    const live = engineRef.current;
    if (!live) return;
    live.unlock();
    if (live.playing) {
      live.pause();
      setPlaying(false);
    } else {
      void live.resume().then(() => setPlaying(true));
    }
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-bg text-fg">
      {/* Visualizer canvas area — will be replaced with real visualizer */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-muted">
          <p className="text-sm">Visualizer</p>
          <p className="mt-1 text-xs opacity-60">
            {mode} · {orbStyle} {revolve && mode === "orb" ? "· revolving" : ""}
          </p>
        </div>
      </div>

      {/* Edge glow placeholder */}
      {edgeGlow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[2rem]"
          style={{
            boxShadow: `inset 0 0 40px ${edgeColor}55, 0 0 30px ${edgeColor}33`,
          }}
        />
      )}

      {/* Top bar — song info only */}
      <header className="safe-top pointer-events-none absolute inset-x-0 top-0 z-10 px-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="pointer-events-auto rounded-full bg-bg/60 px-3 py-1.5 text-sm text-muted backdrop-blur"
          >
            ← Library
          </button>
          <div className="text-right">
            <p className="max-w-[200px] truncate text-sm font-medium text-fg">
              {track?.name ?? "No track"}
            </p>
            <p className="text-xs text-muted">
              {formatTime(time)} / {formatTime(duration)}
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="absolute inset-x-0 top-20 z-20 px-5">
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        </div>
      )}

      {/* Bottom handle to open drawer */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-6 pt-4"
      >
        <div className="h-1.5 w-12 rounded-full bg-fg/30" />
      </button>

      {/* Bottom Drawer */}
      {drawerOpen && (
        <>
          <div
            className="absolute inset-0 z-30 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 z-40 max-h-[70dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-bg-elev px-5 pb-10 pt-4">
            <div className="mb-4 flex justify-center">
              <div className="h-1.5 w-12 rounded-full bg-fg/30" />
            </div>

            <div className="mb-6 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={toggle}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-fg text-bg"
              >
                {playing ? "❚❚" : "▶"}
              </button>
            </div>

            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted">Visualizer</h2>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("orb")}
                  className={`rounded-full px-4 py-2 text-sm ${
                    mode === "orb" ? "bg-fg text-bg" : "bg-fg/10 text-fg"
                  }`}
                >
                  Orb
                </button>
                <button
                  type="button"
                  onClick={() => setMode("wave")}
                  className={`rounded-full px-4 py-2 text-sm ${
                    mode === "wave" ? "bg-fg text-bg" : "bg-fg/10 text-fg"
                  }`}
                >
                  Wave
                </button>
              </div>

              {mode === "orb" && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {(["blackhole", "supernova", "plasma", "lightning", "glow"] as OrbStyle[]).map(
                      (style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setOrbStyle(style)}
                          className={`rounded-xl px-2 py-3 text-xs capitalize ${
                            orbStyle === style ? "bg-fg text-bg" : "bg-fg/10 text-fg"
                          }`}
                        >
                          {style}
                        </button>
                      ),
                    )}
                  </div>

                  <label className="flex items-center justify-between gap-3">
                    <span className="text-sm">Revolve</span>
                    <input
                      type="checkbox"
                      checked={revolve}
                      onChange={(e) => setRevolve(e.target.checked)}
                      className="h-5 w-5"
                    />
                  </label>
                </>
              )}

              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Edge glow</span>
                <input
                  type="checkbox"
                  checked={edgeGlow}
                  onChange={(e) => setEdgeGlow(e.target.checked)}
                  className="h-5 w-5"
                />
              </label>

              {edgeGlow && (
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm">Edge colour</span>
                  <input
                    type="color"
                    value={edgeColor}
                    onChange={(e) => setEdgeColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
                  />
                </label>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remain = whole % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
}
