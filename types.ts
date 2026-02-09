export type Language = 'fr' | 'ar';
export type Direction = 'ltr' | 'rtl';

export type ReservationStatus = 'Pending' | 'Confirmed' | 'Activated' | 'Ongoing' | 'Completed' | 'Archived';
export type WorkerRole = 'Admin' | 'Worker' | 'Driver';
export type PaymentType = 'Daily' | 'Monthly';
export type MaintenanceType = 'Oil Change' | 'Insurance' | 'Technical Control' | 'Repair' | 'Other';
export type AuditType = 'status' | 'price' | 'payment' | 'vehicle' | 'system';

export interface Advance {
  id: string;
  amount: number;
  date: string;
  note: string;
}

export interface Absence {
  id: string;
  date: string;
  cost: number;
  reason: string;
}

export interface Worker {
  id: string;
  fullName: string;
  role: WorkerRole;
  amount: number;
  paymentType: PaymentType;
  birthday: string;
  phone: string;
  email: string;
  address: string;
  idNumber: string;
  username: string;
  hasAdvances: boolean;
  advances: Advance[];
  absences: Absence[];
}

export interface Agency {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  vehicleCount: number;
  status: 'Open' | 'Closed';
}

export interface UserSession {
  id: string;
  fullName: string;
  role: WorkerRole;
  avatar?: string;
}

export interface StatusLog {
  id: string;
  type: AuditType;
  action: string;
  status: ReservationStatus;
  timestamp: string;
  user: string;
  role: WorkerRole;
  notes?: string;
  oldValue?: string | number;
  newValue?: string | number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  allowedRoles: WorkerRole[];
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  phone: string;
  email?: string;
  address?: string;
  wilaya?: string;
  idNumber?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  documentPhotos?: string[];
  avatar?: string;
  totalReservations: number;
  totalSpending: number;
  registrationDate: string;
}

export interface Property {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color?: string;
  chassisNumber?: string;
  fuel?: string;
  transmission?: 'Manual' | 'Automatic';
  seats?: number;
  doors?: number;
  price: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  caution?: number;
  status: 'Rented' | 'Vacant' | 'Maintenance';
  availability: boolean;
  address: string;
  mileage: number;
  insuranceExpiry?: string;
  technicalControlDate?: string;
  insuranceInfo?: string;
  image: string;
  secondaryImages?: string[];
  type: 'Apartment' | 'House' | 'Studio' | 'Commercial';
  rooms: number;
  area: number;
}

export interface Reservation {
  id: string;
  resNumber: string;
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  paidAmount: number;
  totalAmount: number;
  status: ReservationStatus;
  statusHistory: StatusLog[];
  notes?: string;
}

export interface Damage {
  id: string;
  reservationId: string;
  vehicleId: string;
  name: string;
  vehicleName: string;
  clientName: string;
  description: string;
  position: string;
  cost: number;
  severity: 'Light' | 'Medium' | 'Severe';
  status: 'Pending' | 'Repaired';
  repairDate?: string;
  createdAt: string;
}

export interface Inspection {
  id: string;
  reservationId: string;
  vehicleId: string;
  date: string;
  type: 'Departure' | 'Return';
  vehicleName: string;
  plate: string;
  clientName: string;
  mileage: number;
  fuelLevel: string;
  checklist: any;
  exteriorPhotos: string[];
  interiorPhotos: string[];
  notes: string;
  signature: string;
}

export interface Expense {
  id: string;
  name: string;
  cost: number;
  date: string;
  category: string;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: MaintenanceType;
  cost: number;
  date: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  number: string;
  reservationId: string;
  clientName: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  type: 'Invoice' | 'Contract' | 'Devis';
}

export interface Translation {
  [key: string]: {
    fr: string;
    ar: string;
  };
}