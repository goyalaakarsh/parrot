import { Search } from 'lucide-react';
import { Prompt, HistoryEntry } from '../types';
import { PromptCard } from './PromptCard';

interface UnifiedSearchResultsProps {
  prompts: Prompt[];
  historyEntries: HistoryEntry[];
  searchQuery: string;
  selectedIndex: number;
  onSelectPrompt: (index: number) => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (id: string) => void;
  onCopyPrompt: (prompt: Prompt) => void;
  onPastePrompt: (prompt: Prompt) => void;
  onTogglePin: (id: string) => void;
  onTagClick: (tag: string) => void;
  onCopyHistory: (entry: HistoryEntry) => void;
  onPasteHistory: (entry: HistoryEntry) => void;
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

export function UnifiedSearchResults({
  prompts,
  historyEntries,
  searchQuery,
  selectedIndex,
  onSelectPrompt,
  onEditPrompt,
  onDeletePrompt,
  onCopyPrompt,
  onPastePrompt,
  onTogglePin,
  onTagClick,
  onCopyHistory,
  onPasteHistory,
}: UnifiedSearchResultsProps) {
  const totalResults = prompts.length + historyEntries.length;
  const promptCount = prompts.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 px-1 mb-2 text-[10px] text-muted shrink-0">
        <Search size={10} aria-hidden="true" />
        <span>{totalResults} result{totalResults !== 1 ? 's' : ''} — {prompts.length} text{prompts.length !== 1 ? 's' : ''}, {historyEntries.length} histor{historyEntries.length !== 1 ? 'ies' : 'y'}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
        {/* My Texts section */}
        {prompts.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-1 mb-1">
              <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">My Texts</span>
            </div>
            <div role="listbox" aria-label="Matching texts" className="space-y-1">
              {prompts.map((prompt, idx) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  isSelected={idx === selectedIndex}
                  onSelect={() => onSelectPrompt(idx)}
                  onEdit={() => onEditPrompt(prompt)}
                  onDelete={() => onDeletePrompt(prompt.id)}
                  onCopy={() => onCopyPrompt(prompt)}
                  onPaste={() => onPastePrompt(prompt)}
                  onTogglePin={() => onTogglePin(prompt.id)}
                  onTagClick={onTagClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* History section */}
        {historyEntries.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-1 mb-1">
              <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">History</span>
            </div>
            <div role="listbox" aria-label="Matching history" className="space-y-1">
              {historyEntries.map((entry, idx) => {
                const globalIdx = promptCount + idx;
                const isImage = !!entry.imagePath;

                return (
                  <div
                    key={entry.id}
                    role="option"
                    aria-selected={globalIdx === selectedIndex}
                    onClick={() => onSelectPrompt(globalIdx)}
                    className={`group w-full flex flex-col p-3 rounded-md border text-left cursor-pointer transition-[border-color,background-color] duration-100 ${
                      globalIdx === selectedIndex
                        ? 'border-accent bg-accent-dim/15'
                        : 'border-transparent bg-surface hover:border-border'
                    }`}
                  >
                    {!isImage && (
                      <p className={`text-xs text-muted break-words whitespace-pre-line text-left ${
                        globalIdx === selectedIndex ? 'line-clamp-5' : 'line-clamp-3'
                      }`}>
                        {entry.text.length > 150 ? `${entry.text.substring(0, 150)}…` : entry.text}
                      </p>
                    )}
                    {isImage && (
                      <p className="text-xs text-muted italic">[Image]</p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted">
                      {entry.sourceApp && (
                        <span className="px-1 py-0.5 rounded bg-surface-hover border border-border">{entry.sourceApp}</span>
                      )}
                      <span>{formatRelativeTime(entry.capturedAt)}</span>
                    </div>

                    <div className={`flex items-center justify-end gap-1.5 w-full overflow-hidden transition-[height,opacity,margin,padding] duration-100 ${
                      globalIdx === selectedIndex
                        ? 'h-6 opacity-100 mt-2.5 pt-0.5'
                        : 'h-0 opacity-0 group-hover:h-6 group-hover:opacity-100 group-hover:mt-2.5 group-hover:pt-0.5'
                    }`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onCopyHistory(entry); }}
                        title="Copy (Shift+Enter)"
                        className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all"
                      >
                        <span className="text-[10px]">Copy</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onPasteHistory(entry); }}
                        title="Paste (Enter)"
                        className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all"
                      >
                        <span className="text-[10px]">Paste</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalResults === 0 && (
          <div className="py-6 text-xs text-muted text-center">
            No results for "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
