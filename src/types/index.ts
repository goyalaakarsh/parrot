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
  imagePath?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface SavedLink {
  id: string;
  title: string;
  url: string;
  description: string;
  faviconUrl: string | null;
  category: string;
  tags: string[];
  createdAt: string;
  lastUsedAt?: string;
  pinned: boolean;
  pinnedAt?: string;
}

export interface IdentityField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'email' | 'phone' | 'address';
}

export interface Identity {
  id: string;
  name: string;
  fields: IdentityField[];
  createdAt: string;
  updatedAt?: string;
  pinned: boolean;
  pinnedAt?: string;
}

export interface Settings {
  globalShortcut: string;
  quickCaptureShortcut: string;
  launchAtStartup: boolean;
  textHistoryRetentionDays: number;
  imageHistoryRetentionDays: number;
  theme: 'dark' | 'light' | 'system';
}
