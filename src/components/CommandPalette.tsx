import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action?: () => void;
  enabled?: boolean;
}

interface CommandPaletteProps {
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const enabledCommands = commands.filter(c => c.enabled !== false);
    if (!query.trim()) return enabledCommands;
    const q = query.toLowerCase();
    return enabledCommands.filter(
      c =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.shortcut && c.shortcut.toLowerCase().includes(q))
    );
  }, [commands, query]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const executeCommand = useCallback((command: Command) => {
    if (command.action) {
      command.action();
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeCommand(filtered[selectedIndex]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, filtered, selectedIndex, executeCommand]);

  const categories = useMemo(() => {
    const map = new Map<string, Command[]>();
    filtered.forEach(c => {
      const arr = map.get(c.category) || [];
      arr.push(c);
      map.set(c.category, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Flatten filtered commands for index tracking
  const flatCommands = useMemo(() => {
    const flat: Command[] = [];
    categories.forEach(([, items]) => {
      items.forEach(cmd => flat.push(cmd));
    });
    return flat;
  }, [categories]);

  return (
    <div className="flex-1 flex flex-col p-1 select-text min-h-0">
      <div className="flex items-center gap-2 border-b border-border pb-2.5 mb-2">
        <button
          onClick={onClose}
          aria-label="Back to texts"
          className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-muted hover:text-accent hover:bg-surface-hover transition-all"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none">Esc</kbd>
        </button>
        <h2 className="text-sm font-semibold text-primary">Commands</h2>
      </div>

      <div className="relative border border-border rounded-lg bg-surface mb-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search commands…"
          aria-label="Search commands"
          className="w-full h-9 px-3 text-sm bg-transparent text-primary placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent rounded-lg"
        />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0">
        {categories.length === 0 && (
          <div className="py-6 text-xs text-muted text-center">No commands found</div>
        )}
        {categories.map(([category, items]) => (
          <div key={category}>
            <div className="px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {category}
            </div>
            {items.map((cmd) => {
              const globalIndex = flatCommands.indexOf(cmd);
              const isSelected = globalIndex === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  data-index={globalIndex}
                  onClick={() => executeCommand(cmd)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-colors ${
                    isSelected
                      ? 'bg-accent/10 text-accent'
                      : 'text-primary hover:bg-surface-hover'
                  }`}
                >
                  <span>{cmd.label}</span>
                  <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans">
                    {cmd.shortcut}
                  </kbd>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-2 mt-1 text-[9px] text-muted text-center select-none">
        ↑↓ navigate · Enter select · Esc close
      </div>
    </div>
  );
}
