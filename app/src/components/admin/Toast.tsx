import { useEffect } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

type ToastProps = {
  message: string;
  onClose: () => void;
  duration?: number;
  variant?: ToastVariant;
};

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-[#404040] text-white',
};

const Toast = ({ message, onClose, duration = 3200, variant = 'info' }: ToastProps) => {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg ${variantStyles[variant]}`}>
      {message}
    </div>
  );
};

export default Toast;
