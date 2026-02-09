import React, { useState, createContext, useContext, lazy, Suspense, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Toast, { ToastType } from './components/Toast.tsx';
import { Language, UserSession, Property, Reservation, Client, Worker, Inspection, Damage, Maintenance, Expense, Agency } from './types.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Login from './pages/Login.tsx';
import { supabase } from './supabase.ts';

export interface AgencySettings {
  name: string;
  slogan: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
  penalties: {
    lateType: string;
    lateTolerance: number;
    mileageDailyLimit: number;
    mileageTolerance: number;
    mileageExtraPrice: number;
    mileageUnlimitedPrice: number;
    fuelMissingPrice: number;
  }
}

interface AppContextType {
  showToast: (message: string, type: ToastType) => void;
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  workers: Worker[];
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  inspections: Inspection[];
  setInspections: React.Dispatch<React.SetStateAction<Inspection[]>>;
  damages: Damage[];
  setDamages: React.Dispatch<React.SetStateAction<Damage[]>>;
  maintenance: Maintenance[];
  setMaintenance: React.Dispatch<React.SetStateAction<Maintenance[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  agencies: Agency[];
  setAgencies: React.Dispatch<React.SetStateAction<Agency[]>>;
  agencySettings: AgencySettings;
  setAgencySettings: React.Dispatch<React.SetStateAction<AgencySettings>>;
  deleteReservationSafely: (id: string) => void;
  logout: () => void;
  refreshData: () => Promise<void>;
  fetchFullClient: (id: string) => Promise<Client | null>;
  fetchFullVehicle: (id: string) => Promise<Property | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Reservations = lazy(() => import('./pages/Reservations.tsx'));
const Operations = lazy(() => import('./pages/Operations.tsx'));
const Properties = lazy(() => import('./pages/Properties.tsx'));
const Tenants = lazy(() => import('./pages/Tenants.tsx'));
const Agencies = lazy(() => import('./pages/Agencies.tsx'));
const Workers = lazy(() => import('./pages/Workers.tsx'));
const Expenses = lazy(() => import('./pages/Expenses.tsx'));
const Reports = lazy(() => import('./pages/Reports.tsx'));
const AIInsights = lazy(() => import('./pages/AIInsights.tsx'));
const Finance = lazy(() => import('./pages/Finance.tsx'));
const SettingsPage = lazy(() => import('./pages/Settings.tsx'));

const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="text-blue-600 mb-4">
      <Loader2 size={60} strokeWidth={2.5} />
    </motion.div>
    <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Synchro Cloud Express...</p>
  </div>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('fr');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [appInitializing, setAppInitializing] = useState(true);
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [damages, setDamages] = useState<Damage[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);

  const [agencySettings, setAgencySettings] = useState<AgencySettings>({
    name: 'RentMaster AI', slogan: 'Le futur de la location intelligente',
    address: 'Quartier d\'Affaires, Alger', phone: '+213 550 123 456', email: 'contact@rentmaster.dz',
    logo: null,
    penalties: { lateType: 'forfait_heure', lateTolerance: 30, mileageDailyLimit: 200, mileageTolerance: 50, mileageExtraPrice: 40, mileageUnlimitedPrice: 1500, fuelMissingPrice: 1000 }
  });

  const showToast = useCallback((message: string, type: ToastType) => setToast({ message, type }), []);

  const mapClient = useCallback((c: any): Client => {
    let avatar = c.avatar_url || '';
    let docs = c.document_photos || [];
    let cleanAddress = c.address || '';
    let wilaya = c.wilaya || '16 - Alger';
    let nickname = c.nickname || '';
    let regDate = c.registration_date || new Date().toISOString().split('T')[0];
    if (cleanAddress.includes('##RM_STORAGE##')) {
      try {
        const parts = cleanAddress.split('##RM_STORAGE##');
        cleanAddress = parts[0].trim();
        const meta = JSON.parse(parts[1]);
        if (meta.avatar) avatar = meta.avatar;
        if (meta.docs) docs = meta.docs;
        if (meta.wilaya) wilaya = meta.wilaya;
        if (meta.nickname) nickname = meta.nickname;
        if (meta.regDate) regDate = meta.regDate;
      } catch (e) { console.warn("Virtual Parse err", e); }
    }
    return {
      id: c.id, firstName: c.first_name, lastName: c.last_name, phone: c.phone, email: c.email, address: cleanAddress, wilaya, idNumber: c.id_number, licenseNumber: c.license_number, licenseExpiry: c.license_expiry, totalSpending: c.total_spending || 0, totalReservations: c.total_reservations || 0, registrationDate: regDate, nickname, documentPhotos: docs, avatar
    };
  }, []);

  const mapWorker = useCallback((w: any): Worker => {
    let cleanAddress = w.address || '';
    let advances = w.advances || [];
    let absences = w.absences || [];
    let role = w.role || 'Worker';
    let paymentType = w.payment_type || 'Monthly';
    if (cleanAddress.includes('##RM_STORAGE##')) {
      try {
        const parts = cleanAddress.split('##RM_STORAGE##');
        cleanAddress = parts[0].trim();
        const meta = JSON.parse(parts[1]);
        if (meta.advances) advances = meta.advances;
        if (meta.absences) absences = meta.absences;
        if (meta.role) role = meta.role;
        if (meta.paymentType) paymentType = meta.paymentType;
      } catch (e) { console.warn("Worker Storage err", e); }
    }
    return {
      id: w.id, fullName: w.full_name, role: role, amount: w.salary || 0, paymentType: paymentType, birthday: w.birthday || '', phone: w.phone || '', email: w.email || '', address: cleanAddress, idNumber: w.id_number || '', username: w.username || '', hasAdvances: advances.length > 0, advances: advances, absences: absences
    };
  }, []);

  const fetchFullClient = async (id: string): Promise<Client | null> => {
    const { data } = await supabase.from('clients').select('*').eq('id', id).single();
    return data ? mapClient(data) : null;
  };

  const fetchFullVehicle = async (id: string): Promise<Property | null> => {
    const { data } = await supabase.from('vehicles').select('*').eq('id', id).single();
    if (!data) return null;
    return {
      id: data.id, title: `${data.brand} ${data.model}`, brand: data.brand, model: data.model, year: data.year, plate: data.plate, color: data.color, chassisNumber: data.chassis_number, fuel: data.fuel_type, transmission: data.transmission, seats: data.seats, doors: data.doors, price: data.daily_price || 0, weeklyPrice: data.weekly_price, monthlyPrice: data.monthly_price, caution: data.caution, status: data.status || 'Vacant', availability: data.availability, address: data.location || 'Parc Principal', mileage: data.current_mileage || 0, insuranceExpiry: data.insurance_expiry, technicalControlDate: data.technical_control_expiry, insuranceInfo: data.insurance_info, image: data.image_url || '', secondaryImages: data.secondary_images || [], type: 'Studio', rooms: 0, area: 0
    };
  };

  const refreshData = useCallback(async () => {
    try {
      const [vRes, cRes, rRes, aRes, wRes, iRes, dRes, mRes, eRes, configRes] = await Promise.all([
        supabase.from('vehicles').select('id, brand, model, year, plate, color, daily_price, status, availability, location, current_mileage, image_url'),
        supabase.from('clients').select('id, first_name, last_name, phone, email, address, registration_date, total_spending, total_reservations, nickname, avatar_url, wilaya').order('id', { ascending: false }),
        supabase.from('reservations').select('*, clients(first_name, last_name), vehicles(brand, model)').order('created_at', { ascending: false }),
        supabase.from('agencies').select('*'),
        supabase.from('workers').select('*').order('id', { ascending: false }),
        supabase.from('inspections').select('*, reservations(id, clients(first_name, last_name), vehicles(brand, model, plate))').order('created_at', { ascending: false }),
        supabase.from('damages').select('*, reservations(id, clients(first_name, last_name), vehicles(brand, model))').order('created_at', { ascending: false }),
        supabase.from('maintenance').select('*, vehicles(brand, model, plate)').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('agency_config').select('settings').maybeSingle()
      ]);

      if (vRes.data) setProperties(vRes.data.map((v: any) => ({ id: v.id, title: `${v.brand} ${v.model}`, brand: v.brand, model: v.model, year: v.year, plate: v.plate, color: v.color, price: v.daily_price || 0, status: v.status || 'Vacant', availability: v.availability !== undefined ? v.availability : true, address: v.location || 'Parc Principal', mileage: v.current_mileage || 0, image: v.image_url || '', secondaryImages: [], type: 'Studio', rooms: 0, area: 0 })));
      if (cRes.data) setClients(cRes.data.map(mapClient));
      if (wRes.data) setWorkers(wRes.data.map(mapWorker));
      if (rRes.data) setReservations(rRes.data.map((r: any) => ({ id: r.id, resNumber: r.res_number, clientId: r.client_id, clientName: r.clients ? `${r.clients.first_name} ${r.clients.last_name}` : 'Inconnu', vehicleId: r.vehicle_id, vehicleName: r.vehicles ? `${r.vehicles.brand} ${r.vehicles.model}` : 'Véhicule', startDate: r.start_date, endDate: r.end_date, totalAmount: r.total_amount, paidAmount: r.paid_amount, status: r.status, statusHistory: [], notes: r.notes || '' })));
      if (aRes.data) setAgencies(aRes.data.map((a: any) => ({ id: a.id, name: a.name, city: a.city, address: a.address, phone: a.phone, email: a.email, manager: a.manager_name, vehicleCount: 0, status: 'Open' })));
      
      if (mRes.data) setMaintenance(mRes.data.map((m: any) => ({ id: m.id, vehicleId: m.vehicle_id, vehicleName: m.vehicles ? `${m.vehicles.brand} ${m.vehicles.model}` : 'Inconnu', type: m.type, cost: m.cost, date: m.date, notes: m.notes })));
      if (eRes.data) setExpenses(eRes.data.map((e: any) => ({ id: e.id, name: e.name, cost: e.cost, date: e.date, category: e.category, notes: e.notes || '' })));
      
      if (iRes.data) setInspections(iRes.data.map((i: any) => { const res = i.reservations; return { id: i.id, reservationId: i.reservation_id, vehicleId: i.vehicle_id || res?.vehicle_id || '', date: i.created_at?.split('T')[0] || 'N/A', type: i.type, vehicleName: res?.vehicles ? `${res.vehicles.brand} ${res.vehicles.model}` : 'Inconnu', plate: res?.vehicles?.plate || 'N/A', clientName: res?.clients ? `${res.clients.first_name} ${res.clients.last_name}` : 'Inconnu', mileage: i.checklist?.mileage || 0, fuelLevel: i.checklist?.fuel_level || 'Plein', checklist: i.checklist || {}, exteriorPhotos: [], interiorPhotos: [], notes: i.checklist?.notes || '', signature: i.checklist?.signature || '' }; }));
      if (dRes.data) setDamages(dRes.data.map((d: any) => { const res = d.reservations; return { id: d.id, reservationId: d.reservation_id, vehicleId: d.vehicle_id || '', name: d.name, vehicleName: res?.vehicles ? `${res.vehicles.brand} ${res.vehicles.model}` : 'Inconnu', clientName: res?.clients ? `${res.clients.first_name} ${res.clients.last_name}` : 'Inconnu', description: d.description, position: d.position, cost: d.cost, severity: d.severity, status: d.status, repair_date: d.repair_date, created_at: d.created_at }; }));

      if (configRes.data) setAgencySettings(configRes.data.settings);

    } catch (err) { console.error("Critical Refresh Failure:", err); }
  }, [mapClient, mapWorker]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser({ id: session.user.id, fullName: session.user.user_metadata.full_name || 'Admin', role: 'Admin', avatar: `https://ui-avatars.com/api/?name=${session.user.email}&background=6366f1&color=fff` });
        refreshData();
      }
      setAppInitializing(false);
    };
    initAuth();
  }, [refreshData]);

  const deleteReservationSafely = async (id: string) => {
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (!error) { showToast("Contrat supprimé", "success"); refreshData(); }
  };

  const logout = async () => { await supabase.auth.signOut(); setUser(null); showToast("Déconnecté", "info"); };

  if (appInitializing) return <PageLoader />;

  return (
    <AppContext.Provider value={{ showToast, properties, setProperties, reservations, setReservations, clients, setClients, workers, setWorkers, inspections, setInspections, damages, setDamages, maintenance, setMaintenance, expenses, setExpenses, agencies, setAgencies, agencySettings, setAgencySettings, deleteReservationSafely, logout, refreshData, fetchFullClient, fetchFullVehicle }}>
      {!user ? (
        <>
          <Login lang={lang} setLang={setLang} onLogin={(u) => setUser(u)} />
          <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
        </>
      ) : (
        <Router>
          <Layout lang={lang} setLang={setLang} user={user} setUser={setUser}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Suspense fallback={<PageLoader />}><Dashboard lang={lang} user={user} /></Suspense>} />
                <Route path="/planner" element={<Suspense fallback={<PageLoader />}><Reservations lang={lang} user={user} /></Suspense>} />
                <Route path="/operations" element={<Suspense fallback={<PageLoader />}><Operations lang={lang} user={user} /></Suspense>} />
                <Route path="/properties" element={<Suspense fallback={<PageLoader />}><Properties lang={lang} user={user} /></Suspense>} />
                <Route path="/tenants" element={<Suspense fallback={<PageLoader />}><Tenants lang={lang} user={user} /></Suspense>} />
                <Route path="/agencies" element={<Suspense fallback={<PageLoader />}><Agencies lang={lang} /></Suspense>} />
                <Route path="/workers" element={<Suspense fallback={<PageLoader />}><Workers lang={lang} /></Suspense>} />
                <Route path="/expenses" element={<Suspense fallback={<PageLoader />}><Expenses lang={lang} user={user} /></Suspense>} />
                <Route path="/reports" element={<Suspense fallback={<PageLoader />}><Reports lang={lang} /></Suspense>} />
                <Route path="/ai" element={<Suspense fallback={<PageLoader />}><AIInsights lang={lang} /></Suspense>} />
                <Route path="/finance" element={<Suspense fallback={<PageLoader />}><Finance lang={lang} user={user} /></Suspense>} />
                <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage lang={lang} /></Suspense>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Layout>
          <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
        </Router>
      )}
    </AppContext.Provider>
  );
};

export default App;