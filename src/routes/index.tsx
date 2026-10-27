import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Engine } from "@/lib/audio/engine";
import { deleteTrack, isAudioFile, listTracks, loadTrackBlob, saveTrack, type Track } from "@/lib/library/tracks";

export const Route = createFileRoute("/")({ component: MusicList });

function MusicList() {
  const navigate = useNavigate();
  const engineRef = useRef<Engine | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const rememberTracks = useCallback((next: Track[]) => {
    setTracks(next);
  }, []);

  useEffect(() => {
    const engine = new Engine();
    engineRef.current = engine;
    void listTracks().then(rememberTracks);
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [rememberTracks]);

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
      const next = [...saved, ...tracks].sort((a, b) => b.addedAt - a.addedAt);
      rememberTracks(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add files");
    } finally {
      setBusy(false);
    }
  }

  async function removeTrack(id: string) {
    await deleteTrack(id);
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }

  function openTrack(id: string) {
    navigate({ to: "/play", search: { id } });
  }

  return (
    <main
      className="relative min-h-dvh bg-bg text-fg"
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void addFiles([...e.dataTransfer.files]);
      }}
    >
      <header className="safe-top sticky top-0 z-20 border-b border-border/60 bg-bg/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="wordmark text-fg">Helios</h1>
            <p className="text-sm text-muted">Your library</p>
          </div>
          <button
            type="button"
            onClick={() => {
              engineRef.current?.unlock();
              fileRef.current?.click();
            }}
            className="rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg transition active:scale-95"
          >
            Upload
          </button>
        </div>
      </header>

      <input
        ref={fileRef}
        className="sr-only"
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.webm"
        multiple
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          void addFiles(files);
        }}
      />

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-bg/85">
          <p className="wordmark text-fg">Drop audio</p>
        </div>
      )}

      <div className="px-5 pb-24 pt-4">
        {error && (
          <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        {busy && <p className="mb-4 text-sm text-muted">Adding tracks…</p>}

        {tracks.length === 0 && !busy ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <p className="text-lg text-muted">No tracks yet</p>
            <p className="max-w-xs text-sm text-muted">
              Upload audio or drop files here. Then open a track to see the visualizer.
            </p>
            <button
              type="button"
              onClick={() => {
                engineRef.current?.unlock();
                fileRef.current?.click();
              }}
              className="rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg"
            >
              Upload music
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {tracks.map((track) => (
              <li key={track.id}>
                <button
                  type="button"
                  onClick={() => openTrack(track.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-bg-elev/60 px-4 py-3 text-left transition active:scale-[0.99]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-fg/10 text-xs font-medium text-muted">
                    ♪
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg">{track.name}</p>
                    <p className="text-xs text-muted">{formatSize(track.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void removeTrack(track.id);
                    }}
                    className="rounded-md px-2 py-1 text-xs text-muted hover:bg-fg/10 hover:text-fg"
                    aria-label="Remove"
                  >
                    Remove
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
