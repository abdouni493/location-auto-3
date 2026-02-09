import React, { useState, useMemo, useCallback } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Worker, WorkerRole, Advance, Absence } from '../types';
import { 
  Plus, Search, User, Phone, Mail, MapPin, 
  MoreVertical, Eye, Edit2, Trash2,
  Filter, CreditCard, Calendar, Briefcase, 
  Wallet, CalendarX, UserCog, ShieldCheck, AlertCircle,
  X, CheckCircle, ArrowRight, Banknote, Clock, FileText, UserCheck, IdCard, Loader2, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkerForm from '../components/WorkerForm';
import BottomSheet from '../components/BottomSheet';
import { useApp } from '../App';
import { supabase } from '../supabase';

const Workers: React.FC<{ lang: Language }> = ({ lang }) => {
  const { showToast, workers, setWorkers, refreshData } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<WorkerRole | 'All'>('All');
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Modal States
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null);
  const [advancesWorker, setAdvancesWorker] = useState<Worker | null>(null);
  const [absencesWorker, setAbsencesWorker] = useState<Worker | null>(null);

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isRtl = lang === 'ar';

  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchesSearch = w.fullName.toLowerCase().includes(search.toLowerCase()) || w.phone.includes(search);
      const matchesRole = roleFilter === 'All' || w.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [workers, search, roleFilter]);

  const handleReset = useCallback(async () => {
    setSearch('');
    setRoleFilter('All');
    setIsProcessing(true);
    await refreshData();
    setIsProcessing(false);
    showToast(isRtl ? "تم تحديث البيانات" : "Données actualisées depuis le Cloud", "info");
  }, [refreshData, isRtl, showToast]);

  const handleDelete = async (worker: Worker) => {
    if (worker.advances.length > 0) {
      setDeleteError(isRtl ? "تعذر الحذف: الموظف لديه تسبيقات معلقة." : "Impossible de supprimer : le collaborateur a des avances en cours.");
      setTimeout(() => setDeleteError(null), 4000);
      setActiveMenu(null);
      return;
    }
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('workers').delete().eq('id', worker.id);
      
      if (error) {
        if (error.code === '23503') {
           showToast(isRtl ? "هذا الموظف مرتبط ببيانات أخرى" : "Impossible: ce collaborateur est lié à d'autres données.", "error");
        } else {
           throw error;
        }
      } else {
        showToast(isRtl ? "تم حذف الموظف بنجاح" : "Collaborateur retiré du Cloud", "success");
        await refreshData();
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsProcessing(false);
      setActiveMenu(null);
    }
  };

  const updateWorkerExtras = async (workerId: string, updates: { advances?: Advance[], absences?: Absence[] }) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    const newAdvances = updates.advances || worker.advances;
    const newAbsences = updates.absences || worker.absences;

    const virtualStorage = {
      advances: newAdvances,
      absences: newAbsences,
      role: worker.role,
      paymentType: worker.paymentType
    };

    const hijackedAddress = `${worker.address || ''} ##RM_STORAGE##${JSON.stringify(virtualStorage)}`;

    try {
       const { error } = await supabase.from('workers').update({ address: hijackedAddress }).eq('id', workerId);
       if (error) throw error;
       await refreshData();
    } catch (err: any) {
       showToast(err.message, "error");
    }
  };

  const getRoleBadge = (role: WorkerRole) => {
    switch (role) {
      case 'Admin': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Driver': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Worker': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none">{isRtl ? 'إدارة' : 'Équipe'} <span className="text-gradient">{isRtl ? 'الموظفين' : 'Collaborateurs'}</span></h1>
          <p className="text-slate-500 mt-1 font-bold text-base sm:text-lg leading-tight">
            {lang === 'fr' ? 'Gérez les accès, la paie et le suivi de performance.' : 'إدارة الوصول والرواتب ومتابعة الأداء.'}
          </p>
        </motion.div>
        <div className="flex gap-3">
          <button 
            onClick={handleReset}
            disabled={isProcessing}
            className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-600 shadow-sm flex items-center justify-center transition-all hover:bg-slate-50 active:scale-95"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
          </button>
          <button 
            onClick={() => { setEditingWorker(null); setShowForm(true); }}
            className="bg-aurora text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-blue-100 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={22} strokeWidth={3} />
            {t('addWorker')}
          </button>
        </div>
      </header>

      <div className="relative group max-w-2xl px-1">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"><Search size={22}/></div>
        <input 
          type="text" placeholder={isRtl ? "ابحث عن اسم، وظيفة..." : "Rechercher par nom, rôle..."} 
          className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] font-black text-xl text-slate-900 outline-none focus:border-blue-500 transition-all shadow-xl shadow-slate-200/40"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <AnimatePresence>
        {deleteError && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600 shadow-xl mx-1">
            <AlertCircle size={24} />
            <p className="font-black text-sm">{deleteError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredWorkers.map((worker) => (
          <motion.div key={worker.id} layout className="group bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-500 relative flex flex-col h-full overflow-hidden">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-[2rem] bg-slate-50 text-slate-900 flex items-center justify-center text-3xl font-black shadow-inner border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                    {worker.fullName[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-white border border-slate-100 shadow-lg flex items-center justify-center text-emerald-500">
                    <UserCheck size={16} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 truncate max-w-[160px] tracking-tight leading-none">{worker.fullName}</h3>
                  <span className={`inline-block px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest mt-3 border-2 shadow-sm ${getRoleBadge(worker.role)}`}>
                    {t(worker.role.toLowerCase())}
                  </span>
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setActiveMenu(activeMenu === worker.id ? null : worker.id)}
                  className={`p-3 rounded-2xl transition-all shadow-sm border ${activeMenu === worker.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 hover:text-slate-900 border-slate-100'}`}
                >
                  <MoreVertical size={20} />
                </button>
                <AnimatePresence>
                  {activeMenu === worker.id && (
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-3 w-60 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-slate-100 p-2.5 z-50 overflow-hidden`}>
                      <MenuAction icon={Edit2} label={t('edit')} color="text-slate-600" onClick={() => { setEditingWorker(worker); setShowForm(true); setActiveMenu(null); }} />
                      <MenuAction icon={Banknote} label={isRtl ? 'التسبيقات' : 'Acomptes'} color="text-amber-600" onClick={() => { setAdvancesWorker(worker); setActiveMenu(null); }} />
                      <MenuAction icon={CalendarX} label={isRtl ? 'الغيابات' : 'Absences'} color="text-rose-600" onClick={() => { setAbsencesWorker(worker); setActiveMenu(null); }} />
                      <div className="h-px bg-slate-100 my-2 mx-4" />
                      <MenuAction icon={Trash2} label={t('delete')} color="text-rose-600 bg-rose-50" variant="danger" onClick={() => handleDelete(worker)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-4 pb-8 border-b border-slate-50 flex-1">
               <InfoRow icon={Phone} text={worker.phone} label="Mobile" />
               <InfoRow icon={Mail} text={worker.email} label="Email" />
               <InfoRow icon={MapPin} text={worker.address} label="Domicile" />
            </div>

            <div className="flex flex-col gap-4 mt-8">
               <div className="flex items-center justify-between px-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('salary')}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900 tracking-tighter">{worker.amount.toLocaleString()}</span>
                      <span className="text-xs font-black text-blue-500 uppercase">DA</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type Paie</p>
                    <p className="text-xs font-black text-slate-600 uppercase tracking-wider">{t(worker.paymentType.toLowerCase())}</p>
                  </div>
               </div>
               
               <div className="flex w-full mt-2">
                  <button 
                    onClick={() => setViewingWorker(worker)}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-[1.02] shadow-xl active:scale-95 transition-all"
                  >
                    <Eye size={20} /> Voir Dossier Complet
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {viewingWorker && <DetailsModal worker={viewingWorker} onClose={() => setViewingWorker(null)} lang={lang} />}
        {advancesWorker && <AdvancesModal 
          worker={advancesWorker} 
          onClose={() => setAdvancesWorker(null)} 
          lang={lang} 
          onAddAdvance={(adv) => updateWorkerExtras(advancesWorker.id, { advances: [...advancesWorker.advances, adv] })}
          onDeleteAdvance={(id) => updateWorkerExtras(advancesWorker.id, { advances: advancesWorker.advances.filter(a => a.id !== id) })}
        />}
        {absencesWorker && <AbsencesModal 
          worker={absencesWorker} 
          onClose={() => setAbsencesWorker(null)} 
          lang={lang} 
          onAddAbsence={(abs) => updateWorkerExtras(absencesWorker.id, { absences: [...absencesWorker.absences, abs] })}
          onDeleteAbsence={(id) => updateWorkerExtras(absencesWorker.id, { absences: absencesWorker.absences.filter(a => a.id !== id) })}
        />}
        {showForm && (
          <WorkerForm 
            lang={lang} 
            onClose={() => setShowForm(false)} 
            editingWorker={editingWorker}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const InfoRow = ({ icon: Icon, text, label }: any) => (
  <div className="flex items-center gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0">
      <Icon size={16} />
    </div>
    <div className="flex-1 overflow-hidden">
       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
       <p className="text-sm font-bold text-slate-700 truncate leading-none">{text || 'N/A'}</p>
    </div>
  </div>
);

const MenuAction = ({ icon: Icon, label, color, onClick, variant }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all mb-1 last:mb-0 hover:scale-[1.02] ${variant === 'danger' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'text-slate-600 bg-slate-50/50 hover:bg-slate-100'}`}
  >
    <div className={color}><Icon size={18} strokeWidth={2.5} /></div>
    {label}
  </button>
);

const ModalDetailItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-5 group">
     <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all border border-slate-100 shadow-sm"><Icon size={22} /></div>
     <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
        <p className="text-base font-black text-slate-900">{value || 'N/A'}</p>
     </div>
  </div>
);

const DetailsModal = ({ worker, onClose, lang }: any) => {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="relative bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.75rem] bg-blue-600 text-white flex items-center justify-center text-3xl font-black shadow-xl">
                 {worker.fullName[0]}
              </div>
              <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{worker.fullName}</h2>
                 <p className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mt-2">Dossier Collaborateur • Réf: {worker.id}</p>
              </div>
           </div>
           <button onClick={onClose} className="p-4 bg-white text-slate-400 rounded-2xl shadow-sm hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 no-scrollbar grid grid-cols-1 md:grid-cols-2 gap-12 bg-white">
           <section className="space-y-10">
              <div className="space-y-6">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Identité & Contact</p>
                 <ModalDetailItem icon={Phone} label="Mobile" value={worker.phone} />
                 <ModalDetailItem icon={Mail} label="Email Professionnel" value={worker.email} />
                 <ModalDetailItem icon={MapPin} label="Adresse Domicile" value={worker.address} />
                 <ModalDetailItem icon={Calendar} label="Date de Naissance" value={worker.birthday} />
              </div>
           </section>

           <section className="space-y-10">
              <div className="space-y-6">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Administration & Paie</p>
                 <ModalDetailItem icon={IdCard} label="Numéro ID / Passeport" value={worker.idNumber} />
                 <ModalDetailItem icon={Briefcase} label="Poste / Rôle" value={worker.role} />
                 <ModalDetailItem icon={Wallet} label="Contrat de Paie" value={worker.paymentType} />
                 <ModalDetailItem icon={UserCog} label="Nom d'utilisateur" value={worker.username} />
              </div>
           </section>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
           <button className="px-10 py-5 bg-white border border-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all">Exporter PDF</button>
           <button onClick={onClose} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Fermer</button>
        </div>
      </motion.div>
    </div>
  );
};

const AdvancesModal = ({ worker, onClose, lang, onAddAdvance, onDeleteAdvance }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const submit = () => {
    if (!amount) return;
    onAddAdvance({ id: Date.now().toString(), amount: parseFloat(amount), date, note });
    setAmount(''); setNote(''); setShowAdd(false);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg"><Banknote size={28} /></div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">Acomptes : {worker.fullName}</h3>
           </div>
           <button onClick={onClose} className="p-3 bg-white text-slate-400 rounded-2xl hover:bg-rose-50 transition-all"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-8">
           {!showAdd ? (
             <button onClick={() => setShowAdd(true)} className="w-full p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 hover:border-amber-400 transition-all">
                <Plus size={32} className="text-slate-300" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enregistrer un nouvel acompte</p>
             </button>
           ) : (
             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Montant (DA)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-6 py-4 bg-white rounded-2xl font-black text-xl outline-none focus:ring-2 border border-slate-100" /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-6 py-4 bg-white rounded-2xl font-bold border border-slate-100" /></div>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Observation</label><textarea value={note} onChange={e => setNote(e.target.value)} className="w-full px-6 py-4 bg-white rounded-2xl font-bold h-24 resize-none" /></div>
                <div className="flex gap-3"><button onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] uppercase">Annuler</button><button onClick={submit} className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase">Confirmer</button></div>
             </motion.div>
           )}
           <div className="space-y-4">
              {worker.advances.map((adv: any) => (
                <div key={adv.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black"><Banknote size={18} /></div>
                      <div><p className="text-sm font-black text-slate-900">{adv.amount.toLocaleString()} DA</p><p className="text-[10px] font-bold text-slate-400 uppercase">{adv.date} • {adv.note}</p></div>
                   </div>
                   <button onClick={() => onDeleteAdvance(adv.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                </div>
              ))}
           </div>
        </div>
      </motion.div>
    </div>
  );
};

const AbsencesModal = ({ worker, onClose, lang, onAddAbsence, onDeleteAbsence }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const submit = () => {
    if (!cost || !reason) return;
    onAddAbsence({ id: Date.now().toString(), cost: parseFloat(cost), date, reason });
    setCost(''); setReason(''); setShowAdd(false);
  };
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg"><CalendarX size={28} /></div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">Absences : {worker.fullName}</h3>
           </div>
           <button onClick={onClose} className="p-3 bg-white text-slate-400 rounded-2xl hover:bg-rose-50 transition-all"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-8">
           {!showAdd ? (
             <button onClick={() => setShowAdd(true)} className="w-full p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 hover:border-rose-400 transition-all"><Clock size={32} className="text-slate-300" /><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signaler une absence</p></button>
           ) : (
             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Déduction (DA)</label><input type="number" value={cost} onChange={e => setCost(e.target.value)} className="w-full px-6 py-4 bg-white rounded-2xl font-black text-xl outline-none border border-slate-100" /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-6 py-4 bg-white rounded-2xl font-bold border border-slate-100" /></div>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Motif</label><input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full px-6 py-4 bg-white rounded-2xl font-bold border border-slate-100" /></div>
                <div className="flex gap-3"><button onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] uppercase">Annuler</button><button onClick={submit} className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase">Enregistrer</button></div>
             </motion.div>
           )}
           <div className="space-y-4">
              {worker.absences.map((abs: any) => (
                <div key={abs.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl group">
                   <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-black"><CalendarX size={18} /></div><div><p className="text-sm font-black text-slate-900">{abs.reason}</p><p className="text-[10px] font-bold text-rose-400 uppercase">-{abs.cost.toLocaleString()} DA • {abs.date}</p></div></div>
                   <button onClick={() => onDeleteAbsence(abs.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                </div>
              ))}
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Workers;