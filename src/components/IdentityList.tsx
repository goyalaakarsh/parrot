import { Plus, Users, Search } from 'lucide-react';
import { Identity } from '../types';
import { IdentityCard } from './IdentityCard';

interface IdentityListProps {
  identities: Identity[];
  totalCount: number;
  searchQuery: string;
  selectedIndex: number;
  onSelectIdentity: (index: number) => void;
  onEditIdentity: (identity: Identity) => void;
  onDeleteIdentity: (id: string) => void;
  onCopyField: (value: string) => void;
  onCopyBlock: (identity: Identity) => void;
  onTogglePin: (id: string) => void;
  onAddClick: () => void;
}

export function IdentityList({
  identities,
  totalCount,
  searchQuery,
  selectedIndex,
  onSelectIdentity,
  onEditIdentity,
  onDeleteIdentity,
  onCopyField,
  onCopyBlock,
  onTogglePin,
  onAddClick,
}: IdentityListProps) {
  if (identities.length === 0 && !searchQuery) {
    return (
      <div role="status" aria-label="No identities" className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-dim/20 border border-accent/20 flex items-center justify-center text-accent mb-3">
          <Users size={22} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-primary mb-1">No identities saved</h3>
        <p className="text-xs text-muted mb-4 max-w-[220px]">
          Save your personal info — quickly copy fields or fill entire forms.
        </p>
        <button
          onClick={onAddClick}
          aria-label="Add your first identity"
          className="px-3.5 py-1.5 rounded-lg bg-accent text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-[opacity,transform] shadow-md shadow-accent/10 flex items-center gap-2"
        >
          <span>+ Add your first identity</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 border border-black/20 text-background font-sans font-medium leading-none shadow-sm">Ctrl+N</kbd>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {searchQuery && (
        <div className="flex items-center gap-1.5 px-1 mb-2 text-[10px] text-muted shrink-0">
          <Search size={10} aria-hidden="true" />
          <span>{identities.length} of {totalCount} identities</span>
        </div>
      )}

      <div role="listbox" aria-label="Identities" className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
        {identities.map((identity, idx) => (
          <IdentityCard
            key={identity.id}
            identity={identity}
            isSelected={idx === selectedIndex}
            onSelect={() => onSelectIdentity(idx)}
            onEdit={() => onEditIdentity(identity)}
            onDelete={() => onDeleteIdentity(identity.id)}
            onCopyField={onCopyField}
            onCopyBlock={() => onCopyBlock(identity)}
            onTogglePin={() => onTogglePin(identity.id)}
          />
        ))}
      </div>
      <button
        onClick={onAddClick}
        aria-label="Add new identity"
        className="shrink-0 w-full flex items-center justify-center gap-2 py-2 mt-1.5 text-muted hover:text-accent text-xs font-semibold transition-colors duration-100 focus:outline-none focus:ring-1 focus:ring-accent rounded"
      >
        <Plus size={13} aria-hidden="true" />
        <span>Add Identity</span>
        <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Ctrl+N</kbd>
      </button>
    </div>
  );
}
