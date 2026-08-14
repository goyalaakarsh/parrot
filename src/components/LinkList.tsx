import { Plus, Link2, Search } from 'lucide-react';
import { SavedLink } from '../types';
import { LinkCard } from './LinkCard';

interface LinkListProps {
  links: SavedLink[];
  totalCount: number;
  searchQuery: string;
  selectedIndex: number;
  onSelectLink: (index: number) => void;
  onEditLink: (link: SavedLink) => void;
  onDeleteLink: (id: string) => void;
  onCopyLink: (link: SavedLink) => void;
  onPasteLink: (link: SavedLink) => void;
  onTogglePin: (id: string) => void;
  onTagClick: (tag: string) => void;
  onAddClick: () => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
}

const CATEGORIES = ['All', 'Work', 'Social', 'Shopping', 'Entertainment', 'Other'];

export function LinkList({
  links,
  totalCount,
  searchQuery,
  selectedIndex,
  onSelectLink,
  onEditLink,
  onDeleteLink,
  onCopyLink,
  onPasteLink,
  onTogglePin,
  onTagClick,
  onAddClick,
  categoryFilter,
  onCategoryChange,
}: LinkListProps) {
  if (links.length === 0 && !searchQuery && !categoryFilter) {
    return (
      <div role="status" aria-label="No links" className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-dim/20 border border-accent/20 flex items-center justify-center text-accent mb-3">
          <Link2 size={22} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-primary mb-1">No links saved</h3>
        <p className="text-xs text-muted mb-4 max-w-[220px]">
          Save links you use frequently — copy and paste them instantly anywhere.
        </p>
        <button
          onClick={onAddClick}
          aria-label="Add your first link"
          className="px-3.5 py-1.5 rounded-lg bg-accent text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-[opacity,transform] shadow-md shadow-accent/10 flex items-center gap-2"
        >
          <span>+ Add your first link</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 border border-black/20 text-background font-sans font-medium leading-none shadow-sm">Ctrl+N</kbd>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Category filter pills */}
      <div className="flex items-center gap-1 mb-2 shrink-0 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onCategoryChange(cat === 'All' ? '' : cat); onSelectLink(0); }}
            className={`text-[10px] font-semibold px-2 py-1 rounded transition-all whitespace-nowrap ${
              (cat === 'All' && !categoryFilter) || categoryFilter === cat
                ? 'text-accent bg-accent-dim/15'
                : 'text-muted hover:text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {searchQuery && (
        <div className="flex items-center gap-1.5 px-1 mb-2 text-[10px] text-muted shrink-0">
          <Search size={10} aria-hidden="true" />
          <span>{links.length} of {totalCount} links</span>
        </div>
      )}

      <div role="listbox" aria-label="Links" className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
        {links.map((link, idx) => (
          <LinkCard
            key={link.id}
            link={link}
            isSelected={idx === selectedIndex}
            onSelect={() => onSelectLink(idx)}
            onEdit={() => onEditLink(link)}
            onDelete={() => onDeleteLink(link.id)}
            onCopy={() => onCopyLink(link)}
            onPaste={() => onPasteLink(link)}
            onTogglePin={() => onTogglePin(link.id)}
            onTagClick={onTagClick}
          />
        ))}
      </div>
      <button
        onClick={onAddClick}
        aria-label="Add new link"
        className="shrink-0 w-full flex items-center justify-center gap-2 py-2 mt-1.5 text-muted hover:text-accent text-xs font-semibold transition-colors duration-100 focus:outline-none focus:ring-1 focus:ring-accent rounded"
      >
        <Plus size={13} aria-hidden="true" />
        <span>Add Link</span>
        <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Ctrl+N</kbd>
      </button>
    </div>
  );
}
