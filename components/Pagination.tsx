
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  lang: 'fr' | 'ar';
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange, lang }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const isRtl = lang === 'ar';

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-3 rounded-xl bg-white border border-slate-100 text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
      >
        {isRtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      
      <div className="flex items-center gap-1">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i + 1)}
            className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
              currentPage === i + 1 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-50'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-3 rounded-xl bg-white border border-slate-100 text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
      >
        {isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </div>
  );
};

export default Pagination;
