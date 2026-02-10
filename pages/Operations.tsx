
import React, { useState, useMemo, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Inspection, Damage, UserSession } from '../types';
import { 
  ClipboardList, ShieldAlert, Plus, Filter, 
  Eye, Trash2, Edit2, Car, MapPin, CheckCircle2, 
  AlertTriangle, History, Calendar, User, Banknote, Clock, ArrowRight, PenTool, CheckCircle,
  MoreHorizontal, ChevronRight, Settings2, X, MoreVertical, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InspectionWizard from '../components/InspectionWizard';
import DamageForm from '../components/DamageForm';
import BottomSheet from '../components/BottomSheet';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useApp } from '../App';
import { usePersistentFilters } from '../hooks/usePersistentFilters';
import { useDebounce } from '../hooks/useDebounce';
import { TableSkeleton } from '../components/Skeleton';
import { supabase } from '../supabase';

interface OpFilters {
  search: string;
  type: string;
}

const initialFilters: OpFilters = {
  search: '',
  type: 'All'
};

const Operations: React.FC<{ lang: Language, user: UserSession }> = ({ lang, user }) => {
  const { 
    showToast, inspections, setInspections, damages, setDamages, 
    reservations, refreshData
  } = useApp();
  
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'inspections' | 'damages'>('inspections');
  const [filters, setFilters, resetFilters] = usePersistentFilters<OpFilters>(user, 'operations', initialFilters);
  const debouncedSearch = useDebounce(filters.search, 300);
  
  const [showInspectionWizard, setShowInspectionWizard] = useState(false);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [editingDamage, setEditingDamage] = useState<Damage | null>(null);

  const [viewingItem, setViewingItem] = useState<{item: any, type: 'ins' | 'dmg'} | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'ins' | 'dmg'} | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredInspections = useMemo(() => {
    return inspections.filter(i => {
      const matchesSearch = i.vehicleName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            i.clientName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            i.plate.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesType = filters.type === 'All' || i.type === filters.type;
      return matchesSearch && matchesType;
    });
  }, [debouncedSearch, filters, inspections]);

  const filteredDamages = useMemo(() => {
    return damages.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            d.vehicleName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            d.clientName.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesSearch;
    });
  }, [debouncedSearch, damages]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const table = itemToDelete.type === 'ins' ? 'inspections' : 'damages';
      const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id);
      if (error) throw error;
      showToast(itemToDelete.type === 'ins' ? "Inspection supprimée" : "Sinistre supprimé", "success");
      await refreshData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setItemToDelete(null);
    }
  };

  const markDamageAsRepaired = async (id: string) => {
    try {
      const { error } = await supabase.from('damages').update({ 
        status: 'Repaired', 
        repair_date: new Date().toISOString().split('T')[0] 
      }).eq('id', id);
      if (error) throw error;
      showToast("Dommage marqué comme réparé", "success");
      await refreshData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Light': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Severe': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none">Cycle <span className="text-gradient">Opérationnel</span></h1>
          <p className="text-slate-500 mt-1 font-bold text-base sm:text-lg leading-tight">Vérifications d'état et suivi sinistres.</p>
        </motion.div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(true)} className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm text-slate-600 flex items-center gap-2 font-black text-xs uppercase transition-all hover:bg-slate-50 hover:border-slate-200 active:scale-95"><Filter size={18} /><span>{t('filters')}</span></button>
          <button onClick={() => { if (activeTab === 'inspections') { setEditingInspection(null); setShowInspectionWizard(true); } else { setEditingDamage(null); setShowDamageForm(true); } }} className="bg-aurora text-white px-8 py-4 rounded-2xl font-black shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2"><Plus size={22} strokeWidth={3} /><span>Nouveau</span></button>
        </div>
      </header>

      <div className="flex items-center gap-2 bg-white p-2 rounded-[2.25rem] border border-slate-100 shadow-sm max-w-md">
        <button onClick={() => setActiveTab('inspections')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.75rem] font-black transition-all ${activeTab === 'inspections' ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'}`}><ClipboardList size={20} /><span>{t('inspections')}</span></button>
        <button onClick={() => setActiveTab('damages')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.75rem] font-black transition-all ${activeTab === 'damages' ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'}`}><ShieldAlert size={20} /><span>{t('damages')}</span></button>
      </div>

      {loading ? <TableSkeleton /> : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {activeTab === 'inspections' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredInspections.map(ins => (
                  <motion.div key={ins.id} layout className="group bg-white p-7 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-visible flex flex-col h-full hover:shadow-2xl transition-all duration-500">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3"><span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border-2 shadow-sm ${ins.type === 'Departure' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{t(ins.type.toLowerCase())}</span><div className="flex items-center gap-1.5 text-slate-400"><Calendar size={12} /><span className="text-[10px] font-black uppercase tracking-wider">{ins.date}</span></div></div>
                      <div className="relative z-[60]"><button onClick={() => setActiveMenu(activeMenu === ins.id ? null : ins.id)} className={`p-2.5 rounded-xl transition-all border ${activeMenu === ins.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:text-slate-900'}`}><MoreVertical size={18} /></button><AnimatePresence>{activeMenu === ins.id && (<motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-56 bg-white/95 backdrop-blur-2xl rounded-[2.25rem] shadow-3xl border border-slate-100 p-2 z-[100] overflow-hidden`}><MenuAction icon={Eye} label="Détails" iconClassName="text-emerald-500" onClick={() => { setViewingItem({item: ins, type: 'ins'}); setActiveMenu(null); }} /><MenuAction icon={Edit2} label="Modifier" iconClassName="text-blue-500" onClick={() => { setEditingInspection(ins); setShowInspectionWizard(true); setActiveMenu(null); }} /><div className="h-px bg-slate-100 my-1.5 mx-4" /><MenuAction icon={Trash2} label="Supprimer" variant="danger" onClick={() => { setItemToDelete({id: ins.id, type: 'ins'}); setActiveMenu(null); }} /></motion.div>)}</AnimatePresence></div>
                    </div>
                    <div className="mb-8"><h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-1">{ins.vehicleName}</h3><p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{ins.plate}</p></div>
                    <div className="grid grid-cols-2 gap-3 mb-8"><div className="p-4 bg-slate-50/80 rounded-[1.5rem] text-center border border-slate-100/50"><p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest leading-none">Kilométrage</p><p className="text-lg font-black text-slate-900 tracking-tighter">{ins.mileage.toLocaleString()} <span className="text-[10px] font-bold">KM</span></p></div><div className="p-4 bg-slate-50/80 rounded-[1.5rem] text-center border border-slate-100/50"><p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest leading-none">Carburant</p><p className="text-lg font-black text-slate-900 tracking-tighter">{ins.fuelLevel}</p></div></div>
                    <div className="mt-auto pt-6 border-t border-slate-50"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner shrink-0"><User size={18} /></div><div className="flex-1 overflow-hidden"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Locataire</p><p className="text-sm font-black text-slate-800 truncate leading-none">{ins.clientName}</p></div></div></div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredDamages.map(dmg => (
                  <motion.div key={dmg.id} layout className="group bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl relative overflow-visible flex flex-col h-full hover:shadow-2xl transition-all duration-500">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3"><span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border-2 shadow-sm ${getSeverityColor(dmg.severity)}`}>{dmg.severity}</span><span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-inner border border-slate-50 ${dmg.status === 'Repaired' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{dmg.status}</span></div>
                      <div className="relative z-[60]"><button onClick={() => setActiveMenu(activeMenu === dmg.id ? null : dmg.id)} className={`p-2.5 rounded-xl transition-all border ${activeMenu === dmg.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:text-slate-900'}`}><MoreVertical size={18} /></button><AnimatePresence>{activeMenu === dmg.id && (<motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-56 bg-white/95 backdrop-blur-2xl rounded-[2.25rem] shadow-3xl border border-slate-100 p-2 z-[100] overflow-hidden`}><MenuAction icon={Eye} label="Détails" iconClassName="text-emerald-500" onClick={() => { setViewingItem({item: dmg, type: 'dmg'}); setActiveMenu(null); }} /><MenuAction icon={Edit2} label="Modifier" iconClassName="text-blue-500" onClick={() => { setEditingDamage(dmg); setShowDamageForm(true); setActiveMenu(null); }} /><div className="h-px bg-slate-100 my-1.5 mx-4" /><MenuAction icon={Trash2} label="Supprimer" variant="danger" onClick={() => { setItemToDelete({id: dmg.id, type: 'dmg'}); setActiveMenu(null); }} /></motion.div>)}</AnimatePresence></div>
                    </div>
                    <div className="mb-6"><h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-2">{dmg.name}</h3><p className="text-sm font-bold text-slate-500 leading-relaxed line-clamp-2 italic">"{dmg.description}"</p></div>
                    <div className="space-y-4 mb-8"><div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-[1.75rem] border border-slate-100/50"><div className="flex items-center gap-3 text-slate-600"><Car size={18} className="text-blue-500" /> <span className="text-xs font-black uppercase tracking-tight">{dmg.vehicleName}</span></div><div className="flex items-center gap-3 text-slate-400"><Calendar size={16} /> <span className="text-[10px] font-bold">{dmg.createdAt}</span></div></div><div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-[1.75rem] border border-indigo-100/50"><div className="flex items-center gap-3 text-indigo-700"><User size={18} /> <span className="text-xs font-black uppercase tracking-widest truncate w-24">{dmg.clientName}</span></div><div className="flex items-center gap-2 text-indigo-700"><MapPin size={16} /> <span className="text-[10px] font-black uppercase">{dmg.position}</span></div></div><div className="p-6 bg-slate-900 rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10"><Banknote size={40} /></div><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Estimation frais</p><p className="text-2xl font-black text-emerald-400 tracking-tighter">{dmg.cost.toLocaleString()} <span className="text-xs font-bold text-slate-500">DA</span></p></div></div>
                    <div className="mt-auto pt-4 border-t border-slate-50"><div className="flex gap-2">{dmg.status === 'Pending' ? (<button onClick={() => markDamageAsRepaired(dmg.id)} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><CheckCircle size={16}/> Réparé</button>) : (<div className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Terminé le {dmg.repairDate}</div>)}</div></div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {viewingItem && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setViewingItem(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">{viewingItem.type === 'ins' ? <ClipboardList size={24} /> : <ShieldAlert size={24} />}</div><h3 className="text-xl font-black text-slate-900">Détails de l'élément</h3></div><button onClick={() => setViewingItem(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={20}/></button></div>
              <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-12">
                 <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Informations principales</p><div className="grid grid-cols-2 lg:grid-cols-4 gap-8"><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Véhicule</p><p className="font-black text-slate-800">{viewingItem.item.vehicleName}</p></div><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Client</p><p className="font-black text-slate-800">{viewingItem.item.clientName}</p></div><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</p><p className="font-black text-slate-800">{viewingItem.type === 'ins' ? viewingItem.item.date : viewingItem.item.createdAt}</p></div><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Référence</p><p className="font-black text-slate-800">#{viewingItem.item.id.slice(-6).toUpperCase()}</p></div></div></div>
                 
                 {viewingItem.type === 'ins' && (
                    <div className="space-y-8">
                       {/* PHOTO GALLERIES */}
                       {(viewingItem.item.exteriorPhotos?.length > 0 || viewingItem.item.interiorPhotos?.length > 0) && (
                         <div className="space-y-8">
                           <div className="flex items-center gap-3 border-b border-slate-100 pb-2"><Camera size={18} className="text-blue-500" /><p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Galerie Photos Inspection</p></div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {viewingItem.item.exteriorPhotos?.length > 0 && (
                                <div className="space-y-4">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Photos Extérieures ({viewingItem.item.exteriorPhotos.length})</p>
                                   <div className="grid grid-cols-2 gap-3">
                                      {viewingItem.item.exteriorPhotos.map((img: string, i: number) => (
                                        <div key={`ext-${i}`} className="aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-md"><img src={img} className="w-full h-full object-cover" alt="" /></div>
                                      ))}
                                   </div>
                                </div>
                              )}
                              {viewingItem.item.interiorPhotos?.length > 0 && (
                                <div className="space-y-4">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Photos Intérieures ({viewingItem.item.interiorPhotos.length})</p>
                                   <div className="grid grid-cols-2 gap-3">
                                      {viewingItem.item.interiorPhotos.map((img: string, i: number) => (
                                        <div key={`int-${i}`} className="aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-md"><img src={img} className="w-full h-full object-cover" alt="" /></div>
                                      ))}
                                   </div>
                                </div>
                              )}
                           </div>
                         </div>
                       )}

                       <div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Checklist État</p><div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{Object.entries(viewingItem.item.checklist).map(([key, val]: [string, any]) => (<div key={key} className={`flex items-center justify-between p-4 rounded-2xl border-2 ${val ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}><span className="text-[10px] font-black uppercase tracking-wider">{key}</span>{val ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}</div>))}</div></div>
                    </div>
                 )}
                 <div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Observations</p><div className="p-8 bg-white border-2 border-slate-100 rounded-[3rem] italic font-medium text-slate-600 leading-relaxed shadow-inner">{viewingItem.item.notes || viewingItem.item.description || "Aucune observation particulière renseignée."}</div></div>
                 {viewingItem.item.signature && (<div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Signature Validée</p><div className="bg-slate-50 rounded-[3rem] p-10 flex items-center justify-center border-2 border-dashed border-slate-200"><img src={viewingItem.item.signature} className="max-h-40 object-contain" alt="Signature" /></div></div>)}
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end"><button onClick={() => setViewingItem(null)} className="px-12 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Fermer</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationDialog isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleDelete} title="Désactivation Définitive" message="Êtes-vous certain de vouloir supprimer cet enregistrement ? Cette action effacera les données de l'historique opérationnel." lang={lang} />
      {showInspectionWizard && (<InspectionWizard lang={lang} onClose={() => { setShowInspectionWizard(false); setEditingInspection(null); setActiveMenu(null); }} initialInspection={editingInspection} />)}
      {showDamageForm && (<DamageForm lang={lang} onClose={() => { setShowDamageForm(false); setEditingDamage(null); setActiveMenu(null); }} editingDamage={editingDamage} />)}
      {showFilters && (<BottomSheet isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filtrage Avancé"><div className="space-y-8"><div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Recherche textuelle</label><div className="relative"><SearchWithIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} /><input type="text" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] outline-none font-bold focus:border-blue-500" placeholder="Marque, client, plaque..." /></div></div>{activeTab === 'inspections' && (<div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Type d'inspection</label><div className="grid grid-cols-3 gap-2">{['All', 'Departure', 'Return'].map(t => (<button key={t} onClick={() => setFilters({...filters, type: t})} className={`py-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${filters.type === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100 text-slate-400'}`}>{t === 'All' ? 'Tous' : t}</button>))}</div></div>)}<div className="grid grid-cols-2 gap-4 pt-4"><button onClick={resetFilters} className="py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Reset</button><button onClick={() => setShowFilters(false)} className="py-5 bg-aurora text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100">Appliquer</button></div></div></BottomSheet>)}
    </div>
  );
};

const MenuAction = ({ icon: Icon, label, variant = 'default', onClick, className = "", iconClassName = "" }: any) => (<motion.button whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }} onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-3.5 font-black text-[10px] uppercase tracking-widest transition-all rounded-2xl mb-1 last:mb-0 ${variant === 'danger' ? 'text-rose-500 bg-rose-50/30' : 'text-slate-600 hover:bg-slate-50'} ${className}`}><div className={`shrink-0 ${iconClassName}`}><Icon size={16} strokeWidth={2.5} /></div>{label}</motion.button>);
const SearchWithIcon = (props: any) => (<svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);

export default Operations;
