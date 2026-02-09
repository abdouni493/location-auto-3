
import React, { useState, useRef, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { 
  Settings, Globe, ShieldCheck, Database, 
  Facebook, Instagram, Mail, Phone, MapPin, 
  Key, User, Check, AlertCircle, Trash2, Download, Upload,
  Zap, Clock, Gauge, Fuel, Percent, Banknote, Sparkles, Image as ImageIcon,
  ChevronRight, ArrowRight, AlertTriangle, Landmark, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../App';
import { supabase } from '../supabase';

const SettingsPage: React.FC<{ lang: Language }> = ({ lang }) => {
  const { agencySettings, setAgencySettings, showToast, refreshData } = useApp();
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState('agency');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth States for Security Tab
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
        setNewEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  const tabs = [
    { id: 'agency', icon: Globe, label: 'Identité Agence' },
    { id: 'penalties', icon: AlertTriangle, label: 'Matrice Pénalités' },
    { id: 'security', icon: Key, label: 'Accès & Sécurité' },
    { id: 'backup', icon: Database, label: 'Maintenance Données' },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAgencySettings({ ...agencySettings, logo: reader.result as string });
        showToast("Logo mis à jour avec succès", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setAgencySettings({ ...agencySettings, logo: null });
    showToast("Logo supprimé", "info");
  };

  const handleUpdateAuth = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      showToast("Les mots de passe ne correspondent pas", "error");
      return;
    }

    setIsUpdatingAuth(true);
    try {
      const updates: any = {};
      // Only update if changed
      if (newEmail !== currentUserEmail) updates.email = newEmail;
      if (newPassword) updates.password = newPassword;

      if (Object.keys(updates).length === 0) {
        showToast("Aucune modification détectée", "info");
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      showToast("Profil de sécurité mis à jour. Vérifiez vos emails si vous avez changé l'adresse.", "success");
      
      // Cleanup sensitive state
      setNewPassword('');
      setConfirmPassword('');
      if (updates.email) setCurrentUserEmail(newEmail);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUpdatingAuth(false);
    }
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentification requise");

      const { error } = await supabase
        .from('agency_config')
        .upsert({ 
          user_id: user.id,
          settings: agencySettings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      showToast("Configuration synchronisée sur le Cloud", "success");
      await refreshData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="px-1">
        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">Configuration <span className="text-gradient">Système</span></h1>
        <p className="text-slate-500 mt-2 font-bold text-lg leading-tight">Personnalisez votre identité et vos règles métier.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="space-y-3">
           {tabs.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`w-full flex items-center justify-between px-8 py-6 rounded-[2rem] font-black transition-all group ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl scale-[1.02]' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}
             >
               <div className="flex items-center gap-4">
                 <tab.icon size={22} className={activeTab === tab.id ? 'text-blue-400' : 'text-slate-300 group-hover:text-blue-500'} />
                 <span className="text-sm uppercase tracking-wider">{tab.label}</span>
               </div>
               <ChevronRight size={18} className={`${activeTab === tab.id ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
             </button>
           ))}
        </div>

        <div className="lg:col-span-3">
           <AnimatePresence mode="wait">
             <motion.div 
               key={activeTab} 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: -20 }} 
               className="bg-white p-10 lg:p-14 rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-12 relative overflow-hidden"
             >
                {activeTab === 'agency' && (
                  <div className="space-y-12">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                       <div className="relative group">
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-40 h-40 rounded-[3rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-inner overflow-hidden"
                          >
                            {agencySettings.logo ? (
                              <img src={agencySettings.logo} className="w-full h-full object-contain p-4" alt="Agency Logo" />
                            ) : (
                              <>
                                <ImageIcon size={40} strokeWidth={1.5} />
                                <span className="text-[9px] font-black uppercase mt-2 tracking-widest">Logo (PNG/JPG)</span>
                              </>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                          </div>
                          {agencySettings.logo && (
                            <button onClick={removeLogo} className="absolute -top-3 -right-3 p-2.5 bg-rose-500 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-white">
                               <Trash2 size={16} />
                            </button>
                          )}
                       </div>
                       <div className="flex-1 space-y-6 w-full">
                          <SettingsInput label="Nom Commercial de l'Agence" value={agencySettings.name} onChange={(v: string) => setAgencySettings({...agencySettings, name: v})} icon={Landmark} />
                          <SettingsInput label="Slogan / Signature" value={agencySettings.slogan} onChange={(v: string) => setAgencySettings({...agencySettings, slogan: v})} icon={Sparkles} />
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-100">
                       <SettingsInput label="Adresse du Siège" value={agencySettings.address} onChange={(v: string) => setAgencySettings({...agencySettings, address: v})} icon={MapPin} />
                       <SettingsInput label="Téléphone Officiel" value={agencySettings.phone} onChange={(v: string) => setAgencySettings({...agencySettings, phone: v})} icon={Phone} />
                       <SettingsInput label="Email de Contact" value={agencySettings.email} onChange={(v: string) => setAgencySettings({...agencySettings, email: v})} icon={Mail} />
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Réseaux Sociaux</label>
                          <div className="flex gap-2">
                             <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3"><Facebook size={18} className="text-blue-600" /><span className="text-xs font-bold text-slate-400">Facebook</span></div>
                             <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3"><Instagram size={18} className="text-rose-600" /><span className="text-xs font-bold text-slate-400">Instagram</span></div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'penalties' && (
                  <div className="space-y-12">
                    <div className="space-y-8">
                       <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner"><Clock size={20} /></div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Pénalités de Retard</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de Calcul</label>
                             <div className="grid grid-cols-1 gap-2">
                                {[
                                  { id: 'tarif_journalier', label: 'Tarif Journalier complet' },
                                  { id: 'forfait_heure', label: "Forfait pour l'heure" },
                                  { id: 'forfait_jour', label: 'Forfait fixe par jour' },
                                  { id: 'pourcentage', label: 'Pourcentage du tarif' }
                                ].map(type => (
                                  <button 
                                    key={type.id} 
                                    onClick={() => setAgencySettings({...agencySettings, penalties: {...agencySettings.penalties, lateType: type.id as any}})}
                                    className={`p-5 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-between ${agencySettings.penalties.lateType === type.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                                  >
                                    {type.label}
                                    {agencySettings.penalties.lateType === type.id && <Check size={18} strokeWidth={3} />}
                                  </button>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-6">
                             <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 space-y-4">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} /> Grace Period</p>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temps de tolérance (Minutes)</label>
                                <div className="relative group">
                                   <input 
                                     type="number" 
                                     value={agencySettings.penalties.lateTolerance} 
                                     onChange={e => setAgencySettings({...agencySettings, penalties: {...agencySettings.penalties, lateTolerance: parseInt(e.target.value) || 0}})}
                                     className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-2xl outline-none focus:border-blue-500 shadow-inner" 
                                   />
                                   <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Min.</div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner"><Gauge size={20} /></div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Limites de Kilométrage</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <NumericSetting label="Limite Journalière" unit="KMS" value={agencySettings.penalties.mileageDailyLimit} onChange={v => setAgencySettings({...agencySettings, penalties: {...agencySettings.penalties, mileageDailyLimit: v}})} />
                          <NumericSetting label="Tolérance Gratuite" unit="KMS" value={agencySettings.penalties.mileageTolerance} onChange={v => setAgencySettings({...agencySettings, penalties: {...agencySettings.penalties, mileageTolerance: v}})} />
                          <NumericSetting label="Prix KM Excédent" unit="DA" value={agencySettings.penalties.mileageExtraPrice} onChange={v => setAgencySettings({...agencySettings, penalties: {...agencySettings.penalties, mileageExtraPrice: v}})} />
                          <NumericSetting label="KM Illimité (Jour)" unit="DA" value={agencySettings.penalties.mileageUnlimitedPrice} onChange={v => setAgencySettings({...agencySettings, penalties: {...agencySettings.penalties, mileageUnlimitedPrice: v}})} />
                       </div>
                    </div>

                    <div className="space-y-8">
                       <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner"><Fuel size={20} /></div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Gestion du Carburant</h3>
                       </div>
                       <div className="max-w-sm">
                          <NumericSetting label="Prix par unité manquante" unit="DA" value={agencySettings.penalties.fuelMissingPrice} onChange={v => setAgencySettings({...agencySettings, penalties: {...agencySettings.penalties, fuelMissingPrice: v}})} />
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-12">
                    <div className="p-10 bg-slate-900 rounded-[3rem] text-white space-y-6 shadow-3xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={120} /></div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black tracking-tight">Accès Administrateur Cloud</h3>
                        <p className="text-sm font-bold text-slate-400 mt-2">Mettez à jour vos identifiants pour garantir la sécurité du parc.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 relative z-10">
                        <SettingsInput label="Email Actuel / Identifiant" icon={Mail} value={newEmail} onChange={setNewEmail} dark />
                        <div className="hidden md:block" />
                        <SettingsInput label="Nouveau Mot de Passe" icon={Key} type="password" value={newPassword} onChange={setNewPassword} placeholder="••••••••" dark />
                        <SettingsInput label="Confirmer Mot de Passe" icon={Key} type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" dark />
                      </div>
                      <div className="pt-6 border-t border-white/10 flex justify-end relative z-10">
                        <button 
                          onClick={handleUpdateAuth}
                          disabled={isUpdatingAuth}
                          className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-blue-500 shadow-xl disabled:opacity-50"
                        >
                          {isUpdatingAuth ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                          Mettre à jour mes accès
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'backup' && (
                  <div className="space-y-12 py-10 text-center max-w-2xl mx-auto">
                    <div className="w-24 h-24 rounded-[3rem] bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner border border-indigo-100"><Database size={48} /></div>
                    <div className="space-y-4">
                       <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Sauvegarde Intégrale</h3>
                       <p className="text-slate-500 font-bold text-lg leading-relaxed">Exporter l'intégralité de votre base de données dans un fichier chiffré.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <button className="flex items-center justify-center gap-4 bg-slate-900 text-white py-6 rounded-3xl font-black shadow-2xl active:scale-95 transition-all uppercase text-xs tracking-widest">
                         <Download size={24} />
                         Exporter DB (.SQL)
                       </button>
                       <button className="flex items-center justify-center gap-4 bg-white border-4 border-slate-100 text-slate-700 py-6 rounded-3xl font-black hover:bg-slate-50 active:scale-95 transition-all uppercase text-xs tracking-widest">
                         <Upload size={24} />
                         Restaurer Archives
                       </button>
                    </div>
                  </div>
                )}

                <div className="pt-12 border-t border-slate-100 flex justify-end gap-4">
                   <button onClick={() => showToast('Changements ignorés', 'info')} className="px-10 py-5 font-black text-slate-400 uppercase text-xs tracking-widest">Ignorer</button>
                   <button 
                     onClick={handleSaveToCloud}
                     disabled={isSaving}
                     className="bg-aurora text-white px-12 py-5 rounded-[1.75rem] font-black shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-3 uppercase text-xs tracking-[0.2em] disabled:opacity-50"
                   >
                     {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
                     Valider le paramétrage
                   </button>
                </div>
             </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const NumericSetting = ({ label, unit, value, onChange }: { label: string, unit: string, value: number, onChange: (v: number) => void }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
       <input 
         type="number" 
         value={value} 
         onChange={e => onChange?.(parseInt(e.target.value) || 0)} 
         className="w-full pl-6 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl outline-none focus:border-blue-500 shadow-inner transition-all" 
       />
       <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">{unit}</div>
    </div>
  </div>
);

const SettingsInput = ({ label, icon: Icon, placeholder, type = "text", value, onChange, dark = false }: any) => (
  <div className="space-y-2 w-full">
    <label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</label>
    <div className="relative group">
      {Icon && <Icon className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${dark ? 'text-slate-700 group-focus-within:text-blue-400' : 'text-slate-300 group-focus-within:text-blue-500'}`} size={20} />}
      <input 
        type={type} 
        placeholder={placeholder} 
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        className={`w-full ${Icon ? 'pl-14' : 'px-6'} pr-6 py-5 rounded-[1.75rem] outline-none font-bold text-sm transition-all shadow-inner ${dark ? 'bg-white/5 border border-white/10 text-white focus:bg-white/10' : 'bg-slate-50 border-2 border-slate-100 text-slate-700 focus:bg-white focus:border-blue-500'}`} 
      />
    </div>
  </div>
);

export default SettingsPage;
