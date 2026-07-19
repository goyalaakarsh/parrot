import { useState, useEffect, useRef } from 'react';
import { Clipboard, CornerDownLeft, Save, Trash2, Clock, History, Expand } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { HistoryEntry } from '../types';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  totalCount: number;
  filter: 'all' | 'text' | 'images';
  onFilterChange: (f: 'all' | 'text' | 'images') => void;
  onCopy: (entry: HistoryEntry) => void;
  onPaste: (entry: HistoryEntry) => void;
  onPromote: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  selectedIndex: number;
  onSelectPrompt: (index: number) => void;
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

export function HistoryPanel({
  entries,
  totalCount,
  filter,
  onFilterChange,
  onCopy,
  onPaste,
  onPromote,
  onDelete,
  selectedIndex,
  onSelectPrompt,
}: HistoryPanelProps) {
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const entryRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Load image URLs on mount / when entries change
  useEffect(() => {
    const allImageEntries = entries.filter(e => e.imagePath);
    const urls = new Map<string, string>();
    let cancelled = false;

    Promise.all(allImageEntries.map(async (entry) => {
      try {
        const path = await invoke<string>('get_image_path', { entryId: entry.id });
        if (!cancelled) {
          urls.set(entry.id, convertFileSrc(path));
        }
      } catch (err) {
        console.error('Failed to get image path:', err);
      }
    })).then(() => {
      if (!cancelled) {
        setImageUrls(urls);
      }
    });

    return () => { cancelled = true; };
  }, [entries]);

  // Scroll selected entry into view
  useEffect(() => {
    const el = entryRefs.current.get(selectedIndex);
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (totalCount === 0) {
    return (
      <div role="status" aria-label="No history" className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-dim/20 border border-accent/20 flex items-center justify-center text-accent mb-3">
          <History size={22} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-primary mb-1">No history yet</h3>
        <p className="text-xs text-muted mb-4 max-w-[220px]">
          Start copying text or images anywhere — Parrot will automatically save them here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Filter pills */}
      <div className="flex items-center gap-1 mb-2 shrink-0">
        {(['all', 'text', 'images'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { onFilterChange(f); onSelectPrompt(0); }}
            className={`text-[10px] font-semibold px-2 py-1 rounded transition-all capitalize ${
              filter === f
                ? 'text-accent bg-accent-dim/15'
                : 'text-muted hover:text-primary'
            }`}
          >
            {f === 'all' ? `All (${totalCount})` : f === 'text' ? `Text` : `Images`}
          </button>
        ))}
      </div>

      {/* Entries list */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
        {entries.map((entry, idx) => {
          const isImage = !!entry.imagePath;
          const imageUrl = imageUrls.get(entry.id);
          const isSelected = idx === selectedIndex;

          return (
            <div
              key={entry.id}
              ref={(el) => { if (el) entryRefs.current.set(idx, el); }}
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelectPrompt(idx)}
              className={`group w-full flex flex-col p-3 rounded-md border text-left cursor-pointer transition-[border-color,background-color] duration-100 ${
                isSelected
                  ? 'border-accent bg-accent-dim/15'
                  : 'border-transparent bg-surface hover:border-border'
              }`}
            >
              {isImage ? (
                <div className="flex flex-col gap-2">
                  {imageUrl && (
                    <div
                      className="relative cursor-pointer rounded-md overflow-hidden border border-border"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedImageId(expandedImageId === entry.id ? null : entry.id);
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt="Clipboard image"
                        className={`w-full object-cover ${expandedImageId === entry.id ? 'max-h-[300px]' : 'max-h-[120px]'}`}
                        style={{ objectPosition: 'top' }}
                      />
                      <div className="absolute top-1.5 right-1.5 p-1 rounded bg-background/60 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        <Expand size={12} />
                      </div>
                    </div>
                  )}
                  {entry.imageWidth && entry.imageHeight && (
                    <span className="text-[10px] text-muted">{entry.imageWidth} × {entry.imageHeight}</span>
                  )}
                </div>
              ) : (
                <p className={`text-xs text-muted break-words whitespace-pre-line text-left ${
                  isSelected ? 'line-clamp-5' : 'line-clamp-3'
                }`}>
                  {entry.text.length > 150 ? `${entry.text.substring(0, 150)}…` : entry.text}
                </p>
              )}

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

              <div className={`flex items-center justify-end gap-1.5 w-full overflow-hidden transition-[height,opacity,margin,padding] duration-100 ${
                isSelected
                  ? 'h-6 opacity-100 mt-2.5 pt-0.5'
                  : 'h-0 opacity-0 group-hover:h-6 group-hover:opacity-100 group-hover:mt-2.5 group-hover:pt-0.5'
              }`}>
                <button
                  onClick={(e) => { e.stopPropagation(); onCopy(entry); }}
                  title="Copy (Shift+Enter)"
                  aria-label="Copy"
                  className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all flex items-center gap-1"
                >
                  <Clipboard size={13} aria-hidden="true" />
                  {isSelected && <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Shift+Enter</kbd>}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onPaste(entry); }}
                  title="Paste (Enter)"
                  aria-label="Paste"
                  className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all flex items-center gap-1"
                >
                  <CornerDownLeft size={13} aria-hidden="true" />
                  {isSelected && <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Enter</kbd>}
                </button>
                {!isImage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPromote(entry); }}
                    title="Save to My Texts"
                    aria-label="Save to My Texts"
                    className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all flex items-center gap-1"
                  >
                    <Save size={13} aria-hidden="true" />
                    <span className="text-[10px] font-medium">Save</span>
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                  title="Delete"
                  aria-label="Delete"
                  className="p-1 rounded text-muted hover:text-danger hover:bg-surface-hover transition-all"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
        {entries.length === 0 && (
          <div className="py-6 text-xs text-muted text-center">
            {filter === 'text' ? 'No text history entries' : 'No image history entries'}
          </div>
        )}
      </div>
    </div>
  );
}
