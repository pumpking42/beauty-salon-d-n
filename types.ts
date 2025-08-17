export interface Service {
  id: number;
  name: string;
  price: number;
  commissionRate: 0.3 | 0.4;
}

export interface Stylist {
  id: number;
  name: string;
}

export enum PaymentMethod {
  Cash = 'Efectivo',
  QR = 'QR',
}

export interface Transaction {
  id: string;
  items: {
    service: Service;
    price: number;
    stylist: Stylist;
  }[];
  paymentMethod: PaymentMethod;
  total: number;
  timestamp: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  timestamp: string;
}

export interface Report {
  date: string;
  transactions: Transaction[];
  expenses: Expense[];
}

export enum View {
    POS,
    Reports,
    Settings,
    Payroll,
}

export enum ReportViewMode {
  Day = 'Día',
  Month = 'Mes',
  Year = 'Año'
}

export interface PayrollRecord {
    stylistId: number;
    startDate: string;
    endDate: string;
}