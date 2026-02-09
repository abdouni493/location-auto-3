import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TRANSLATIONS } from '../constants';
import { Language, UserSession, Reservation } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, Car, Calendar, Clock, AlertCircle, 
  ArrowUpRight, ArrowDownRight, BrainCircuit, Sparkles, ChevronRight,
  Wallet, History, Star, MapPin, CheckCircle, Loader2, Plus, Zap, Activity,
  Landmark, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardSkeleton } from '../components/Skeleton';
import { useApp } from '../App';

const earningsData = [
  { name: 'Lun', value: 24000 }, { name: 'Mar', value: 36000 }, { name: 'Mer', value: 31000 },
  { name: 'Jeu', value: 48000 }, { name: 'Ven', value: 54000 }, { name: 'Sam', value: 68000 },
  { name: 'Dim', value: 59000 },
];

const categoryData = [
  { name: 'Écono.', value: 450, color: '#3b82f6' },
  { name: 'Luxe', value: 180, color: '#8b5cf6' },
  { name: 'Util.', value: 120, color: '#10b981' },
];

const Dashboard: React.FC<{ lang: Language, user: UserSession }> = ({ lang, user }) => {
  const { reservations, properties, maintenance, refreshData } = useApp();
  const navigate = useNavigate();
  const t = (key: string) => TRANSLATIONS[key.toLowerCase()]?.[lang] || key;
  const isRtl = lang === 'ar';
  
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const stats = useMemo(() => [
    { label: 'totalReservations', value: reservations.length.toString(), change: '+12%', isUp: true, icon: Calendar, color: 'blue' },
    { label: 'earnings', value: `${reservations.reduce((acc, r) => acc + r.paidAmount, 0).toLocaleString()} ${t('currencyDA')}`, change: '+24%', isUp: true, icon: TrendingUp, color: 'purple' },
    { label: 'lateReturns', value: '3', change: '-2', isUp: false, icon: AlertCircle, color: 'rose' },
    { label: 'availableVehicles', value: properties.filter(p => p.availability).length.toString(), change: '+5', isUp: true, icon: Car, color: 'emerald' },
  ], [reservations, properties, t]);

  const isLoading = reservations.length === 0 && properties.length === 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <CardSkeleton /> <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none">
            {t('hello')}, <span className="text-gradient">{user.fullName}</span>
          </h1>
          <p className="text-slate-500 font-bold text-lg lg:text-xl leading-tight">{t('readyForTasks')}</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/planner')}
          className="bg-slate-900 text-white px-10 py-5 lg:px-12 lg:py-6 rounded-[2rem] font-black shadow-2xl flex items-center justify-center gap-4 transition-all uppercase text-xs tracking-[0.2em]"
        >
          <Plus size={24} strokeWidth={3} />
          {t('newReservation')}
        </motion.button>
      </header>

      {/* KPI Stats Grid Optimized for PC */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div key={i} whileHover={{ y: -8 }} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl relative overflow-hidden group transition-all duration-500">
            <div className="flex justify-between items-start mb-8">
              <div className={`w-16 h-16 rounded-[1.75rem] bg-slate-50 flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500`}>
                <stat.icon size={32} />
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-black px-4 py-2 rounded-xl ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">{t(stat.label)}</p>
            <p className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section Optimized for PC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white p-10 lg:p-14 rounded-[4.5rem] border border-slate-100 shadow-2xl flex flex-col h-[550px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-12">
             <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{t('revenueFlow')}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Évolution des encaissements sur 7 jours</p>
             </div>
             <div className="flex gap-2">
                <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">7 Jours</button>
                <button className="px-5 py-2.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100">30 Jours</button>
             </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsData}>
                <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }} dx={-10} />
                <Tooltip cursor={{ stroke: '#3b82f6', strokeWidth: 2 }} contentStyle={{ borderRadius: '2.5rem', border: 'none', boxShadow: '0 40px 80px rgba(0,0,0,0.15)', padding: '24px' }} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={6} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 p-10 lg:p-14 rounded-[4.5rem] shadow-3xl flex flex-col h-[550px] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Zap size={250} /></div>
          <h3 className="text-3xl font-black tracking-tighter mb-2">Performance Flotte</h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-12">Taux d'occupation par gamme</p>
          <div className="flex-1 min-h-0 relative z-10">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={categoryData} layout="vertical">
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} width={60} />
                 <Bar dataKey="value" radius={[0, 25, 25, 0]} barSize={28}>
                   {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
          <div className="space-y-6 mt-10 pt-10 border-t border-white/5 relative z-10">
             <div className="flex items-center justify-between">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Fleet Score</span>
               <span className="text-3xl font-black text-emerald-400 tracking-tighter">82%</span>
             </div>
             <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;