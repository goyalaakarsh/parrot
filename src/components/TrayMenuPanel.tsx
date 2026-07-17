import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { Plus, Search, Settings, Info, LogOut, Command } from 'lucide-react';
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
    { id: 'open', label: 'Open Prompts', icon: <Search size={14} />, action: () => handleOpenView('list') },
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

  const hasQuickActions = actions.some(a => !searchQuery || a.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const hasRecentItems = recentPrompts.some(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.text.toLowerCase().includes(searchQuery.toLowerCase()));
  const hasAppItems = appItems.some(a => !searchQuery || a.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div role="menu" aria-label="Parrot tray menu" className="w-[240px] bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg shadow-lg flex flex-col select-none overflow-hidden font-sans">
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
        {hasQuickActions && (
          <div>
            <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#5a5a5a]">Quick Actions</div>
            {allItems.map((entry, idx) =>
              entry.type === 'action' ? (
                <button
                  key={`action-${entry.item.id}`}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                    idx === focusedIndex ? 'bg-[#2a2a2a] text-accent' : 'text-[#e0e0e0]'
                  } hover:bg-[#2a2a2a]`}
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
              ) : null
            )}
          </div>
        )}

        {/* Recent Prompts */}
        {hasRecentItems && (
          <div>
            <div className="h-px bg-[#2d2d2d] mx-3 my-1" />
            <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#5a5a5a]">Recent</div>
            {allItems.map((entry, idx) =>
              entry.type === 'recent' ? (
                <button
                  key={`recent-${entry.item.id}`}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors truncate ${
                    idx === focusedIndex ? 'bg-[#2a2a2a] text-accent' : 'text-[#e0e0e0]'
                  } hover:bg-[#2a2a2a]`}
                  onClick={() => handlePastePrompt(entry.item)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                >
                  <span className="truncate flex-1">{entry.item.title || 'Untitled'}</span>
                </button>
              ) : null
            )}
          </div>
        )}

        {/* App */}
        {hasAppItems && (
          <div>
            <div className="h-px bg-[#2d2d2d] mx-3 my-1" />
            {allItems.map((entry, idx) =>
              entry.type === 'app' ? (
                <button
                  key={`app-${entry.item.id}`}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                    idx === focusedIndex ? 'bg-[#2a2a2a] text-accent' : 'text-[#e0e0e0]'
                  } hover:bg-[#2a2a2a]`}
                  onClick={() => entry.item.action()}
                  onMouseEnter={() => setFocusedIndex(idx)}
                >
                  <span className="shrink-0 text-muted">{entry.item.icon}</span>
                  <span className="flex-1">{entry.item.label}</span>
                </button>
              ) : null
            )}
          </div>
        )}

        {allItems.length === 0 && (
          <div className="px-4 py-6 text-xs text-[#5a5a5a] text-center">No results</div>
        )}
      </div>
    </div>
  );
}
