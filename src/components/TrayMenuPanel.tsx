import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Plus, Search, Settings, Info, LogOut, Command } from 'lucide-react';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

const actions: ActionItem[] = [
  { id: 'add', label: 'Add Prompt', icon: <Plus size={14} />, shortcut: 'Ctrl+N', action: () => invoke('open_main_window', { view: 'add' }) },
  { id: 'palette', label: 'Command Palette', icon: <Command size={14} />, shortcut: 'Ctrl+K', action: () => invoke('open_main_window', { view: 'command-palette' }) },
  { id: 'open', label: 'Open Prompts', icon: <Search size={14} />, action: () => invoke('open_main_window', { view: 'list' }) },
  { id: 'settings', label: 'Settings', icon: <Settings size={14} />, shortcut: 'Ctrl+,', action: () => invoke('open_main_window', { view: 'settings' }) },
];

const appItems: ActionItem[] = [
  { id: 'about', label: 'About', icon: <Info size={14} />, action: () => invoke('open_main_window', { view: 'about' }) },
  { id: 'quit', label: 'Quit', icon: <LogOut size={14} />, action: () => { invoke('exit_app'); } },
];

const allItems = [...actions, ...appItems];

export function TrayMenuPanel() {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(i => (i + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(i => (i - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        allItems[focusedIndex]?.action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        getCurrentWindow().hide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex]);

  return (
    <div role="menu" aria-label="Parrot tray menu" className="w-[220px] bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg shadow-lg flex flex-col select-none overflow-hidden font-sans">
      <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#5a5a5a]">Quick Actions</div>
      {actions.map((item, idx) => (
        <button
          key={`action-${item.id}`}
          role="menuitem"
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
            idx === focusedIndex ? 'bg-[#2a2a2a] text-accent' : 'text-[#e0e0e0]'
          } hover:bg-[#2a2a2a]`}
          onClick={() => item.action()}
          onMouseEnter={() => setFocusedIndex(idx)}
        >
          <span className="shrink-0 text-muted">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.shortcut && (
            <kbd className="text-[9px] px-1 py-0.5 rounded bg-[#2d2d2d] border border-[#3a3a3a] text-[#888] font-sans">
              {item.shortcut}
            </kbd>
          )}
        </button>
      ))}

      <div className="h-px bg-[#2d2d2d] mx-3 my-1" />
      <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#5a5a5a]">App</div>
      {appItems.map((item, idx) => {
        const globalIdx = actions.length + idx;
        return (
          <button
            key={`app-${item.id}`}
            role="menuitem"
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
              globalIdx === focusedIndex ? 'bg-[#2a2a2a] text-accent' : 'text-[#e0e0e0]'
            } hover:bg-[#2a2a2a]`}
            onClick={() => item.action()}
            onMouseEnter={() => setFocusedIndex(globalIdx)}
          >
            <span className="shrink-0 text-muted">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
