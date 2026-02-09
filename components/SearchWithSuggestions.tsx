
import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchWithSuggestionsProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  isRtl?: boolean;
}

const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({ 
  value, onChange, suggestions, placeholder, isRtl 
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions
    .filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
    .slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 group">
      <Search className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors`} size={20} />
      <input 
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        className={`w-full ${isRtl ? 'pr-14 pl-12' : 'pl-14 pr-12'} py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold shadow-sm`}
      />
      {value && (
        <button 
          onClick={() => onChange('')}
          className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400`}
        >
          <X size={16} />
        </button>
      )}

      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  onChange(suggestion);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-6 py-3 hover:bg-slate-50 font-bold text-slate-700 text-sm transition-colors border-b border-slate-50 last:border-0"
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchWithSuggestions;
