import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Command } from 'lucide-react';

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
    <div className="flex-1 flex flex-col p-1 select-text">
      <div className="flex items-center gap-2 border-b border-border pb-2.5 mb-2">
        <button
          onClick={onClose}
          aria-label="Back to prompts"
          className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-muted hover:text-accent hover:bg-surface-hover transition-all"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none">Esc</kbd>
        </button>
        <Command size={14} className="text-accent" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-primary">Commands</h2>
      </div>

      <div className="relative border border-border rounded-lg bg-surface mb-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search commands..."
          className="w-full h-9 px-3 text-sm bg-transparent text-primary placeholder-muted focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {categories.length === 0 && (
          <div className="py-6 text-xs text-muted text-center">No commands found</div>
        )}
        {categories.map(([category, items]) => (
          <div key={category}>
            <div className="px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {category}
            </div>
            {items.map((cmd) => {
              const globalIdx = filtered.indexOf(cmd);
              return (
                <button
                  key={cmd.id}
                  onClick={() => { cmd.action(); onClose(); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-md transition-colors ${
                    globalIdx === selectedIndex
                      ? 'bg-surface-hover text-accent'
                      : cmd.enabled
                      ? 'text-primary'
                      : 'text-muted'
                  } hover:bg-surface-hover`}
                >
                  <span>{cmd.label}</span>
                  {cmd.shortcut && (
                    <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans">
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
  );
}
