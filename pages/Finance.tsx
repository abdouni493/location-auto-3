
import React, { useState, useMemo, useEffect } from 'react';
import { TRANSLATIONS, MOCK_INVOICES } from '../constants';
import { Language, Invoice, UserSession, Reservation } from '../types';
import { 
  Filter, Receipt, FileText, FileSpreadsheet, 
  Eye, Trash2, X, History, Wallet,
  Lock, Clock, Download, Printer, Sparkles, Type, MapPin, 
  Settings2, Edit3, CheckCircle, ChevronDown, MoreVertical,
  Calendar, User, Banknote, ShieldCheck, Info, Share2, Palette, Layout,
  Car, Plus, Landmark, Mail, Phone, Wrench, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import BottomSheet from '../components/BottomSheet';
import { useApp } from '../App';
import { TableSkeleton } from '../components/Skeleton';
import { useNavigate } from 'react-router-dom';

// Fix: Missing DocumentList component
const DocumentList = ({ items, isRtl, handlePrint, setViewingDoc }: any) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-1">
      {items.map((item: any) => (
        <motion.div 
          key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="group bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-500 relative flex flex-col h-full overflow-hidden"
        >
          <div className="flex justify-between items-start mb-6">
             <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
               <Receipt size={28} />
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => setViewingDoc(item)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all"><Eye size={20}/></button>
                <button onClick={() => handlePrint(item)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"><Printer size={20}/></button>
             </div>
          </div>
          <div className="flex-1">
             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{item.status}</span>
             <h3 className="text-xl font-black text-slate-900 tracking-tight mt-4 leading-none">{item.number}</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{item.clientName}</p>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-50 flex items-end justify-between">
             <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Date</p><p className="text-sm font-bold text-slate-700">{item.date}</p></div>
             <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Montant</p><p className="text-2xl font-black text-slate-900 tracking-tighter">{item.amount.toLocaleString()} <span className="text-xs font-black text-blue-500">DA</span></p></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Fix: Missing PersonalGains component for drivers
const PersonalGains = () => (
  <div className="space-y-8">
     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gains du Mois</p>
           <p className="text-4xl font-black tracking-tighter text-emerald-400">45,000 DA</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-4">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Missions Terminées</p>
           <p className="text-4xl font-black tracking-tighter text-blue-600">12</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-4">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note Moyenne</p>
           <p className="text-4xl font-black tracking-tighter text-amber-500">4.9/5</p>
        </div>
     </div>
     <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-10">
        <h3 className="text-xl font-black text-slate-900 mb-8">Historique des missions</h3>
        <div className="space-y-4">
           {[1, 2, 3].map(i => (
             <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400"><History size={20}/></div>
                   <div><p className="font-black text-slate-900">Course Aéroport - Alger Centre</p><p className="text-[10px] font-bold text-slate-400">12 Mai 2024</p></div>
                </div>
                <p className="text-lg font-black text-slate-900">3,500 DA</p>
             </div>
           ))}
        </div>
     </div>
  </div>
);

// Fix: Missing DesignBuilder component for admins
const DesignBuilder = () => {
  const { agencySettings } = useApp();
  return (
    <div className="bg-white p-10 lg:p-14 rounded-[4rem] border border-slate-100 shadow-xl space-y-12">
       <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="max-w-md space-y-4">
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Éditeur de documents</h3>
             <p className="text-slate-500 font-bold text-lg leading-relaxed">Personnalisez l'apparence visuelle de vos factures et contrats pour refléter votre image de marque.</p>
          </div>
          <div className="flex gap-4">
             <div className="w-12 h-12 rounded-full bg-blue-600 shadow-xl border-4 border-white ring-2 ring-blue-50" />
             <div className="w-12 h-12 rounded-full bg-slate-900 shadow-xl border-4 border-white ring-2 ring-slate-50" />
             <div className="w-12 h-12 rounded-full bg-emerald-600 shadow-xl border-4 border-white ring-2 ring-emerald-50" />
          </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
             <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">En-tête de document</p>
                <div className="space-y-4">
                   <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100"><Palette size={20} className="text-blue-500" /><span className="text-xs font-black uppercase">Couleur Primaire</span><div className="ml-auto w-10 h-6 rounded bg-blue-600" /></div>
                   <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100"><Type size={20} className="text-slate-400" /><span className="text-xs font-black uppercase">Typographie</span><span className="ml-auto text-xs font-bold">Jakarta Sans</span></div>
                   <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100"><Layout size={20} className="text-slate-400" /><span className="text-xs font-black uppercase">Mise en page</span><span className="ml-auto text-xs font-bold">Standard Pro</span></div>
                </div>
             </div>
          </div>
          <div className="space-y-6">
             <div className="aspect-[1/1.414] bg-slate-900 rounded-[2rem] p-8 shadow-2xl flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10"><Sparkles size={120} /></div>
                <div className="w-12 h-12 bg-white/20 rounded-xl mb-6" />
                <div className="h-4 w-32 bg-white/20 rounded mb-2" />
                <div className="h-2 w-48 bg-white/10 rounded mb-10" />
                <div className="h-px bg-white/10 mb-8" />
                <div className="flex-1 space-y-4">
                   <div className="h-4 w-full bg-white/10 rounded" />
                   <div className="h-4 w-full bg-white/10 rounded" />
                   <div className="h-4 w-2/3 bg-white/10 rounded" />
                </div>
                <div className="h-10 w-full bg-emerald-500/20 border border-emerald-500/30 rounded-xl mt-auto" />
             </div>
             <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Aperçu interactif du template</p>
          </div>
       </div>
    </div>
  );
};

const Finance: React.FC<{ lang: Language, user: UserSession }> = ({ lang, user }) => {
  const { reservations, showToast, properties, agencySettings } = useApp();
  const navigate = useNavigate();
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isRtl = lang === 'ar';
  
  const [activeTab, setActiveTab] = useState<'Invoice' | 'Contract' | 'Devis' | 'Design' | 'Personal'>(
    user.role === 'Driver' ? 'Personal' : 'Invoice'
  );
  
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Invoice | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const tabs = useMemo(() => {
    if (user.role === 'Driver') return [{ id: 'Personal', label: 'myPay', icon: Wallet }];
    const base = [
      { id: 'Invoice', label: 'invoices', icon: Receipt, color: 'text-emerald-500' },
      { id: 'Contract', label: 'contracts', icon: FileText, color: 'text-blue-500' },
      { id: 'Devis', label: 'devis', icon: FileSpreadsheet, color: 'text-amber-500' },
    ];
    if (user.role === 'Admin') base.push({ id: 'Design', label: 'customization', icon: Settings2, color: 'text-slate-500' });
    return base;
  }, [user.role]);

  const filteredItems = useMemo(() => {
    if (activeTab === 'Design' || activeTab === 'Personal') return [];
    return MOCK_INVOICES.filter((item: Invoice) => 
      item.type === activeTab &&
      (item.number.toLowerCase().includes(search.toLowerCase()) || 
       item.clientName.toLowerCase().includes(search.toLowerCase()))
    );
  }, [activeTab, search]);

  const handlePrint = (item: Invoice | null) => {
    if (!item) return;
    setViewingDoc(item);
    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2 no-print">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">Pôle <span className="text-gradient">Financier</span></h1>
          <p className="text-slate-500 mt-2 font-bold text-lg leading-tight">Pilotez votre facturation et vos revenus à 360°.</p>
        </motion.div>
        <div className="flex items-center gap-4">
           {activeTab !== 'Design' && activeTab !== 'Personal' && (
             <>
               <button onClick={() => setShowFilters(true)} className="p-5 bg-white border border-slate-100 rounded-2xl text-slate-600 shadow-sm flex items-center gap-3 font-black text-xs uppercase transition-all hover:bg-slate-50 active:scale-95">
                 <Filter size={18} /><span>Filtres</span>
               </button>
               <button 
                onClick={() => setShowQuickActions(true)}
                className="bg-aurora text-white px-8 py-5 rounded-2xl font-black shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
               >
                 <Plus size={22} strokeWidth={3} /><span>Action Rapide</span>
               </button>
             </>
           )}
        </div>
      </header>

      <div className="flex items-center gap-2 bg-white p-2.5 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-x-auto no-scrollbar no-print">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 px-8 py-5 rounded-[1.75rem] font-black transition-all whitespace-nowrap text-sm ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl scale-[1.03]' : 'text-slate-500 hover:bg-slate-50'}`}>
            <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : (tab as any).color} strokeWidth={2.5} />
            <span>{t(tab.label)}</span>
          </button>
        ))}
      </div>

      <LayoutGroup>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {loading ? <TableSkeleton /> : (activeTab === 'Personal' ? <PersonalGains /> : activeTab === 'Design' ? <DesignBuilder /> : <DocumentList items={filteredItems} isRtl={isRtl} handlePrint={handlePrint} setViewingDoc={setViewingDoc} />)}
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>

      <BottomSheet isOpen={showQuickActions} onClose={() => setShowQuickActions(false)} title="Actions Financières">
         <div className="grid grid-cols-1 gap-4">
            <QuickActionBtn icon={Wallet} label="Saisir une Dépense" desc="Loyer, électricité, marketing..." color="text-rose-600 bg-rose-50" onClick={() => { navigate('/expenses'); setShowQuickActions(false); }} />
            <QuickActionBtn icon={Wrench} label="Enregistrer Entretien" desc="Vidange, freins, pneumatiques..." color="text-blue-600 bg-blue-50" onClick={() => { navigate('/expenses'); setShowQuickActions(false); }} />
            <QuickActionBtn icon={FileSpreadsheet} label="Nouveau Devis" desc="Estimation pour un prospect" color="text-amber-600 bg-amber-50" onClick={() => { navigate('/planner'); setShowQuickActions(false); }} />
         </div>
      </BottomSheet>
    </div>
  );
};

const QuickActionBtn = ({ icon: Icon, label, desc, color, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center gap-6 p-6 bg-slate-50 hover:bg-white rounded-[2rem] border border-transparent hover:border-slate-100 transition-all group">
     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${color}`}><Icon size={24} /></div>
     <div className="text-left">
        <p className="font-black text-slate-900 uppercase text-xs tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xs font-bold text-slate-400">{desc}</p>
     </div>
     <ArrowRight size={20} className="ml-auto text-slate-200 group-hover:text-blue-500 transition-colors" />
  </button>
);

export default Finance;
