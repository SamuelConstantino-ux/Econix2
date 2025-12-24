
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const getMonthName = (yearMonth: string): string => {
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
};

export const addMonthsToYearMonth = (yearMonth: string, offset: number): string => {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  const newYear = date.getFullYear();
  const newMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${newYear}-${newMonth}`;
};
