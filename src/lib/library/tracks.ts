export type Track = {
  id: string;
  name: string;
  type: string;
  addedAt: number;
  size: number;
  /** Kept in memory when the browser refuses to store the file. */
  blob?: Blob;
};

const DB_NAME = "helios";
const DB_VERSION = 1;
const META = "meta";
const BLOBS = "blobs";

const memory = new Map<string, Track>();

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: "id" });
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open the library"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Library write failed"));
    tx.onabort = () => reject(tx.error ?? new Error("Library write aborted"));
  });
}

export function prettyName(filename: string): string {
  const bare = filename.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim();
  return bare || "Untitled";
}

export async function listTracks(): Promise<Track[]> {
  try {
    const db = await openDb();
    const rows = await new Promise<Track[]>((resolve, reject) => {
      const tx = db.transaction(META, "readonly");
      const req = tx.objectStore(META).getAll();
      req.onsuccess = () => resolve((req.result as Track[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    const savedIds = new Set(rows.map((row) => row.id));
    const sessionOnly = [...memory.values()].filter((track) => !savedIds.has(track.id) && track.blob);
    return [...rows, ...sessionOnly].sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    return [...memory.values()].sort((a, b) => b.addedAt - a.addedAt);
  }
}

export async function saveTrack(file: File): Promise<Track> {
  const track: Track = {
    id: crypto.randomUUID(),
    name: prettyName(file.name),
    type: file.type || "audio/*",
    addedAt: Date.now(),
    size: file.size,
  };
  try {
    const db = await openDb();
    const tx = db.transaction([META, BLOBS], "readwrite");
    tx.objectStore(META).put(track);
    tx.objectStore(BLOBS).put({ id: track.id, blob: file });
    await txDone(tx);
    db.close();
    return track;
  } catch {
    const session = { ...track, blob: file };
    memory.set(session.id, session);
    return session;
  }
}

export async function loadTrackBlob(track: Track): Promise<Blob | null> {
  if (track.blob) return track.blob;
  const cached = memory.get(track.id);
  if (cached?.blob) return cached.blob;
  try {
    const db = await openDb();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(BLOBS, "readonly");
      const req = tx.objectStore(BLOBS).get(track.id);
      req.onsuccess = () => {
        const row = req.result as { blob?: Blob } | undefined;
        resolve(row?.blob ?? null);
      };
      req.onerror = () => reject(req.error);
    });
    db.close();
    return blob;
  } catch {
    return null;
  }
}

export async function deleteTrack(id: string): Promise<void> {
  memory.delete(id);
  try {
    const db = await openDb();
    const tx = db.transaction([META, BLOBS], "readwrite");
    tx.objectStore(META).delete(id);
    tx.objectStore(BLOBS).delete(id);
    await txDone(tx);
    db.close();
  } catch {
    /* session-only track already dropped */
  }
}

const AUDIO_EXT = /\.(mp3|wav|m4a|aac|flac|ogg|opus|webm|mp4|aiff|aif)$/i;

export function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  if (file.type === "video/mp4") return AUDIO_EXT.test(file.name);
  return AUDIO_EXT.test(file.name);
}
