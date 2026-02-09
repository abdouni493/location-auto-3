
import React, { useState, useMemo, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Expense, Maintenance, Property, UserSession } from '../types';
import { 
  Plus, Search, Wallet, Wrench, MoreVertical, 
  Trash2, Edit2, Calendar, Car, Filter, Info,
  X, Banknote, ShieldCheck, Gauge, Check, 
  ChevronRight, ArrowRight, Receipt, Activity, Settings2,
  FileText, Landmark, Clock, AlertTriangle, Eye, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../App';
import BottomSheet from '../components/BottomSheet';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { CardSkeleton } from '../components/Skeleton';
import { supabase } from '../supabase';

const Expenses: React.FC<{ lang: Language, user: UserSession }> = ({ lang, user }) => {
  const { properties, maintenance, expenses, showToast, refreshData } = useApp();
  
  const [activeTab, setActiveTab] = useState<'expenses' | 'maintenance'>('maintenance');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<{item: any, type: 'exp' | 'maint'} | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'exp' | 'maint'} | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isRtl = lang === 'ar';

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredExpenses = useMemo(() => 
    expenses.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || (e.category || '').toLowerCase().includes(search.toLowerCase()))
  , [expenses, search]);

  const filteredMaintenance = useMemo(() => 
    maintenance.filter(m => m.vehicleName.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase()))
  , [maintenance, search]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const table = itemToDelete.type === 'exp' ? 'expenses' : 'maintenance';
      const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id);
      if (error) throw error;
      
      showToast("Élément supprimé avec succès", "success");
      await refreshData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const renderExpenseCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <AnimatePresence mode="popLayout">
        {filteredExpenses.map(exp => (
          <motion.div 
            key={exp.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="group bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-500 relative flex flex-col h-full overflow-visible"
          >
            <div className="flex justify-between items-start mb-6">
               <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner">
                 <Wallet size={28} />
               </div>
               <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === exp.id ? null : exp.id)}
                    className={`p-3 rounded-2xl transition-all shadow-sm border ${activeMenu === exp.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 hover:text-slate-900'}`}
                  >
                    <MoreVertical size={20} />
                  </button>
                  <AnimatePresence>
                    {activeMenu === exp.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-slate-100 p-2 z-[100] overflow-hidden`}>
                         <MenuAction icon={Edit2} label="Modifier" iconClassName="text-blue-500" onClick={() => { setEditingItem({item: exp, type: 'exp'}); setShowForm(true); setActiveMenu(null); }} />
                         <div className="h-px bg-slate-50 my-2 mx-4" />
                         <MenuAction icon={Trash2} label="Supprimer" variant="danger" onClick={() => { setItemToDelete({id: exp.id, type: 'exp'}); setActiveMenu(null); }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
            <div className="space-y-1">
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg">{exp.category}</span>
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight pt-2">{exp.name}</h3>
            </div>
            {exp.notes && <p className="text-xs text-slate-400 italic mt-2 line-clamp-2">"{exp.notes}"</p>}
            <div className="mt-auto pt-6 flex justify-between items-end border-t border-slate-50">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Calendar size={18} /></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Date</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{exp.date}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Montant</p>
                  <p className="text-3xl font-black text-rose-600 tracking-tighter mt-1">{exp.cost.toLocaleString()} <span className="text-xs">DA</span></p>
               </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const renderMaintenanceCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <AnimatePresence mode="popLayout">
        {filteredMaintenance.map(maint => {
          const car = properties.find(p => p.id === maint.vehicleId);
          return (
            <motion.div 
              key={maint.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="group bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-500 relative flex flex-col h-full overflow-visible"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                      <Wrench size={28} />
                    </div>
                    <div>
                       <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none">{maint.vehicleName}</h4>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{car?.plate || 'Flotte'}</span>
                    </div>
                 </div>
                 <div className="relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === maint.id ? null : maint.id)}
                      className={`p-3 rounded-2xl transition-all shadow-sm border ${activeMenu === maint.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-900'}`}
                    >
                      <MoreVertical size={20} />
                    </button>
                    <AnimatePresence>
                      {activeMenu === maint.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-3 w-56 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-slate-100 p-2 z-[100] overflow-hidden`}>
                           <MenuAction icon={Edit2} label="Modifier" iconClassName="text-blue-500" onClick={() => { setEditingItem({item: maint, type: 'maint'}); setShowForm(true); setActiveMenu(null); }} />
                           <div className="h-px bg-slate-50 my-2 mx-4" />
                           <MenuAction icon={Trash2} label="Supprimer" variant="danger" onClick={() => { setItemToDelete({id: maint.id, type: 'maint'}); setActiveMenu(null); }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>
              <div className="space-y-4 flex-1">
                 <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">{maint.type}</span>
                 </div>
                 {maint.notes && <p className="text-sm font-medium text-slate-500 leading-relaxed italic border-l-4 border-slate-100 pl-4 py-1">"{maint.notes}"</p>}
              </div>
              <div className="mt-8 flex justify-between items-end border-t border-slate-50 pt-6">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Calendar size={18} /></div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Date</p>
                      <p className="text-sm font-bold text-slate-700 mt-1">{maint.date}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Coût</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter mt-1">{maint.cost.toLocaleString()} <span className="text-xs text-blue-500 uppercase">DA</span></p>
                 </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-1">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">Pilotage <span className="text-gradient">Financier</span></h1>
          <p className="text-slate-500 mt-2 font-bold text-lg leading-tight">Suivi rigoureux des dépenses agence et entretien du parc.</p>
        </motion.div>
        <div className="flex items-center gap-4">
          <button onClick={() => { setEditingItem(null); setShowForm(true); }} className="bg-aurora text-white px-10 py-5 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
            <Plus size={22} strokeWidth={3} />
            <span>Enregistrer {activeTab === 'expenses' ? 'Dépense' : 'Entretien'}</span>
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2 bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-2xl overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('maintenance')} className={`flex-1 flex items-center justify-center gap-4 px-8 py-5 rounded-[1.75rem] font-black transition-all whitespace-nowrap text-sm ${activeTab === 'maintenance' ? 'bg-slate-900 text-white shadow-2xl scale-[1.03]' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Wrench size={20} className={activeTab === 'maintenance' ? 'text-white' : 'text-blue-500'} strokeWidth={2.5} />
          <span>Entretien Flotte</span>
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`flex-1 flex items-center justify-center gap-4 px-8 py-5 rounded-[1.75rem] font-black transition-all whitespace-nowrap text-sm ${activeTab === 'expenses' ? 'bg-slate-900 text-white shadow-2xl scale-[1.03]' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Wallet size={20} className={activeTab === 'expenses' ? 'text-white' : 'text-rose-500'} strokeWidth={2.5} />
          <span>Moyens Généraux</span>
        </button>
      </div>

      <div className="relative group max-w-2xl px-1">
        <Search className={`absolute ${isRtl ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors`} size={24} />
        <input type="text" placeholder={activeTab === 'expenses' ? "Rechercher par nom, catégorie..." : "Rechercher par véhicule, type..."} value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full ${isRtl ? 'pr-16 pl-8' : 'pl-16 pr-8'} py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] font-black text-xl text-slate-900 outline-none focus:border-blue-500 transition-all shadow-xl shadow-slate-200/40`} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {loading ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div> : (activeTab === 'expenses' ? renderExpenseCards() : renderMaintenanceCards())}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <EntryForm 
            lang={lang} 
            activeTab={activeTab} 
            editingItem={editingItem}
            onClose={() => { setShowForm(false); setEditingItem(null); }}
            onSave={async (data: any) => {
              try {
                const table = activeTab === 'expenses' ? 'expenses' : 'maintenance';
                // CRITICAL: Map to exact DB column names (snake_case)
                const dbData = activeTab === 'expenses' ? {
                   name: data.name, 
                   category: data.category, 
                   cost: data.cost, 
                   date: data.date, 
                   notes: data.notes
                } : {
                   vehicle_id: data.vehicleId, 
                   type: data.type, 
                   cost: data.cost, 
                   date: data.date, 
                   notes: data.notes
                };

                const action = editingItem 
                  ? supabase.from(table).update(dbData).eq('id', editingItem.item.id)
                  : supabase.from(table).insert([dbData]);

                const { error } = await action;
                if (error) throw error;

                showToast("Opération réussie", "success");
                await refreshData();
                setShowForm(false);
                setEditingItem(null);
              } catch (err: any) {
                console.error("DB Save Error:", err);
                showToast(err.message, "error");
              }
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmationDialog isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleDelete} title="Suppression Définitive" message="Voulez-vous supprimer cet enregistrement ?" lang={lang} />
    </div>
  );
};

const EntryForm = ({ lang, activeTab, editingItem, onClose, onSave }: any) => {
  const { properties } = useApp();
  // Ensure we use 'type' for maintenance and 'category' for general expenses
  const [type, setType] = useState(editingItem?.item.type || editingItem?.item.category || (activeTab === 'maintenance' ? 'Vidange' : 'Infrastructure'));
  const [vehicleId, setVehicleId] = useState(editingItem?.item.vehicleId || '');
  const [name, setName] = useState(editingItem?.item.name || '');
  const [cost, setCost] = useState(editingItem?.item.cost?.toString() || '');
  const [date, setDate] = useState(editingItem?.item.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(editingItem?.item.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = activeTab === 'maintenance' 
    ? ['Vidange', 'Assurance', 'Contrôle technique', 'Pneumatique', 'Réparation', 'Autre']
    : ['Infrastructure', 'Services', 'Marketing', 'Frais Bancaires', 'Fournitures', 'Autre'];

  const handleSubmit = async () => {
    if (!cost || !date || (activeTab === 'maintenance' && !vehicleId)) return;
    setIsSubmitting(true);
    // Send standard object back to parent handler
    await onSave({ cost: parseFloat(cost), date, notes, type, category: type, vehicleId, name });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center shadow-xl ${activeTab === 'maintenance' ? 'bg-blue-600' : 'bg-rose-600'} text-white`}>
                 {activeTab === 'maintenance' ? <Wrench size={32} /> : <Wallet size={32} />}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{editingItem ? 'Modifier' : 'Nouveau'}</h2>
           </div>
           <button onClick={onClose} className="p-4 bg-white text-slate-400 rounded-2xl shadow-sm hover:bg-rose-50 transition-all"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 space-y-10">
           {activeTab === 'maintenance' && (
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Véhicule</label>
                 <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black outline-none focus:border-blue-500 transition-all appearance-none">
                    <option value="">-- Choisir --</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.brand} {p.model} ({p.plate})</option>)}
                 </select>
              </div>
           )}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type / Catégorie</label>
                 <select value={type} onChange={e => setType(e.target.value)} className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black outline-none focus:border-blue-500 transition-all appearance-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
              {activeTab === 'expenses' && <WizardInput label="Libellé" value={name} onChange={setName} icon={FileText} />}
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold outline-none focus:border-blue-500 transition-all" />
              </div>
           </div>
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (DA)</label>
              <div className="relative group">
                 <Banknote className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={28} />
                 <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="w-full pl-20 pr-8 py-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black text-4xl text-slate-900 outline-none focus:border-emerald-500 shadow-inner transition-all" placeholder="0" />
              </div>
           </div>
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Détails</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] outline-none font-bold h-32 resize-none focus:border-blue-500 transition-all" placeholder="..." />
           </div>
        </div>
        <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between gap-6">
           <button onClick={onClose} className="px-10 py-5 rounded-[1.75rem] font-black text-slate-500 bg-slate-50 hover:bg-slate-100 uppercase text-xs transition-all">Annuler</button>
           <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 max-w-sm bg-slate-900 text-white py-5 rounded-[1.75rem] font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 uppercase text-xs disabled:opacity-50">
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
              Enregistrer
           </button>
        </div>
      </motion.div>
    </div>
  );
};

const MenuAction = ({ icon: Icon, label, variant = 'default', onClick, iconClassName = "" }: any) => (
  <motion.button whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }} onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 font-black text-[10px] uppercase tracking-widest transition-all rounded-[1.5rem] mb-1 last:mb-0 ${variant === 'danger' ? 'text-rose-500 bg-rose-50/30' : 'text-slate-600 hover:bg-slate-50'}`}>
    <div className={`shrink-0 ${iconClassName}`}><Icon size={18} strokeWidth={2.5} /></div>{label}
  </motion.button>
);

const WizardInput = ({ label, icon: Icon, value, onChange }: any) => (
  <div className="space-y-4">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />}
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`w-full ${Icon ? 'pl-14' : 'px-6'} pr-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none font-bold text-slate-700 focus:border-blue-500 transition-all`} />
    </div>
  </div>
);

export default Expenses;
