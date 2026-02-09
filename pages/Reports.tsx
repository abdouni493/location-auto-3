
import React, { useState, useMemo } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Reservation, Property, Maintenance, Expense, Client } from '../types';
import { 
  BarChart3, Calendar, TrendingUp, Wallet, 
  Users, Car, ArrowUpRight, ArrowDownRight, 
  Download, Printer, FileText, PieChart,
  CalendarDays, Zap, ShieldCheck, Banknote,
  Wrench, Activity, Search, Filter, MoreVertical,
  ChevronRight, ArrowRight, Loader2, Sparkles,
  Info, AlertCircle, Receipt, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../App';

const Reports: React.FC<{ lang: Language }> = ({ lang }) => {
  const { reservations, properties, maintenance, expenses, clients } = useApp();
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isRtl = lang === 'ar';
  
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500)); // Simulate deep calculation

    const start = new Date(dates.start);
    const end = new Date(dates.end);

    const periodRes = reservations.filter(r => {
      const d = new Date(r.startDate);
      return d >= start && d <= end;
    });

    const periodMaint = maintenance.filter(m => {
      const d = new Date(m.date);
      return d >= start && d <= end;
    });

    const periodExp = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    const newClients = clients.filter(c => {
      const d = new Date(c.registrationDate);
      return d >= start && d <= end;
    });

    const totalRevenue = periodRes.reduce((acc, r) => acc + r.paidAmount, 0);
    const totalMaintCost = periodMaint.reduce((acc, m) => acc + m.cost, 0);
    const totalAgencyExp = periodExp.reduce((acc, e) => acc + e.cost, 0);
    const netProfit = totalRevenue - (totalMaintCost + totalAgencyExp);

    setReportData({
      reservations: periodRes,
      maintenance: periodMaint,
      expenses: periodExp,
      newClients,
      stats: {
        revenue: totalRevenue,
        costs: totalMaintCost + totalAgencyExp,
        profit: netProfit,
        resCount: periodRes.length,
        maintCount: periodMaint.length,
        clientGrowth: newClients.length,
        carUtilization: 85 // Mocked for demo
      }
    });
    setIsGenerating(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-1">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">
            Intelligence <span className="text-gradient">Analytique</span>
          </h1>
          <p className="text-slate-500 mt-2 font-bold text-lg leading-tight">
            Générez des bilans complets sur l'intégralité de votre activité.
          </p>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <button className="p-5 bg-white border border-slate-100 rounded-2xl text-slate-600 shadow-sm flex items-center justify-center transition-all hover:bg-slate-50 active:scale-95">
             <Printer size={22} />
          </button>
          <button className="bg-aurora text-white px-10 py-5 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
            <Download size={22} />
            <span>Exporter Rapport</span>
          </button>
        </div>
      </header>

      {/* Control Panel */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
           <Activity size={240} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-end relative z-10">
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                 <CalendarDays size={14} className="text-blue-500" /> Date de début
              </label>
              <input 
                type="date" 
                value={dates.start} 
                onChange={e => setDates({...dates, start: e.target.value})} 
                className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-slate-800 outline-none focus:border-blue-500 shadow-inner transition-all" 
              />
           </div>
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                 <CalendarDays size={14} className="text-blue-500" /> Date de fin
              </label>
              <input 
                type="date" 
                value={dates.end} 
                onChange={e => setDates({...dates, end: e.target.value})} 
                className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-slate-800 outline-none focus:border-blue-500 shadow-inner transition-all" 
              />
           </div>
           <button 
             onClick={generateReport}
             disabled={isGenerating}
             className="w-full h-[76px] bg-slate-900 text-white rounded-[2rem] font-black shadow-2xl flex items-center justify-center gap-4 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
           >
             {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} className="text-blue-400" />}
             <span className="uppercase tracking-[0.2em] text-sm">Générer Rapport Global</span>
           </button>
        </div>

        <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-start gap-5">
           <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0"><Sparkles className="text-blue-500" size={24} /></div>
           <p className="text-xs font-bold text-blue-700 leading-relaxed pt-1">
             Notre moteur d'analyse compile instantanément les revenus locatifs, les dépenses d'entretien véhicule, les frais de fonctionnement agence et la croissance de votre portefeuille client sur la période sélectionnée.
           </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {reportData && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-12"
          >
            {/* KPI OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <ReportKPI label="Revenu Brut" value={reportData.stats.revenue} icon={TrendingUp} color="emerald" sub="Dossiers encaissés" />
               <ReportKPI label="Charges Totales" value={reportData.stats.costs} icon={Wallet} color="rose" sub="Maint. + Agence" />
               <ReportKPI label="Bénéfice Net" value={reportData.stats.profit} icon={Banknote} color="blue" sub="Résultat d'exploitation" special />
               <ReportKPI label="Utilisation" value={reportData.stats.carUtilization} icon={Activity} color="indigo" sub="Taux occupation moyen" isPercent />
            </div>

            {/* SECTIONS GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
               
               {/* 1. RESERVATIONS LISTING */}
               <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8 flex flex-col h-full">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner"><History size={24} /></div>
                        <div>
                           <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Journal des Locations</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{reportData.reservations.length} Contrats identifiés</p>
                        </div>
                     </div>
                     <button className="p-3 bg-slate-50 rounded-xl text-slate-400"><MoreVertical size={20}/></button>
                  </div>
                  <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                     {reportData.reservations.map((r: Reservation) => (
                       <ReportEntry key={r.id} title={r.clientName} sub={r.vehicleName} meta={r.resNumber} value={r.totalAmount} color="text-slate-900" icon={Users} />
                     ))}
                  </div>
                  <button className="w-full py-5 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors">Voir tous les contrats</button>
               </section>

               {/* 2. MAINTENANCE LOGS */}
               <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8 flex flex-col h-full">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner"><Wrench size={24} /></div>
                        <div>
                           <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Registre de Maintenance</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{reportData.maintenance.length} Interventions atelier</p>
                        </div>
                     </div>
                     <button className="p-3 bg-slate-50 rounded-xl text-slate-400"><MoreVertical size={20}/></button>
                  </div>
                  <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                     {reportData.maintenance.map((m: Maintenance) => (
                       <ReportEntry key={m.id} title={m.type} sub={m.vehicleName} meta={m.date} value={m.cost} color="text-rose-600" icon={Wrench} isExpense />
                     ))}
                  </div>
                  <button className="w-full py-5 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors">Bilan Technique Complet</button>
               </section>

               {/* 3. AGENCY EXPENSES */}
               <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8 flex flex-col h-full">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner"><Receipt size={24} /></div>
                        <div>
                           <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Charges d'Exploitation</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{reportData.expenses.length} Écritures comptables</p>
                        </div>
                     </div>
                     <button className="p-3 bg-slate-50 rounded-xl text-slate-400"><MoreVertical size={20}/></button>
                  </div>
                  <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                     {reportData.expenses.map((e: Expense) => (
                       <ReportEntry key={e.id} title={e.name} sub={e.category} meta={e.date} value={e.cost} color="text-amber-600" icon={Wallet} isExpense />
                     ))}
                  </div>
               </section>

               {/* 4. CLIENT GROWTH & STATS */}
               <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8 flex flex-col h-full">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner"><Users size={24} /></div>
                        <div>
                           <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Développement Clientèle</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{reportData.newClients.length} Nouvelles inscriptions</p>
                        </div>
                     </div>
                     <button className="p-3 bg-slate-50 rounded-xl text-slate-400"><MoreVertical size={20}/></button>
                  </div>
                  <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                     {reportData.newClients.map((c: Client) => (
                       <div key={c.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm">{c.firstName[0]}{c.lastName[0]}</div>
                             <div>
                                <p className="text-sm font-black text-slate-900">{c.firstName} {c.lastName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.phone}</p>
                             </div>
                          </div>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Nouveau</span>
                       </div>
                     ))}
                     {reportData.newClients.length === 0 && (
                        <div className="h-40 flex flex-col items-center justify-center text-center opacity-40 grayscale space-y-2">
                           <Users size={40} />
                           <p className="text-xs font-black uppercase tracking-widest">Aucun nouveau client</p>
                        </div>
                     )}
                  </div>
               </section>

            </div>

            {/* VEHICLE PROFITABILITY TABLE */}
            <div className="bg-slate-900 p-10 lg:p-14 rounded-[4rem] text-white shadow-3xl space-y-12">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-10">
                  <div className="space-y-2">
                     <h3 className="text-3xl font-black tracking-tighter">Profitabilité par Unité</h3>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Analyse croisée Revenus vs Maintenance</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                     <ShieldCheck size={20} className="text-emerald-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Données certifiées</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {properties.map(p => {
                    const carRes = reportData.reservations.filter((r: Reservation) => r.vehicleId === p.id);
                    const carRev = carRes.reduce((acc: number, r: Reservation) => acc + r.paidAmount, 0);
                    const carMaint = reportData.maintenance.filter((m: Maintenance) => m.vehicleId === p.id);
                    const carCost = carMaint.reduce((acc: number, m: Maintenance) => acc + m.cost, 0);
                    const carProfit = carRev - carCost;

                    return (
                      <motion.div whileHover={{ y: -5 }} key={p.id} className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 space-y-6 group transition-all">
                         <div className="flex items-center gap-4">
                            <img src={p.image} className="w-16 h-16 rounded-2xl object-cover shadow-2xl" alt="" />
                            <div>
                               <p className="font-black text-lg tracking-tight leading-none">{p.brand} {p.model}</p>
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5">{p.plate}</p>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-6">
                            <div className="space-y-1">
                               <p className="text-[8px] font-black text-slate-500 uppercase">Généré</p>
                               <p className="font-black text-emerald-400">{carRev.toLocaleString()} DA</p>
                            </div>
                            <div className="space-y-1 text-right">
                               <p className="text-[8px] font-black text-slate-500 uppercase">Coûts</p>
                               <p className="font-black text-rose-400">{carCost.toLocaleString()} DA</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Période</p>
                            <p className={`text-2xl font-black tracking-tighter ${carProfit >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>{carProfit.toLocaleString()} DA</p>
                         </div>
                      </motion.div>
                    );
                  })}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReportKPI = ({ label, value, icon: Icon, color, sub, special = false, isPercent = false }: any) => {
  const colorMap: any = {
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className={`p-8 rounded-[3rem] bg-white border border-slate-100 shadow-xl relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${special ? 'ring-4 ring-blue-50' : ''}`}>
       <div className="flex justify-between items-start mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${colorMap[color]}`}>
             <Icon size={24} />
          </div>
          {special && (
             <div className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest animate-bounce">Focus</div>
          )}
       </div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
       <div className="flex items-baseline gap-1.5">
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{value.toLocaleString()}</p>
          <span className={`text-[10px] font-black uppercase ${colorMap[color].split(' ')[1]}`}>{isPercent ? '%' : 'DA'}</span>
       </div>
       <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 tracking-widest border-t border-slate-50 pt-4">{sub}</p>
    </div>
  );
};

const ReportEntry = ({ title, sub, meta, value, color, icon: Icon, isExpense = false }: any) => (
  <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
     <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shadow-sm"><Icon size={20}/></div>
        <div>
           <p className="text-base font-black text-slate-900 leading-tight">{title}</p>
           <div className="flex items-center gap-2 mt-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{sub}</p>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">{meta}</p>
           </div>
        </div>
     </div>
     <div className="text-right">
        <p className={`text-xl font-black tracking-tighter ${color}`}>{isExpense ? '-' : '+'}{value.toLocaleString()} <span className="text-[10px]">DA</span></p>
     </div>
  </div>
);

export default Reports;
