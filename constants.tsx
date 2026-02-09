
import React from 'react';
import { 
  LayoutDashboard, Car, Users, Receipt, Settings, BrainCircuit, 
  Calendar, Clock, AlertCircle, DollarSign, ArrowUpRight, TrendingUp, 
  MapPin, ClipboardList, ShieldAlert, UserCog, Briefcase, 
  History, Wallet, CalendarX, UserCheck, BarChart3, Wrench, 
  Database, ShieldCheck, CreditCard, Facebook, Instagram, Mail,
  Landmark, Store
} from 'lucide-react';
// Remove Driver import as it's not exported from types.ts
import { Translation, Reservation, Invoice, Property, Client, Inspection, Damage, Worker, Agency, MenuItem, Maintenance, Expense } from './types';

export const TVA_RATE = 0.19;

export const WILAYAS = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna", "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou", "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine", "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Arreridj", "35 - Boumerdès", "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma", "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane", "49 - El M'Ghair", "50 - El Meniaa",
  "51 - Ouled Djellal", "52 - Bordj Mokhtar", "53 - Béni Abbès", "54 - Timimoun", "55 - Touggourt", "56 - Djanet", "57 - In Salah", "58 - In Guezzam"
];

export const TRANSLATIONS: Translation = {
  // Navigation
  dashboard: { fr: 'Tableau de bord', ar: 'لوحة القيادة' },
  properties: { fr: 'Véhicules', ar: 'المركبات' },
  tenants: { fr: 'Clients', ar: 'العملاء' },
  workers: { fr: 'Équipe', ar: 'فريق العمل' },
  payments: { fr: 'Finances', ar: 'المالية' },
  expenses: { fr: 'Dépenses', ar: 'المصاريف' },
  reports: { fr: 'Rapports', ar: 'التقارير' },
  aiInsights: { fr: 'Analyses IA', ar: 'تحليلات الذكاء الاصطناعي' },
  settings: { fr: 'Configuration', ar: 'الإعدادات' },
  planner: { fr: 'Planificateur', ar: 'المخطط' },
  operations: { fr: 'Opérations', ar: 'العمليات' },
  myPay: { fr: 'Ma Paie', ar: 'راتبي' },
  agencies: { fr: 'Agences', ar: 'الفروع' },

  // Statuses
  statuspending: { fr: 'En attente', ar: 'في الانتظار' },
  statusconfirmed: { fr: 'Confirmée', ar: 'مؤكدة' },
  statusactivated: { fr: 'Activée', ar: 'مفعلة' },
  statusongoing: { fr: 'En cours', ar: 'قيد التنفيذ' },
  statuscompleted: { fr: 'Terminée', ar: 'مكتملة' },
  statusarchived: { fr: 'Archivée', ar: 'مؤرشفة' },
  statusrented: { fr: 'Louée', ar: 'مؤجرة' },
  statusvacant: { fr: 'Disponible', ar: 'متاحة' },
  statusmaintenance: { fr: 'Atelier', ar: 'في الصيانة' },

  // General Actions
  addClient: { fr: 'Ajouter Client', ar: 'إضافة عميل' },
  addProperty: { fr: 'Ajouter Véhicule', ar: 'إضافة مركبة' },
  addWorker: { fr: 'Ajouter Collaborateur', ar: 'إضافة موظف' },
  addAgency: { fr: 'Ajouter Agence', ar: 'إضافة فرع' },
  edit: { fr: 'Modifier', ar: 'تعديل' },
  delete: { fr: 'Supprimer', ar: 'حذف' },
  confirm: { fr: 'Confirmer', ar: 'تأكيد' },
  cancel: { fr: 'Annuler', ar: 'إلغاء' },
  nextStep: { fr: 'Étape suivante', ar: 'الخطوة التالية' },
  back: { fr: 'Retour', ar: 'رجوع' },
  save: { fr: 'Enregistrer', ar: 'حفظ' },
  view: { fr: 'Voir', ar: 'عرض' },
  actions: { fr: 'Actions', ar: 'إجراءات' },
  all: { fr: 'Toutes', ar: 'الكل' },
  filters: { fr: 'Filtres', ar: 'فلترة' },
  search: { fr: 'Rechercher', ar: 'بحث' },

  // Document types
  invoices: { fr: 'Factures', ar: 'الفواتير' },
  contracts: { fr: 'Contrats', ar: 'العقود' },
  devis: { fr: 'Devis', ar: 'عروض أسعار' },

  // Dashboard Specific
  hello: { fr: 'Bonjour', ar: 'مرحباً' },
  readyForTasks: { fr: 'Prêt pour vos tâches du jour ?', ar: 'هل أنت جاهز لمهام اليوم؟' },
  fleetPerformance: { fr: 'Performance globale du parc.', ar: 'إليك أداء أسطولك.' },
  newReservation: { fr: 'Nouvelle Réservation', ar: 'حجز جديد' },
  revenueFlow: { fr: 'Flux de Revenus', ar: 'تدفق الإيرادات' },
  fleetStatus: { fr: 'État Flotte', ar: 'حالة الأسطول' },
  aiRecommendation: { fr: 'Recommandation Stratégique', ar: 'توصية الذكاء الاصطناعي' },
  analyzeWithAi: { fr: 'Analyser avec l\'IA', ar: 'تحليل بالذكاء الاصطناعي' },
  totalReservations: { fr: 'Réservations', ar: 'إجمالي الحجوزات' },
  earnings: { fr: 'Chiffre d\'affaires', ar: 'الأرباح' },
  lateReturns: { fr: 'Retours tardifs', ar: 'تأخر الإرجاع' },
  availableVehicles: { fr: 'Unités disponibles', ar: 'المركبات المتاحة' },
  currencyDA: { fr: 'DA', ar: 'دج' },

  // Wizard Keys
  datesLogistics: { fr: 'Dates & Logistique', ar: 'التواريخ واللوجستيات' },
  vehicleSelection: { fr: 'Sélection Véhicule', ar: 'اختيار المركبة' },
  clientIdentification: { fr: 'Identification Client', ar: 'تحديد هوية العميل' },
  servicesOptions: { fr: 'Services & Options', ar: 'الخدمات والخيارات' },
  financialClosure: { fr: 'Clôture Financière', ar: 'الإغلاق المالي' },
  confirmation: { fr: 'Confirmation', ar: 'التأكيد' },
  startDate: { fr: 'Date de Début', ar: 'تاريخ البدء' },
  endDate: { fr: 'Date de Fin', ar: 'تاريخ الانتهاء' },
  pickupLocation: { fr: 'Lieu de Départ', ar: 'مكان الاستلام' },
  returnLocation: { fr: 'Lieu de Retour', ar: 'مكان الإرجاع' },
  searchClient: { fr: 'Rechercher un client...', ar: 'بحث عن عميل...' },
  newClientProfile: { fr: 'Créer Profil Client', ar: 'إنشاء ملف عميل' },
  baseRental: { fr: 'Location de Base', ar: 'الإيجار الأساسي' },
  optionalServices: { fr: 'Options & Services', ar: 'الخيارات والخدمات' },
  discountHT: { fr: 'Remise HT', ar: 'تخفيض' },
  applyTVA: { fr: 'Appliquer la TVA (19%)', ar: 'تطبيق الضريبة (19%)' },
  totalTTC: { fr: 'Total TTC', ar: 'الإجمالي مع الضريبة' },
  balanceDue: { fr: 'Reste à payer', ar: 'المبلغ المتبقي' },
  extraDiscount: { fr: 'Remise Exceptionnelle', ar: 'تخفيض استثنائي' },
  depositAmount: { fr: 'Acompte Versé', ar: 'المبلغ المدفوع' },
  signAndSave: { fr: 'Valider le dossier', ar: 'تأكيد الملف' },
  expertDossier: { fr: 'Dossier Expert', ar: 'ملف خبير' },
  step: { fr: 'Étape', ar: 'خطوة' },
  of: { fr: 'sur', ar: 'من' },
};

export const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'dashboard', icon: LayoutDashboard, path: '/', allowedRoles: ['Admin', 'Worker', 'Driver'] },
  { id: 'planner', label: 'planner', icon: Calendar, path: '/planner', allowedRoles: ['Admin', 'Worker', 'Driver'] },
  { id: 'operations', label: 'operations', icon: ClipboardList, path: '/operations', allowedRoles: ['Admin', 'Worker', 'Driver'] },
  { id: 'properties', label: 'properties', icon: Car, path: '/properties', allowedRoles: ['Admin', 'Worker'] },
  { id: 'tenants', label: 'tenants', icon: Users, path: '/tenants', allowedRoles: ['Admin', 'Worker'] },
  { id: 'agencies', label: 'agencies', icon: Landmark, path: '/agencies', allowedRoles: ['Admin'] },
  { id: 'workers', label: 'workers', icon: Briefcase, path: '/workers', allowedRoles: ['Admin'] },
  { id: 'finance', label: 'payments', icon: Receipt, path: '/finance', allowedRoles: ['Admin', 'Worker', 'Driver'] },
  { id: 'expenses', label: 'expenses', icon: Wallet, path: '/expenses', allowedRoles: ['Admin', 'Worker'] },
  { id: 'reports', label: 'reports', icon: BarChart3, path: '/reports', allowedRoles: ['Admin'] },
  { id: 'ai', label: 'aiInsights', icon: BrainCircuit, path: '/ai', allowedRoles: ['Admin', 'Worker'] },
  { id: 'settings', label: 'settings', icon: Settings, path: '/settings', allowedRoles: ['Admin'] },
];

export const MOCK_RESERVATIONS: Reservation[] = [
  { 
    id: 'r1', resNumber: 'RES-2024-001', clientId: 'c1', clientName: 'Sofiane Hamidi', 
    // Remove invoiceId as it's not in the Reservation interface
    vehicleId: 'v1', vehicleName: 'Tesla Model 3', 
    startDate: '2024-05-10 10:00', endDate: '2024-05-15 10:00', paidAmount: 45000, totalAmount: 45000, 
    status: 'Confirmed', statusHistory: [] 
  },
];

export const MOCK_PROPERTIES: Property[] = [
  { id: 'v1', title: 'Tesla Model 3', brand: 'Tesla', model: 'Model 3', year: 2023, address: 'Alger Centre', type: 'Studio', price: 9000, status: 'Rented', availability: false, rooms: 0, area: 0, image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800', fuel: 'Électrique', plate: 'EV-452-RE', mileage: 12450 },
  { id: 'v2', title: 'BMW X5', brand: 'BMW', model: 'X5', year: 2022, address: 'Aéroport Alger', type: 'Apartment', price: 15000, status: 'Vacant', availability: true, rooms: 0, area: 0, image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800', fuel: 'Diesel', plate: 'BX-991-ZZ', mileage: 28900 },
];

export const MOCK_CLIENTS: Client[] = [
  // Fix: added missing wilaya property to comply with Client interface
  { id: 'c1', firstName: 'Sofiane', lastName: 'Hamidi', phone: '0550123456', email: 'sofiane.h@email.com', address: 'Alger Centre', wilaya: '16 - Alger', idNumber: '1098234765', licenseNumber: 'AL-9988-22', licenseExpiry: '2028-10-15', totalReservations: 1, totalSpending: 124500, registrationDate: '2023-01-10' },
];

export const MOCK_MAINTENANCE: Maintenance[] = [
  { id: 'm1', vehicleId: 'v1', vehicleName: 'Tesla Model 3', type: 'Oil Change', cost: 8500, date: '2024-05-12', notes: 'Entretien régulier' },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', name: 'Loyer Bureau Hydra', cost: 120000, date: '2024-05-01', category: 'Infrastructure' },
  { id: 'e2', name: 'Abonnement Fibre', cost: 8500, date: '2024-05-05', category: 'Services' },
];

export const MOCK_INSPECTIONS: Inspection[] = [
  { 
    id: 'i1', reservationId: 'r1', vehicleId: 'v1', date: '2024-05-10', type: 'Departure', vehicleName: 'Tesla Model 3', plate: 'EV-452-RE', clientName: 'Sofiane Hamidi', mileage: 12450, fuelLevel: 'Plein',
    checklist: { lights: true, tires: true, brakes: true, wipers: true, mirrors: true, belts: true, horn: true, spareWheel: true, jack: true, triangles: true, firstAid: true, documents: true, climatisation: true, cleanliness: true },
    exteriorPhotos: [], interiorPhotos: [],
    // Add missing required properties
    notes: '', signature: ''
  },
];

export const MOCK_DAMAGES: Damage[] = [
  { id: 'd1', reservationId: 'r1', vehicleId: 'v1', name: 'Rayure portière', vehicleName: 'Tesla Model 3', clientName: 'Sofiane Hamidi', description: 'Rayure superficielle.', position: 'Avant Gauche', cost: 15000, severity: 'Light', status: 'Pending', createdAt: '2024-05-11' },
];

export const MOCK_AGENCIES: Agency[] = [
  { id: 'a1', name: 'Agence Alger Centre', city: 'Alger', address: '12 Rue Didouche Mourad', phone: '021 66 77 88', email: 'alger@rentmaster.dz', manager: 'Salim Benali', vehicleCount: 12, status: 'Open' },
  { id: 'a2', name: 'Aéroport Alger', city: 'Alger', address: 'Terminal International', phone: '021 55 44 33', email: 'airport@rentmaster.dz', manager: 'Amine Kaci', vehicleCount: 24, status: 'Open' },
  { id: 'a3', name: 'Agence Oran Port', city: 'Oran', address: 'Quai N°4', phone: '041 22 33 44', email: 'oran@rentmaster.dz', manager: 'Yacine Houari', vehicleCount: 8, status: 'Open' },
];

export const MOCK_OPTIONS = {
  decorations: [{ id: 'opt1', name: 'Siège Bébé', price: 1500 }],
  insurance: [{ id: 'opt3', name: 'Assurance Premium', price: 4500 }],
  services: [{ id: 'opt4', name: 'Lavage Intégral', price: 2000 }],
};

export const MOCK_WORKERS: Worker[] = [
  {
    id: 'w1',
    fullName: 'Karim Brahimi',
    role: 'Admin',
    amount: 95000,
    paymentType: 'Monthly',
    birthday: '1985-06-15',
    phone: '0550112233',
    email: 'karim.b@rentmaster.dz',
    address: 'Alger Centre',
    idNumber: '123456789',
    username: 'karim_admin',
    hasAdvances: false,
    advances: [],
    absences: []
  },
  {
    id: 'w2',
    fullName: 'Samir Lounis',
    role: 'Worker',
    amount: 55000,
    paymentType: 'Monthly',
    birthday: '1992-03-20',
    phone: '0555443322',
    email: 'samir.l@rentmaster.dz',
    address: 'Bab Ezzouar',
    idNumber: '987654321',
    username: 'samir_w',
    hasAdvances: true,
    advances: [
      { id: 'adv1', amount: 5000, date: '2024-05-10', note: 'Avance transport' }
    ],
    absences: []
  }
];

export const MOCK_INVOICES: Invoice[] = [
  { id: 'inv-1', number: 'FAC-2024-001', reservationId: 'r1', clientName: 'Sofiane Hamidi', date: '2024-05-10', amount: 45000, status: 'Paid', type: 'Invoice' },
  { id: 'inv-2', number: 'DEVIS-2024-002', reservationId: 'r1', clientName: 'Sofiane Hamidi', date: '2024-05-12', amount: 15000, status: 'Unpaid', type: 'Devis' },
  { id: 'inv-3', number: 'CTR-2024-003', reservationId: 'r1', clientName: 'Sofiane Hamidi', date: '2024-05-10', amount: 45000, status: 'Paid', type: 'Contract' },
];

export const MOCK_DRIVERS = [
  { id: 'dr1', name: 'Ahmed Rezki', rating: 4.8, image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100' },
  { id: 'dr2', name: 'Samir Brahimi', rating: 4.5, image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
  { id: 'dr3', name: 'Karim Lounes', rating: 4.9, image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
];
