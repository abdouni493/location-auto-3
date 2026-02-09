
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  lang: Language;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmLabel, cancelLabel, variant = 'danger', lang
}) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
          >
            <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center ${
              variant === 'danger' ? 'bg-rose-50 text-rose-600' : 
              variant === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <AlertTriangle size={32} />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 font-bold mb-8 leading-relaxed">{message}</p>
            
            <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all"
              >
                {cancelLabel || t('cancel')}
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={`flex-[1.5] py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  variant === 'danger' ? 'bg-rose-600 shadow-rose-100' : 
                  variant === 'warning' ? 'bg-amber-600 shadow-amber-100' : 'bg-blue-600 shadow-blue-100'
                }`}
              >
                <Check size={18} strokeWidth={3} />
                {confirmLabel || t('confirm')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
