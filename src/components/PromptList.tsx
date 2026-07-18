import { Plus, MessageSquarePlus, Search } from 'lucide-react';
import { Prompt } from '../types';
import { PromptCard } from './PromptCard';

interface PromptListProps {
  prompts: Prompt[];
  totalCount: number;
  searchQuery: string;
  selectedIndex: number;
  onSelectPrompt: (index: number) => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (id: string) => void;
  onCopyPrompt: (prompt: Prompt) => void;
  onPastePrompt: (prompt: Prompt) => void;
  onAddClick: () => void;
}

export function PromptList({
  prompts,
  totalCount,
  searchQuery,
  selectedIndex,
  onSelectPrompt,
  onEditPrompt,
  onDeletePrompt,
  onCopyPrompt,
  onPastePrompt,
  onAddClick,
}: PromptListProps) {
  if (prompts.length === 0 && !searchQuery) {
    return (
      <div role="status" aria-label="No texts" className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-dim/20 border border-accent/20 flex items-center justify-center text-accent mb-3">
          <MessageSquarePlus size={22} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-primary mb-1">No texts found</h3>
        <p className="text-xs text-muted mb-4 max-w-[200px]">
          Create texts to copy and paste them instantly anywhere.
        </p>
        <button
          onClick={onAddClick}
          aria-label="Add your first text"
          className="px-3.5 py-1.5 rounded-lg bg-accent text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-accent/10 flex items-center gap-2"
        >
          <span>+ Add your first text</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-accent-dim border border-accent/40 text-background font-sans font-medium leading-none opacity-85">Ctrl+N</kbd>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {searchQuery && (
        <div className="flex items-center gap-1.5 px-1 mb-2 text-[10px] text-muted shrink-0">
          <Search size={10} aria-hidden="true" />
          <span>{prompts.length} of {totalCount} texts</span>
        </div>
      )}
      <div role="listbox" aria-label="Texts" className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
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
          />
        ))}
      </div>
      <button
        onClick={onAddClick}
        aria-label="Add new text"
        className="shrink-0 w-full flex items-center justify-center gap-2 py-2 mt-1.5 text-muted hover:text-accent text-xs font-semibold transition-all duration-100"
      >
        <Plus size={13} aria-hidden="true" />
        <span>Add Text</span>
        <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Ctrl+N</kbd>
      </button>
    </div>
  );
}
