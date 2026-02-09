
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Worker, WorkerRole, PaymentType } from '../types';
import { 
  X, User, Phone, Mail, MapPin, IdCard, 
  Calendar, Check, ChevronRight, ChevronLeft,
  Briefcase, Wallet, Key, UserCog, Banknote, Loader2, Sparkles,
  ShieldCheck, Car, ShieldAlert, Terminal, ExternalLink, Activity, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../App';
import { supabase } from '../supabase';

interface WorkerFormProps {
  lang: Language;
  onClose: () => void;
  editingWorker?: Worker | null;
}

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const WorkerForm: React.FC<WorkerFormProps> = ({ lang, onClose, editingWorker }) => {
  const { refreshData, showToast } = useApp();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [dbError, setDbError] = useState<{message: string, sql: string, code?: string} | null>(null);
  
  const [blacklistedColumns, setBlacklistedColumns] = useState<string[]>([]);
  
  const isRtl = lang === 'ar';
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const [formData, setFormData] = useState({
    fullName: editingWorker?.fullName || '',
    birthday: editingWorker?.birthday || '',
    phone: editingWorker?.phone || '',
    email: editingWorker?.email || '',
    address: editingWorker?.address || '',
    idNumber: editingWorker?.idNumber || '',
    role: (editingWorker?.role || 'Worker') as WorkerRole,
    paymentType: (editingWorker?.paymentType || 'Monthly') as PaymentType,
    amount: editingWorker?.amount || '',
    username: editingWorker?.username || '',
    password: '',
  });

  const steps = [
    { id: 1, title: 'Identité', icon: User, desc: 'Civil' },
    { id: 2, title: 'Fonction', icon: Briefcase, desc: 'Contrat' },
    { id: 3, title: 'Finance', icon: Wallet, desc: 'Paie' },
    { id: 4, title: 'Accès', icon: Key, desc: 'Cloud' },
  ];

  const handleNext = () => {
    if (step === 1 && (!formData.fullName || !formData.phone)) {
      showToast(isRtl ? "البيانات الأساسية مطلوبة" : "Le Nom et le Téléphone sont obligatoires", "error");
      return;
    }
    setStep(s => Math.min(s + 1, steps.length));
  };
  
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSave = async (currentBlacklist: string[] = blacklistedColumns) => {
    if (!formData.fullName || !formData.phone || !formData.amount) return;

    setIsSaving(true);
    setDbError(null);
    
    const virtualStorage = {
       advances: editingWorker?.advances || [],
       absences: editingWorker?.absences || [],
       role: formData.role,
       paymentType: formData.paymentType
    };

    const hijackedAddress = `${formData.address || ''} ##RM_STORAGE##${JSON.stringify(virtualStorage)}`;

    const fullPayload: any = {
      id: editingWorker?.id || generateUUID(),
      full_name: formData.fullName,
      phone: formData.phone,
      email: formData.email || null,
      address: hijackedAddress,
      salary: parseFloat(formData.amount.toString()) || 0,
      birthday: formData.birthday || null,
      id_number: formData.idNumber || null,
      username: formData.username || null,
    };

    if (formData.password) fullPayload.password = formData.password;

    const filteredPayload = Object.keys(fullPayload)
      .filter(key => !currentBlacklist.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = fullPayload[key];
        return obj;
      }, {});

    try {
      const action = editingWorker 
        ? supabase.from('workers').update(filteredPayload).eq('id', editingWorker.id)
        : supabase.from('workers').insert([filteredPayload]);

      const { error } = await action;

      if (error) {
        if (error.message.includes('column') || error.code === '42703') {
          const match = error.message.match(/'([^']+)'/);
          const missingField = match ? match[1] : null;

          if (missingField && !currentBlacklist.includes(missingField)) {
             const nextBlacklist = [...currentBlacklist, missingField];
             setBlacklistedColumns(nextBlacklist);
             return handleSave(nextBlacklist); 
          }
        }
        throw error;
      }

      showToast(editingWorker ? "Collaborateur actualisé" : "Nouveau dossier créé", "success");
      await refreshData();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 overflow-hidden bg-slate-900/60 backdrop-blur-md">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl h-auto overflow-hidden flex flex-col border border-white"
      >
        <div className="px-10 py-10 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.75rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl">
              {React.createElement(steps[step-1].icon, { size: 32, strokeWidth: 2.5 })}
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{editingWorker ? 'Édition Profil' : 'Nouveau Dossier'}</h2>
              <div className="flex items-center gap-2 mt-2">
                 <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Sparkles size={12} /> {steps[step-1].title}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all text-slate-400 shadow-sm border border-slate-100"><X size={24} strokeWidth={3} /></button>
        </div>

        <div className="h-1.5 w-full bg-slate-50 relative">
          <motion.div className="absolute inset-y-0 left-0 bg-blue-600" animate={{ width: `${(step / steps.length) * 100}%` }} />
        </div>

        <div className="p-10 space-y-8 bg-slate-50/20 max-h-[60vh] overflow-y-auto no-scrollbar">
           <AnimatePresence mode="wait">
             <motion.div key={step} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-8">
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormInput label="Nom Complet *" icon={User} placeholder="Prénom Nom" value={formData.fullName} onChange={(v: string) => setFormData({...formData, fullName: v})} className="md:col-span-2" />
                    <FormInput label="Téléphone Mobile *" icon={Phone} placeholder="05XX XX XX XX" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
                    <FormInput label="Email Professionnel" icon={Mail} placeholder="nom@agence.dz" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                    <FormInput label="Adresse Résidence" icon={MapPin} placeholder="Commune, Wilaya..." value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} className="md:col-span-2" />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sélectionner le Rôle</label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'Admin', icon: ShieldCheck, label: 'Admin' },
                          { id: 'Worker', icon: UserCog, label: 'Collaborateur' },
                          { id: 'Driver', icon: Car, label: 'Chauffeur' }
                        ].map(r => (
                          <button key={r.id} type="button" onClick={() => setFormData({...formData, role: r.id as WorkerRole})} className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-4 transition-all ${formData.role === r.id ? `bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.03]` : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}><r.icon size={28} /><span className="font-black text-[10px] uppercase tracking-widest">{r.label}</span></button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                       <FormInput label="N° Pièce d'identité" icon={IdCard} placeholder="CNI ou Passeport" value={formData.idNumber} onChange={(v: string) => setFormData({...formData, idNumber: v})} />
                       <FormInput label="Date de Naissance" icon={Calendar} type="date" value={formData.birthday} onChange={(v: string) => setFormData({...formData, birthday: v})} />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-12 py-6 text-center">
                    <div className="space-y-6 max-w-md mx-auto">
                       <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] block">Rémunération Net (DA) *</label>
                       <div className="relative group">
                          <Banknote className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={32} />
                          <input type="number" className="w-full pl-24 pr-10 py-10 bg-white border-4 border-slate-100 rounded-[3rem] outline-none font-black text-6xl text-slate-900 focus:border-blue-600 transition-all shadow-xl text-center shadow-slate-200/50" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} placeholder="0" />
                       </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <FormInput label="Nom d'utilisateur" icon={UserCog} placeholder="amine_k" value={formData.username} onChange={(v: string) => setFormData({...formData, username: v})} />
                       <FormInput label="Mot de passe" icon={Key} type="password" placeholder="••••••••" value={formData.password} onChange={(v: string) => setFormData({...formData, password: v})} />
                    </div>
                  </div>
                )}
             </motion.div>
           </AnimatePresence>
        </div>

        <div className="px-10 py-10 bg-white border-t border-slate-100 flex items-center justify-between gap-6 relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
          <button type="button" onClick={step === 1 ? onClose : handleBack} className="px-10 py-5 rounded-[1.5rem] font-black text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all uppercase text-xs tracking-widest">{step === 1 ? 'Annuler' : 'Retour'}</button>
          <button type="button" onClick={step < steps.length ? handleNext : () => handleSave()} disabled={isSaving} className="px-14 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-2xl hover:scale-[1.03] active:scale-95 transition-all uppercase text-xs tracking-[0.2em] flex items-center gap-3 disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
            <span>{step < steps.length ? 'Continuer' : (editingWorker ? 'Mettre à jour' : 'Valider') }</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const FormInput = ({ label, icon: Icon, placeholder, type = "text", value, onChange, className = "" }: any) => (
  <div className={`space-y-3 ${className}`}>
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1.5 leading-none">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={22} />}
      <input 
        type={type} 
        placeholder={placeholder} 
        value={value} 
        onChange={e => onChange?.(e.target.value)} 
        className={`w-full ${Icon ? 'pl-16' : 'px-8'} pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-bold text-lg focus:border-blue-500 focus:ring-8 focus:ring-blue-50/50 transition-all shadow-inner`} 
      />
    </div>
  </div>
);

export default WorkerForm;
