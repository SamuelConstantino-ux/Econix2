
export type RecordType = 'Entrada' | 'Saída' | 'Investimento';

export type RecordStatus = 'Pago' | 'Agendado';

export type RecurrenceType = 'Fixo' | 'Variável';

export interface Category {
  id: string;
  name: string;
  color: string;
  type: RecordType | 'Geral';
}

export interface FinancialRecord {
  id: string;
  type: RecordType;
  date: string; // ISO format
  value: number;
  category: string;
  description?: string;
  status: RecordStatus;
  recurrence: RecurrenceType;
}

export type ViewType = 'dashboard' | 'records' | 'profile';

export interface DashboardFilters {
  month: string; // YYYY-MM
  comparisonMonth?: string;
  startDate?: string;
  endDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}
