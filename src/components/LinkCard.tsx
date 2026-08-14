import { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Clipboard, CornerDownLeft, AlertCircle, Star, Globe } from 'lucide-react';
import { SavedLink } from '../types';

interface LinkCardProps {
  link: SavedLink;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onTogglePin: () => void;
  onTagClick: (tag: string) => void;
}

export function LinkCard({
  link,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onCopy,
  onPaste,
  onTogglePin,
  onTagClick,
}: LinkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isSelected, isDeleting, onEdit, onDelete]);

  useEffect(() => {
    if (isDeleting && deleteRef.current) {
      deleteRef.current.focus();
    }
  }, [isDeleting]);

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
    onPaste();
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
            <span>Delete this link?</span>
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
              aria-label={link.pinned ? 'Unpin' : 'Pin to top'}
              className={`shrink-0 mt-0.5 p-0.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-accent ${
                link.pinned
                  ? 'opacity-100 text-yellow-500'
                  : 'opacity-40 hover:opacity-100 text-muted hover:text-yellow-500'
              }`}
            >
              <Star
                size={13}
                aria-hidden="true"
                className={link.pinned ? 'fill-yellow-500 text-yellow-500' : ''}
              />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {link.faviconUrl ? (
                  <img
                    src={link.faviconUrl}
                    alt=""
                    className="w-3.5 h-3.5 rounded-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe size={13} className="text-muted shrink-0" />
                )}
                <p className={`text-xs font-medium text-primary truncate ${isSelected ? '' : ''}`}>
                  {link.title}
                </p>
              </div>
              <p className="text-[10px] text-muted truncate mt-0.5">
                {link.url.length > 50 ? `${link.url.substring(0, 50)}…` : link.url}
              </p>
              {link.description && (
                <p className={`text-[10px] text-muted mt-1 ${isSelected ? 'line-clamp-3' : 'line-clamp-1'}`}>
                  {link.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {link.category && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-accent-dim/20 border border-accent/20 text-accent font-medium">
                {link.category}
              </span>
            )}
            {link.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
                className="px-1.5 py-0.5 rounded text-[9px] bg-surface-hover border border-border text-muted font-medium hover:text-accent hover:border-accent/30 transition-all"
              >
                #{tag}
              </button>
            ))}
            {link.tags.length > 3 && (
              <span className="text-[9px] text-muted">+{link.tags.length - 3}</span>
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
                  onCopy();
                }}
                aria-label="Copy URL (Shift+Enter)"
                tabIndex={isSelected ? 0 : -1}
                className="shrink-0 p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <Clipboard size={13} aria-hidden="true" />
                {isSelected && <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Shift+Enter</kbd>}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPaste();
                }}
                aria-label="Paste URL (Enter)"
                tabIndex={isSelected ? 0 : -1}
                className="shrink-0 p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <CornerDownLeft size={13} aria-hidden="true" />
                {isSelected && <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Enter</kbd>}
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
