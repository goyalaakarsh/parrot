export interface Prompt {
  id: string;
  title: string;
  text: string;
  tags: string[];
  createdAt: string; // ISO8601 string
}

export interface Settings {
  globalShortcut: string;
  launchAtStartup: boolean;
}
