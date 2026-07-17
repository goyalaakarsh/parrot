export interface Prompt {
  id: string;
  title: string;
  text: string;
  tags: string[];
  createdAt: string; // ISO8601 string
  lastUsedAt?: string; // ISO8601 string, set when prompt is copied/pasted
}

export interface Settings {
  globalShortcut: string;
  launchAtStartup: boolean;
}
