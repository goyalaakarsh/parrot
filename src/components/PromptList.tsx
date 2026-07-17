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
      <div role="status" aria-label="No prompts" className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-dim/20 border border-accent/20 flex items-center justify-center text-accent mb-3">
          <MessageSquarePlus size={22} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-primary mb-1">No prompts found</h3>
        <p className="text-xs text-muted mb-4 max-w-[200px]">
          Create prompts to copy and paste them instantly anywhere.
        </p>
        <button
          onClick={onAddClick}
          aria-label="Add your first prompt"
          className="px-3.5 py-1.5 rounded-lg bg-accent text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-accent/10 flex items-center gap-2"
        >
          <span>+ Add your first prompt</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-accent-dim border border-accent/40 text-background font-sans font-medium leading-none opacity-85">Ctrl+N</kbd>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {searchQuery && (
        <div className="flex items-center gap-1.5 px-1 mb-2 text-[10px] text-muted">
          <Search size={10} aria-hidden="true" />
          <span>{prompts.length} of {totalCount} prompts</span>
        </div>
      )}
      <div role="listbox" aria-label="Prompts" className="flex-1 overflow-y-auto pr-1.5 space-y-1 mb-2">
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

        <button
          onClick={onAddClick}
          aria-label="Add new prompt"
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-md border border-dashed border-border hover:border-accent hover:bg-accent-dim/5 text-muted hover:text-accent transition-all duration-100 mt-2"
        >
          <Plus size={14} aria-hidden="true" />
          <span className="text-[12px] font-semibold">Add Prompt</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none ml-1 shadow-sm">Ctrl+N</kbd>
        </button>
      </div>
    </div>
  );
}
