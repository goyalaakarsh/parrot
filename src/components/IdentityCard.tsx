import { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, AlertCircle, Star, Copy, User } from 'lucide-react';
import { Identity, IdentityField } from '../types';

interface IdentityCardProps {
  identity: Identity;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyField: (value: string) => void;
  onCopyBlock: () => void;
  onTogglePin: () => void;
}

export function IdentityCard({
  identity,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onCopyField,
  onCopyBlock,
  onTogglePin,
}: IdentityCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  useEffect(() => {
    if (!isSelected) {
      setIsDeleting(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
        return;
      }

      if (isDeleting) {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          onDelete();
          setIsDeleting(false);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          setIsDeleting(false);
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          e.stopPropagation();
          cancelRef.current?.focus();
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          e.stopPropagation();
          deleteRef.current?.focus();
          return;
        }
      } else {
        if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
        } else if (
          e.key === 'Delete' || 
          (e.key === 'd' && (e.ctrlKey || e.metaKey))
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          setIsDeleting(true);
        } else if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          e.stopPropagation();
          onCopyBlock();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isSelected, isDeleting, onEdit, onDelete, onCopyBlock]);

  useEffect(() => {
    if (isDeleting && deleteRef.current) {
      deleteRef.current.focus();
    }
  }, [isDeleting]);

  useEffect(() => {
    if (copiedFieldId) {
      const timer = setTimeout(() => setCopiedFieldId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [copiedFieldId]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setIsDeleting(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(false);
  };

  const handleCardClick = () => {
    if (isDeleting) return;
    onSelect();
  };

  const handleFieldClick = (e: React.MouseEvent, field: IdentityField) => {
    e.stopPropagation();
    onCopyField(field.value);
    setCopiedFieldId(field.id);
  };

  return (
    <div
      ref={cardRef}
      role="option"
      aria-selected={isSelected}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (isDeleting) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`relative group w-full flex flex-col p-3 rounded-md border text-left cursor-pointer transition-[border-color,background-color] duration-100 ${
        isSelected
          ? 'border-accent bg-accent-dim/15'
          : 'border-transparent bg-surface hover:border-border'
      }`}
    >
      {isDeleting ? (
        <div className="flex flex-col gap-2 w-full animate-slide-up">
          <div className="flex items-center gap-1.5 text-danger text-xs font-semibold">
            <AlertCircle size={14} aria-hidden="true" />
            <span>Delete this identity?</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              ref={cancelRef}
              onClick={handleCancelDelete}
              className="px-2 py-1 text-xs rounded bg-surface-hover border border-border text-muted hover:text-primary transition-all"
            >
              Cancel
            </button>
            <button
              ref={deleteRef}
              onClick={handleConfirmDelete}
              className="px-2 py-1 text-xs rounded bg-danger/20 border border-danger/30 text-danger hover:bg-danger/30 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin();
              }}
              aria-label={identity.pinned ? 'Unpin' : 'Pin to top'}
              className={`shrink-0 mt-0.5 p-0.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-accent ${
                identity.pinned
                  ? 'opacity-100 text-yellow-500'
                  : 'opacity-40 hover:opacity-100 text-muted hover:text-yellow-500'
              }`}
            >
              <Star
                size={13}
                aria-hidden="true"
                className={identity.pinned ? 'fill-yellow-500 text-yellow-500' : ''}
              />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <User size={13} className="text-muted shrink-0" />
                <p className="text-xs font-medium text-primary truncate">
                  {identity.name}
                </p>
              </div>
            </div>
          </div>

          {/* Fields list */}
          <div className="mt-2 space-y-1">
            {identity.fields.slice(0, isSelected ? undefined : 3).map((field) => (
              <button
                key={field.id}
                onClick={(e) => handleFieldClick(e, field)}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-left transition-all ${
                  copiedFieldId === field.id
                    ? 'bg-accent/20 border border-accent/30'
                    : 'bg-surface-hover border border-transparent hover:border-border'
                }`}
              >
                <span className="text-[10px] text-muted font-medium">{field.label}</span>
                <span className="text-[10px] text-primary truncate max-w-[150px]">
                  {field.value || '—'}
                </span>
              </button>
            ))}
            {!isSelected && identity.fields.length > 3 && (
              <span className="text-[9px] text-muted px-2">+{identity.fields.length - 3} more fields</span>
            )}
          </div>

          <div className={`flex items-center justify-end gap-1 w-full min-w-0 transition-[height,opacity,margin,padding] duration-100 ${
            isSelected 
              ? 'h-6 opacity-100 mt-2.5 pt-0.5' 
              : 'h-0 opacity-0 group-hover:h-6 group-hover:opacity-100 group-hover:mt-2.5 group-hover:pt-0.5 overflow-hidden'
          }`}>
            <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyBlock();
                }}
                aria-label="Copy All Fields (Ctrl+B)"
                tabIndex={isSelected ? 0 : -1}
                className="shrink-0 p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <Copy size={13} aria-hidden="true" />
                <span className="text-[10px] font-medium">Block</span>
                {isSelected && <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Ctrl+B</kbd>}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                aria-label="Edit (Ctrl+E)"
                tabIndex={isSelected ? 0 : -1}
                className="shrink-0 p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <Edit2 size={13} aria-hidden="true" />
                {isSelected && <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Ctrl+E</kbd>}
              </button>
              <button
                onClick={handleDeleteClick}
                aria-label="Delete (Delete)"
                tabIndex={isSelected ? 0 : -1}
                className="shrink-0 p-1 rounded text-muted hover:text-danger hover:bg-surface-hover transition-all flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <Trash2 size={13} aria-hidden="true" />
                {isSelected && <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Delete</kbd>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
