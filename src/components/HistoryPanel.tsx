import { Clipboard, CornerDownLeft, Save, Trash2, Clock, History } from 'lucide-react';
import { HistoryEntry } from '../types';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onCopy: (entry: HistoryEntry) => void;
  onPaste: (entry: HistoryEntry) => void;
  onPromote: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoString).toLocaleDateString();
}

export function HistoryPanel({ entries, onCopy, onPaste, onPromote, onDelete }: HistoryPanelProps) {
  if (entries.length === 0) {
    return (
      <div role="status" aria-label="No history" className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-dim/20 border border-accent/20 flex items-center justify-center text-accent mb-3">
          <History size={22} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-primary mb-1">No history yet</h3>
        <p className="text-xs text-muted mb-4 max-w-[220px]">
          Start copying text anywhere — Parrot will automatically save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="group w-full flex flex-col p-3 rounded-md border border-transparent bg-surface hover:border-border transition-all duration-100"
        >
          <p className="text-xs text-muted break-words whitespace-pre-line line-clamp-3">
            {entry.text.length > 120 ? `${entry.text.substring(0, 120)}...` : entry.text}
          </p>

          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted">
            {entry.sourceApp && (
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.5 rounded bg-surface-hover border border-border">{entry.sourceApp}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={10} aria-hidden="true" />
              {formatRelativeTime(entry.capturedAt)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-1.5 mt-2.5 pt-0.5 h-6 opacity-0 group-hover:opacity-100 transition-all duration-100">
            <button
              onClick={() => onCopy(entry)}
              title="Copy"
              aria-label="Copy"
              className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all"
            >
              <Clipboard size={13} aria-hidden="true" />
            </button>
            <button
              onClick={() => onPaste(entry)}
              title="Paste"
              aria-label="Paste"
              className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all"
            >
              <CornerDownLeft size={13} aria-hidden="true" />
            </button>
            <button
              onClick={() => onPromote(entry)}
              title="Save to My Texts"
              aria-label="Save to My Texts"
              className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all flex items-center gap-1"
            >
              <Save size={13} aria-hidden="true" />
              <span className="text-[10px] font-medium">Save</span>
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              title="Delete"
              aria-label="Delete"
              className="p-1 rounded text-muted hover:text-danger hover:bg-surface-hover transition-all"
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
