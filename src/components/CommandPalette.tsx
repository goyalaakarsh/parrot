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
              {items.map((cmd) => {
                const globalIdx = filtered.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    onClick={() => { cmd.action(); onClose(); }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-xs text-left transition-colors ${
                      globalIdx === selectedIndex
                        ? 'bg-[#2a2a2a] text-accent'
                        : cmd.enabled
                        ? 'text-[#e0e0e0]'
                        : 'text-[#5a5a5a]'
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
