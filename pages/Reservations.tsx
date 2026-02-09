import React, { useState, useMemo, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Reservation, ReservationStatus, UserSession, Property } from '../types';
import { 
  Search, Filter, MoreVertical, Calendar, User, Car, 
  Plus, Eye, Trash2, X, Play, LogOut, Check, Info, Clock, Archive, ShieldCheck, History, MoreHorizontal,
  Banknote, Wrench, ShieldAlert, Lock, RotateCcw, AlertTriangle, AlertCircle, FileText, ChevronRight, MapPin, Wallet,
  CheckCircle, FileCheck, ArrowRightLeft, CreditCard, Printer, Gauge, Fuel, Edit3, FileSpreadsheet, Ban, CheckSquare,
  Landmark, Receipt, TrendingUp, Sparkles, ArrowUpRight, Activity, Zap, Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReservationWizard from '../components/ReservationWizard';
import Pagination from '../components/Pagination';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useApp } from '../App';
import { useDebounce } from '../hooks/useDebounce';
import { usePersistentFilters } from '../hooks/usePersistentFilters';
import { TableSkeleton } from '../components/Skeleton';
import { supabase } from '../supabase';

const ITEMS_PER_PAGE = 8;

interface ReservationFilters {
  search: string;
  status: ReservationStatus | 'All';
  vehicleId: string;
}

const initialFilters: ReservationFilters = {
  search: '',
  status: 'All',
  vehicleId: ''
};

const getStatusStyle = (status: ReservationStatus) => {
  switch (status) {
    case 'Completed': return 'bg-emerald-500 text-white';
    case 'Pending': return 'bg-amber-500 text-white';
    case 'Confirmed': return 'bg-blue-600 text-white';
    case 'Activated':
    case 'Ongoing': return 'bg-slate-900 text-white';
    case 'Archived': return 'bg-slate-400 text-white';
    default: return 'bg-slate-200 text-slate-600';
  }
};

const calculateDays = (start: string, end: string) => {
  const s = new Date(start.split(' ')[0]);
  const e = new Date(end.split(' ')[0]);
  const diffTime = Math.abs(e.getTime() - s.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
};

const Reservations: React.FC<{ lang: Language, user: UserSession }> = ({ lang, user }) => {
  const { showToast, reservations, properties, refreshData, deleteReservationSafely } = useApp();
  const t = (key: string) => TRANSLATIONS[key.toLowerCase()]?.[lang] || key;
  const isRtl = lang === 'ar';
  
  const [filters, setFilters, resetFilters] = usePersistentFilters<ReservationFilters>(user, 'reservations', initialFilters);
  const debouncedSearch = useDebounce(filters.search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState<Reservation | boolean>(false);
  const [loading, setLoading] = useState(true);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const matchesSearch = res.clientName.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                            res.resNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            res.vehicleName.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = filters.status === 'All' || res.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [debouncedSearch, filters, reservations]);

  const paginatedReservations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReservations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReservations, currentPage]);

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 px-1 no-print">
        <div className="space-y-2">
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none">{isRtl ? 'إدارة' : 'Flux'} <span className="text-gradient">{isRtl ? 'الحجوزات' : 'Opérationnel'}</span></h1>
          <p className="text-slate-500 font-bold text-xl leading-tight">{isRtl ? 'نظرة عامة على الأسطول والنشاط.' : 'Orchestration complète de vos contrats et locations.'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group min-w-[340px]">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"><Search size={24}/></div>
            <input 
              type="text" placeholder={isRtl ? "بحث..." : "Chercher contrat, client, voiture..."} 
              className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-lg text-slate-900 outline-none focus:border-blue-500 transition-all shadow-xl shadow-slate-200/20"
              value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowWizard(true)} 
            className="flex items-center justify-center gap-4 bg-slate-900 text-white px-12 py-[22px] rounded-2xl font-black shadow-2xl transition-all uppercase text-xs tracking-widest"
          >
            <Plus size={24} strokeWidth={3} />
            <span>Nouveau dossier</span>
          </motion.button>
        </div>
      </header>

      {loading ? <TableSkeleton /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10 px-1 no-print">
          <AnimatePresence mode="popLayout">
            {paginatedReservations.length ? paginatedReservations.map((res) => {
              const car = properties.find(p => p.id === res.vehicleId);
              const remaining = res.totalAmount - res.paidAmount;
              const paymentPercent = (res.paidAmount / res.totalAmount) * 100;
              const days = calculateDays(res.startDate, res.endDate);

              return (
                <motion.div 
                  layout key={res.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-white rounded-[4rem] border border-slate-100 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.06)] hover:shadow-2xl transition-all duration-500 relative flex flex-col h-[680px] overflow-hidden"
                >
                  <div className="relative h-64 shrink-0 overflow-hidden">
                    <img src={car?.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] ease-out" alt={res.vehicleName} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80" />
                    
                    <div className="absolute top-8 left-8">
                       <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl border border-white/20 ${getStatusStyle(res.status)}`}>
                         {t(`status${res.status.toLowerCase()}`)}
                       </span>
                    </div>

                    <div className="absolute top-8 right-8 z-[60]">
                      <button 
                        onClick={() => setActiveMenu(activeMenu === res.id ? null : res.id)}
                        className={`p-3.5 backdrop-blur-2xl rounded-2xl transition-all border border-white/20 ${activeMenu === res.id ? 'bg-white text-slate-900 shadow-2xl' : 'bg-white/10 text-white hover:bg-white hover:text-slate-900'}`}
                      >
                        <MoreVertical size={22} />
                      </button>
                      <AnimatePresence>
                        {activeMenu === res.id && (
                          <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-4 w-64 bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-3xl border border-slate-100 p-2 z-[100] overflow-hidden`}>
                            <MenuAction icon={Eye} label="Dossier Complet" iconClassName="text-blue-500" onClick={() => setActiveMenu(null)} />
                            <MenuAction icon={Edit3} label="Éditer" iconClassName="text-amber-500" onClick={() => { setShowWizard(res); setActiveMenu(null); }} />
                            <div className="h-px bg-slate-100 my-2 mx-4" />
                            <MenuAction icon={Trash2} label="Supprimer" variant="danger" onClick={() => { setReservationToDelete(res); setActiveMenu(null); }} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="absolute bottom-10 left-10 right-10">
                      <h3 className="text-white font-black text-3xl tracking-tighter truncate leading-none">{res.vehicleName}</h3>
                      <div className="flex items-center gap-3 mt-4">
                        <span className="px-4 py-1.5 bg-blue-500/20 backdrop-blur-xl rounded-xl text-[10px] font-black text-blue-200 uppercase tracking-widest border border-blue-400/30">{car?.plate || 'TRANSIT'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-10 space-y-10 flex-1 flex flex-col bg-white">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-xl">{res.clientName[0]}</div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 leading-none tracking-tight">{res.clientName}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">{res.resNumber}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10 py-8 border-y border-slate-50 relative">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DÉPART</p>
                          <p className="text-base font-black text-slate-900">{res.startDate.split(' ')[0]}</p>
                       </div>
                       <div className="space-y-2 text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">RETOUR</p>
                          <p className="text-base font-black text-slate-900">{res.endDate.split(' ')[0]}</p>
                       </div>
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm text-slate-300">
                          <ChevronRight size={16} />
                       </div>
                    </div>

                    <div className="mt-auto space-y-6">
                       <div className="flex items-end justify-between">
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valeur du dossier</p>
                             <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">{res.totalAmount.toLocaleString()}</span>
                                <span className="text-xs font-black text-blue-500 uppercase">DA</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                                <Calendar size={14} className="text-slate-400" />
                                <span className="text-[11px] font-black text-slate-800">{days} {isRtl ? 'أيام' : 'Jours'}</span>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                             <span className="text-slate-400">Paiement : {Math.round(paymentPercent)}%</span>
                             <span className={remaining > 0 ? "text-amber-600" : "text-emerald-600"}>Solde: {remaining.toLocaleString()} DA</span>
                          </div>
                          <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50 shadow-inner p-[2px]">
                             <motion.div initial={{ width: 0 }} animate={{ width: `${paymentPercent}%` }} className={`h-full rounded-full ${remaining > 0 ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`} />
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="col-span-full py-32 text-center">
                 <div className="w-28 h-28 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 text-slate-200 border-2 border-dashed border-slate-200"><Calendar size={56} /></div>
                 <p className="text-slate-400 font-black uppercase text-sm tracking-[0.4em]">{isRtl ? 'لا توجد حجوزات' : 'Aucun dossier actif'}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      <Pagination currentPage={currentPage} totalItems={filteredReservations.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} lang={lang} />
      {showWizard && <ReservationWizard lang={lang} onClose={() => setShowWizard(false)} initialReservation={typeof showWizard === 'object' ? showWizard : null} />}
      <ConfirmationDialog isOpen={!!reservationToDelete} onClose={() => setReservationToDelete(null)} onConfirm={() => deleteReservationSafely(reservationToDelete!.id)} title="Action Irréversible" message="Supprimer définitivement ce dossier Cloud ?" lang={lang} />
    </div>
  );
};

const MenuAction = ({ icon: Icon, label, variant = 'default', onClick, iconClassName = "" }: any) => (
  <motion.button whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }} onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-[18px] font-black text-[11px] uppercase tracking-widest transition-all rounded-[1.75rem] mb-1 last:mb-0 ${variant === 'danger' ? 'text-rose-500 bg-rose-50/30' : 'text-slate-600 hover:bg-slate-50'}`}>
    <div className={`shrink-0 ${iconClassName}`}><Icon size={18} strokeWidth={2.5} /></div>{label}
  </motion.button>
);

export default Reservations;