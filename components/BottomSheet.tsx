
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
            <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">{title}</h3>
              <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
