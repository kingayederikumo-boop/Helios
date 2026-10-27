import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlayerDock } from "@/components/player-dock";
import { SolarCanvas } from "@/components/solar-canvas";
import { Engine } from "@/lib/audio/engine";
import { deleteTrack, isAudioFile, listTracks, loadTrackBlob, saveTrack, type Track } from "@/lib/library/tracks";

export const Route = createFileRoute("/")({ component: Home });

type Meters = { bass: number; mid: number; air: number };
type Hover = { name: string; x: number; y: number };

function Home() {
  const engineRef = useRef<Engine | null>(null);
  const tracksRef = useRef<Track[]>([]);
  const currentIdRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<() => void>(() => undefined);
  const lastVolume = useRef(0.85);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [demo, setDemo] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [meters, setMeters] = useState<Meters>({ bass: 0, mid: 0, air: 0 });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [bottomInset, setBottomInset] = useState(240);
  const [hover, setHover] = useState<Hover | null>(null);

  const rememberTracks = useCallback((next: Track[]) => {
    tracksRef.current = next;
    setTracks(next);
  }, []);

  const playId = useCallback(async (id: string) => {
    const current = engineRef.current;
    const track = tracksRef.current.find((item) => item.id === id);
    if (!current || !track) return;
    current.unlock();
    setBusy(true);
    setError(null);
    try {
      const blob = await loadTrackBlob(track);
      if (!blob) throw new Error("That file is no longer on this device.");
      await current.playBlob(blob);
      currentIdRef.current = id;
      setCurrentId(id);
      setDemo(false);
      setPlaying(true);
    } catch (err) {
      setPlaying(false);
      currentIdRef.current = id;
      setCurrentId(id);
      setDemo(false);
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const current = new Engine();
    engineRef.current = current;
    setEngine(current);
    const stored = window.localStorage.getItem("helios-volume");
    if (stored) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed)) {
        const next = Math.min(1, Math.max(0, parsed));
        current.setVolume(next);
        setVolume(next);
        if (next > 0) lastVolume.current = next;
      }
    }
    current.onEnded = () => {
      const list = tracksRef.current;
      if (list.length === 0) {
        setPlaying(false);
        return;
      }
      const index = list.findIndex((track) => track.id === currentIdRef.current);
      const following = list[(index + 1) % list.length];
      if (following) void playId(following.id);
    };
    void listTracks().then((rows) => rememberTracks(rows));
    const timer = window.setInterval(() => {
      const live = engineRef.current;
      if (!live) return;
      setTime(live.currentTime());
      setDuration(live.duration());
      setMeters({ bass: live.levels.bass, mid: live.levels.mid, air: live.levels.air });
      setPlaying(live.playing);
    }, 200);
    return () => {
      window.clearInterval(timer);
      current.dispose();
      if (engineRef.current === current) engineRef.current = null;
    };
  }, [playId, rememberTracks]);

  useEffect(() => {
    const node = dockRef.current;
    if (!node) return;
    const measure = () => setBottomInset(node.offsetHeight + 12);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [tracks.length, error, demo, busy, currentId, playing]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select")) return;
      const live = engineRef.current;
      if (!live) return;
      if (event.code === "Space") {
        event.preventDefault();
        toggleRef.current();
      } else if (event.code === "ArrowRight") {
        live.seek(live.currentTime() + 5);
      } else if (event.code === "ArrowLeft") {
        live.seek(live.currentTime() - 5);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function togglePlayback() {
    const live = engineRef.current;
    if (!live || busy) return;
    live.unlock();
    if (live.playing) {
      live.pause();
      setPlaying(false);
      return;
    }
    if (live.mode === "file" && currentIdRef.current) {
      void live.resume().then(() => setPlaying(true)).catch((err: unknown) => setError(friendly(err)));
      return;
    }
    if (live.mode === "demo") {
      live.playDemo();
      setDemo(true);
      setPlaying(true);
      return;
    }
    if (currentIdRef.current) {
      void playId(currentIdRef.current);
      return;
    }
    if (tracksRef.current[0]) {
      void playId(tracksRef.current[0].id);
      return;
    }
    live.playDemo();
    setDemo(true);
    setPlaying(true);
    setError(null);
  }

  toggleRef.current = togglePlayback;

  async function addFiles(files: File[]) {
    const audio = files.filter(isAudioFile);
    if (audio.length === 0) {
      setError("Choose an audio file — MP3, M4A, WAV, FLAC, or OGG.");
      return;
    }
    engineRef.current?.unlock();
    setBusy(true);
    setError(null);
    try {
      const saved: Track[] = [];
      for (const file of audio) saved.push(await saveTrack(file));
      const next = [...saved, ...tracksRef.current].sort((a, b) => b.addedAt - a.addedAt);
      rememberTracks(next);
      const first = saved[0];
      if (first) await playId(first.id);
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  }

  function step(direction: -1 | 1) {
    const list = tracksRef.current;
    if (list.length === 0) return;
    const index = list.findIndex((track) => track.id === currentIdRef.current);
    const start = index < 0 ? 0 : index;
    const following = list[(start + direction + list.length) % list.length];
    if (following) void playId(following.id);
  }

  async function removeTrack(id: string) {
    await deleteTrack(id);
    const next = tracksRef.current.filter((track) => track.id !== id);
    rememberTracks(next);
    if (currentIdRef.current !== id) return;
    engineRef.current?.pause();
    setPlaying(false);
    currentIdRef.current = null;
    setCurrentId(null);
    const following = next[0];
    if (following) void playId(following.id);
  }

  function changeVolume(value: number) {
    const next = Math.min(1, Math.max(0, value));
    setVolume(next);
    engineRef.current?.setVolume(next);
    if (next > 0) lastVolume.current = next;
    window.localStorage.setItem("helios-volume", String(next));
  }

  const current = tracks.find((track) => track.id === currentId) ?? null;
  const title = demo ? "Preview tone" : (current?.name ?? "Nothing in orbit");
  const timeLabel = current ? `${formatTime(time)} / ${formatTime(duration)}` : null;

  return (
    <main
      className="relative h-dvh overflow-hidden bg-bg text-fg"
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void addFiles([...event.dataTransfer.files]);
      }}
    >
      <h1 className="sr-only">Helios solar audio visualizer</h1>
      <SolarCanvas engine={engine} bottomInset={bottomInset} onHover={setHover} />

      <header className="safe-top pointer-events-none absolute inset-x-0 top-0 z-10 px-5">
        <p className="wordmark text-fg">Helios</p>
        <p className="text-sm text-muted">Solar listening</p>
      </header>

      {hover ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-bg-elev px-2 py-1 text-xs text-fg"
          style={{ left: hover.x, top: hover.y - 10 }}
        >
          {hover.name}
        </div>
      ) : null}

      {dragging ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-bg/80 px-6">
          <p className="wordmark text-fg">Drop audio</p>
        </div>
      ) : null}

      <input
        ref={fileRef}
        className="sr-only"
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.webm"
        multiple
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          void addFiles(files);
        }}
      />

      <PlayerDock
        dockRef={dockRef}
        title={title}
        detail={busy ? "Reading audio…" : null}
        timeLabel={timeLabel}
        seekValue={time}
        seekMax={duration}
        seekable={Boolean(current) && !demo}
        playing={playing}
        busy={busy}
        demo={demo}
        volume={volume}
        tracks={tracks}
        currentId={demo ? null : currentId}
        meters={meters}
        error={error}
        showIntro={!current && !demo && tracks.length === 0}
        onAdd={() => {
          engineRef.current?.unlock();
          fileRef.current?.click();
        }}
        onDemo={() => {
          const live = engineRef.current;
          if (!live) return;
          live.unlock();
          live.playDemo();
          setDemo(true);
          setPlaying(true);
          setError(null);
        }}
        onToggle={() => togglePlayback()}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onSeek={(value) => {
          engineRef.current?.seek(value);
          setTime(value);
        }}
        onVolume={changeVolume}
        onMute={() => changeVolume(volume === 0 ? lastVolume.current || 0.85 : 0)}
        onPick={(id) => void playId(id)}
        onRemove={(id) => void removeTrack(id)}
      />
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

function friendly(err: unknown): string {
  if (err instanceof DOMException && err.name === "NotAllowedError") return "Tap play to start the audio.";
  if (err instanceof DOMException && err.name === "NotSupportedError") return "This browser can't play that file.";
  if (err instanceof Error && err.message) return err.message;
  return "This file couldn't be played.";
}
