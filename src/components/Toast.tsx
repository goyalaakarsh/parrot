import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[340px] animate-slide-up">
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
