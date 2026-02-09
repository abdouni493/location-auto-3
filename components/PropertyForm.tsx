
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Property } from '../types';
import { 
  X, Car, Settings2, Banknote, MapPin, Gauge, 
  ShieldCheck, Hash, Palette, Users, DoorOpen, FileCheck, Clock, CheckCircle2, AlertCircle, Calendar, Fuel, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../App';
import { supabase } from '../supabase';

interface PropertyFormProps {
  lang: Language;
  onClose: () => void;
  editingProperty?: Property | null;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ lang, onClose, editingProperty }) => {
  const { refreshData, showToast, agencies } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRtl = lang === 'ar';

  const [formData, setFormData] = useState({
    brand: editingProperty?.brand || '',
    model: editingProperty?.model || '',
    year: editingProperty?.year?.toString() || new Date().getFullYear().toString(),
    plate: editingProperty?.plate || '',
    color: editingProperty?.color || '',
    chassis_number: editingProperty?.chassisNumber || '',
    fuel_type: editingProperty?.fuel || 'Essence',
    transmission: editingProperty?.transmission || 'Manual',
    seats: editingProperty?.seats?.toString() || '5',
    doors: editingProperty?.doors?.toString() || '5',
    daily_price: editingProperty?.price?.toString() || '',
    weekly_price: editingProperty?.weeklyPrice?.toString() || '',
    monthly_price: editingProperty?.monthlyPrice?.toString() || '',
    caution: editingProperty?.caution?.toString() || '0',
    status: editingProperty?.status || 'Vacant',
    availability: editingProperty?.availability !== undefined ? editingProperty.availability : true,
    location: editingProperty?.address || (agencies[0]?.name || 'Principal'),
    current_mileage: editingProperty?.mileage?.toString() || '0',
    insurance_expiry: editingProperty?.insuranceExpiry || '',
    technical_control_expiry: editingProperty?.technicalControlDate || '',
    insurance_info: editingProperty?.insuranceInfo || '',
  });

  const handleSave = async () => {
    if (!formData.brand || !formData.model || !formData.plate || !formData.daily_price) {
      showToast(isRtl ? "الرجاء ملء البيانات الأساسية" : "Champs obligatoires: Marque, Modèle, Plaque, Prix", "error");
      return;
    }
    
    setIsSubmitting(true);
    const dbData: any = {
      brand: formData.brand,
      model: formData.model,
      year: parseInt(formData.year),
      plate: formData.plate,
      color: formData.color,
      chassis_number: formData.chassis_number,
      fuel_type: formData.fuel_type,
      transmission: formData.transmission,
      seats: parseInt(formData.seats),
      doors: parseInt(formData.doors),
      daily_price: parseFloat(formData.daily_price),
      weekly_price: formData.weekly_price ? parseFloat(formData.weekly_price) : null,
      monthly_price: formData.monthly_price ? parseFloat(formData.monthly_price) : null,
      caution: parseFloat(formData.caution),
      status: formData.status,
      availability: formData.availability,
      location: formData.location,
      current_mileage: parseInt(formData.current_mileage),
      insurance_expiry: formData.insurance_expiry || null,
      technical_control_expiry: formData.technical_control_expiry || null,
      insurance_info: formData.insurance_info,
    };

    if (!editingProperty) dbData.image_url = ''; 

    try {
      const { error } = editingProperty 
        ? await supabase.from('vehicles').update(dbData).eq('id', editingProperty.id)
        : await supabase.from('vehicles').insert([dbData]);

      if (error) throw error;
      showToast(isRtl ? "تمت إضافة المركبة بنجاح" : "Véhicule enregistré avec succès", "success");
      await refreshData();
      onClose();
    } catch (err: any) {
      showToast(err.message || "Erreur de connexion Cloud", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl"><Car size={32} /></div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">{editingProperty ? (isRtl ? 'تعديل' : 'Modifier') : (isRtl ? 'إضافة' : 'Nouveau')} Véhicule</h2>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Fiche technique automobile complète</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar bg-slate-50/30">
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-2 border-l-4 border-blue-500">Identité & Châssis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput label="Marque" value={formData.brand} onChange={(v: string) => setFormData({...formData, brand: v})} icon={Car} />
              <FormInput label="Modèle" value={formData.model} onChange={(v: string) => setFormData({...formData, model: v})} icon={Settings2} />
              <FormInput label="Année" type="number" value={formData.year} onChange={(v: string) => setFormData({...formData, year: v})} icon={Calendar} />
              <FormInput label="Immatriculation" value={formData.plate} onChange={(v: string) => setFormData({...formData, plate: v})} icon={Hash} placeholder="Ex: 00123-122-16" />
              <FormInput label="Couleur" value={formData.color} onChange={(v: string) => setFormData({...formData, color: v})} icon={Palette} />
              <FormInput label="N° Châssis" value={formData.chassis_number} onChange={(v: string) => setFormData({...formData, chassis_number: v})} icon={ShieldCheck} />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-2 border-l-4 border-amber-500">Spécifications & Emplacement</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Carburant</label>
                <select value={formData.fuel_type} onChange={e => setFormData({...formData, fuel_type: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold shadow-inner outline-none focus:border-blue-500 transition-all">
                  {['Essence', 'Diesel', 'GPL', 'Électrique', 'Hybride'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Transmission</label>
                <select value={formData.transmission} onChange={e => setFormData({...formData, transmission: e.target.value as any})} className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold shadow-inner outline-none focus:border-blue-500 transition-all">
                  <option value="Manual">Manuelle</option>
                  <option value="Automatic">Automatique</option>
                </select>
              </div>
              <FormInput label="Places" type="number" value={formData.seats} onChange={(v: string) => setFormData({...formData, seats: v})} icon={Users} />
              <FormInput label="Portes" type="number" value={formData.doors} onChange={(v: string) => setFormData({...formData, doors: v})} icon={DoorOpen} />
              <FormInput label="Kilométrage" type="number" value={formData.current_mileage} onChange={(v: string) => setFormData({...formData, current_mileage: v})} icon={Gauge} />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Localisation (Agence)</label>
                <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold shadow-inner outline-none focus:border-blue-500 transition-all">
                  {agencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  {agencies.length === 0 && <option value="Principal">Parc Principal</option>}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Statut Initial</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold shadow-inner outline-none focus:border-blue-500 transition-all">
                  <option value="Vacant">Disponible</option>
                  <option value="Maintenance">En maintenance</option>
                </select>
              </div>
              <div className="flex flex-col justify-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-inner">
                <label className="text-[10px] font-black uppercase text-slate-400">Opérationnel ?</label>
                <div className="flex items-center gap-3">
                   <button onClick={() => setFormData({...formData, availability: true})} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${formData.availability ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>OUI</button>
                   <button onClick={() => setFormData({...formData, availability: false})} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${!formData.availability ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>NON</button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-2 border-l-4 border-emerald-500">Tarification & Caution</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <FormInput label="Prix/Jour (DA)" type="number" value={formData.daily_price} onChange={(v: string) => setFormData({...formData, daily_price: v})} icon={Banknote} color="text-emerald-600" />
              <FormInput label="Prix/Semaine" type="number" value={formData.weekly_price} onChange={(v: string) => setFormData({...formData, weekly_price: v})} icon={Calendar} />
              <FormInput label="Prix/Mois" type="number" value={formData.monthly_price} onChange={(v: string) => setFormData({...formData, monthly_price: v})} icon={Clock} />
              <FormInput label="Caution (DA)" type="number" value={formData.caution} onChange={(v: string) => setFormData({...formData, caution: v})} icon={ShieldCheck} color="text-rose-600" />
            </div>
          </div>
        </div>

        <div className="px-10 py-8 border-t bg-white flex justify-end gap-6 sticky bottom-0 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          <button onClick={onClose} className="px-8 py-4 font-black text-slate-400 hover:text-slate-900 transition-all uppercase text-xs tracking-widest">Annuler</button>
          <button onClick={handleSave} disabled={isSubmitting} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3 uppercase text-xs tracking-[0.2em]">
            {isSubmitting ? <span className="animate-pulse">Cloud...</span> : (
              <>
                <ShieldCheck size={20} />
                <span>Sauvegarder</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const FormInput = ({ label, value, onChange, type = "text", icon: Icon, placeholder, className = "", color = "text-slate-400" }: any) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{label}</label>
    <div className="relative group">
      {Icon && <Icon className={`absolute left-5 top-1/2 -translate-y-1/2 ${color} transition-colors group-focus-within:text-blue-500`} size={20} />}
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange?.(e.target.value)} 
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-14' : 'px-6'} pr-6 py-4 bg-white border border-slate-100 rounded-2xl outline-none font-bold shadow-inner focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all`} 
      />
    </div>
  </div>
);

export default PropertyForm;
