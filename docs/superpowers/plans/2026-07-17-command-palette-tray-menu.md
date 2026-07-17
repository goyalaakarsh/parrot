# Command Palette + Tray Menu Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a command palette overlay to the Parrot main window and redesign the tray menu into a rich mini-launcher with sections, search, and recent prompts.

**Architecture:** Two independent frontend features sharing a single backend change (tracking prompt usage timestamps). Command palette is a new React component toggled by `Ctrl+K`. Tray menu rewrites `TrayMenuPanel.tsx` with sections and search, grows the tray window from 140x115 to 240x300.

**Tech Stack:** React 18, TypeScript, Tauri v2 (Rust), Tailwind CSS, lucide-react

---

## File Map

### Modified files:
| File | Change |
|---|---|
| `src/types/index.ts` | Add `lastUsedAt?: string` to `Prompt` |
| `src-tauri/src/commands.rs` | Add `get_recent_prompts` command |
| `src/hooks/usePrompts.ts` | Add `markPromptUsed` function |
| `src/App.tsx` | Integrate command palette view, update copy/paste to track usage |
| `src/hooks/useKeyboard.ts` | Add Ctrl+K handler for command palette |
| `src-tauri/tauri.conf.json` | Update tray_menu window size to 240x300 |
| `src/components/TrayMenuPanel.tsx` | Complete rewrite with sections, search, recent prompts |

### Created files:
| File | Description |
|---|---|
| `src/components/CommandPalette.tsx` | Command palette modal overlay |

---

### Task 1: Add `lastUsedAt` to Prompt type + Rust backend

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/storage.rs`

**Step 1: Update TypeScript Prompt type**

Edit `src/types/index.ts:1-7` — add `lastUsedAt?: string` to the `Prompt` interface:

```
export interface Prompt {
  id: string;
  title: string;
  text: string;
  tags: string[];
  createdAt: string;
  lastUsedAt?: string;
}
```

**Step 2: Update Rust Prompt struct**

Edit `src-tauri/src/storage.rs:6-15` — add `#[serde(default)] pub last_used_at: Option<String>`:

```
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Prompt {
    pub id: String,
    pub title: String,
    #[serde(alias = "body")]
    pub text: String,
    pub tags: Vec<String>,
    pub created_at: String,
    #[serde(default)]
    pub last_used_at: Option<String>,
}
```

The `#[serde(default)]` ensures existing prompts without this field still deserialize correctly.

**Step 3: Add `get_recent_prompts` command**

Add to `src-tauri/src/commands.rs`:

```
#[tauri::command]
pub fn get_recent_prompts(app: AppHandle) -> Result<Vec<Prompt>, String> {
    let mut prompts = storage::load_prompts(&app)?;
    prompts.sort_by(|a, b| {
        let a_time = a.last_used_at.as_deref().unwrap_or("0");
        let b_time = b.last_used_at.as_deref().unwrap_or("0");
        b_time.cmp(a_time)
    });
    prompts.truncate(3);
    Ok(prompts)
}
```

Also register `commands::get_recent_prompts` in the invoke_handler in `lib.rs:180-190`.

**Step 4: Register the command in lib.rs**

Edit `src-tauri/src/lib.rs:180-190` — add `commands::get_recent_prompts,` to the `generate_handler![]` macro.

---

### Task 2: Add `markPromptUsed` to usePrompts hook

**Files:**
- Modify: `src/hooks/usePrompts.ts`

- [ ] **Step 1: Add `markPromptUsed` function**

Add after `deletePrompt` function (~line 98) in `src/hooks/usePrompts.ts`:

```typescript
  const markPromptUsed = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    const updatedPrompts = prompts.map(p =>
      p.id === id ? { ...p, lastUsedAt: now } : p
    );
    setPrompts(updatedPrompts);
    try {
      await invoke('save_prompts', { prompts: updatedPrompts });
    } catch (err: any) {
      console.error('Failed to update lastUsedAt:', err);
      fetchPrompts();
    }
  }, [prompts, fetchPrompts]);
```

- [ ] **Step 2: Add `markPromptUsed` to the return object**

```typescript
  return {
    prompts,
    loading,
    addPrompt,
    updatePrompt,
    deletePrompt,
    markPromptUsed,
    refresh: fetchPrompts,
  };
```

---

### Task 3: Create CommandPalette component

**Files:**
- Create: `src/components/CommandPalette.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState, useEffect, useRef, useMemo } from 'react';

interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
  enabled: boolean;
}

interface CommandPaletteProps {
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      c =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.shortcut && c.shortcut.toLowerCase().includes(q))
    );
  }, [commands, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % Math.max(filtered.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
        onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, selectedIndex, onClose]);

  const categories = useMemo(() => {
    const map = new Map<string, Command[]>();
    filtered.forEach(c => {
      const arr = map.get(c.category) || [];
      arr.push(c);
      map.set(c.category, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-12 bg-black/40">
      <div className="w-[90%] max-h-[340px] bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="relative border-b border-[#2d2d2d]">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="w-full h-10 px-4 text-sm bg-transparent text-[#e0e0e0] placeholder-[#5a5a5a] focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {categories.length === 0 && (
            <div className="px-4 py-6 text-xs text-[#5a5a5a] text-center">No commands found</div>
          )}
          {categories.map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#5a5a5a]">
                {category}
              </div>
              {items.map((cmd, idx) => {
                const globalIdx = filtered.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    onClick={() => { cmd.action(); onClose(); }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-xs text-left transition-colors ${
                      globalIdx === selectedIndex
                        ? 'bg-[#2a2a2a] text-accent'
                        : cmd.enabled ? 'text-[#e0e0e0]' : 'text-[#5a5a5a]'
                    } hover:bg-[#2a2a2a]`}
                  >
                    <span>{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-[#2d2d2d] border border-[#3a3a3a] text-[#888] font-sans">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 4: Add Ctrl+K to keyboard hook

**Files:**
- Modify: `src/hooks/useKeyboard.ts`

- [ ] **Step 1: Add `onCtrlK` callback prop**

Update `UseKeyboardProps` interface:

```
interface UseKeyboardProps {
  itemsCount: number;
  onEnter: (index: number) => void;
  onShiftEnter: (index: number) => void;
  onEscape: () => void;
  onCtrlN?: () => void;
  onCtrlComma?: () => void;
  onCtrlK?: () => void;
  isActive: boolean;
}
```

- [ ] **Step 2: Add handler for Ctrl+K**

Add before the `if (itemsCount === 0) return;` check:

```
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onCtrlK?.();
        return;
      }
```

- [ ] **Step 3: Add `onCtrlK` to deps array**

Add `onCtrlK` to the dependency array of the effect.

---

### Task 5: Integrate command palette + usage tracking in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import CommandPalette**

Add import:
```
import { CommandPalette } from './components/CommandPalette';
```

- [ ] **Step 2: Add state for command palette**

Add after `searchFocused` state:
```
const [showCommandPalette, setShowCommandPalette] = useState(false);
```

- [ ] **Step 3: Destructure `markPromptUsed` from usePrompts**

Change:
```
const { prompts, loading, addPrompt, updatePrompt, deletePrompt } = usePrompts(showToast);
```
to:
```
const { prompts, loading, addPrompt, updatePrompt, deletePrompt, markPromptUsed } = usePrompts(showToast);
```

- [ ] **Step 4: Update copy/paste handlers to track usage**

In `handleCopyPrompt`, after successful copy:
```
markPromptUsed(prompt.id);
```

In `handlePastePrompt`, after successful paste:
```
markPromptUsed(prompt.id);
```

- [ ] **Step 5: Build commands array**

Add before the `isTrayMenu` check:
```
  const commands = useMemo(() => [
    {
      id: 'open-prompts',
      label: 'Open Prompts',
      category: 'Navigation',
      action: () => setView('list'),
      enabled: true,
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      category: 'Navigation',
      shortcut: 'Ctrl+,',
      action: () => setView('settings'),
      enabled: true,
    },
    {
      id: 'add-prompt',
      label: 'Add Prompt',
      category: 'Navigation',
      shortcut: 'Ctrl+N',
      action: () => setView('add'),
      enabled: true,
    },
    {
      id: 'copy-selected',
      label: 'Copy Selected',
      category: 'Actions',
      shortcut: 'Shift+Enter',
      action: () => {
        if (filteredPrompts[selectedIndex]) {
          handleCopyPrompt(filteredPrompts[selectedIndex]);
        }
      },
      enabled: filteredPrompts.length > 0,
    },
    {
      id: 'paste-selected',
      label: 'Paste Selected',
      category: 'Actions',
      shortcut: 'Enter',
      action: () => {
        if (filteredPrompts[selectedIndex]) {
          handlePastePrompt(filteredPrompts[selectedIndex]);
        }
      },
      enabled: filteredPrompts.length > 0,
    },
    {
      id: 'toggle-palette',
      label: 'Command Palette',
      category: 'App',
      shortcut: 'Ctrl+K',
      action: () => setShowCommandPalette(true),
      enabled: true,
    },
    {
      id: 'quit',
      label: 'Quit Parrot',
      category: 'App',
      action: () => invoke('exit_app'),
      enabled: true,
    },
  ], [filteredPrompts, selectedIndex, handleCopyPrompt, handlePastePrompt]);
```

This needs `useMemo` imported from React.

- [ ] **Step 6: Pass `onCtrlK` to useKeyboard**

```
  const { selectedIndex, setSelectedIndex } = useKeyboard({
    itemsCount: filteredPrompts.length,
    onEnter: handleKeyboardEnter,
    onShiftEnter: handleKeyboardShiftEnter,
    onEscape: handleKeyboardEscape,
    onCtrlN: () => setView('add'),
    onCtrlComma: () => setView('settings'),
    onCtrlK: () => setShowCommandPalette(true),
    isActive: view === 'list' && !loading,
  });
```

- [ ] **Step 7: Render command palette overlay**

Inside the main container div, before the closing `</div>`, add:
```
      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
          commands={commands}
        />
      )}
```

This should be after the view blocks but inside the main `div.className="..."`.

---

### Task 6: Update tray_menu window config

**Files:**
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: Change tray_menu window size**

Edit `src-tauri/tauri.conf.json:32-44` — change width to 240, height to 280:

```
      {
        "label": "tray_menu",
        "title": "Parrot Menu",
        "width": 240,
        "height": 280,
        "resizable": false,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "visible": false,
        "focus": true,
        "url": "index.html?window=tray_menu"
      }
```

---

### Task 7: Rewrite TrayMenuPanel with sections and search

**Files:**
- Modify: `src/components/TrayMenuPanel.tsx`

- [ ] **Step 1: Complete rewrite**

The new tray menu should have:
- Search bar at top
- Quick Actions section
- Recent Prompts section (loaded via invoke)
- App section with About + Quit
- Full keyboard navigation

```tsx
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { Plus, Search, Settings, Terminal, Info, LogOut, Command } from 'lucide-react';
import { Prompt } from '../types';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export function TrayMenuPanel() {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentPrompts, setRecentPrompts] = useState<Prompt[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    invoke<Prompt[]>('get_recent_prompts').then(setRecentPrompts).catch(console.error);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const handleOpenView = useCallback(async (view: string) => {
    try {
      await invoke('open_main_window', { view });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handlePastePrompt = useCallback(async (prompt: Prompt) => {
    try {
      const hwnd = await invoke<number>('get_foreground_hwnd');
      await writeText(prompt.text);
      const win = getCurrentWindow();
      await win.hide();
      await invoke('paste_to_previous_window', { hwnd });
    } catch (err) {
      console.error('Auto-paste failed:', err);
    }
  }, []);

  const actions: ActionItem[] = [
    { id: 'add', label: 'Add Prompt', icon: <Plus size={14} />, shortcut: 'Ctrl+N', action: () => handleOpenView('add') },
    { id: 'palette', label: 'Command Palette', icon: <Command size={14} />, shortcut: 'Ctrl+K', action: () => handleOpenView('list') },
    { id: 'open', label: 'Open Prompts', icon: <Terminal size={14} />, action: () => handleOpenView('list') },
    { id: 'settings', label: 'Settings', icon: <Settings size={14} />, shortcut: 'Ctrl+,', action: () => handleOpenView('settings') },
  ];

  const appItems: ActionItem[] = [
    { id: 'about', label: 'About', icon: <Info size={14} />, action: () => {} },
    { id: 'quit', label: 'Quit', icon: <LogOut size={14} />, action: () => { invoke('exit_app'); } },
  ];

  type FlatItem = { type: 'action'; item: ActionItem } | { type: 'recent'; item: Prompt } | { type: 'app'; item: ActionItem };

  const allItems = useMemo((): FlatItem[] => {
    const q = searchQuery.toLowerCase();
    const matches = (label: string) => !q || label.toLowerCase().includes(q);

    const items: FlatItem[] = [];
    actions.filter(a => matches(a.label)).forEach(a => items.push({ type: 'action', item: a }));
    recentPrompts
      .filter(p => !q || p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q))
      .forEach(p => items.push({ type: 'recent', item: p }));
    appItems.filter(a => matches(a.label)).forEach(a => items.push({ type: 'app', item: a }));
    return items;
  }, [searchQuery, recentPrompts]);

  useEffect(() => {
    setFocusedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(i => (i + 1) % Math.max(allItems.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(i => (i - 1 + Math.max(allItems.length, 1)) % Math.max(allItems.length, 1));
      } else if (e.key === 'Enter' && allItems[focusedIndex]) {
        e.preventDefault();
        const entry = allItems[focusedIndex];
        if (entry.type === 'action' || entry.type === 'app') {
          entry.item.action();
        } else {
          handlePastePrompt(entry.item);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        getCurrentWindow().hide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allItems, focusedIndex, handlePastePrompt]);

  const renderItem = (entry: FlatItem, idx: number) => {
    const isFocused = idx === focusedIndex;
    const baseClass = `w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
      isFocused ? 'bg-[#2a2a2a] text-accent' : 'text-[#e0e0e0]'
    } hover:bg-[#2a2a2a]`;

    if (entry.type === 'recent') {
      return (
        <button
          key={`recent-${entry.item.id}`}
          className={`${baseClass} truncate`}
          onClick={() => handlePastePrompt(entry.item)}
          onMouseEnter={() => setFocusedIndex(idx)}
        >
          <Search size={12} className="shrink-0 text-muted" />
          <span className="truncate flex-1">{entry.item.title || 'Untitled'}</span>
        </button>
      );
    }

    if (entry.type === 'app') {
      return (
        <button
          key={`app-${entry.item.id}`}
          className={baseClass}
          onClick={() => entry.item.action()}
          onMouseEnter={() => setFocusedIndex(idx)}
        >
          <span className="shrink-0 text-muted">{entry.item.icon}</span>
          <span className="flex-1">{entry.item.label}</span>
        </button>
      );
    }

    return (
      <button
        key={`action-${entry.item.id}`}
        className={baseClass}
        onClick={() => entry.item.action()}
        onMouseEnter={() => setFocusedIndex(idx)}
      >
        <span className="shrink-0 text-muted">{entry.item.icon}</span>
        <span className="flex-1">{entry.item.label}</span>
        {entry.item.shortcut && (
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-[#2d2d2d] border border-[#3a3a3a] text-[#888] font-sans">
            {entry.item.shortcut}
          </kbd>
        )}
      </button>
    );
  };

  const hasRecentSection = recentPrompts.length > 0 && (!searchQuery || recentPrompts.some(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.text.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div ref={containerRef} role="menu" aria-label="Parrot tray menu" className="w-[240px] bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg shadow-lg flex flex-col select-none overflow-hidden font-sans">
      {/* Search */}
      <div className="relative border-b border-[#2d2d2d]">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a5a]" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search..."
          aria-label="Search tray menu"
          className="w-full h-9 pl-8 pr-3 text-xs bg-transparent text-[#e0e0e0] placeholder-[#5a5a5a] focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto max-h-[240px]">
        {/* Quick Actions */}
        {allItems.some(i => i.type === 'action') && actions.some(a => !searchQuery || a.label.toLowerCase().includes(searchQuery.toLowerCase())) && (
          <div>
            <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#5a5a5a]">Quick Actions</div>
            {allItems.map((entry, idx) => entry.type === 'action' && renderItem(entry, idx))}
          </div>
        )}

        {/* Recent Prompts */}
        {hasRecentSection && (
          <div>
            <div className="h-px bg-[#2d2d2d] mx-3 my-1" />
            <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#5a5a5a]">Recent</div>
            {allItems.map((entry, idx) => entry.type === 'recent' && renderItem(entry, idx))}
          </div>
        )}

        {/* App */}
        {allItems.some(i => i.type === 'app') && (
          <div>
            <div className="h-px bg-[#2d2d2d] mx-3 my-1" />
            {allItems.map((entry, idx) => entry.type === 'app' && renderItem(entry, idx))}
          </div>
        )}

        {allItems.length === 0 && (
          <div className="px-4 py-6 text-xs text-[#5a5a5a] text-center">No results</div>
        )}
      </div>
    </div>
  );
}
```

---

### Task 8: Verify builds

- [ ] **Step 1: Check frontend build**

Run: `npm run build` in `D:\Projects\parrot`
Expected: No TypeScript or build errors.

- [ ] **Step 2: Check Rust backend build**

Run: `cd src-tauri && cargo check` in `D:\Projects\parrot`
Expected: No compilation errors.

- [ ] **Step 3: Commit everything**

```bash
git add -A
git commit -m "feat: add command palette + tray menu redesign"
```
