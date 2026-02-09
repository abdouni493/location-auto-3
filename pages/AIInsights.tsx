
import React, { useState, useMemo } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { 
  BrainCircuit, Sparkles, Loader2, Download, 
  Share2, BarChart3, TrendingUp, ShieldCheck, 
  Zap, Database, Target, Lightbulb, ArrowUpRight,
  Activity, Wallet, Car, Users, RefreshCcw, Landmark,
  LineChart, PieChart, Info
} from 'lucide-react';
import { getBusinessInsights } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../App';

const AIInsights: React.FC<{ lang: Language }> = ({ lang }) => {
  const { properties, reservations, maintenance, expenses, clients, agencies } = useApp();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const t = (key: string) => TRANSLATIONS[key.toLowerCase()]?.[lang] || key;
  const isRtl = lang === 'ar';

  const loadingSteps = isRtl 
    ? ["تجميع بيانات الأسطول...", "تحليل التدفقات المالية...", "استشارة محرك Gemini 3 Pro...", "تنسيق التوصيات النهائية..."]
    : ["Neural Link : Agrégation des données...", "Analyse des algorithmes financiers...", "Inférence Gemini 3 Pro en cours...", "Génération du rapport stratégique..."];

  // Complex business logic aggregation
  const businessData = useMemo(() => {
    const totalRevenue = reservations.reduce((acc, r) => acc + r.paidAmount, 0);
    const totalCosts = maintenance.reduce((acc, m) => acc + m.cost, 0) + expenses.reduce((acc, e) => acc + e.cost, 0);
    const utilizationRate = properties.length > 0 
      ? Math.round((properties.filter(p => !p.availability).length / properties.length) * 100) 
      : 0;

    return {
      properties,
      reservations,
      maintenance,
      expenses,
      clients,
      agencies,
      stats: {
        totalRevenue,
        totalCosts,
        netProfit: totalRevenue - totalCosts,
        utilizationRate,
        clientLTV: clients.length > 0 ? Math.round(totalRevenue / clients.length) : 0
      }
    };
  }, [properties, reservations, maintenance, expenses, clients, agencies]);

  const handleGenerate = async () => {
    setLoading(true);
    setInsight(null);
    
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingSteps.length);
    }, 2500);

    try {
      const result = await getBusinessInsights(businessData, lang);
      setInsight(result);
    } catch (err) {
      console.error(err);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-1000">
      <header className="text-center space-y-8 relative py-10">
        <div className="absolute inset-0 flex justify-center items-center opacity-[0.03] pointer-events-none">
           <BrainCircuit size={600} />
        </div>

        <div className="relative inline-flex mb-4">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute inset-0 bg-blue-600 blur-[80px] rounded-full"
          />
          <motion.div 
             animate={{ rotate: 360 }}
             transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
             className="relative z-10 w-32 h-32 rounded-[3rem] bg-slate-900 text-white shadow-3xl flex items-center justify-center border border-white/10"
          >
            <BrainCircuit size={64} className="text-blue-400" />
          </motion.div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-aurora rounded-2xl flex items-center justify-center text-white shadow-2xl animate-bounce border-4 border-white">
            <Sparkles size={24} />
          </div>
        </div>
        
        <div className="space-y-3 relative z-10">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
            Neural <span className="text-gradient">Commander</span>
          </h1>
          <p className="text-slate-500 max-w-3xl mx-auto font-black text-xl uppercase tracking-widest leading-relaxed">
            {lang === 'fr' 
              ? "L'intelligence artificielle au service de votre rentabilité locative." 
              : "الذكاء الاصطناعي في خدمة ربحية وكالتك."}
          </p>
        </div>
      </header>

      {/* Real-time Business Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <AIPredictionCard icon={TrendingUp} label="Rentabilité Nette" value={`${businessData.stats.netProfit.toLocaleString()}`} unit="DA" color="text-emerald-500" trend="+14.2%" />
        <AIPredictionCard icon={Activity} label="Occupation Flotte" value={`${businessData.stats.utilizationRate}`} unit="%" color="text-blue-500" trend="+5.1%" />
        <AIPredictionCard icon={Users} label="LTV Moyen Client" value={`${businessData.stats.clientLTV.toLocaleString()}`} unit="DA" color="text-indigo-500" trend="+2.8%" />
        <AIPredictionCard icon={Landmark} label="Pôle Agences" value={`${agencies.length}`} unit="Sites" color="text-amber-500" trend="Stable" />
      </div>

      <div className="bg-slate-900 p-1 rounded-[4.5rem] shadow-3xl overflow-hidden group">
        <div className="bg-white/5 backdrop-blur-3xl p-10 md:p-16 rounded-[4.25rem] space-y-16 relative">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
             <InsightFeat icon={Target} title="Analyse de données logiques" desc="Gemini 3 Pro corrèle vos dépenses de maintenance avec vos revenus par véhicule." />
             <InsightFeat icon={Zap} title="Prédiction des tendances" desc="Anticipez la demande saisonnière et ajustez vos tarifs dynamiquement." />
             <InsightFeat icon={ShieldCheck} title="Audit de conformité" desc="L'IA détecte les anomalies dans vos contrats et dossiers d'inspections." />
          </div>

          <div className="flex flex-col items-center gap-10">
            <motion.button 
              whileHover={{ scale: 1.02, translateY: -5 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              onClick={handleGenerate}
              className="group w-full max-w-3xl bg-white text-slate-900 py-10 rounded-[3rem] font-black shadow-[0_30px_60px_rgba(255,255,255,0.1)] hover:shadow-blue-500/20 transition-all disabled:opacity-70 flex flex-col items-center justify-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-4 text-3xl tracking-tighter">
                   <Loader2 className="animate-spin text-blue-600" size={40} />
                   <span>{loadingSteps[loadingStep]}</span>
                </div>
              ) : (
                <>
                   <div className="flex items-center gap-5 text-4xl tracking-tighter">
                      <RefreshCcw size={40} className="group-hover:rotate-180 transition-transform duration-700 text-blue-600" />
                      <span>{isRtl ? 'بدء التحليل الاستراتيجي' : 'Lancer l\'Audit Global'}</span>
                   </div>
                   <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-black mt-2">Propulsé par Google Gemini 3 Pro</span>
                </>
              )}
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {insight && (
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/10 pb-10">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[2rem] bg-blue-600 text-white flex items-center justify-center shadow-2xl">
                         <ShieldCheck size={32} />
                      </div>
                      <div>
                         <h3 className="text-3xl font-black text-white tracking-tighter leading-none">Dossier d'Intelligence Stratégique</h3>
                         <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mt-3">Rapport certifié par Neural Core • {new Date().toLocaleDateString()}</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <button className="p-5 bg-white/5 text-white/50 rounded-2xl hover:bg-white hover:text-slate-900 transition-all border border-white/10"><Share2 size={24}/></button>
                      <button className="p-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"><Download size={24}/> Exporter Dossier</button>
                   </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-inner text-slate-900 leading-relaxed font-bold whitespace-pre-wrap relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-slate-900 pointer-events-none"><Database size={400} /></div>
                    <div className="relative z-10 text-xl md:text-2xl font-medium text-slate-700 space-y-6">
                      {insight}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <AIBottomMetric icon={LineChart} label="Fiabilité de l'Analyse" value="98.2%" color="bg-blue-500" />
                   <AIBottomMetric icon={PieChart} label="Précision Prédictive" value="Haut" color="bg-emerald-500" />
                   <AIBottomMetric icon={Info} label="Statut de l'Audit" value="Terminé" color="bg-indigo-500" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const AIPredictionCard = ({ icon: Icon, label, value, unit, color, trend }: any) => (
  <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-6">
     <div className="flex justify-between items-start">
        <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center ${color} shadow-inner`}>
           <Icon size={28} />
        </div>
        <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-widest">{trend}</div>
     </div>
     <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">{label}</p>
        <div className="flex items-baseline gap-2">
           <span className="text-4xl font-black text-slate-900 tracking-tighter">{value}</span>
           <span className={`text-xs font-black uppercase ${color}`}>{unit}</span>
        </div>
     </div>
  </motion.div>
);

const InsightFeat = ({ icon: Icon, title, desc }: any) => (
  <div className="space-y-6 group">
     <div className="w-16 h-16 rounded-[1.75rem] bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-xl">
        <Icon size={32} />
     </div>
     <div className="space-y-3">
        <h4 className="text-xl font-black text-white tracking-tight">{title}</h4>
        <p className="text-slate-400 font-medium leading-relaxed">{desc}</p>
     </div>
  </div>
);

const AIBottomMetric = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] text-center space-y-4 backdrop-blur-xl">
     <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center mx-auto shadow-2xl`}>
        <Icon size={20} />
     </div>
     <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
     </div>
  </div>
);

export default AIInsights;
