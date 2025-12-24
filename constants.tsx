
import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Entradas
  { id: '2', name: 'Salário', color: '#10b981', type: 'Entrada' },
  { id: '7', name: 'Renda Extra', color: '#34d399', type: 'Entrada' },
  { id: '9-in', name: 'Outros', color: '#9ca3af', type: 'Entrada' },
  
  // Saídas
  { id: '1', name: 'Alimentação', color: '#f87171', type: 'Saída' },
  { id: '3', name: 'Moradia', color: '#60a5fa', type: 'Saída' },
  { id: '4', name: 'Transporte', color: '#fbbf24', type: 'Saída' },
  { id: '5', name: 'Saúde', color: '#f472b6', type: 'Saída' },
  { id: '6', name: 'Lazer', color: '#a78bfa', type: 'Saída' },
  { id: '8', name: 'Educação', color: '#818cf8', type: 'Saída' },
  { id: '9-out', name: 'Outros', color: '#9ca3af', type: 'Saída' },
  
  // Investimentos
  { id: '10', name: 'Investimento CDB', color: '#2dd4bf', type: 'Investimento' },
  { id: '11', name: 'Ações', color: '#4ade80', type: 'Investimento' },
  { id: '9-inv', name: 'Outros', color: '#9ca3af', type: 'Investimento' },
];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
