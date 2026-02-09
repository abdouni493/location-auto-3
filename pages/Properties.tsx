import React, { useState, useMemo, useRef } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Property, UserSession, Reservation, Maintenance } from '../types';
import { 
  Plus, LayoutGrid, List as ListIcon, 
  Fuel, Gauge, Settings2, MoreVertical, Edit2, Trash2, Filter, RotateCcw,
  Car, Eye, Image as ImageIcon, History, Banknote, ShieldCheck, 
  X, Camera, Calendar, TrendingUp, Wrench, Users, ShieldAlert,
  ArrowRight, CheckCircle2, AlertCircle, Hash, Info, Landmark, Clock, Zap, Upload,
  Receipt, ImageOff, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyForm from '../components/PropertyForm';
import ConfirmationDialog from '../components/ConfirmationDialog';
import LazyImage from '../components/LazyImage';
import Pagination from '../components/Pagination';
import { useApp } from '../App';
import { useDebounce } from '../hooks/useDebounce';
import { usePersistentFilters } from '../hooks/usePersistentFilters';
import { supabase } from '../supabase';

const ITEMS_PER_PAGE = 8;

interface PropertyFilters {
  search: string;
  brand: string;
  fuel: string;
  status: string;
}

const initialFilters: PropertyFilters = {
  search: '',
  brand: '',
  fuel: '',
  status: 'All'
};

const Properties: React.FC<{ lang: Language, user: UserSession }> = ({ lang, user }) => {
  const { properties, setProperties, showToast, reservations, maintenance, refreshData } = useApp();
  const [filters, setFilters, resetFilters] = usePersistentFilters<PropertyFilters>(user, 'properties', initialFilters);
  const debouncedSearch = useDebounce(filters.search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  const [showDetails, setShowDetails] = useState<Property | null>(null);
  const [showPhotos, setShowPhotos] = useState<Property | null>(null);
  const [showHistory, setShowHistory] = useState<Property | null>(null);
  const [showMaint, setShowMaint] = useState<Property | null>(null);
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isRtl = lang === 'ar';

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            p.plate?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            p.brand?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesBrand = !filters.brand || p.brand === filters.brand;
      const matchesFuel = !filters.fuel || p.fuel === filters.fuel;
      const matchesStatus = filters.status === 'All' || p.status === filters.status;
      return matchesSearch && matchesBrand && matchesFuel && matchesStatus;
    });
  }, [debouncedSearch, filters, properties]);

  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProperties.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProperties, currentPage]);

  const toggleAvailability = async (id: string) => {
    const prop = properties.find(p => p.id === id);
    if (!prop) return;
    const { error } = await supabase.from('vehicles').update({ availability: !prop.availability }).eq('id', id);
    if (error) {
      showToast(error.message, "error");
    } else {
      setProperties(prev => prev.map(p => p.id === id ? { ...p, availability: !p.availability } : p));
      showToast(isRtl ? "تم تحديث الحالة" : "Disponibilité mise à jour", "success");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', propertyToDelete.id);
      if (error) {
        showToast(error.message, "error");
      } else {
        showToast("Véhicule supprimé", "success");
        await refreshData();
      }
    } catch (err) {
      showToast("Erreur système", "error");
    } finally {
      setPropertyToDelete(null);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 px-1">
        <div className="space-y-2">
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none">
            {isRtl ? 'إدارة' : 'Parc'} <span className="text-gradient">{isRtl ? 'المركبات' : 'Automobile'}</span>
          </h1>
          <p className="text-slate-500 font-bold text-xl">{isRtl ? 'تحكم في أسطولك بأدوات احترافية.' : 'Pilotez votre inventaire avec une précision chirurgicale.'}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group min-w-[340px]">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"><Settings2 size={24}/></div>
            <input 
              type="text" placeholder={isRtl ? "ابحث عن ماركة، طراز، أو لوحة..." : "Rechercher..."} 
              className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-lg text-slate-900 outline-none focus:border-blue-500 transition-all shadow-xl shadow-slate-200/20"
              value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingProperty(null); setShowForm(true); }}
            className="bg-slate-900 text-white px-10 py-[22px] rounded-2xl font-black shadow-2xl flex items-center gap-4 transition-all uppercase text-xs tracking-widest"
          >
            <Plus size={24} strokeWidth={3} />
            <span>{t('addProperty')}</span>
          </motion.button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
        <AnimatePresence mode="popLayout">
          {paginatedProperties.map((prop) => (
            <motion.div 
              key={prop.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="group bg-white rounded-[3.5rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.05)] border border-slate-100 transition-all duration-500 relative flex flex-col h-[660px] z-10 hover:shadow-[0_40px_90px_-20px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              <div className="relative h-64 shrink-0 overflow-hidden">
                 {prop.image ? (
                   <LazyImage src={prop.image} alt={prop.title} className="w-full h-full group-hover:scale-110 transition-transform duration-[1.5s]" />
                 ) : (
                   <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-3 text-slate-400">
                      <ImageOff size={48} strokeWidth={1.5} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Image indisponible</span>
                   </div>
                 )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                
                <div className="absolute top-6 left-6">
                   <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border border-white/20 ${
                     prop.status === 'Rented' ? 'bg-rose-500 text-white' : 
                     prop.status === 'Maintenance' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                   }`}>
                     {t(`status${prop.status.toLowerCase()}`)}
                   </span>
                </div>

                <div className="absolute top-6 right-6 z-[60]">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === prop.id ? null : prop.id)}
                    className={`p-3 backdrop-blur-xl rounded-2xl transition-all shadow-2xl border border-white/20 group/btn ${activeMenu === prop.id ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white hover:text-slate-900'}`}
                  >
                    <MoreVertical size={22} />
                  </button>
                  
                  <AnimatePresence>
                    {activeMenu === prop.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-3 w-60 bg-white/95 backdrop-blur-3xl rounded-[2.25rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-slate-100 p-2 z-[100] overflow-hidden`}>
                        <MenuAction icon={Eye} label="Détails" iconClassName="text-blue-500" onClick={() => { setShowDetails(prop); setActiveMenu(null); }} />
                        <MenuAction icon={ImageIcon} label="Galerie" iconClassName="text-indigo-500" onClick={() => { setShowPhotos(prop); setActiveMenu(null); }} />
                        <MenuAction icon={Wrench} label="Entretien" iconClassName="text-rose-500" onClick={() => { setShowMaint(prop); setActiveMenu(null); }} />
                        <MenuAction icon={Edit2} label="Éditer" iconClassName="text-slate-900" onClick={() => { setEditingProperty(prop); setShowForm(true); setActiveMenu(null); }} />
                        <div className="h-px bg-slate-100 my-2 mx-4" />
                        <MenuAction icon={Trash2} label="Supprimer" variant="danger" onClick={() => { setPropertyToDelete(prop); setActiveMenu(null); }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="absolute bottom-8 left-8 right-8 text-white">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 group-hover:text-blue-300 transition-colors">{prop.brand}</p>
                   <h3 className="text-3xl font-black tracking-tighter leading-none mt-2 truncate">{prop.model}</h3>
                </div>
              </div>

              <div className="p-10 space-y-8 flex-1 flex flex-col bg-white">
                <div className="flex items-center justify-between">
                   <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[12px] uppercase tracking-widest border border-blue-100/50">{prop.plate}</div>
                   <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{prop.year}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{prop.transmission}</span>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                   <StatBox icon={Fuel} label="Carb." value={prop.fuel || 'N/A'} color="text-amber-500" />
                   <StatBox icon={Gauge} label="Kilométrage" value={`${(prop.mileage || 0).toLocaleString()}`} color="text-indigo-500" />
                   <StatBox icon={Users} label="Places" value={`${prop.seats || 5}`} color="text-emerald-500" />
                </div>

                <div className="bg-slate-50/50 p-6 rounded-[2.25rem] border border-slate-100 flex items-center gap-4">
                   <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 shrink-0"><Landmark size={18} /></div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Localisation</p>
                      <p className="text-sm font-black text-slate-700 truncate">{prop.address || 'Parc Principal'}</p>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-auto">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prix Journalier</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{prop.price.toLocaleString()}</span>
                        <span className="text-xs font-black text-blue-500 uppercase">DA</span>
                      </div>
                   </div>
                   <motion.div 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                      onClick={() => toggleAvailability(prop.id)}
                      className={`w-16 h-16 rounded-[1.75rem] flex flex-col items-center justify-center transition-all cursor-pointer shadow-xl ${prop.availability ? 'bg-emerald-500 text-white' : 'bg-rose-50 text-rose-400 border-2 border-rose-100 shadow-none'}`}
                   >
                      {prop.availability ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                   </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Pagination currentPage={currentPage} totalItems={filteredProperties.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} lang={lang} />

      <ConfirmationDialog 
        isOpen={!!propertyToDelete} onClose={() => setPropertyToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Désactivation Totale" message="Êtes-vous certain de vouloir retirer ce véhicule ? Cette action est irréversible et supprimera le dossier Cloud." lang={lang}
      />
      {showForm && <PropertyForm lang={lang} onClose={() => { setShowForm(false); setEditingProperty(null); }} editingProperty={editingProperty} />}
    </div>
  );
};

const MenuAction = ({ icon: Icon, label, variant = 'default', onClick, iconClassName = "" }: any) => (
  <motion.button 
    whileHover={{ scale: 1.02, x: 5 }} 
    whileTap={{ scale: 0.98 }} 
    onClick={onClick} 
    className={`w-full flex items-center gap-5 px-6 py-4 font-black text-[11px] uppercase tracking-widest transition-all rounded-[1.75rem] mb-1 last:mb-0 ${variant === 'danger' ? 'text-rose-500 bg-rose-50/30' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <div className={`shrink-0 ${iconClassName}`}><Icon size={18} strokeWidth={2.5} /></div>
    {label}
  </motion.button>
);

const StatBox = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-slate-50/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center group-hover:bg-white transition-all border border-transparent group-hover:border-slate-100">
    <Icon size={20} className={`${color} mb-2`} />
    <p className="text-[11px] font-black text-slate-900 truncate w-full">{value}</p>
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
  </div>
);

export default Properties;