import { useState, useEffect } from 'react';
import { Edit2, Trash2, Clipboard, CornerDownLeft, AlertCircle } from 'lucide-react';
import { Prompt } from '../types';

interface PromptCardProps {
  prompt: Prompt;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onPaste: () => void;
}

export function PromptCard({
  prompt,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onCopy,
  onPaste,
}: PromptCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Keyboard shortcut listener for active prompt card
  useEffect(() => {
    if (!isSelected) {
      setIsDeleting(false); // Reset delete state if selection changes
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in inputs/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onEdit();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        setIsDeleting(true);
      } else if (e.key === 'Escape' && isDeleting) {
        e.preventDefault();
        e.stopPropagation();
        setIsDeleting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isDeleting, onEdit]);

  // Split text to separate title (1st line) and body description (subsequent lines)
  const lines = prompt.text.split('\n');
  const descriptionText = lines.slice(1).join('\n').trim();
  const truncatedDescription = isSelected
    ? (descriptionText.length > 500 ? `${descriptionText.substring(0, 500)}...` : descriptionText)
    : (descriptionText.length > 100 ? `${descriptionText.substring(0, 100)}...` : descriptionText);

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
    onSelect();
    onPaste();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative group w-full flex flex-col p-3 rounded-md border text-left cursor-pointer transition-all duration-100 ${
        isSelected
          ? 'border-accent bg-accent-dim/15'
          : 'border-transparent bg-surface hover:border-border'
      }`}
    >


      {isDeleting ? (
        <div className="flex flex-col gap-2 w-full animate-slide-up">
          <div className="flex items-center gap-1.5 text-danger text-xs font-semibold">
            <AlertCircle size={14} />
            <span>Delete this prompt?</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancelDelete}
              className="px-2 py-1 text-xs rounded bg-surface-hover border border-border text-muted hover:text-primary transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-2 py-1 text-xs rounded bg-danger/20 border border-danger/30 text-danger hover:bg-danger/30 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="w-full text-left">
            <span className={`text-[13px]  block ${prompt.title ? 'text-primary' : 'text-muted italic'}`}>
              {prompt.title || 'Untitled'}
            </span>
          </div>

          {descriptionText && (
            <p className={`text-xs text-muted mt-1 break-words whitespace-pre-line text-left ${
              isSelected ? 'line-clamp-5' : 'line-clamp-2'
            }`}>
              {truncatedDescription}
            </p>
          )}

          {prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-surface-hover border border-border text-muted font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons row (slides down and fades in on hover/selection) */}
          <div className={`flex items-center justify-end gap-1.5 w-full overflow-hidden transition-all duration-100 ${
            isSelected 
              ? 'h-6 opacity-100 mt-2.5 pt-0.5' 
              : 'h-0 opacity-0 group-hover:h-6 group-hover:opacity-100 group-hover:mt-2.5 group-hover:pt-0.5'
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              title="Copy (Shift+Enter)"
              className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all flex items-center gap-1 focus:outline-none"
            >
              <Clipboard size={13} />
              {isSelected && <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Shift+Enter</kbd>}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPaste();
              }}
              title="Auto-insert (Enter)"
              className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all flex items-center gap-1 focus:outline-none"
            >
              <CornerDownLeft size={13} />
              {isSelected && <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Enter</kbd>}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit (Ctrl+E)"
              className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all flex items-center gap-1 focus:outline-none"
            >
              <Edit2 size={13} />
              {isSelected && <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Ctrl+E</kbd>}
            </button>
            <button
              onClick={handleDeleteClick}
              title="Delete (Delete)"
              className="p-1 rounded text-muted hover:text-danger hover:bg-surface-hover transition-all flex items-center gap-1 focus:outline-none"
            >
              <Trash2 size={13} />
              {isSelected && <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Delete</kbd>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
