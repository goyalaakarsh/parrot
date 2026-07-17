# Command Palette + Tray Menu Redesign

**Date**: 2026-07-17
**Status**: Approved

## Overview

Two interrelated features to improve Parrot's UX:
1. A **command palette** — a searchable overlay listing all app actions with keyboard shortcuts
2. A **tray menu redesign** — expand the right-click tray menu from 3 static items to a rich mini-launcher with sections, search, and recent prompts

---

## 1. Command Palette

### Trigger
- `Ctrl+K` or `Ctrl+P` keyboard shortcut from anywhere in the main window
- Also invokable from tray menu

### UI
- Modal overlay within the main Parrot window (380x480)
- Semi-transparent dark backdrop (`bg-black/40`)
- Centered panel (~340px wide, max ~400px tall) with rounded corners
- Search input at top with placeholder "Search commands..."
- Scrollable results list below, grouped by category with section headers

### Commands

| Category | Label | Shortcut | Action |
|---|---|---|---|
| Navigation | Open Prompts | — | Switch to prompt list view |
| Navigation | Open Settings | `Ctrl+,` | Switch to settings view |
| Navigation | Open Add Prompt | `Ctrl+N` | Switch to add prompt view |
| Actions | Copy Selected | `Shift+Enter` | Copy highlighted prompt |
| Actions | Paste Selected | `Enter` | Auto-paste highlighted prompt |
| Actions | Edit Selected | `Ctrl+E` | Edit highlighted prompt |
| Actions | Delete Selected | `Delete` | Delete highlighted prompt |
| App | Command Palette | `Ctrl+K` | Toggle this palette |
| App | Quit Parrot | — | Exit the app |

### Behavior
- Fuzzy search across command labels, categories, and shortcut text
- Arrow Up/Down to navigate, Enter to execute, Escape to close
- Typing auto-focuses the search input
- Selected item gets a highlight background
- Keyboard shortcut shown as a badge/chip on the right side
- If a command is context-dependent (e.g., Copy requires a prompt selected), show it greyed out with a note

### New files
- `src/components/CommandPalette.tsx`

### Modified files
- `src/App.tsx` — integrate command palette view/toggle
- `src/hooks/useKeyboard.ts` — add `Ctrl+K` handler
- `src/types/index.ts` — possibly no changes

---

## 2. Tray Menu Redesign

### Window Config Change
- `tauri.conf.json`: tray_menu window from `140x115` → `240x300`
- URL remains `index.html?window=tray_menu`

### Layout (top to bottom)

1. **Search bar** — filters all items below (commands + recent prompts)
2. **Quick Actions section** — header "QUICK ACTIONS"
   - + Add Prompt (shows `Ctrl+N` hint)
   - ⌘K Command Palette
   - 📋 Open Prompts
   - ⚙️ Settings (shows `Ctrl+,` hint)
3. **Recent section** — header "RECENT" (only shown if there are recent prompts)
   - Up to 3 most recently used prompts shown as clickable items
   - Truncated title + preview text
   - Click executes paste into previous window
4. **App section** — thin separator
   - ℹ️ About
   - 🚪 Quit

### Behavior
- **Arrow Up/Down** navigates through ALL visible items (commands + recent prompts)
- **Enter** executes selected item
- **Escape** closes tray menu
- **Click** on a recent prompt → immediately paste into previous window
- Auto-hide on blur (existing behavior preserved)
- Search bar filters: matches against command labels, prompt titles, and prompt text

### Backend: Recent Prompts Tracking
- Extend `Prompt` type in Rust with optional `last_used_at: Option<String>` (ISO 8601)
- When a prompt is pasted or copied (via `handlePastePrompt` / `handleCopyPrompt`), update its `last_used_at` timestamp and persist to `prompts.json`
- New Tauri command: `get_recent_prompts(limit: u32) -> Vec<Prompt>` — returns prompts sorted by `last_used_at` DESC, nulls last
- Or simpler: modify `get_prompts` to accept optional sort param; client filters recent ones

### Modified backend files
- `src-tauri/src/commands.rs` — add `get_recent_prompts` or extend existing
- `src-tauri/src/storage.rs` — no structural changes needed (already stores prompts)
- `src/types/index.ts` — add `lastUsedAt?: string` to `Prompt`

### Modified frontend files
- `src/components/TrayMenuPanel.tsx` — complete rewrite with sections, search, recent prompts
- `src/App.tsx` — update `handleCopyPrompt` / `handlePastePrompt` to save recent usage
- `src/hooks/usePrompts.ts` — add `markPromptUsed` function

---

## 3. Implementation Order

1. **Prompt type update** — add `lastUsedAt` field
2. **Recent prompts tracking** — update copy/paste handlers to record usage timestamp
3. **Tray menu redesign** — rewrite `TrayMenuPanel.tsx` + update window config
4. **Command palette** — new component + keyboard hook + integrate into App
5. **Wire tray menu "Command Palette" button** to open main window in command palette mode

---

## Future Considerations (out of scope)
- Configurable command palette shortcut
- Pinning prompts to tray menu
- Theme support for tray menu
