import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { Plus, Search, Settings, Info, LogOut, Command } from 'lucide-react';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

const actions: ActionItem[] = [
  { id: 'add', label: 'Add Text', icon: <Plus size={14} />, shortcut: 'Ctrl+N', action: () => invoke('open_main_window', { view: 'add' }) },
  { id: 'palette', label: 'Command Palette', icon: <Command size={14} />, shortcut: 'Ctrl+K', action: () => invoke('open_main_window', { view: 'command-palette' }) },
  { id: 'open', label: 'Open Texts', icon: <Search size={14} />, action: () => invoke('open_main_window', { view: 'list' }) },
  { id: 'settings', label: 'Settings', icon: <Settings size={14} />, shortcut: 'Ctrl+,', action: () => invoke('open_main_window', { view: 'settings' }) },
];

const appItems: ActionItem[] = [
  { id: 'about', label: 'About', icon: <Info size={14} />, action: () => invoke('open_main_window', { view: 'about' }) },
  { id: 'quit', label: 'Quit', icon: <LogOut size={14} />, action: () => { invoke('exit_app'); } },
];

const allItems = [...actions, ...appItems];

export function TrayMenuPanel() {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dynamically resize window height to fit exact menu content height
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const contentHeight = Math.ceil(rect.height);
      if (contentHeight > 0) {
        getCurrentWindow().setSize(new LogicalSize(220, contentHeight)).catch(() => {});
      }
    }
  }, []);

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
    <div
      ref={menuRef}
      role="menu"
      aria-label="Parrot tray menu"
      className="w-full bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg shadow-lg flex flex-col select-none overflow-hidden font-sans p-1"
    >
      <div className="px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#5a5a5a] shrink-0">Quick Actions</div>
      {actions.map((item, idx) => (
        <button
          key={`action-${item.id}`}
          role="menuitem"
          className={`w-full shrink-0 flex items-center gap-2 px-2.5 py-2 text-xs text-left rounded-md transition-colors ${
            idx === focusedIndex ? 'bg-[#2a2a2a] text-accent' : 'text-[#e0e0e0]'
          } hover:bg-[#2a2a2a]`}
          onClick={() => item.action()}
          onMouseEnter={() => setFocusedIndex(idx)}
        >
          <span className="shrink-0 text-muted" aria-hidden="true">{item.icon}</span>
          <span className="flex-1 truncate">{item.label}</span>
          {item.shortcut && (
            <kbd className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-[#2d2d2d] border border-[#3a3a3a] text-[#888] font-sans">
              {item.shortcut}
            </kbd>
          )}
        </button>
      ))}

      <div className="px-2.5 py-1.5 mt-1 text-[9px] font-semibold uppercase tracking-wider text-[#5a5a5a] shrink-0">App</div>
      {appItems.map((item, idx) => {
        const globalIdx = actions.length + idx;
        return (
          <button
            key={`app-${item.id}`}
            role="menuitem"
            className={`w-full shrink-0 flex items-center gap-2 px-2.5 py-2 text-xs text-left rounded-md transition-colors ${
              globalIdx === focusedIndex ? 'bg-[#2a2a2a] text-accent' : 'text-[#e0e0e0]'
            } hover:bg-[#2a2a2a]`}
            onClick={() => item.action()}
            onMouseEnter={() => setFocusedIndex(globalIdx)}
          >
            <span className="shrink-0 text-muted" aria-hidden="true">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
