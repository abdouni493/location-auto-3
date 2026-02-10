import React, { useState, useMemo, memo, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Client, UserSession, Reservation } from '../types';
import { 
  Plus, Search, User, Phone, Mail, MapPin, 
  MoreVertical, Eye, Edit2, Trash2, History,
  ChevronDown, Filter, CreditCard, Calendar, AlertCircle, RotateCcw,
  X, IdCard, Wallet, TrendingUp, CheckCircle, Clock, Landmark, Hash, UserCheck, ShieldCheck,
  ImageIcon, FileText, Download, Camera, Globe, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ClientForm from '../components/ClientForm';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useDebounce } from '../hooks/useDebounce';
import { usePersistentFilters } from '../hooks/usePersistentFilters';
import { useApp } from '../App';
import { supabase } from '../supabase';

interface TenantFilters {
  search: string;
  regDate: string;
}

const initialFilters: TenantFilters = {
  search: '',
  regDate: ''
};

const ClientCard = memo(({ client, t, isRtl, onEdit, onViewDetails, onViewHistory, onDelete, isActive, onToggleMenu }: any) => {
  return (
    <motion.div 
      layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} 
      className="group bg-white rounded-[4rem] border border-slate-100 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all duration-500 relative flex flex-col h-[560px] overflow-visible"
    >
      <div className="p-10 pb-6 flex flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 text-slate-900 flex items-center justify-center text-4xl font-black shadow-inner border-2 border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-700 overflow-hidden ring-4 ring-slate-100 ring-offset-4 ring-offset-white">
            {client.avatar ? (
              <img src={client.avatar} className="w-full h-full object-cover" alt="Profile" loading="lazy" />
            ) : (
              <span className="opacity-40">{client.firstName[0]}{client.lastName[0]}</span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-xl flex items-center justify-center text-blue-600">
            <UserCheck size={22} />
          </div>
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none truncate w-full px-4">{client.firstName} {client.lastName}</h3>
        {client.nickname && <span className="mt-4 px-5 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg">{client.nickname}</span>}
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-5">#ID-{client.id.slice(-6).toUpperCase()}</p>
      </div>

      <div className="absolute top-8 right-8 z-[60]">
        <button onClick={onToggleMenu} className={`p-2.5 rounded-xl transition-all shadow-xl border border-slate-100 ${isActive ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-white/80 text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
          <MoreVertical size={22} />
        </button>
        <AnimatePresence>
          {isActive && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-4 w-60 bg-white/95 backdrop-blur-3xl rounded-[2.25rem] shadow-3xl border border-slate-100 p-2 z-[100] overflow-hidden`}>
              <MenuAction icon={Eye} label="Fiche Client" iconClassName="text-blue-500" onClick={onViewDetails} />
              <MenuAction icon={History} label="Contrats" iconClassName="text-indigo-500" onClick={onViewHistory} />
              <MenuAction icon={Edit2} label="Éditer" iconClassName="text-slate-900" onClick={onEdit} />
              <div className="h-px bg-slate-100 my-2 mx-4" />
              <MenuAction icon={Trash2} label="Supprimer" variant="danger" onClick={onDelete} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-10 py-8 space-y-6 border-y border-slate-50 mt-4 flex-1">
         <ContactItem icon={Phone} text={client.phone} label="Mobile" />
         <ContactItem icon={Mail} text={client.email || 'Non renseigné'} label="Email Professionnel" />
         <ContactItem icon={MapPin} text={client.wilaya || 'Algérie'} label="Secteur" />
      </div>

      <div className="p-10 grid grid-cols-2 gap-8 bg-slate-50/50">
         <div className="space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrats</p><p className="text-2xl font-black text-slate-900">{client.totalReservations || 0}</p></div>
         <div className="space-y-2 text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Investissement</p><p className="text-2xl font-black text-blue-600 tracking-tighter">{(client.totalSpending || 0).toLocaleString()} <span className="text-xs">DA</span></p></div>
      </div>
    </motion.div>
  );
});

const Tenants: React.FC<{ lang: Language, user: UserSession }> = ({ lang, user }) => {
  const { clients, reservations, refreshData } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [filters, setFilters, resetFilters] = usePersistentFilters<TenantFilters>(user, 'tenants', initialFilters);
  const debouncedSearch = useDebounce(filters.search, 200);
  
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isRtl = lang === 'ar';

  const filteredClients = useMemo(() => {
    const searchLow = debouncedSearch.toLowerCase();
    return clients.filter(c => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      return (name.includes(searchLow) || c.phone.includes(debouncedSearch)) && (!filters.regDate || c.registrationDate === filters.regDate);
    });
  }, [debouncedSearch, filters.regDate, clients]);

  return (
    <div className="space-y-12 pb-20 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 px-1">
        <div className="space-y-2">
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none">{isRtl ? 'قاعدة' : 'Hub'} <span className="text-gradient">{isRtl ? 'العملاء' : 'Clientèle'}</span></h1>
          <p className="text-slate-500 font-bold text-xl leading-tight">Relation client et gestion des portefeuilles Cloud.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group min-w-[340px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24}/>
            <input type="text" placeholder="Rechercher un membre..." className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-lg text-slate-900 outline-none focus:border-blue-500 shadow-xl shadow-slate-200/20" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
          <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => { setEditingClient(null); setShowForm(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-4 transition-all uppercase text-xs tracking-widest"><Plus size={24} strokeWidth={3} /><span>{t('addClient')}</span></motion.button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} t={t} isRtl={isRtl} isActive={activeMenu === client.id} onToggleMenu={() => setActiveMenu(activeMenu === client.id ? null : client.id)} onEdit={() => { setEditingClient(client); setShowForm(true); setActiveMenu(null); }} onViewDetails={() => setActiveMenu(null)} onViewHistory={() => setActiveMenu(null)} onDelete={() => { setClientToDelete(client); setActiveMenu(null); }} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showForm && <ClientForm lang={lang} onClose={() => { setShowForm(false); setEditingClient(null); }} editingClient={editingClient} />}
      </AnimatePresence>

      <ConfirmationDialog isOpen={!!clientToDelete} onClose={() => setClientToDelete(null)} onConfirm={async () => { await supabase.from('clients').delete().eq('id', clientToDelete.id); await refreshData(); setClientToDelete(null); }} title="Suppression" message="Effacer définitivement ce dossier client ?" lang={lang} />
    </div>
  );
};

const MenuAction = ({ icon: Icon, label, variant = 'default', onClick, iconClassName = "" }: any) => (
  <motion.button whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }} onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-4 font-black text-[11px] uppercase tracking-widest transition-all rounded-[1.75rem] mb-1 last:mb-0 ${variant === 'danger' ? 'text-rose-500 bg-rose-50/30' : 'text-slate-600 hover:bg-slate-50'}`}>
    <div className={`shrink-0 ${iconClassName}`}><Icon size={18} strokeWidth={2.5} /></div>{label}
  </motion.button>
);

const ContactItem = ({ icon: Icon, text, label }: any) => (
  <div className="flex items-center gap-5 group"><div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shadow-inner shrink-0 border border-transparent group-hover:border-blue-100"><Icon size={20} /></div><div className="flex-1 overflow-hidden"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p><p className="text-sm font-black text-slate-800 truncate">{text}</p></div></div>
);

export default Tenants;