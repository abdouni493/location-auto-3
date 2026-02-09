import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut, Sparkles, LayoutDashboard, Calendar, ClipboardList, Receipt, Settings as SettingsIcon } from 'lucide-react';
import { MENU_ITEMS, TRANSLATIONS } from '../constants';
import { Language, Direction, UserSession, WorkerRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import Breadcrumbs from './Breadcrumbs';
import { useApp } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  lang: Language;
  setLang: (l: Language) => void;
  user: UserSession;
  setUser: (u: UserSession) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, lang, setLang, user, setUser }) => {
  const { agencySettings, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const dir: Direction = lang === 'ar' ? 'rtl' : 'ltr';
  // Fix: Added isRtl definition to resolve error in logout button label
  const isRtl = lang === 'ar';
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  const filteredMenuItems = MENU_ITEMS.filter(item => item.allowedRoles.includes(user.role));
  
  const mobileNavItems = [
    { id: 'dashboard', icon: LayoutDashboard, path: '/', label: 'dashboard' },
    { id: 'planner', icon: Calendar, path: '/planner', label: 'planner' },
    { id: 'operations', icon: ClipboardList, path: '/operations', label: 'operations' },
    { id: 'finance', icon: Receipt, path: '/finance', label: 'payments' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-row font-sans selection:bg-blue-100 selection:text-blue-600 overflow-x-hidden">
      {/* PC Sidebar - Fixed for geometric perfection */}
      <aside className={`hidden lg:flex flex-col w-[340px] h-screen sticky top-0 shrink-0 p-8 ${dir === 'rtl' ? 'order-last border-l' : 'border-r'} border-slate-100 bg-white shadow-[20px_0_60px_-15px_rgba(0,0,0,0.02)] z-50`}>
        <div className="flex items-center gap-4 mb-14 px-2">
          {agencySettings.logo ? (
            <div className="w-14 h-14 bg-slate-50 rounded-2xl p-2 flex items-center justify-center shadow-sm">
              <img src={agencySettings.logo} className="max-w-full max-h-full object-contain" alt="Logo" />
            </div>
          ) : (
            <div className="bg-aurora w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center">
              <Sparkles className="text-white" size={28} />
            </div>
          )}
          <div className="overflow-hidden">
            <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none truncate">{agencySettings.name}</h1>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mt-1 block">Cloud Executive</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar pr-2 -mr-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`relative flex items-center gap-4 px-6 py-[18px] rounded-[1.75rem] transition-all duration-300 group ${
                  active 
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <div className={`shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-blue-400' : ''}`}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className="font-black tracking-widest text-[11px] uppercase">{t(item.label)}</span>
                {active && <motion.div layoutId="activePill" className="absolute right-4 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-50 space-y-4">
          <button 
            onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')} 
            className="w-full flex items-center justify-center gap-3 bg-slate-50 text-slate-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100"
          >
            <Globe size={16} /> {lang === 'fr' ? 'العربية' : 'Français'}
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 bg-rose-50 text-rose-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
          >
            <LogOut size={16} /> {isRtl ? 'تسجيل الخروج' : 'Déconnexion'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        <header className="h-24 px-8 lg:px-14 flex items-center justify-between sticky top-0 z-[40] bg-[#f8fafc]/90 backdrop-blur-2xl border-b border-slate-200/50">
          <div className="flex items-center gap-6">
            <div className="lg:hidden">
              {agencySettings.logo ? (
                <img src={agencySettings.logo} className="w-10 h-10 object-contain rounded-xl" alt="Logo" />
              ) : (
                <div className="bg-aurora p-2 rounded-xl shadow-lg">
                  <Sparkles className="text-white" size={18} />
                </div>
              )}
            </div>
            <div className="hidden lg:block">
              <Breadcrumbs lang={lang} />
            </div>
          </div>

          <div className="flex items-center gap-6 lg:gap-8">
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-black text-slate-900 tracking-tight leading-none">{user.fullName}</p>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1.5">{user.role}</p>
              </div>
              <button onClick={() => setMenuOpen(true)} className="lg:hidden w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 active:scale-90 transition-all">
                <Menu size={24} />
              </button>
              <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-xl overflow-hidden bg-slate-200 ring-4 ring-slate-100/50 hidden lg:block">
                <img src={user.avatar} className="w-full h-full object-cover" alt="user" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 sm:px-8 lg:px-14 pt-8 pb-32 lg:pb-16 w-full max-w-[1800px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* NEW Mobile Navigation Design based on user image */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[100] flex justify-center">
        <nav className="h-24 w-full bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex items-center justify-between px-3 border border-white/10">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link 
                key={item.id} 
                to={item.path} 
                className={`flex-1 flex flex-col items-center justify-center transition-all duration-500 rounded-[1.75rem] h-[80%] mx-1
                  ${active ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400'}
                `}
              >
                <Icon size={active ? 20 : 26} strokeWidth={active ? 3 : 2} />
                {active && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[8px] font-black uppercase mt-1 tracking-tighter text-center px-2"
                  >
                    {t(item.label)}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200]" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white z-[210] shadow-2xl flex flex-col p-8">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-3">
                   {agencySettings.logo ? (
                     <img src={agencySettings.logo} className="w-8 h-8 object-contain rounded-lg" alt="" />
                   ) : (
                     <div className="w-10 h-10 rounded-xl bg-aurora flex items-center justify-center text-white"><Sparkles size={20} /></div>
                   )}
                   <h2 className="text-xl font-black text-slate-900">Menu</h2>
                </div>
                <button onClick={() => setMenuOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl"><X size={24} /></button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                 {filteredMenuItems.map(item => (
                   <Link key={item.id} to={item.path} onClick={() => setMenuOpen(false)} className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${location.pathname === item.path ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                      <item.icon size={20} /> {t(item.label)}
                   </Link>
                 ))}
              </div>
              <div className="pt-8 border-t border-slate-100 space-y-4">
                 <button onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')} className="w-full flex items-center gap-4 px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest"><Globe size={20} /> {lang === 'fr' ? 'العربية' : 'Français'}</button>
                 <button onClick={logout} className="w-full flex items-center gap-4 px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm uppercase tracking-widest"><LogOut size={20} /> Déconnexion</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;