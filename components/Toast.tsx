
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-800', iconColor: 'text-emerald-500' },
    error: { icon: AlertCircle, bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-800', iconColor: 'text-rose-500' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800', iconColor: 'text-blue-500' }
  };

  const { icon: Icon, bg, border, text, iconColor } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border ${bg} ${border} ${text} min-w-[320px]`}
    >
      <Icon className={iconColor} size={24} />
      <p className="flex-1 font-black text-sm">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default Toast;
