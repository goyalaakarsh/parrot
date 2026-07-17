import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

const menuItems = ['Open', 'Settings', 'Quit'] as const;
type MenuItem = (typeof menuItems)[number];

export function TrayMenuPanel() {
  const [focusedIndex, _setFocusedIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const setFocusedIndex = (idx: number) => {
    _setFocusedIndex(idx);
    buttonRefs.current[idx]?.focus();
  };

  useEffect(() => {
    buttonRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((focusedIndex + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((focusedIndex - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        getCurrentWindow().hide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex]);

  const handleAction = async (item: MenuItem) => {
    try {
      if (item === 'Open') {
        await invoke('open_main_window', { view: 'list' });
      } else if (item === 'Settings') {
        await invoke('open_main_window', { view: 'settings' });
      } else if (item === 'Quit') {
        await invoke('exit_app');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div role="menu" aria-label="Parrot tray menu" className="w-[140px] h-[115px] bg-[#1e1e1e] border border-[#2d2d2d] rounded-md shadow-lg flex flex-col py-1.5 text-left font-sans select-none overflow-hidden">
      {menuItems.map((item, idx) => (
        <span key={item}>
          <button
            ref={(el) => { buttonRefs.current[idx] = el; }}
            role="menuitem"
            onClick={() => handleAction(item)}
            onFocus={() => _setFocusedIndex(idx)}
            aria-label={item === 'Open' ? 'Open prompts' : item === 'Settings' ? 'Open settings' : 'Quit Parrot'}
            className="w-full px-4 py-1.5 text-xs text-[#e0e0e0] hover:bg-[#2a2a2a] transition-all text-left font-normal focus:outline-none focus:bg-[#2a2a2a] focus:text-accent"
          >
            {item}
          </button>
          {item === 'Settings' && <div className="h-px bg-[#2d2d2d] my-1" />}
        </span>
      ))}
    </div>
  );
}
