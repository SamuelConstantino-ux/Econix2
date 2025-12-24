
import React, { useMemo } from 'react';
import { FinancialRecord, DashboardFilters, Category } from '../types';
import { formatCurrency, getMonthName, addMonthsToYearMonth } from '../utils/finance';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface DashboardProps {
  records: FinancialRecord[];
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  categories: Category[];
}

const Dashboard: React.FC<DashboardProps> = ({ records, filters, setFilters, categories }) => {
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const recordDate = new Date(record.date);
      const [fYear, fMonth] = filters.month.split('-').map(Number);

      const matchesMonth = recordDate.getFullYear() === fYear && (recordDate.getMonth() + 1) === fMonth;

      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        return recordDate >= start && recordDate <= end;
      }

      return matchesMonth;
    });
  }, [records, filters]);

  const handlePrevMonth = () => {
    setFilters({ ...filters, month: addMonthsToYearMonth(filters.month, -1) });
  };

  const handleNextMonth = () => {
    setFilters({ ...filters, month: addMonthsToYearMonth(filters.month, 1) });
  };

  // KPIs (Apenas registros PAGOS) - Tipagem explícita para evitar erros aritméticos
  const stats = useMemo(() => {
    const paidRecords = filteredRecords.filter(r => r.status === 'Pago');
    const income = paidRecords.filter(r => r.type === 'Entrada').reduce((acc: number, r) => acc + Number(r.value), 0);
    const outcome = paidRecords.filter(r => r.type === 'Saída').reduce((acc: number, r) => acc + Number(r.value), 0);
    const investment = paidRecords.filter(r => r.type === 'Investimento').reduce((acc: number, r) => acc + Number(r.value), 0);

    return {
      income,
      outcome,
      investment,
      net: income - (outcome + investment)
    };
  }, [filteredRecords]);

  // Dados do gráfico de rosca
  const donutData = useMemo(() => {
    const total = stats.income + stats.outcome + stats.investment;
    if (total === 0) return [];
    return [
      { name: 'Entradas', value: stats.income, color: '#10b981', percent: ((stats.income / total) * 100).toFixed(0) },
      { name: 'Saídas', value: stats.outcome, color: '#ef4444', percent: ((stats.outcome / total) * 100).toFixed(0) },
      { name: 'Investimentos', value: stats.investment, color: '#3b82f6', percent: ((stats.investment / total) * 100).toFixed(0) },
    ].filter(d => d.value > 0);
  }, [stats]);

  // Dados do gráfico de barras (Despesas por Categoria com Cores Dinâmicas)
  const categoryData = useMemo(() => {
    const expenses = filteredRecords.filter(r => r.type === 'Saída' && r.status === 'Pago');
    const totalExpenses = expenses.reduce((acc: number, r) => acc + Number(r.value), 0);
    const map: Record<string, number> = {};
    expenses.forEach(r => {
      map[r.category] = (map[r.category] || 0) + Number(r.value);
    });

    return Object.entries(map)
      .map(([name, value]) => {
        const categoryInfo = categories.find(c => c.name === name);
        return {
          name,
          value,
          color: categoryInfo?.color || '#6366f1',
          percent: totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(0) : '0'
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords, categories]);

  // Insights
  const insights = useMemo(() => {
    const list: string[] = [];
    if (categoryData.length > 0) {
      list.push(`Sua maior categoria de gasto este mês foi ${categoryData[0].name}.`);
    }
    if (stats.income > 0) {
      const investPercent = ((stats.investment / stats.income) * 100).toFixed(1);
      list.push(`Seus investimentos representam ${investPercent}% das suas entradas.`);
      const expensePercent = (((stats.outcome + stats.investment) / stats.income) * 100).toFixed(1);
      list.push(`Você está comprometendo ${expensePercent}% da sua renda mensal.`);
    }
    if (stats.net < 0) {
      list.push("Cuidado! Suas despesas superaram suas receitas este mês.");
    }
    return list;
  }, [categoryData, stats]);

  return (
    <div className="space-y-4 pb-20 px-4">
      {/* Header com Navegação */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Período de Análise</h2>
          <div className="flex items-center gap-3">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-50 rounded-lg border border-gray-100 text-gray-500 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-base font-bold text-gray-900 capitalize min-w-[140px] text-center">
              {getMonthName(filters.month)}
            </p>
            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-50 rounded-lg border border-gray-100 text-gray-500 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards de KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Entradas" value={stats.income} icon={<TrendingUp className="w-4 h-4" />} color="emerald" barColor="#10b981" />
        <KpiCard title="Saídas" value={stats.outcome} icon={<TrendingDown className="w-4 h-4" />} color="rose" barColor="#ef4444" />
        <KpiCard title="Líquido" value={stats.net} icon={<Wallet className="w-4 h-4" />} color="blue" barColor="#3b82f6" />
        <KpiCard title="Investido" value={stats.investment} icon={<PiggyBank className="w-4 h-4" />} color="indigo" barColor="#6366f1" />
      </div>

      {/* Seção de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[320px]">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Distribuição Financeira</h3>
          <div className="flex-1 min-h-0">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                    {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                    formatter={(value: number, name: string, props: any) => [formatCurrency(value), `${name} (${props.payload.percent}%)`]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value, entry: any) => (
                    <span className="text-[10px] font-medium text-gray-500">{value} ({entry.payload.percent}%)</span>
                  )} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState message="Sem dados para este período." />}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[320px]">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Gastos por Categoria</h3>
          <div className="flex-1 min-h-0">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, bottom: 40, left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    fontSize={9}
                    tick={{ fill: '#9ca3af', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis
                    fontSize={9}
                    tick={{ fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                  />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24} label={(props: any) => {
                    const { x, y, width, index } = props;
                    return (
                      <text x={x + width / 2} y={y - 8} fill="#9ca3af" textAnchor="middle" fontSize={9} fontWeight="bold">
                        {categoryData[index].percent}%
                      </text>
                    );
                  }}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState message="Nenhuma despesa registrada." />}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Insights Econix</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.length > 0 ? insights.map((insight, idx) => (
            <div key={idx} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50 flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">{insight}</p>
            </div>
          )) : <p className="text-[10px] text-gray-400 italic">Continue registrando para obter insights automáticos.</p>}
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; barColor: string }> = ({ title, value, icon, color, barColor }) => {
  const bgColors: Record<string, string> = {
    emerald: 'bg-emerald-50/40 border-emerald-100/80',
    rose: 'bg-rose-50/40 border-rose-100/80',
    blue: 'bg-blue-50/40 border-blue-100/80',
    indigo: 'bg-indigo-50/40 border-indigo-100/80'
  };

  return (
    <div className={`${bgColors[color] || 'bg-gray-50 border-gray-100'} rounded-2xl shadow-sm border flex overflow-hidden hover:shadow-md transition-all group relative h-24`}>
      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: barColor }} />
      <div className="flex-1 p-4 flex items-center justify-between min-w-0">
        <div className="min-w-0">
          <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-0.5">
            {title}
          </p>
          <p className="text-lg font-black truncate text-gray-900 tracking-tight">
            {formatCurrency(value)}
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 ml-2 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400">
    <p className="text-xs font-medium">{message}</p>
  </div>
);

export default Dashboard;
