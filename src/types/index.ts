export interface Prompt {
  id: string;
  title: string;
  text: string;
  tags: string[];
  createdAt: string; // ISO8601 string
  lastUsedAt?: string; // ISO8601 string, set when prompt is copied/pasted
  pinned: boolean;
  pinnedAt?: string; // ISO8601 string, set when prompt is pinned
}

export interface HistoryEntry {
  id: string;
  text: string;
  sourceApp: string | null;
  capturedAt: string; // ISO8601 string
}

export interface Settings {
  globalShortcut: string;
  quickCaptureShortcut: string;
  launchAtStartup: boolean;
}
