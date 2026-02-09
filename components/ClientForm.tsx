
import React, { useState, useRef } from 'react';
import { TRANSLATIONS, WILAYAS } from '../constants';
import { Language, Client } from '../types';
import { 
  X, User, Phone, Mail, MapPin, IdCard, 
  CreditCard, Calendar, Check, ChevronRight, ChevronLeft,
  Camera, Plus, Trash2, Tag, FileText, Loader2, Globe, ImageIcon, UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../App';
import { supabase } from '../supabase';

interface ClientFormProps {
  lang: Language;
  onClose: () => void;
  editingClient?: Client | null;
}

// Utility for image compression to speed up DB operations
const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); // 0.7 quality is plenty for documents
    };
  });
};

const ClientForm: React.FC<ClientFormProps> = ({ lang, onClose, editingClient }) => {
  const { refreshData, showToast } = useApp();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isRtl = lang === 'ar';
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const [formData, setFormData] = useState({
    firstName: editingClient?.firstName || '',
    lastName: editingClient?.lastName || '',
    nickname: editingClient?.nickname || '',
    phone: editingClient?.phone || '',
    email: editingClient?.email || '',
    address: editingClient?.address || '',
    wilaya: editingClient?.wilaya || '16 - Alger',
    idNumber: editingClient?.idNumber || '',
    licenseNumber: editingClient?.licenseNumber || '',
    licenseExpiry: editingClient?.licenseExpiry || '',
    documentPhotos: editingClient?.documentPhotos || [] as string[],
    avatar: editingClient?.avatar || ''
  });

  const steps = [
    { id: 1, title: 'Identification', icon: User },
    { id: 2, title: 'Documents Légaux', icon: IdCard },
    { id: 3, title: 'Pièces Justificatives', icon: Camera },
  ];

  const handleNext = () => {
    if (step === 1 && (!formData.firstName || !formData.lastName || !formData.phone)) {
      showToast(isRtl ? "الاسم واللقب والهاتف مطلوبة" : "Prénom, Nom et Téléphone sont obligatoires", "error");
      return;
    }
    setStep(s => Math.min(s + 1, steps.length));
  };
  
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 400, 400); // Avatars are small
      setFormData(prev => ({ ...prev, avatar: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 1200, 1200); // Documents need more detail
        setFormData(prev => ({
          ...prev,
          documentPhotos: [...prev.documentPhotos, compressed]
        }));
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documentPhotos: prev.documentPhotos.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const regDate = editingClient?.registrationDate || new Date().toISOString().split('T')[0];
    
    // Core structure
    let dbData: any = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      email: formData.email || null,
      address: formData.address || null,
      id_number: formData.idNumber || null,
      license_number: formData.licenseNumber || null,
      license_expiry: formData.licenseExpiry || null,
      wilaya: formData.wilaya || null,
      nickname: formData.nickname || null,
      document_photos: formData.documentPhotos,
      avatar_url: formData.avatar || null,
      registration_date: regDate
    };

    try {
      // 1. Try standard columns
      const action = editingClient 
        ? supabase.from('clients').update(dbData).eq('id', editingClient.id)
        : supabase.from('clients').insert([dbData]);

      const { error } = await action;

      if (error) {
        // 2. Fallback to Virtual Metadata Layer
        if (error.message.includes('column') || error.code === '42703') {
           console.warn("Retrying with Virtual Storage Fallback...");
           
           const virtualStorage = {
             avatar: formData.avatar || null,
             docs: formData.documentPhotos,
             wilaya: formData.wilaya,
             nickname: formData.nickname,
             regDate: regDate
           };
           
           const hijackedAddress = `${formData.address || ''} ##RM_STORAGE##${JSON.stringify(virtualStorage)}`;

           const fallbackData = {
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone,
              email: formData.email || null,
              address: hijackedAddress,
              id_number: formData.idNumber || null,
              license_number: formData.licenseNumber || null,
              license_expiry: formData.licenseExpiry || null,
              registration_date: regDate
           };

           const retryAction = editingClient 
             ? supabase.from('clients').update(fallbackData).eq('id', editingClient.id)
             : supabase.from('clients').insert([fallbackData]);
           
           const { error: retryError } = await retryAction;
           if (retryError) throw retryError;
           showToast(isRtl ? "تم الحفظ بنجاح" : "Enregistré avec succès", "success");
        } else {
           throw error;
        }
      } else {
        showToast(editingClient ? "Dossier mis à jour" : "Client enregistré avec succès", "success");
      }
      
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white w-full max-w-4xl md:rounded-[3.5rem] shadow-2xl h-full md:h-auto overflow-hidden flex flex-col max-h-[95vh]"
      >
        <div className="px-8 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-100">
              {React.createElement(steps[step-1].icon, { size: 28, strokeWidth: 2.5 })}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {editingClient ? (isRtl ? 'تعديل الملف' : 'Modifier Client') : (isRtl ? 'إضافة عميل' : 'Nouveau Client')}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                  {steps[step-1].title}
                </span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Étape {step}/{steps.length}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-10 no-scrollbar bg-slate-50/20">
          <AnimatePresence mode="wait">
            <motion.div 
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && (
                <div className="space-y-10">
                   <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="relative group">
                         <div 
                           onClick={() => avatarInputRef.current?.click()}
                           className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all overflow-hidden"
                         >
                            {formData.avatar ? (
                              <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                              <>
                                <UserCircle size={40} strokeWidth={1} />
                                <span className="text-[8px] font-black uppercase mt-2">Photo de profil</span>
                              </>
                            )}
                         </div>
                         <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                         {formData.avatar && (
                           <button onClick={() => setFormData({...formData, avatar: ''})} className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-lg shadow-lg hover:scale-110 transition-all"><Trash2 size={12}/></button>
                         )}
                      </div>
                      <div className="flex-1 w-full space-y-2">
                         <p className="text-sm font-bold text-slate-700">Identification Principale</p>
                         <p className="text-xs text-slate-400">La fiche sera sauvegardée sur le Cloud et apparaîtra instantanément dans votre liste.</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="Prénom *" icon={User} placeholder="Mohamed" value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                    <FormInput label="Nom de famille *" icon={User} placeholder="Kaci" value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} />
                    <FormInput label="Numéro de téléphone *" icon={Phone} placeholder="0550..." value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
                    <FormInput label="Email (Optionnel)" icon={Mail} placeholder="nom@email.dz" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                    <FormInput label="Alias / Nom d'usage (Optionnel)" icon={Tag} placeholder="Ex: Client VIP" value={formData.nickname} onChange={(v: string) => setFormData({...formData, nickname: v})} className="md:col-span-2" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="N° Carte d'Identité / Passeport" icon={IdCard} placeholder="Réf. Document" value={formData.idNumber} onChange={(v: string) => setFormData({...formData, idNumber: v})} className="md:col-span-2" />
                    
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wilaya</label>
                       <div className="relative group">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <select 
                            value={formData.wilaya} 
                            onChange={e => setFormData({...formData, wilaya: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold focus:border-blue-500 transition-all shadow-inner appearance-none"
                          >
                            <option value="">Sélectionner Wilaya</option>
                            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                       </div>
                    </div>

                    <FormInput label="Adresse Résidence" icon={MapPin} placeholder="Adresse complète..." value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} />
                    
                    <FormInput label="N° Permis de Conduire" icon={CreditCard} placeholder="00/00000/00" value={formData.licenseNumber} onChange={(v: string) => setFormData({...formData, licenseNumber: v})} />
                    <FormInput label="Date d'expiration Permis" icon={Calendar} type="date" value={formData.licenseExpiry} onChange={(v: string) => setFormData({...formData, licenseExpiry: v})} />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-slate-500">Numérisez les documents (CNI, Passeport, Permis)</p>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Optimisation Cloud Active</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-3xl border-4 border-dashed border-slate-100 bg-white flex flex-col items-center justify-center text-slate-300 hover:border-blue-500 hover:text-blue-500 transition-all group">
                      <Plus size={32} />
                      <span className="text-[8px] font-black uppercase mt-2">Ajouter</span>
                    </button>
                    <input type="file" multiple ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    {formData.documentPhotos.map((photo, index) => (
                      <div key={index} className="aspect-square rounded-3xl overflow-hidden relative group border-2 border-white shadow-md">
                        <img src={photo} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => removePhoto(index)} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-8 py-8 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
          <button onClick={step === 1 ? onClose : handleBack} className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest">
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {step === 1 ? t('cancel') : t('back')}
          </button>
          {step < steps.length ? (
            <button onClick={handleNext} className="flex items-center gap-3 bg-blue-600 text-white px-12 py-5 rounded-[1.5rem] font-black shadow-2xl hover:bg-blue-700 transition-all active:scale-95 uppercase text-xs tracking-widest">
              <span>{t('nextStep')}</span>
              {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-3 bg-slate-900 text-white px-12 py-5 rounded-[1.5rem] font-black shadow-2xl active:scale-95 transition-all uppercase text-xs tracking-[0.2em] disabled:opacity-50">
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={3} />}
              <span>{editingClient ? 'Mettre à jour' : 'Enregistrer Dossier'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const FormInput = ({ label, icon: Icon, placeholder, type = "text", value, onChange, className = "" }: any) => (
  <div className={`space-y-3 ${className}`}>
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none ml-1">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />}
      <input 
        type={type} 
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${Icon ? 'pl-12' : 'px-6'} pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-inner`} 
      />
    </div>
  </div>
);

export default ClientForm;
