import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, MapPin, Car, Fuel, Check, ChevronRight, 
  ChevronLeft, Search, UserPlus, Phone, Mail, IdCard, 
  CreditCard, Receipt, Percent, Wallet, CheckCircle, AlertCircle, 
  Settings2, ShieldCheck, User, Store, ArrowRight, Info, Plus, Banknote,
  AlertTriangle, Clock, Landmark, Gauge, Sparkles, Printer, UserCheck, Trash2,
  FileText, Users, Zap, FileSpreadsheet, Map, UserCircle, Camera, ImageIcon, Loader2,
  // Fix: Missing imports for PenTool and Eraser icons used in SignaturePad
  PenTool, Eraser
} from 'lucide-react';
import { TRANSLATIONS, WILAYAS, TVA_RATE } from '../constants';
import { Language, Reservation, Client, StatusLog, Property, Agency, Worker } from '../types';
import { useApp } from '../App';
import { supabase } from '../supabase';

interface ReservationWizardProps {
  lang: Language;
  onClose: () => void;
  initialReservation?: Reservation | null;
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
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      } else {
        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

const SignaturePad = ({ onSave, onClear, initialValue }: { onSave: (data: string) => void, onClear: () => void, initialValue?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!initialValue);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return ctx;
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  };

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, []);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    } else {
      return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) onSave(canvas.toDataURL());
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onClear();
  };

  return (
    <div className="space-y-6">
      <div className="relative h-64 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 overflow-hidden group shadow-inner">
        <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="absolute inset-0 w-full h-full cursor-crosshair touch-none" />
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none transition-opacity duration-300 group-hover:opacity-50">
            <PenTool size={48} strokeWidth={1.5} />
            <span className="text-[10px] font-black uppercase mt-4 tracking-widest">Signer ici (Tactile ou Souris)</span>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={clear} type="button" className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><Eraser size={16} /> Effacer</button>
        <button disabled={isEmpty} type="button" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 disabled:opacity-50 transition-all">Confirmer le tracé</button>
      </div>
    </div>
  );
};

const ReservationWizard: React.FC<ReservationWizardProps> = ({ lang, onClose, initialReservation }) => {
  const { showToast, setReservations, properties, agencies, clients, workers, refreshData, agencySettings } = useApp();
  const t = (key: string) => TRANSLATIONS[key.toLowerCase()]?.[lang] || key;
  const isRtl = lang === 'ar';

  const [step, setStep] = useState(1);
  const [clientSearch, setClientSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  
  const [showAddOption, setShowAddOption] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedRes, setGeneratedRes] = useState<Reservation | null>(null);
  const [printType, setPrintType] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const defaultState = {
    startDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    endTime: '10:00',
    pickupAgencyId: agencies[0]?.id || '',
    returnAgencyId: agencies[0]?.id || '',
    selectedVehicleId: null as string | null,
    selectedClientId: null as string | null,
    isCreatingClient: false,
    useTVA: true,
    newClient: { 
      firstName: '', lastName: '', phone: '', email: '', 
      idNumber: '', wilaya: '16 - Alger', address: '',
      licenseNumber: '', licenseExpiry: '',
      avatar: '', documentPhotos: [] as string[]
    },
    customOptions: [] as { id: string, name: string, price: number }[],
    hasDriver: false,
    selectedDriverId: null as string | null,
    discount: 0,
    amountPaid: 0,
  };

  const [formData, setFormData] = useState(defaultState);

  useEffect(() => {
    if (initialReservation) {
      const parts = initialReservation.startDate.split(' ');
      const endParts = initialReservation.endDate.split(' ');
      setFormData(prev => ({
        ...prev,
        startDate: parts[0] || prev.startDate,
        startTime: parts[1] || prev.startTime,
        endDate: endParts[0] || prev.endDate,
        endTime: endParts[1] || prev.endTime,
        selectedVehicleId: initialReservation.vehicleId,
        selectedClientId: initialReservation.clientId,
        amountPaid: initialReservation.paidAmount,
      }));
    }
  }, [initialReservation]);

  const daysCount = useMemo(() => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [formData.startDate, formData.endDate]);

  const selectedVehicle = useMemo(() => properties.find(v => v.id === formData.selectedVehicleId), [formData.selectedVehicleId, properties]);
  const drivers = useMemo(() => workers.filter(w => w.role === 'Driver'), [workers]);

  const calculations = useMemo(() => {
    const baseHT = selectedVehicle ? selectedVehicle.price * daysCount : 0;
    const optionsTotalHT = formData.customOptions.reduce((acc, opt) => acc + opt.price, 0);
    const subtotalHT = Math.max(0, baseHT + optionsTotalHT - (Number(formData.discount) || 0));
    const tva = formData.useTVA ? subtotalHT * TVA_RATE : 0;
    const totalTTC = subtotalHT + tva;
    const remaining = Math.max(0, totalTTC - (Number(formData.amountPaid) || 0));
    return { baseHT, optionsTotalHT, subtotalHT, tva, totalTTC, remaining };
  }, [selectedVehicle, daysCount, formData.customOptions, formData.discount, formData.amountPaid, formData.useTVA]);

  const handleBack = () => setStep(prev => Math.max(1, prev - 1));

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 400, 400);
      setFormData(prev => ({ ...prev, newClient: { ...prev.newClient, avatar: compressed } }));
    };
    reader.readAsDataURL(file);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // Fix: Explicitly cast Array.from(files) to File[] to avoid 'unknown' type errors during readAsDataURL.
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 1200, 1200);
        setFormData(prev => ({
          ...prev,
          newClient: { ...prev.newClient, documentPhotos: [...prev.newClient.documentPhotos, compressed] }
        }));
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateAndSelectClient = async () => {
    const { firstName, lastName, phone, idNumber, licenseNumber, licenseExpiry, wilaya, address, avatar, documentPhotos } = formData.newClient;
    if (!firstName || !lastName || !phone) {
      showToast("Prénom, Nom et Téléphone requis", "error");
      return;
    }

    setIsSubmitting(true);
    const regDate = new Date().toISOString().split('T')[0];

    const dbData: any = {
      first_name: firstName,
      last_name: lastName,
      phone,
      email: formData.newClient.email || null,
      address: address || null,
      wilaya: wilaya || null,
      id_number: idNumber || null,
      license_number: licenseNumber || null,
      license_expiry: licenseExpiry || null,
      avatar_url: avatar || null,
      document_photos: documentPhotos || [],
      registration_date: regDate
    };

    try {
      const { data, error } = await supabase.from('clients').insert([dbData]).select();

      if (error) {
        // Fallback to Virtual Metadata Layer if columns are missing
        if (error.message.includes('column') || error.code === '42703') {
           const virtualStorage = { avatar, docs: documentPhotos, wilaya, regDate };
           const hijackedAddress = `${address || ''} ##RM_STORAGE##${JSON.stringify(virtualStorage)}`;

           const fallbackData = {
              first_name: firstName,
              last_name: lastName,
              phone,
              email: formData.newClient.email || null,
              address: hijackedAddress,
              id_number: idNumber || null,
              license_number: licenseNumber || null,
              license_expiry: licenseExpiry || null,
              registration_date: regDate
           };

           const { data: retryData, error: retryError } = await supabase.from('clients').insert([fallbackData]).select();
           if (retryError) throw retryError;
           
           await refreshData();
           setFormData({ ...formData, selectedClientId: retryData[0].id, isCreatingClient: false });
        } else {
           throw error;
        }
      } else {
        await refreshData();
        setFormData({ ...formData, selectedClientId: data[0].id, isCreatingClient: false });
      }

      showToast("Client créé et sélectionné", "success");
      setStep(4);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = useCallback(async () => {
    if (step === 1 && (!formData.pickupAgencyId || !formData.returnAgencyId)) return showToast("Veuillez choisir les agences", "error");
    if (step === 2 && !formData.selectedVehicleId) return showToast("Choisissez un véhicule", "error");
    if (step === 3) {
      if (formData.isCreatingClient) {
        await handleCreateAndSelectClient();
        return;
      }
      if (!formData.selectedClientId) return showToast("Identifiez un client", "error");
    }
    
    if (step === 5) {
      setIsSubmitting(true);
      try {
        const clientObj = clients.find(c => c.id === formData.selectedClientId);
        const finalRes: any = {
          res_number: initialReservation?.resNumber || `RES-${Date.now().toString().slice(-6)}`,
          client_id: formData.selectedClientId,
          vehicle_id: formData.selectedVehicleId,
          start_date: `${formData.startDate} ${formData.startTime}`,
          end_date: `${formData.endDate} ${formData.endTime}`,
          paid_amount: Number(formData.amountPaid) || 0,
          total_amount: calculations.totalTTC,
          status: 'Confirmed'
        };

        const { data, error } = await supabase.from('reservations').insert([finalRes]).select();
        if (error) throw error;

        await refreshData();
        setGeneratedRes({
           id: data[0].id,
           resNumber: data[0].res_number,
           clientId: data[0].client_id,
           clientName: `${clientObj?.firstName} ${clientObj?.lastName}`,
           vehicleId: data[0].vehicle_id,
           vehicleName: selectedVehicle?.title || 'Véhicule',
           startDate: data[0].start_date,
           endDate: data[0].end_date,
           paidAmount: data[0].paid_amount,
           totalAmount: data[0].total_amount,
           status: 'Confirmed',
           statusHistory: []
        });
        setStep(6);
      } catch (err: any) {
        showToast(err.message, "error");
      } finally { setIsSubmitting(false); }
      return;
    }
    setStep(prev => prev + 1);
  }, [step, formData, calculations, selectedVehicle, clients, showToast, initialReservation, handleCreateAndSelectClient]);

  const handlePrint = (type: string) => {
    setPrintType(type);
    setTimeout(() => window.print(), 300);
  };

  const addCustomOption = () => {
    if (!newOptionName || !newOptionPrice) return;
    const newOpt = { id: `opt-${Date.now()}`, name: newOptionName, price: parseFloat(newOptionPrice) };
    setFormData({ ...formData, customOptions: [...formData.customOptions, newOpt] });
    setNewOptionName('');
    setNewOptionPrice('');
    setShowAddOption(false);
  };

  return (
    <div className={`fixed inset-0 z-[250] flex flex-col bg-slate-50 overflow-hidden ${isRtl ? 'font-arabic' : 'font-sans'}`}>
      <header className="h-24 px-8 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-50 no-print">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
            {React.createElement(step === 6 ? CheckCircle : Car, { size: 28, strokeWidth: 2.5 })}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{initialReservation ? 'Modifier Dossier' : 'Dossier Expert'}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest">Étape {step} sur 6</span>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Configurateur Intelligent</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
          <X size={24} strokeWidth={3} />
        </button>
      </header>

      <div className="h-1.5 w-full bg-slate-100 relative no-print">
        <motion.div className="absolute inset-y-0 left-0 bg-aurora" animate={{ width: `${(step / 6) * 100}%` }} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 lg:p-16 no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
              
              {/* STEP 1: DATES & AGENCES */}
              {step === 1 && (
                <div className="space-y-12 max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <WizardInput label="Date de Début" type="date" value={formData.startDate} onChange={(v: string) => setFormData({...formData, startDate: v})} icon={Calendar} />
                    <WizardInput label="Heure" type="time" value={formData.startTime} onChange={(v: string) => setFormData({...formData, startTime: v})} icon={Clock} />
                    <WizardInput label="Date de Fin" type="date" value={formData.endDate} onChange={(v: string) => setFormData({...formData, endDate: v})} icon={Calendar} />
                    <WizardInput label="Heure" type="time" value={formData.endTime} onChange={(v: string) => setFormData({...formData, endTime: v})} icon={Clock} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 leading-none">Agence de Départ</label>
                      <select value={formData.pickupAgencyId} onChange={e => setFormData({...formData, pickupAgencyId: e.target.value})} className="w-full px-8 py-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-bold shadow-lg text-lg">
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name} ({a.city})</option>)}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 leading-none">Agence de Retour</label>
                      <select value={formData.returnAgencyId} onChange={e => setFormData({...formData, returnAgencyId: e.target.value})} className="w-full px-8 py-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-bold shadow-lg text-lg">
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name} ({a.city})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SÉLECTION VÉHICULE */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="relative group max-w-2xl mx-auto mb-10">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                    <input type="text" placeholder="Rechercher par marque, modèle ou plaque..." className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] font-black text-xl outline-none focus:border-blue-500 shadow-xl" value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {properties.filter(v => `${v.brand} ${v.model} ${v.plate}`.toLowerCase().includes(vehicleSearch.toLowerCase())).map(v => (
                      <button key={v.id} onClick={() => setFormData({...formData, selectedVehicleId: v.id})} className={`p-6 rounded-[3rem] border-4 transition-all text-left group ${formData.selectedVehicleId === v.id ? 'bg-blue-600 border-blue-200 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-100 shadow-xl'}`}>
                        <div className="aspect-video w-full rounded-[2rem] overflow-hidden mb-6 shadow-lg bg-slate-100">
                          {v.image ? <img src={v.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Car size={48} /></div>}
                        </div>
                        <h4 className="text-xl font-black tracking-tight">{v.brand} {v.model}</h4>
                        <div className="flex items-center justify-between mt-3">
                           <p className={`text-[10px] font-black uppercase tracking-widest ${formData.selectedVehicleId === v.id ? 'text-blue-100' : 'text-slate-400'}`}>{v.plate}</p>
                           <p className="text-lg font-black">{v.price.toLocaleString()} DA <span className="text-[10px] uppercase opacity-60">/ jour</span></p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: CLIENT IDENTIFICATION (IMAGE SUPPORT ADDED) */}
              {step === 3 && (
                <div className="space-y-10 max-w-5xl mx-auto">
                  <div className="flex gap-4 p-2 bg-slate-100 rounded-[2.5rem] max-w-md mx-auto">
                    <button onClick={() => setFormData({...formData, isCreatingClient: false})} className={`flex-1 py-4 rounded-[1.75rem] font-black text-xs uppercase tracking-widest transition-all ${!formData.isCreatingClient ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400'}`}>Recherche</button>
                    <button onClick={() => setFormData({...formData, isCreatingClient: true})} className={`flex-1 py-4 rounded-[1.75rem] font-black text-xs uppercase tracking-widest transition-all ${formData.isCreatingClient ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400'}`}>Nouveau Client</button>
                  </div>
                  
                  {!formData.isCreatingClient ? (
                    <div className="space-y-6">
                      <div className="relative group max-w-2xl mx-auto">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                        <input type="text" placeholder="Rechercher par nom ou numéro de téléphone..." className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] font-black text-xl outline-none focus:border-blue-500 shadow-xl" value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                      </div>
                      <div className="grid gap-3">
                        {clients.filter(c => `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                          <button key={c.id} onClick={() => setFormData({...formData, selectedClientId: c.id})} className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${formData.selectedClientId === c.id ? 'bg-blue-50 border-blue-600 shadow-lg' : 'bg-white border-slate-100 hover:border-slate-200 shadow-md'}`}>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">{c.avatar ? <img src={c.avatar} className="w-full h-full object-cover rounded-xl"/> : c.firstName[0]+c.lastName[0]}</div>
                              <div className="text-left"><p className="font-black text-slate-900 leading-none">{c.firstName} {c.lastName}</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{c.phone} • {c.idNumber}</p></div>
                            </div>
                            {formData.selectedClientId === c.id && <CheckCircle className="text-blue-600" size={24} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {/* Avatar Upload Section */}
                      <div className="flex flex-col items-center bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl">
                        <div className="relative group mb-6">
                           <div 
                             onClick={() => avatarInputRef.current?.click()}
                             className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all overflow-hidden"
                           >
                              {formData.newClient.avatar ? (
                                <img src={formData.newClient.avatar} className="w-full h-full object-cover" alt="Avatar" />
                              ) : (
                                <>
                                  <UserCircle size={40} strokeWidth={1} />
                                  <span className="text-[8px] font-black uppercase mt-2">Photo de profil</span>
                                </>
                              )}
                           </div>
                           <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                           {formData.newClient.avatar && (
                             <button onClick={() => setFormData({...formData, newClient: {...formData.newClient, avatar: ''}})} className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-lg shadow-lg hover:scale-110 transition-all"><Trash2 size={12}/></button>
                           )}
                        </div>
                        <p className="text-sm font-black text-slate-900">Identité visuelle du client</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Format recommandé : Carré 400x400</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100">
                        <WizardInput label="Prénom" value={formData.newClient.firstName} onChange={(v: string) => setFormData({...formData, newClient: {...formData.newClient, firstName: v}})} icon={User} />
                        <WizardInput label="Nom" value={formData.newClient.lastName} onChange={(v: string) => setFormData({...formData, newClient: {...formData.newClient, lastName: v}})} icon={User} />
                        <WizardInput label="Téléphone" value={formData.newClient.phone} onChange={(v: string) => setFormData({...formData, newClient: {...formData.newClient, phone: v}})} icon={Phone} />
                        <WizardInput label="E-mail (Optionnel)" value={formData.newClient.email} onChange={(v: string) => setFormData({...formData, newClient: {...formData.newClient, email: v}})} icon={Mail} />
                        <WizardInput label="N° Pièce d'Identité" value={formData.newClient.idNumber} onChange={(v: string) => setFormData({...formData, newClient: {...formData.newClient, idNumber: v}})} icon={IdCard} />
                        <div className="space-y-4">
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 leading-none">Wilaya</label>
                           <select value={formData.newClient.wilaya} onChange={e => setFormData({...formData, newClient: {...formData.newClient, wilaya: e.target.value}})} className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none font-bold shadow-inner">
                             {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                           </select>
                        </div>
                        <WizardInput label="Adresse Complète" value={formData.newClient.address} onChange={(v: string) => setFormData({...formData, newClient: {...formData.newClient, address: v}})} icon={MapPin} className="md:col-span-2" />
                        <WizardInput label="N° Permis de Conduire" value={formData.newClient.licenseNumber} onChange={(v: string) => setFormData({...formData, newClient: {...formData.newClient, licenseNumber: v}})} icon={CreditCard} />
                        <WizardInput label="Expiration Permis" type="date" value={formData.newClient.licenseExpiry} onChange={(v: string) => setFormData({...formData, newClient: {...formData.newClient, licenseExpiry: v}})} icon={Calendar} />
                      </div>

                      {/* Documents Upload Section */}
                      <div className="space-y-6 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl">
                        <div className="flex items-center justify-between border-b pb-4">
                           <div className="flex items-center gap-3">
                              <Camera size={20} className="text-blue-600" />
                              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Pièces Numérisées</h3>
                           </div>
                           <span className="text-[10px] font-black text-slate-400 uppercase">{formData.newClient.documentPhotos.length} fichiers</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-[2rem] border-4 border-dashed border-slate-100 bg-white flex flex-col items-center justify-center text-slate-300 hover:border-blue-500 hover:text-blue-500 transition-all group shadow-inner">
                            <Plus size={32} />
                            <span className="text-[8px] font-black uppercase mt-2">Scanner</span>
                          </button>
                          <input type="file" multiple ref={fileInputRef} className="hidden" accept="image/*" onChange={handleDocUpload} />
                          {formData.newClient.documentPhotos.map((photo, index) => (
                            <div key={index} className="aspect-square rounded-[2rem] overflow-hidden relative group border-2 border-white shadow-md">
                              <img src={photo} className="w-full h-full object-cover" alt="" />
                              <button onClick={() => setFormData({...formData, newClient: {...formData.newClient, documentPhotos: formData.newClient.documentPhotos.filter((_, i) => i !== index)}})} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: SERVICES & OPTIONS */}
              {step === 4 && (
                <div className="space-y-12 max-w-5xl mx-auto">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-4"><Sparkles size={24} className="text-blue-600" /><h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Options Standards</h3></div>
                      <button onClick={() => setShowAddOption(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all"><Plus size={16}/> Ajouter Option</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {formData.customOptions.map(opt => (
                         <div key={opt.id} className="p-8 rounded-[2.5rem] bg-blue-600 text-white shadow-xl flex items-center justify-between group">
                            <div><p className="font-black text-lg leading-none">{opt.name}</p><p className="text-[10px] font-black uppercase opacity-60 mt-2">{opt.price.toLocaleString()} DA</p></div>
                            <button onClick={() => setFormData({...formData, customOptions: formData.customOptions.filter(o => o.id !== opt.id)})} className="p-2 hover:bg-white/20 rounded-xl transition-all"><Trash2 size={18}/></button>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex items-center gap-4 border-b border-slate-100 pb-4"><UserCheck size={24} className="text-emerald-600" /><h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Services Chauffeur</h3></div>
                     <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 space-y-10 shadow-xl">
                        <label className="flex items-center gap-6 cursor-pointer group">
                           <div className="relative">
                              <input type="checkbox" className="sr-only peer" checked={formData.hasDriver} onChange={e => setFormData({...formData, hasDriver: e.target.checked})} />
                              <div className="w-16 h-9 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-emerald-600"></div>
                           </div>
                           <div>
                              <p className="text-lg font-black text-slate-900 uppercase tracking-widest">Inclure un chauffeur</p>
                              <p className="text-xs font-bold text-slate-400">Le dossier inclura un driver professionnel pour la durée du trajet.</p>
                           </div>
                        </label>
                        
                        <AnimatePresence>
                           {formData.hasDriver && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {drivers.map(d => (
                                   <button key={d.id} onClick={() => setFormData({...formData, selectedDriverId: d.id})} className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all ${formData.selectedDriverId === d.id ? 'bg-emerald-50 border-emerald-500 shadow-lg' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-emerald-600 shadow-sm">{d.fullName[0]}</div>
                                      <div className="text-left"><p className="font-black text-slate-800 leading-none">{d.fullName}</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Driver Certifié</p></div>
                                      {formData.selectedDriverId === d.id && <CheckCircle className="ml-auto text-emerald-500" size={20}/>}
                                   </button>
                                 ))}
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>
                </div>
              )}

              {/* STEP 5: FINANCIAL CLOSURE */}
              {step === 5 && (
                <div className="space-y-12 max-w-4xl mx-auto">
                  <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-3xl space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10"><Banknote size={200} /></div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                      <SummaryItem label="Location de Base" value={calculations.baseHT.toLocaleString()} />
                      <SummaryItem label="Options & Services" value={`+ ${calculations.optionsTotalHT.toLocaleString()}`} />
                      <SummaryItem label="Remise accordée" value={`- ${formData.discount.toLocaleString()}`} color="text-rose-400" />
                      <SummaryItem label="Montant TVA" value={formData.useTVA ? `+ ${calculations.tva.toLocaleString()}` : "0"} color="text-blue-300" />
                    </div>
                    <div className="h-px bg-white/10 relative z-10" />
                    <div className="relative z-10">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-3 text-center md:text-left">TOTAL GÉNÉRAL À RÉGLER</p>
                       <h3 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-center md:text-left">{calculations.totalTTC.toLocaleString()} <span className="text-2xl text-slate-500">DA</span></h3>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-10">
                    <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-[2.5rem] border border-blue-100">
                      <label className="flex items-center gap-6 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" className="sr-only peer" checked={formData.useTVA} onChange={e => setFormData({...formData, useTVA: e.target.checked})} />
                          <div className="w-16 h-9 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                        </div>
                        <span className="text-sm font-black text-blue-900 uppercase tracking-[0.2em]">Appliquer la TVA légale (19%)</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <WizardInput label="Remise Exceptionnelle (DA)" icon={Percent} type="number" value={formData.discount.toString()} onChange={(v: string) => setFormData({...formData, discount: parseFloat(v) || 0})} />
                      <WizardInput label="Acompte Versé (DA)" icon={Wallet} type="number" value={formData.amountPaid.toString()} onChange={(v: string) => setFormData({...formData, amountPaid: parseFloat(v) || 0})} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: CONFIRMATION & PRINT */}
              {step === 6 && generatedRes && (
                <div className="text-center space-y-12 py-8 max-w-4xl mx-auto">
                  <div className="no-print">
                    <div className="w-32 h-32 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xl mb-8"><CheckCircle size={64} /></div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Dossier Validé avec succès !</h2>
                    <p className="text-slate-500 font-bold max-w-lg mx-auto mb-12">Le contrat a été enregistré sur le Cloud. Choisissez les documents à imprimer pour le client.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <PrintAction icon={FileText} label="Contrat Location" color="bg-slate-900" sub="Fiche technique & juridique" onClick={() => handlePrint('CONTRAT DE LOCATION')} />
                      <PrintAction icon={Receipt} label="Facture Client" color="bg-blue-600" sub="Bilan financier & Taxes" onClick={() => handlePrint('FACTURE')} />
                      <PrintAction icon={FileSpreadsheet} label="Devis Proforma" color="bg-indigo-600" sub="Estimation pour accord" onClick={() => handlePrint('DEVIS PRO-FORMA')} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <footer className="h-28 px-8 bg-white border-t border-slate-100 flex items-center justify-between z-50 no-print">
        <div className="flex-1 flex gap-4 max-w-4xl mx-auto">
          {step < 6 ? (
            <>
              <button onClick={step === 1 ? onClose : handleBack} className="flex-1 py-5 rounded-[1.75rem] font-black text-slate-500 bg-slate-50 border border-slate-200">Annuler</button>
              <button onClick={handleNext} disabled={isSubmitting} className="flex-[2] flex items-center justify-center gap-4 bg-slate-900 text-white py-5 rounded-[2rem] font-black shadow-2xl transition-all">
                {isSubmitting ? <motion.div animate={{ rotate: 360 }}><Settings2 size={24} /></motion.div> : <span className="text-lg">{step === 5 ? 'Signer & Valider' : 'Étape Suivante'}</span>}
                <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </>
          ) : (
            <button onClick={onClose} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black shadow-2xl text-xl">Quitter le configurateur</button>
          )}
        </div>
      </footer>

      {/* Custom Option Modal */}
      <AnimatePresence>
        {showAddOption && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddOption(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8">
               <div className="text-center space-y-2">
                  <div className="w-20 h-20 rounded-[2rem] bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner mb-4"><Zap size={40} /></div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Nouvelle Option</h3>
               </div>
               <div className="space-y-6">
                  <WizardInput label="Libellé du service" value={newOptionName} onChange={setNewOptionName} icon={Car} />
                  <WizardInput label="Prix unitaire (DA)" type="number" value={newOptionPrice} onChange={setNewOptionPrice} icon={Banknote} />
               </div>
               <div className="grid grid-cols-2 gap-4 pt-4">
                  <button onClick={() => setShowAddOption(false)} className="py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest">Annuler</button>
                  <button onClick={addCustomOption} className="py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Ajouter</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const WizardInput = ({ label, icon: Icon, type = "text", value, onChange, className = "" }: any) => (
  <div className={`space-y-4 ${className}`}>
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 leading-none">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} />}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={`w-full ${Icon ? 'pl-16 pr-8' : 'px-8'} py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none font-bold shadow-inner text-lg focus:bg-white focus:border-blue-500 transition-all`} />
    </div>
  </div>
);

const SummaryItem = ({ label, value, color = "text-white" }: { label: string, value: string, color?: string }) => (
  <div className="flex flex-col"><span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</span><span className={`text-2xl font-black ${color}`}>{value} <span className="text-xs opacity-40">DA</span></span></div>
);

const PrintAction = ({ icon: Icon, label, color, sub, onClick }: any) => (
  <button onClick={onClick} className={`p-8 rounded-[3.5rem] ${color} text-white flex flex-col items-center gap-5 shadow-2xl hover:scale-[1.03] active:scale-95 transition-all text-center group border border-white/10`}>
     <div className="w-20 h-20 rounded-[2rem] bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner"><Icon size={36} /></div>
     <div className="space-y-2"><p className="font-black text-xl leading-none uppercase tracking-tighter">{label}</p><p className="text-[10px] font-black opacity-50 uppercase tracking-widest">{sub}</p></div>
  </button>
);

export default ReservationWizard;