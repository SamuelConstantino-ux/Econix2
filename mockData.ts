
import { FinancialRecord } from './types';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const pad = (n: number) => n.toString().padStart(2, '0');

export const INITIAL_RECORDS: FinancialRecord[] = [
  // Current Month
  {
    id: '1',
    type: 'Entrada',
    date: `${currentYear}-${pad(currentMonth)}-05`,
    value: 5000,
    category: 'Salário',
    description: 'Salário Mensal',
    status: 'Pago',
    recurrence: 'Fixo'
  },
  {
    id: '2',
    type: 'Saída',
    date: `${currentYear}-${pad(currentMonth)}-10`,
    value: 1200,
    category: 'Moradia',
    description: 'Aluguel',
    status: 'Pago',
    recurrence: 'Fixo'
  },
  {
    id: '3',
    type: 'Saída',
    date: `${currentYear}-${pad(currentMonth)}-12`,
    value: 450,
    category: 'Alimentação',
    description: 'Supermercado',
    status: 'Pago',
    recurrence: 'Variável'
  },
  {
    id: '4',
    type: 'Investimento',
    date: `${currentYear}-${pad(currentMonth)}-15`,
    value: 1000,
    category: 'Investimento CDB',
    description: 'Aporte Mensal',
    status: 'Pago',
    recurrence: 'Fixo'
  },
  {
    id: '5',
    type: 'Saída',
    date: `${currentYear}-${pad(currentMonth)}-20`,
    value: 150,
    category: 'Transporte',
    description: 'Combustível',
    status: 'Pago',
    recurrence: 'Variável'
  },
  {
    id: '6',
    type: 'Saída',
    date: `${currentYear}-${pad(currentMonth)}-25`,
    value: 80,
    category: 'Lazer',
    description: 'Cinema',
    status: 'Agendado',
    recurrence: 'Variável'
  },
  {
    id: '7',
    type: 'Entrada',
    date: `${currentYear}-${pad(currentMonth)}-28`,
    value: 300,
    category: 'Renda Extra',
    description: 'Venda de itens',
    status: 'Agendado',
    recurrence: 'Variável'
  },
  
  // Last Month
  {
    id: '8',
    type: 'Entrada',
    date: `${currentYear}-${pad(currentMonth - 1)}-05`,
    value: 5000,
    category: 'Salário',
    description: 'Salário Mensal',
    status: 'Pago',
    recurrence: 'Fixo'
  },
  {
    id: '9',
    type: 'Saída',
    date: `${currentYear}-${pad(currentMonth - 1)}-10`,
    value: 1200,
    category: 'Moradia',
    description: 'Aluguel',
    status: 'Pago',
    recurrence: 'Fixo'
  },
  {
    id: '10',
    type: 'Saída',
    date: `${currentYear}-${pad(currentMonth - 1)}-12`,
    value: 800,
    category: 'Alimentação',
    description: 'Jantares fora',
    status: 'Pago',
    recurrence: 'Variável'
  }
];
