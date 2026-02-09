
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, User, Lock, ArrowRight, Loader2, 
  Globe, ShieldCheck, Zap, BrainCircuit, AlertCircle, RefreshCcw
} from 'lucide-react';
import { Language, UserSession } from '../types';
import { useApp } from '../App';
import { supabase } from '../supabase';

interface LoginProps {
  lang: Language;
  setLang: (l: Language) => void;
  onLogin: (user: UserSession) => void;
}

const Login: React.FC<LoginProps> = ({ lang, setLang, onLogin }) => {
  const { showToast } = useApp();
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isRtl = lang === 'ar';

  const handleRetry = async () => {
    await supabase.auth.signOut();
    setErrorMsg(null);
    window.location.reload();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      showToast(isRtl ? "يرجى إدخال جميع البيانات" : "Veuillez remplir tous les champs", "error");
      return;
    }
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      let { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: password });
      if (error && (error.message.includes('Invalid login credentials') || error.status === 400)) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: cleanEmail, password: password, options: { data: { full_name: 'Admin Master' } } });
        if (signUpError) throw signUpError;
        if (signUpData.user && !signUpData.session) {
          setErrorMsg(isRtl ? "تم إنشاء الحساب. يرجى تفعيله." : "Compte créé. Veuillez confirmer l'email.");
          setIsLoading(false); return;
        }
        if (signUpData.session) { data = signUpData; error = null; }
      }
      if (error) {
        setErrorMsg(error.message);
        showToast(isRtl ? "فشل العملية" : "Échec de l'opération", "error");
        return;
      }
      if (data?.user) {
        const session: UserSession = {
          id: data.user.id, fullName: data.user.user_metadata.full_name || 'Admin', role: 'Admin',
          avatar: `https://ui-avatars.com/api/?name=${data.user.email}&background=6366f1&color=fff`
        };
        showToast(isRtl ? "تم الدخول بنجاح" : "Accès autorisé", "success");
        // PERF: Don't await refreshData here. Let the transition happen immediately.
        onLogin(session);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      showToast("Erreur système", "error");
    } finally { setIsLoading(false); }
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden ${isRtl ? 'font-arabic' : 'font-sans'}`}>
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#2E3192]">
         <div className="absolute inset-0 bg-gradient-to-br from-[#2E3192] via-[#662D8C] to-[#ED1E79] opacity-90" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg text-center space-y-10 z-10">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-40 h-40 rounded-[4rem] bg-white/10 border border-white/20 backdrop-blur-3xl flex items-center justify-center mx-auto shadow-2xl">
               <BrainCircuit size={80} className="text-white drop-shadow-2xl" />
            </motion.div>
            <div className="space-y-4 text-white">
               <h1 className="text-7xl font-black tracking-tighter leading-none">RentMaster <span className="text-blue-200">AI</span></h1>
               <p className="text-2xl font-bold opacity-90">Cloud Management Suite.</p>
            </div>
         </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-24 relative bg-white">
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-12">
            <div className="text-center lg:text-left">
               <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{isRtl ? 'تسجيل الدخول' : 'Connexion'}</h2>
               <p className="text-slate-500 font-bold mt-4">Accès sécurisé Instantané.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
               {errorMsg && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold">{errorMsg}</div>}
               <div className="space-y-4">
                  <div className="relative group">
                     <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                     <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-600 shadow-inner text-lg" placeholder="Email" />
                  </div>
                  <div className="relative group">
                     <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                     <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-600 shadow-inner text-lg" placeholder="Password" />
                  </div>
               </div>
               <button type="submit" disabled={isLoading} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-3">
                  {isLoading ? <Loader2 className="animate-spin" /> : <span>{isRtl ? 'دخول' : 'Se connecter'}</span>}
                  <ArrowRight size={24} />
               </button>
            </form>
         </motion.div>
      </div>
    </div>
  );
};

const HeroStat = ({ label, icon: Icon }: any) => (
  <div className="space-y-3 text-center group">
     <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-200 mx-auto shadow-2xl backdrop-blur-md"><Icon size={32} /></div>
     <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white opacity-80">{label}</p>
  </div>
);

export default Login;
