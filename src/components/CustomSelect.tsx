import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  value: string | number;
  options: Option[];
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

export function CustomSelect({
  id,
  value,
  options,
  onChange,
  placeholder = 'Select option',
  className = '',
  'aria-label': ariaLabel,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full px-3 py-1.5 text-[13px] rounded-md bg-surface border border-border text-primary flex items-center justify-between gap-2 hover:border-accent/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-[border-color,box-shadow] select-none cursor-pointer"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="text-muted">{placeholder}</span>}
        </span>
        <ChevronDown
          size={14}
          className={`text-muted shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-accent' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md bg-surface border border-border shadow-lg animate-slide-up p-1 space-y-0.5"
        >
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <div
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-accent-dim/30 text-accent font-semibold'
                    : 'text-primary hover:bg-surface-hover'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={13} className="text-accent shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
