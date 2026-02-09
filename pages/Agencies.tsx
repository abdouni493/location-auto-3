
import React, { useState, useMemo } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Agency } from '../types';
import { 
  Plus, Search, Landmark, MapPin, Phone, Mail, 
  MoreVertical, Eye, Edit2, Trash2, History,
  X, User, Car, CheckCircle, Clock,
  ChevronRight, Filter, Store, ShieldCheck, Hash, Globe,
  Briefcase, Check, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../App';
import BottomSheet from '../components/BottomSheet';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { supabase } from '../supabase';

const Agencies: React.FC<{ lang: Language }> = ({ lang }) => {
  const { agencies, setAgencies, showToast, refreshData } = useApp();
  const [search, setSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [viewingAgency, setViewingAgency] = useState<Agency | null>(null);
  const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);

  const t = (key: string) => TRANSLATIONS[key.toLowerCase()]?.[lang] || key;
  const isRtl = lang === 'ar';

  const filteredAgencies = useMemo(() => 
    agencies.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase()))
  , [agencies, search]);

  const handleDeleteConfirm = async () => {
    if (!agencyToDelete) return;
    try {
      const { error } = await supabase.from('agencies').delete().eq('id', agencyToDelete.id);
      if (error) throw error;
      showToast(isRtl ? "تم حذف الوكالة" : "Agence supprimée avec succès", "success");
      await refreshData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setAgencyToDelete(null);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-1">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">
            {isRtl ? 'شبكة' : 'Réseau d\''}<span className="text-gradient">{isRtl ? 'الوكالات' : 'Agences'}</span>
          </h1>
          <p className="text-slate-500 mt-2 font-bold text-lg leading-tight">
            {isRtl ? 'إدارة نقاط البيع والفروع الثانوية.' : 'Pilotez vos points de vente et parcs secondaires.'}
          </p>
        </motion.div>
        <button 
          onClick={() => { setEditingAgency(null); setShowForm(true); }}
          className="bg-aurora text-white px-10 py-5 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={22} strokeWidth={3} />
          <span>{t('addAgency')}</span>
        </button>
      </header>

      <div className="relative group max-w-2xl px-1">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"><Search size={24}/></div>
        <input 
          type="text" 
          placeholder={isRtl ? "ابحث عن وكالة، مدينة..." : "Rechercher une agence, une ville..."} 
          className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] font-black text-xl text-slate-900 outline-none focus:border-blue-500 transition-all shadow-xl shadow-slate-200/40"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredAgencies.map((agency) => (
            <motion.div 
              key={agency.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="group bg-white rounded-[3.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-500 relative flex flex-col h-[480px] overflow-hidden"
            >
              <div className="p-8 pb-4 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 text-white flex items-center justify-center text-4xl font-black shadow-2xl group-hover:scale-105 transition-transform duration-500">
                    <Store size={40} className="text-blue-400" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${agency.status === 'Open' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-50'}`} />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{agency.name}</h3>
                <div className="flex items-center gap-2 mt-4">
                   <MapPin size={14} className="text-blue-500" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{agency.city}</p>
                </div>
              </div>

              <div className="absolute top-6 right-6 z-[60]">
                <button 
                  onClick={() => setActiveMenu(activeMenu === agency.id ? null : agency.id)}
                  className={`p-3 backdrop-blur-xl rounded-2xl transition-all shadow-xl border border-slate-100 ${activeMenu === agency.id ? 'bg-slate-900 text-white' : 'bg-white/80 text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <MoreVertical size={20} />
                </button>
                
                <AnimatePresence>
                  {activeMenu === agency.id && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-3 w-60 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-3xl border border-slate-100 p-2.5 z-[100] overflow-hidden`}>
                      <MenuAction icon={Eye} label="Détails" iconClassName="text-blue-500" onClick={() => { setViewingAgency(agency); setActiveMenu(null); }} />
                      <MenuAction icon={Edit2} label="Éditer" iconClassName="text-slate-900" onClick={() => { setEditingAgency(agency); setShowForm(true); setActiveMenu(null); }} />
                      <div className="h-px bg-slate-100 my-2 mx-4" />
                      <MenuAction icon={Trash2} label="Supprimer" variant="danger" onClick={() => { setAgencyToDelete(agency); setActiveMenu(null); }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="px-8 py-6 space-y-4 border-y border-slate-50 mt-4">
                 <ContactItem icon={Phone} text={agency.phone} label="Fixe / Mobile" />
                 <ContactItem icon={Mail} text={agency.email} label="Email Agence" />
                 <ContactItem icon={User} text={agency.manager} label="Responsable" />
              </div>

              <div className="mt-auto p-8 grid grid-cols-2 gap-4 bg-slate-50/50">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Véhicules</p>
                    <p className="text-xl font-black text-slate-900">{agency.vehicleCount}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Zone</p>
                    <p className="text-xl font-black text-blue-600">{agency.city}</p>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {viewingAgency && <AgencyDetailsModal agency={viewingAgency} onClose={() => setViewingAgency(null)} />}
        {showForm && (
          <AgencyForm 
            lang={lang}
            onClose={() => setShowForm(false)} 
            editingAgency={editingAgency}
            onSave={async (data: any) => {
              try {
                const dbData = {
                  name: data.name,
                  city: data.city,
                  address: data.address,
                  phone: data.phone,
                  email: data.email,
                  manager_name: data.manager
                };

                const { error } = editingAgency 
                  ? await supabase.from('agencies').update(dbData).eq('id', editingAgency.id)
                  : await supabase.from('agencies').insert([dbData]);

                if (error) throw error;

                showToast(editingAgency ? "Agence mise à jour" : "Nouvelle agence enregistrée", "success");
                await refreshData();
                setShowForm(false);
              } catch (err: any) {
                showToast(err.message, "error");
              }
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmationDialog 
        isOpen={!!agencyToDelete} 
        onClose={() => setAgencyToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Désactivation du Point de Vente" 
        message="Êtes-vous certain de vouloir fermer définitivement cette agence ? Les véhicules rattachés devront être réassignés." 
        lang={lang} 
      />
    </div>
  );
};

const MenuAction = ({ icon: Icon, label, variant = 'default', onClick, iconClassName = "" }: any) => (
  <motion.button 
    whileHover={{ scale: 1.02, x: 5 }} 
    whileTap={{ scale: 0.98 }} 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-6 py-4 font-black text-[10px] uppercase tracking-widest transition-all rounded-[1.5rem] mb-1 last:mb-0 ${variant === 'danger' ? 'text-rose-500 bg-rose-50/30' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <div className={`shrink-0 ${iconClassName}`}><Icon size={18} strokeWidth={2.5} /></div>
    {label}
  </motion.button>
);

const ContactItem = ({ icon: Icon, text, label }: any) => (
  <div className="flex items-center gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
      <Icon size={16} />
    </div>
    <div className="flex-1 overflow-hidden">
       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
       <p className="text-sm font-bold text-slate-700 truncate">{text}</p>
    </div>
  </div>
);

const AgencyDetailsModal = ({ agency, onClose }: any) => {
  const { properties } = useApp();
  const agencyVehicles = properties.filter(p => p.address === agency.name || p.address === agency.city);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="relative bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.75rem] bg-slate-900 text-white flex items-center justify-center shadow-xl">
                 <Store size={32} />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{agency.name}</h2>
                 <p className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mt-2">Dossier Agence • {agency.city}</p>
              </div>
           </div>
           <button onClick={onClose} className="p-4 bg-white text-slate-400 rounded-2xl shadow-sm hover:bg-rose-50 transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 no-scrollbar grid grid-cols-1 lg:grid-cols-3 gap-12 bg-white">
           <section className="lg:col-span-1 space-y-10">
              <div className="space-y-6">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Informations</p>
                 <ModalDetailItem icon={MapPin} label="Adresse" value={agency.address} />
                 <ModalDetailItem icon={Phone} label="Téléphone" value={agency.phone} />
                 <ModalDetailItem icon={Mail} label="Contact Email" value={agency.email} />
                 <ModalDetailItem icon={User} label="Manager" value={agency.manager} />
              </div>
           </section>

           <section className="lg:col-span-2 space-y-8">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Parc rattaché ({agencyVehicles.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agencyVehicles.map(v => (
                  <div key={v.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                     <img src={v.image} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
                     <div>
                        <p className="font-black text-sm text-slate-900">{v.brand} {v.model}</p>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{v.plate}</p>
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[8px] font-black uppercase mt-1 ${v.availability ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                           {v.availability ? 'Prêt' : 'Occupé'}
                        </span>
                     </div>
                  </div>
                ))}
                {agencyVehicles.length === 0 && <p className="text-sm font-bold text-slate-400 italic">Aucun véhicule localisé ici.</p>}
              </div>
           </section>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
           <button onClick={onClose} className="px-12 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black uppercase text-xs tracking-widest shadow-xl">Fermer</button>
        </div>
      </motion.div>
    </div>
  );
};

const ModalDetailItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-5 group">
     <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all border border-slate-100 shadow-sm"><Icon size={22} /></div>
     <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
        <p className="text-base font-black text-slate-900">{value || 'N/A'}</p>
     </div>
  </div>
);

const AgencyForm = ({ lang, onClose, editingAgency, onSave }: any) => {
  const isRtl = lang === 'ar';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: editingAgency?.name || '',
    city: editingAgency?.city || '',
    address: editingAgency?.address || '',
    phone: editingAgency?.phone || '',
    email: editingAgency?.email || '',
    manager: editingAgency?.manager || ''
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.city) return;
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-0 md:p-6 overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 40 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="relative bg-white w-full max-w-3xl md:rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] h-full md:h-auto overflow-hidden flex flex-col max-h-[95vh] border border-white"
      >
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.75rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl">
              <Store size={32} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                {editingAgency ? (isRtl ? 'تعديل الوكالة' : 'Éditer l\'agence') : (isRtl ? 'إضافة وكالة جديدة' : 'Nouveau Point de Vente')}
              </h2>
              <p className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mt-2">Configuration Administrative</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all active:scale-90">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-10 no-scrollbar bg-slate-50/30 space-y-10">
           <section className="space-y-6">
              <SectionHeader icon={Landmark} title="Identité Commerciale" />
              <FormInput label="Nom de l'agence" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} icon={Hash} placeholder="Ex: RentMaster Hydra" />
              <FormInput label="Manager Responsable" value={formData.manager} onChange={(v: string) => setFormData({...formData, manager: v})} icon={User} placeholder="Nom du responsable agence" />
           </section>

           <section className="space-y-6">
              <SectionHeader icon={Globe} title="Localisation & Secteur" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="Ville / Wilaya" value={formData.city} onChange={(v: string) => setFormData({...formData, city: v})} icon={MapPin} placeholder="Ex: Alger" />
                <FormInput label="Adresse Complète" value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} icon={MapPin} placeholder="N°, Rue, Commune..." />
              </div>
           </section>

           <section className="space-y-6">
              <SectionHeader icon={Briefcase} title="Canaux de Communication" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="N° Téléphone Officiel" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} icon={Phone} placeholder="021 XX XX XX" />
                <FormInput label="Email de l'agence" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} icon={Mail} placeholder="contact@agence.dz" />
              </div>
           </section>

           <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-start gap-4">
              <ShieldCheck size={24} className="text-blue-500 shrink-0 mt-1" />
              <p className="text-xs font-bold text-blue-700 leading-relaxed">
                {isRtl 
                  ? "سيتم استخدام هذه البيانات في العقود والفواتير الصادرة عن هذا الفرع." 
                  : "Ces informations seront utilisées pour la génération des contrats et factures liés à ce point de vente spécifique."}
              </p>
           </div>
        </div>

        <div className="px-10 py-8 bg-white border-t border-slate-100 flex items-center justify-between gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] sticky bottom-0 z-20">
          <button 
            disabled={isSubmitting}
            onClick={onClose} 
            className="px-10 py-5 rounded-[1.75rem] font-black text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
          >
            {isRtl ? 'إلغاء' : 'Annuler'}
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex-1 max-w-sm bg-slate-900 text-white py-5 rounded-[1.75rem] font-black shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 uppercase text-xs tracking-[0.25em] disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
            {editingAgency ? (isRtl ? 'حفظ التغييرات' : 'Sauvegarder') : (isRtl ? 'تفعيل الوكالة' : 'Valider l\'Agence')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title }: any) => (
  <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
      <Icon size={20} />
    </div>
    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{title}</h3>
  </div>
);

const FormInput = ({ label, icon: Icon, value, onChange, placeholder }: any) => (
  <div className="space-y-2 w-full">
    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">{label}</label>
    <div className="relative group">
      <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
      <input 
        type="text" 
        placeholder={placeholder}
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[1.75rem] font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner group-hover:bg-slate-50/50" 
      />
    </div>
  </div>
);

export default Agencies;
