import type { Ref } from "react";
import {
  FolderOpen,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { Track } from "@/lib/library/tracks";

type Meters = { bass: number; mid: number; air: number };

type Props = {
  dockRef: Ref<HTMLElement>;
  title: string;
  detail: string | null;
  timeLabel: string | null;
  seekValue: number;
  seekMax: number;
  seekable: boolean;
  playing: boolean;
  busy: boolean;
  demo: boolean;
  volume: number;
  tracks: Track[];
  currentId: string | null;
  meters: Meters;
  error: string | null;
  showIntro: boolean;
  onAdd: () => void;
  onDemo: () => void;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (value: number) => void;
  onVolume: (value: number) => void;
  onMute: () => void;
  onPick: (id: string) => void;
  onRemove: (id: string) => void;
};

export function PlayerDock({
  dockRef,
  title,
  detail,
  timeLabel,
  seekValue,
  seekMax,
  seekable,
  playing,
  busy,
  demo,
  volume,
  tracks,
  currentId,
  meters,
  error,
  showIntro,
  onAdd,
  onDemo,
  onToggle,
  onPrev,
  onNext,
  onSeek,
  onVolume,
  onMute,
  onPick,
  onRemove,
}: Props) {
  return (
    <footer ref={dockRef} className="safe-bottom absolute inset-x-0 bottom-0 z-20 border-t border-border bg-bg-elev px-4 pt-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="track-title min-w-0 truncate text-fg">{title}</h2>
        {timeLabel ? <p className="shrink-0 text-sm tabular-nums text-muted">{timeLabel}</p> : null}
      </div>

      {showIntro ? (
        <p className="mb-3 max-w-prose text-sm text-muted">
          Add MP3s and other audio from this device. They stay in the browser — nothing is sent anywhere.
        </p>
      ) : null}

      {detail ? <p className="mb-3 text-sm text-muted">{detail}</p> : null}
      {error ? (
        <p className="mb-3 text-sm text-fg" role="alert">
          {error}
        </p>
      ) : null}

      <label className="mb-4 block">
        <span className="sr-only">Seek</span>
        <input
          className="seek"
          type="range"
          min={0}
          max={seekMax || 0}
          step={0.01}
          value={Number.isFinite(seekValue) ? seekValue : 0}
          disabled={!seekable}
          aria-valuetext={timeLabel ?? undefined}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </label>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Meter label="Bass" value={meters.bass} />
        <Meter label="Mid" value={meters.mid} />
        <Meter label="Air" value={meters.air} />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="ctrl icon-btn" onClick={onPrev} disabled={tracks.length === 0} aria-label="Previous track">
          <SkipBack aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ctrl play-btn"
          onClick={onToggle}
          disabled={busy}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" className="translate-x-px" />}
        </button>
        <button type="button" className="ctrl icon-btn" onClick={onNext} disabled={tracks.length === 0} aria-label="Next track">
          <SkipForward aria-hidden="true" />
        </button>
        <button type="button" className="ctrl icon-btn" onClick={onMute} aria-label={volume === 0 ? "Unmute" : "Mute"}>
          {volume === 0 ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        </button>
        <label className="min-w-16 flex-1">
          <span className="sr-only">Volume</span>
          <input
            className="seek"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => onVolume(Number(event.target.value))}
          />
        </label>
        <button type="button" className="ctrl icon-btn" onClick={onAdd} aria-label="Add audio from this device">
          <FolderOpen aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          className={`ctrl chip ${demo ? "chip-active" : ""}`}
          onClick={onDemo}
          aria-pressed={demo}
        >
          Preview tone
        </button>
        {tracks.map((track) => {
          const active = track.id === currentId;
          return (
            <div key={track.id} className={`chip-wrap ${active ? "chip-active" : ""}`}>
              <button type="button" className="ctrl chip-main" onClick={() => onPick(track.id)} aria-pressed={active}>
                <span className="truncate">{track.name}</span>
              </button>
              <button type="button" className="ctrl chip-remove" onClick={() => onRemove(track.id)} aria-label={`Remove ${track.name}`}>
                <X aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </footer>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  const amount = Math.max(0, Math.min(1, value));
  return (
    <div>
      <p className="mb-1 text-xs text-subtle">{label}</p>
      <div className="h-1 overflow-hidden rounded-full bg-border">
        <div className="meter-fill h-full w-full bg-accent" style={{ transform: `scaleX(${amount})` }} />
      </div>
    </div>
  );
}
