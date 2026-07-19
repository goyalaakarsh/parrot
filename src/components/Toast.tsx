import { useEffect, useRef, useCallback } from 'react';

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
    }, 2500);
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
      role="alert"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[340px] animate-slide-up"
    >
      <div className={`px-4 py-2.5 rounded-lg border text-sm shadow-xl flex items-center gap-2 custom-blur-bg ${
        type === 'error' 
          ? 'border-danger/30 text-danger bg-danger/10' 
          : 'border-accent/30 text-accent bg-accent-dim/20'
      }`}>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}
