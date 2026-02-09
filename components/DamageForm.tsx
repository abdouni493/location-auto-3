
import React, { useState, useMemo } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Damage } from '../types';
import { X, ShieldAlert, MapPin, Check, Banknote, AlertTriangle, User, FileText, LayoutGrid, Info, Car, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../App';
import { supabase } from '../supabase';

interface DamageFormProps {
  lang: Language;
  onClose: () => void;
  editingDamage?: Damage | null;
}

const DamageForm: React.FC<DamageFormProps> = ({ lang, onClose, editingDamage }) => {
  const { refreshData, reservations, showToast } = useApp();
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isRtl = lang === 'ar';
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    vehicleId: editingDamage?.vehicleId || '',
    reservationId: editingDamage?.reservationId || '',
    name: editingDamage?.name || '',
    description: editingDamage?.description || '',
    severity: (editingDamage?.severity || 'Light') as 'Light' | 'Medium' | 'Severe',
    position: editingDamage?.position || 'Aile Avant Gauche',
    cost: editingDamage?.cost?.toString() || '',
  });

  const selectedRes = useMemo(() => 
    reservations.find(r => r.id === formData.reservationId), 
    [formData.reservationId, reservations]
  );

  const handleSave = async () => {
    if (!formData.reservationId || !formData.name || !formData.cost) {
      showToast(isRtl ? "يرجى ملء المعلومات المطلوبة" : "Veuillez remplir les informations obligatoires", "error");
      return;
    }

    setIsSaving(true);
    
    // ATTEMPT TO SYNC - If vehicle_id is missing from table, Supabase will usually ignore it if it's not in our SELECT/INSERT 
    // or return a specific error. We assume reservation_id is the primary link.
    const damageData: any = {
      reservation_id: formData.reservationId,
      name: formData.name,
      description: formData.description,
      position: formData.position,
      cost: parseFloat(formData.cost) || 0,
      severity: formData.severity,
      status: editingDamage?.status || 'Pending'
    };

    // Only add vehicle_id if we have one, otherwise it's derived from reservation_id on the backend/join
    if (selectedRes?.vehicleId || editingDamage?.vehicleId) {
       // We'll try to send it, but the App.tsx mapping is now robust enough to find it via join if this fails.
       damageData.vehicle_id = selectedRes?.vehicleId || editingDamage?.vehicleId;
    }

    try {
      const { error } = editingDamage 
        ? await supabase.from('damages').update(damageData).eq('id', editingDamage.id)
        : await supabase.from('damages').insert([damageData]);

      if (error) {
        // If error specifically mentions vehicle_id, we retry without it
        if (error.message.includes('vehicle_id')) {
           delete damageData.vehicle_id;
           const retry = editingDamage 
             ? await supabase.from('damages').update(damageData).eq('id', editingDamage.id)
             : await supabase.from('damages').insert([damageData]);
           if (retry.error) throw retry.error;
        } else {
           throw error;
        }
      }
      
      showToast("Signalement enregistré dans le Cloud", "success");
      await refreshData();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-0 md:p-6 overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative bg-white w-full max-w-4xl md:rounded-[3.5rem] shadow-2xl h-full md:h-auto overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-50">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xl"><ShieldAlert size={28} /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{editingDamage ? "Modifier Sinistre" : "Signalement Dommage"}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mt-2">Dépôt de plainte / Rapport sinistre</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={24} strokeWidth={3} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-10 py-10 no-scrollbar bg-slate-50/20 space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dossier de réservation / Client</label>
                 <select value={formData.reservationId} onChange={e => setFormData({...formData, reservationId: e.target.value})} className="w-full px-8 py-6 bg-white border-2 border-slate-100 rounded-[2rem] font-bold text-slate-700 outline-none focus:border-blue-500 shadow-lg">
                    <option value="">Sélectionner un dossier</option>
                    {reservations.map(res => <option key={res.id} value={res.id}>{res.resNumber} - {res.clientName}</option>)}
                 </select>
                 {selectedRes && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm"><Car size={18} /></div><div className="text-left"><p className="text-xs font-black text-slate-900 leading-none">{selectedRes.vehicleName}</p><p className="text-[10px] font-bold text-blue-400 uppercase mt-1">Immatriculation confirmée</p></div></motion.div>)}
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gravité du sinistre</label>
                 <div className="grid grid-cols-3 gap-2">{[{ id: 'Light', label: 'Léger', color: 'bg-blue-500' }, { id: 'Medium', label: 'Moyen', color: 'bg-amber-500' }, { id: 'Severe', label: 'Grave', color: 'bg-rose-500' }].map(sv => (<button key={sv.id} onClick={() => setFormData({...formData, severity: sv.id as any})} className={`py-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${formData.severity === sv.id ? `${sv.color} border-slate-100 text-white shadow-lg scale-105` : 'bg-white border-slate-50 text-slate-400 hover:border-slate-100'}`}>{sv.label}</button>))}</div>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du dommage</label><div className="relative group"><FileText className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} /><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] font-bold outline-none focus:border-blue-500 shadow-xl transition-all" placeholder="Ex: Rayure profonde portière" /></div></div>
              <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Position sur véhicule</label><div className="relative group"><MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} /><input type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] font-bold outline-none focus:border-blue-500 shadow-xl transition-all" placeholder="Ex: Avant gauche" /></div></div>
           </div>
           <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description détaillée</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] outline-none font-bold text-slate-700 focus:border-blue-500 shadow-inner h-32 resize-none" placeholder="Décrivez les circonstances et l'étendue des dégâts..." /></div>
           <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frais de réparation estimés (DA)</label><div className="relative group max-w-sm"><Banknote className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={24} /><input type="number" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] font-black text-3xl text-slate-900 outline-none focus:border-emerald-500 shadow-xl transition-all" placeholder="0" /><div className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">DZD</div></div></div>
           <div className="p-8 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm shrink-0"><Info size={24} /></div><p className="text-xs font-bold text-amber-700 leading-relaxed">Les informations saisies ici seront immédiatement visibles sur le dossier financier du client. Veillez à l'exactitude des positions et des montants.</p></div>
        </div>
        <div className="px-10 py-8 border-t border-slate-100 bg-white flex items-center justify-between gap-6 sticky bottom-0 z-50">
           <button onClick={onClose} className="px-10 py-5 rounded-[1.75rem] font-black text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all uppercase text-xs tracking-widest">Annuler</button>
           <button onClick={handleSave} disabled={isSaving} className="flex-1 max-w-sm flex items-center justify-center gap-3 bg-rose-600 text-white py-5 rounded-[1.75rem] font-black shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-widest">{isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}{editingDamage ? "Mettre à jour" : "Enregistrer le Sinistre"}</button>
        </div>
      </motion.div>
    </div>
  );
};

export default DamageForm;
