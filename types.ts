
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

export interface Goal {
  id: string;
  category_id: string; // ID da categoria vinculada
  type: RecordType;
  month: string; // YYYY-MM
  target_value: number;
}

export type ViewType = 'dashboard' | 'records' | 'profile' | 'categories' | 'goals';

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
