
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Inspection, Reservation } from '../types';
import { 
  X, ChevronRight, ChevronLeft, Check, ClipboardList, 
  Car, Gauge, ShieldCheck, PenTool, Camera, AlertTriangle,
  Lightbulb, Activity, Wrench, RefreshCw, Eye, User, FileText,
  Thermometer, Trash2, CheckCircle2, Image as ImageIcon, Sparkles, Eraser, Search,
  Upload, Plus, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../App';
import { supabase } from '../supabase';

interface InspectionWizardProps {
  lang: Language;
  onClose: () => void;
  initialInspection?: Inspection | null;
}

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

const InspectionWizard: React.FC<InspectionWizardProps> = ({ lang, onClose, initialInspection }) => {
  const { showToast, refreshData, reservations } = useApp();
  const [step, setStep] = useState(1);
  const [dossierSearch, setDossierSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const extInputRef = useRef<HTMLInputElement>(null);
  const intInputRef = useRef<HTMLInputElement>(null);
  const isRtl = lang === 'ar';
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const [formData, setFormData] = useState({
    reservationId: initialInspection?.reservationId || '',
    type: initialInspection?.type || 'Departure' as 'Departure' | 'Return',
    mileage: initialInspection?.mileage?.toString() || '',
    fuelLevel: initialInspection?.fuelLevel || 'Plein',
    checklist: initialInspection?.checklist || {
      lights: true, tires: true, brakes: true, wipers: true, mirrors: true, belts: true, horn: true, spareWheel: true, jack: true, triangles: true, firstAid: true, documents: true, climatisation: true, cleanliness: true
    },
    notes: initialInspection?.notes || '',
    exteriorPhotos: initialInspection?.exteriorPhotos || [] as string[],
    interiorPhotos: initialInspection?.interiorPhotos || [] as string[],
    signature: initialInspection?.signature || ''
  });

  const filteredDossiers = useMemo(() => {
    return reservations.filter(res => res.clientName.toLowerCase().includes(dossierSearch.toLowerCase()) || res.vehicleName.toLowerCase().includes(dossierSearch.toLowerCase()) || res.resNumber.toLowerCase().includes(dossierSearch.toLowerCase()));
  }, [reservations, dossierSearch]);

  const selectedRes = useMemo(() => reservations.find(r => r.id === formData.reservationId), [formData.reservationId, reservations]);

  const steps = [
    { id: 1, title: 'Sélection & Type', icon: Car },
    { id: 2, title: 'Informations Générales', icon: Gauge },
    { id: 3, title: 'Contrôle Technique', icon: ShieldCheck },
    { id: 4, title: 'Photos & Résumé', icon: Camera },
    { id: 5, title: 'Signature Client', icon: PenTool },
  ];

  const handlePhotoUpload = (category: 'exterior' | 'interior', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => {
          const key = category === 'exterior' ? 'exteriorPhotos' : 'interiorPhotos';
          return { ...prev, [key]: [...(prev[key] as string[]), base64] };
        });
      };
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = '';
  };

  const removePhoto = (category: 'exterior' | 'interior', index: number) => {
    setFormData(prev => ({ ...prev, [category === 'exterior' ? 'exteriorPhotos' : 'interiorPhotos']: prev[category === 'exterior' ? 'exteriorPhotos' : 'interiorPhotos'].filter((_, i) => i !== index) }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.reservationId) { showToast("Veuillez sélectionner un véhicule/réservation", "error"); return; }
    setStep(s => Math.min(s + 1, steps.length));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleToggle = (key: string) => {
    setFormData(prev => ({ ...prev, checklist: { ...prev.checklist, [key]: !prev.checklist[key] } }));
  };

  const handleSave = async () => {
    if (!formData.mileage) { showToast("Le kilométrage est obligatoire", "error"); setStep(2); return; }
    if (step === 5 && !formData.signature) { showToast("La signature du client est requise", "error"); return; }

    setIsSaving(true);
    
    // CRITICAL FIX: Since vehicle_id column might be missing from schema, move it into checklist JSONB
    const dbData: any = {
      reservation_id: formData.reservationId,
      type: formData.type,
      checklist: {
        ...formData.checklist,
        vehicle_id: selectedRes?.vehicleId || initialInspection?.vehicleId || '', // Store in JSON to prevent schema error
        notes: formData.notes,
        signature: formData.signature,
        mileage: parseInt(formData.mileage),
        fuel_level: formData.fuelLevel,
        exterior_photos: formData.exteriorPhotos,
        interior_photos: formData.interiorPhotos
      }
    };

    try {
      const { error } = initialInspection 
        ? await supabase.from('inspections').update(dbData).eq('id', initialInspection.id)
        : await supabase.from('inspections').insert([dbData]);

      if (error) throw error;
      showToast(initialInspection ? "Inspection mise à jour" : "Inspection validée avec succès", "success");
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
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative bg-white w-full max-w-4xl md:rounded-[3.5rem] shadow-2xl h-full md:h-auto overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-50">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl">{React.createElement(steps[step-1].icon, { size: 28 })}</div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{initialInspection ? "Modifier Inspection" : "Nouvelle Inspection"}</h2>
              <div className="flex items-center gap-2 mt-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{steps[step-1].title}</span>
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Étape {step}/5</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={24} strokeWidth={3} /></button>
        </div>
        <div className="h-1.5 w-full bg-slate-100 relative"><motion.div className="absolute inset-y-0 left-0 bg-aurora" animate={{ width: `${(step/5)*100}%` }} /></div>
        <div className="flex-1 overflow-y-auto px-10 py-10 no-scrollbar bg-slate-50/20">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {step === 1 && (
                <div className="space-y-10">
                   <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Type d'opération</p>
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setFormData({...formData, type: 'Departure'})} className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-4 transition-all ${formData.type === 'Departure' ? 'bg-blue-600 border-blue-100 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-100'}`}><div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${formData.type === 'Departure' ? 'bg-white/20' : 'bg-slate-50'}`}><RefreshCw size={28} /></div><p className="font-black text-xs uppercase tracking-widest">Départ (Check-in)</p></button>
                        <button onClick={() => setFormData({...formData, type: 'Return'})} className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-4 transition-all ${formData.type === 'Return' ? 'bg-emerald-50 border-emerald-100 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-100'}`}><div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${formData.type === 'Return' ? 'bg-white/20' : 'bg-slate-50'}`}><RefreshCw size={28} className="rotate-180" /></div><p className="font-black text-xs uppercase tracking-widest">Retour (Check-out)</p></button>
                     </div>
                   </div>
                   <div className="space-y-4">
                     <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dossier de réservation / Véhicule</p>
                        <div className="relative group w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} /><input type="text" placeholder="Rechercher dossier..." value={dossierSearch} onChange={(e) => setDossierSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-500 shadow-sm transition-all" /></div>
                     </div>
                     <div className="grid gap-3 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                        {filteredDossiers.map(res => (<button key={res.id} onClick={() => setFormData({...formData, reservationId: res.id})} className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${formData.reservationId === res.id ? 'border-blue-600 bg-blue-50/50 shadow-xl' : 'border-slate-100 bg-white hover:border-slate-200'}`}><div className="flex items-center gap-5 text-left"><div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${formData.reservationId === res.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Car size={20} /></div><div><p className="font-black text-slate-900 leading-none">{res.vehicleName}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{res.clientName} • {res.resNumber}</p></div></div>{formData.reservationId === res.id && <CheckCircle2 className="text-blue-600" size={24} />}</button>))}
                        {filteredDossiers.length === 0 && <div className="py-12 text-center text-slate-400 font-bold italic text-sm">Aucun dossier ne correspond à votre recherche.</div>}
                     </div>
                   </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Kilométrage actuel</label><div className="relative group"><Gauge className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} /><input type="number" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} className="w-full pl-16 pr-8 py-8 bg-white border-2 border-slate-100 rounded-[2.5rem] font-black text-3xl text-slate-900 outline-none focus:border-blue-500 shadow-xl transition-all" placeholder="000,000" /><div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">KMS</div></div></div>
                      <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Niveau Carburant</label><div className="grid grid-cols-2 gap-2">{['Plein', '3/4', '1/2', '1/4', '1/8', 'Réserve'].map(lv => (<button key={lv} onClick={() => setFormData({...formData, fuelLevel: lv})} className={`py-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${formData.fuelLevel === lv ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]' : 'bg-white text-slate-400 border-slate-50 hover:border-slate-100'}`}>{lv}</button>))}</div></div>
                   </div>
                   <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Observations Générales (Optionnel)</label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] outline-none font-bold text-slate-700 focus:border-blue-500 shadow-inner h-32 resize-none" placeholder="Notes particulières sur l'état général..." /></div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-10">
                   <div className="space-y-6"><div className="flex items-center gap-3 border-b border-slate-100 pb-2"><ShieldCheck size={18} className="text-blue-500" /><p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Contrôle Sécurité</p></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><CheckItem label="Feux / Phares" icon={Lightbulb} active={formData.checklist.lights} onClick={() => handleToggle('lights')} /><CheckItem label="Pneus (Usure)" icon={Car} active={formData.checklist.tires} onClick={() => handleToggle('tires')} /><CheckItem label="Freins" icon={Activity} active={formData.checklist.brakes} onClick={() => handleToggle('brakes')} /><CheckItem label="Essuie-glaces" icon={RefreshCw} active={formData.checklist.wipers} onClick={() => handleToggle('wipers')} /><CheckItem label="Rétroviseurs" icon={Eye} active={formData.checklist.mirrors} onClick={() => handleToggle('mirrors')} /><CheckItem label="Ceintures" icon={ShieldCheck} active={formData.checklist.belts} onClick={() => handleToggle('belts')} /><CheckItem label="Klaxon" icon={Activity} active={formData.checklist.horn} onClick={() => handleToggle('horn')} /></div></div>
                   <div className="space-y-6"><div className="flex items-center gap-3 border-b border-slate-100 pb-2"><Wrench size={18} className="text-amber-500" /><p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Équipements Obligatoires</p></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><CheckItem label="Roue de secours" icon={RefreshCw} active={formData.checklist.spareWheel} onClick={() => handleToggle('spareWheel')} /><CheckItem label="Cric / Clé" icon={Wrench} active={formData.checklist.jack} onClick={() => handleToggle('jack')} /><CheckItem label="Triangles" icon={AlertTriangle} active={formData.checklist.triangles} onClick={() => handleToggle('triangles')} /><CheckItem label="Trousse secours" icon={Activity} active={formData.checklist.firstAid} onClick={() => handleToggle('firstAid')} /><CheckItem label="Documents" icon={FileText} active={formData.checklist.documents} onClick={() => handleToggle('documents')} /></div></div>
                   <div className="space-y-6"><div className="flex items-center gap-3 border-b border-slate-100 pb-2"><Sparkles size={18} className="text-emerald-500" /><p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Confort & État</p></div><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><CheckItem label="Climatisation" icon={Thermometer} active={formData.checklist.climatisation} onClick={() => handleToggle('climatisation')} /><CheckItem label="Propreté Int/Ext" icon={Sparkles} active={formData.checklist.cleanliness} onClick={() => handleToggle('cleanliness')} /></div></div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-12">
                   <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-wrap gap-8 items-center shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-8 opacity-10"><ClipboardList size={80} /></div><div className="flex-1 min-w-[200px]"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Véhicule</p><p className="text-xl font-black">{selectedRes?.vehicleName || initialInspection?.vehicleName}</p></div><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compteur</p><p className="text-xl font-black">{formData.mileage} km</p></div><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Carburant</p><p className="text-xl font-black">{formData.fuelLevel}</p></div></div>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6"><div className="flex items-center justify-between"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Photos Extérieures</label><span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{formData.exteriorPhotos.length} photos</span></div><input type="file" multiple ref={extInputRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload('exterior', e)} /><div className="grid grid-cols-2 sm:grid-cols-3 gap-4"><button onClick={() => extInputRef.current?.click()} className="aspect-square rounded-[2rem] border-4 border-dashed border-slate-100 bg-white flex flex-col items-center justify-center text-slate-300 hover:border-blue-500 hover:text-blue-500 transition-all group"><Plus size={32} className="group-hover:scale-110 transition-transform" /><p className="text-[8px] font-black uppercase mt-2">Ajouter</p></button>{formData.exteriorPhotos.map((img, idx) => (<div key={`ext-${idx}`} className="aspect-square rounded-[2rem] overflow-hidden relative group border-2 border-white shadow-md"><img src={img} className="w-full h-full object-cover" alt="" /><button onClick={() => removePhoto('exterior', idx)} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><Trash2 size={12} /></button></div>))}</div></div>
                      <div className="space-y-6"><div className="flex items-center justify-between"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Photos Intérieures</label><span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{formData.interiorPhotos.length} photos</span></div><input type="file" multiple ref={intInputRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload('interior', e)} /><div className="grid grid-cols-2 sm:grid-cols-3 gap-4"><button onClick={() => intInputRef.current?.click()} className="aspect-square rounded-[2rem] border-4 border-dashed border-slate-100 bg-white flex flex-col items-center justify-center text-slate-300 hover:border-emerald-500 hover:text-emerald-500 transition-all group"><Plus size={32} className="group-hover:scale-110 transition-transform" /><p className="text-[8px] font-black uppercase mt-2">Ajouter</p></button>{formData.interiorPhotos.map((img, idx) => (<div key={`int-${idx}`} className="aspect-square rounded-[2rem] overflow-hidden relative group border-2 border-white shadow-md"><img src={img} className="w-full h-full object-cover" alt="" /><button onClick={() => removePhoto('interior', idx)} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><Trash2 size={12} /></button></div>))}</div></div>
                   </div>
                </div>
              )}
              {step === 5 && (
                <div className="space-y-12 text-center py-8">
                   <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xl"><CheckCircle2 size={48} /></div>
                   <div className="space-y-2"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">Validation & Signature</h3><p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed">Le client doit apposer sa signature numérique pour confirmer l'état constaté.</p></div>
                   <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 max-w-xl mx-auto shadow-2xl relative"><SignaturePad onSave={(data) => setFormData({...formData, signature: data})} onClear={() => setFormData({...formData, signature: ''})} initialValue={formData.signature} /></div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="px-10 py-8 border-t border-slate-100 bg-white flex items-center justify-between gap-6 sticky bottom-0 z-50">
           <button onClick={step === 1 ? onClose : handleBack} className="flex items-center gap-2 px-10 py-5 rounded-[1.75rem] font-black text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest"><ChevronLeft size={18} /> {step === 1 ? 'Annuler' : 'Précédent'}</button>
           {step < 5 ? (
             <button onClick={handleNext} className="flex-1 max-w-xs flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-[1.75rem] font-black shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-widest">Continuer <ChevronRight size={18} /></button>
           ) : (
             <button onClick={handleSave} disabled={isSaving} className="flex-1 max-w-xs flex items-center justify-center gap-3 bg-aurora text-white py-5 rounded-[1.75rem] font-black shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-widest">{isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}{initialInspection ? "Mettre à jour" : "Valider l'Inspection"}</button>
           )}
        </div>
      </motion.div>
    </div>
  );
};

const CheckItem = ({ label, icon: Icon, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] border-2 transition-all group ${active ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200 hover:text-slate-400'}`}><Icon size={24} className={`transition-transform duration-500 ${active ? 'scale-110 rotate-3' : 'group-hover:scale-105'}`} /><span className="text-[10px] font-black uppercase tracking-tight text-center leading-none">{label}</span><div className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${active ? 'bg-blue-600 border-blue-600' : 'border-slate-100'}`}>{active && <Check size={14} className="text-white" strokeWidth={4} />}</div></button>
);

export default InspectionWizard;
