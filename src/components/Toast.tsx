import { useEffect, useRef, useCallback } from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => {
      onClose();
    }, 2000);
  }, [onClose]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [startTimer, message]);

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleMouseLeave = () => {
    startTimer();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-auto shrink-0"
    >
      <div className={`px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md flex items-center gap-1.5 text-xs font-medium whitespace-nowrap transition-all select-none ${
        type === 'error' 
          ? 'bg-surface/95 border-danger/40 text-primary shadow-danger/10' 
          : 'bg-surface/95 border-accent/40 text-primary shadow-accent/10'
      }`}>
        {type === 'error' ? (
          <AlertCircle size={13} className="text-danger shrink-0" aria-hidden="true" />
        ) : (
          <Check size={13} className="text-accent shrink-0" aria-hidden="true" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}
