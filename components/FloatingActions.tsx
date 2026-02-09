
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, LucideIcon } from 'lucide-react';

interface ActionItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionsProps {
  actions: ActionItem[];
}

const FloatingActions: React.FC<FloatingActionsProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden fixed bottom-28 right-6 z-[100] flex flex-col items-end gap-5">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-4 mb-2">
            {actions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ delay: (actions.length - index) * 0.05, type: 'spring' }}
                onClick={() => { action.onClick(); setIsOpen(false); }}
                className="flex items-center gap-4 px-6 py-4 bg-white rounded-[1.75rem] shadow-[0_15px_30px_rgba(0,0,0,0.1)] border border-slate-100 active:scale-95 transition-all"
              >
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">{action.label}</span>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${action.color || 'bg-aurora text-white shadow-blue-100'}`}>
                  <action.icon size={22} strokeWidth={2.5} />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{ rotate: isOpen ? 45 : 0 }}
        whileTap={{ scale: 0.9 }}
        className="w-16 h-16 bg-slate-900 text-white rounded-[1.75rem] shadow-2xl flex items-center justify-center z-[110] active:scale-90 transition-all border border-white/10"
      >
        {isOpen ? <X size={32} strokeWidth={3} /> : <Plus size={32} strokeWidth={3} />}
      </motion.button>
    </div>
  );
};

export default FloatingActions;
