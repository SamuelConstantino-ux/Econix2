
import React, { useState, useMemo } from 'react';
import { FinancialRecord, RecordType, RecordStatus, Category } from '../types';
import { formatCurrency, formatDate, getMonthName, addMonthsToYearMonth } from '../utils/finance';
import { Plus, Search, Trash2, Edit3, AlertTriangle, ChevronLeft, ChevronRight, Palette, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface RecordsProps {
  records: FinancialRecord[];
  categories: Category[];
  onAdd: (record: Omit<FinancialRecord, 'id'>) => void;
  onEdit: (record: FinancialRecord) => void;
  onDelete: (id: string) => void;
  onAddCategory: (category: Category) => Promise<Category | null>;
}

const Records: React.FC<RecordsProps> = ({ records, categories, onAdd, onEdit, onDelete, onAddCategory }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<RecordType | 'Todos'>('Todos');
  const [statusFilter, setStatusFilter] = useState<RecordStatus | 'Todos'>('Todos');
  const [recurrenceFilter, setRecurrenceFilter] = useState<string | 'Todos'>('Todos');

  const todayMonth = new Date().toISOString().slice(0, 7);
  const [viewMonth, setViewMonth] = useState(todayMonth);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = r.description?.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'Todos' || r.type === typeFilter;
      const matchesStatus = statusFilter === 'Todos' || r.status === statusFilter;
      const matchesRecurrence = recurrenceFilter === 'Todos' || r.recurrence === recurrenceFilter;
      const matchesMonth = r.date.startsWith(viewMonth);
      return matchesSearch && matchesType && matchesStatus && matchesRecurrence && matchesMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, search, typeFilter, statusFilter, viewMonth]);

  const totals = useMemo(() => {
    const sums = filteredRecords.reduce((acc, r) => {
      const val = Number(r.value);
      if (r.type === 'Entrada') acc.income += val;
      else if (r.type === 'Saída') acc.expense += val;
      else if (r.type === 'Investimento') acc.invest += val;
      return acc;
    }, { income: 0, expense: 0, invest: 0 });

    return {
      income: sums.income,
      expense: sums.expense,
      net: sums.income - (sums.expense + sums.invest)
    };
  }, [filteredRecords]);

  const toggleStatus = (record: FinancialRecord) => {
    onEdit({ ...record, status: record.status === 'Pago' ? 'Agendado' : 'Pago' });
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      onDelete(recordToDelete);
      setRecordToDelete(null);
    }
  };

  const handlePrevMonth = () => setViewMonth(prev => addMonthsToYearMonth(prev, -1));
  const handleNextMonth = () => setViewMonth(prev => addMonthsToYearMonth(prev, 1));

  const getCategoryColor = (catName: string) => {
    return categories.find(c => c.name === catName)?.color || '#9ca3af';
  };

  return (
    <div className="space-y-6 pb-24 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Meus Registros</h2>
          <p className="text-sm text-gray-500 font-medium">Gerencie suas movimentações financeiras</p>
        </div>
        <button onClick={() => { setEditingRecord(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-95">
          <Plus className="w-5 h-5" />
          <span className="font-bold">Novo Registro</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Mês Visualizado</label>
          <div className="flex items-center justify-between gap-1">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors border border-gray-100">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold text-gray-900 capitalize truncate">{getMonthName(viewMonth)}</span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors border border-gray-100">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <StatCard label="Entradas" value={totals.income} color="emerald" icon={<TrendingUp className="w-3.5 h-3.5" />} />
        <StatCard label="Saídas" value={totals.expense} color="rose" icon={<TrendingDown className="w-3.5 h-3.5" />} />
        <StatCard label="Resultado Líquido" value={totals.net} color="blue" icon={<Wallet className="w-3.5 h-3.5" />} />
      </div>

      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
        </div>
        <div className="flex gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="text-xs py-2 px-2 bg-gray-50 border-none rounded-lg outline-none font-bold">
            <option value="Todos">Tipos</option>
            <option value="Entrada">Entradas</option>
            <option value="Saída">Saídas</option>
            <option value="Investimento">Investimento</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="text-xs py-2 px-2 bg-gray-50 border-none rounded-lg outline-none font-bold">
            <option value="Todos">Status</option>
            <option value="Pago">Pagos</option>
            <option value="Agendado">Agendados</option>
          </select>
          <select value={recurrenceFilter} onChange={(e) => setRecurrenceFilter(e.target.value as any)} className="text-xs py-2 px-2 bg-gray-50 border-none rounded-lg outline-none font-bold">
            <option value="Todos">Todas</option>
            <option value="Fixo">Fixo</option>
            <option value="Variável">Variável</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[9px] font-bold uppercase tracking-wider">
                <th className="px-3 py-4 w-24">Data</th>
                <th className="px-2 py-4 w-28">Tipo</th>
                <th className="px-2 py-4">Categoria</th>
                <th className="px-2 py-4">Descrição</th>
                <th className="px-2 py-4 w-24">Valor</th>
                <th className="px-2 py-4 text-center w-24">Status</th>
                <th className="px-2 py-4 text-center w-24">Recorrência</th>
                <th className="px-3 py-4 text-center w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-3 py-3 text-[11px] text-gray-600 font-bold whitespace-nowrap">{formatDate(record.date)}</td>
                  <td className="px-2 py-3">
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md inline-block whitespace-nowrap ${record.type === 'Entrada' ? 'bg-emerald-50 text-emerald-600' :
                      record.type === 'Saída' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                      }`}>{record.type}</span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(record.category) }} />
                      <span className="text-[11px] font-bold text-gray-700 truncate">{record.category}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-[11px] font-medium text-gray-500 truncate max-w-[120px]">
                    {record.description || '-'}
                  </td>
                  <td className="px-2 py-3 text-[11px] font-extrabold text-gray-900 whitespace-nowrap">{formatCurrency(record.value)}</td>
                  <td className="px-2 py-3 text-center">
                    <button onClick={() => toggleStatus(record)} className={`text-[9px] font-black px-1.5 py-0.5 rounded-md transition-colors ${record.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {record.status}
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center text-[10px] text-gray-500 italic font-bold">
                    {record.recurrence}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditingRecord(record); setIsModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600 rounded-md transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setRecordToDelete(record.id)} className="p-1 text-gray-400 hover:text-rose-600 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-xs font-bold">Nenhum registro encontrado para este período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">{editingRecord ? 'Editar' : 'Novo'} Registro</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 scroll-smooth">
              <RecordForm
                categories={categories}
                initialData={editingRecord || undefined}
                onSave={(data) => {
                  if (editingRecord) onEdit({ ...data, id: editingRecord.id });
                  else onAdd(data);
                  setIsModalOpen(false);
                }}
                onCancel={() => setIsModalOpen(false)}
                onAddCategory={onAddCategory}
              />
            </div>
          </div>
        </div>
      )}

      {recordToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-black text-gray-900 mb-2">Excluir?</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Esta ação removerá o registro permanentemente.</p>
            <div className="flex gap-2">
              <button onClick={() => setRecordToDelete(null)} className="flex-1 py-2 text-sm font-bold bg-gray-100 rounded-lg">Voltar</button>
              <button onClick={confirmDelete} className="flex-1 py-2 text-sm font-bold bg-rose-600 text-white rounded-lg">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-black text-${color}-600`}>{formatCurrency(value)}</p>
    </div>
    <div className={`p-1.5 rounded-lg bg-${color}-50 text-${color}-600`}>
      {icon}
    </div>
  </div>
);

interface RecordFormProps {
  categories: Category[];
  initialData?: FinancialRecord;
  onSave: (record: Omit<FinancialRecord, 'id'>) => void;
  onCancel: () => void;
  onAddCategory: (category: Category) => Promise<Category | null>;
}

const RecordForm: React.FC<RecordFormProps> = ({ categories, initialData, onSave, onCancel, onAddCategory }) => {
  const [formData, setFormData] = useState<Omit<FinancialRecord, 'id'>>({
    type: initialData?.type || 'Saída',
    date: initialData?.date || new Date().toISOString().slice(0, 10),
    value: initialData?.value || 0,
    category: initialData?.category || '',
    description: initialData?.description || '',
    status: initialData?.status || 'Agendado',
    recurrence: initialData?.recurrence || 'Variável'
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  const availableCategories = useMemo(() => {
    return categories.filter(c => c.type === formData.type || c.type === 'Geral');
  }, [categories, formData.type]);

  React.useEffect(() => {
    if (!initialData && availableCategories.length > 0 && !availableCategories.find(c => c.name === formData.category)) {
      setFormData(prev => ({ ...prev, category: availableCategories[0].name }));
    }
  }, [formData.type, availableCategories, initialData]);

  const handleCreateCategory = async () => {
    if (!newCatName.trim() || isCreatingCat) return;
    setIsCreatingCat(true);

    try {
      const newCat: Category = {
        id: '',
        name: newCatName,
        color: newCatColor,
        type: formData.type
      };

      const created = await onAddCategory(newCat);

      if (created) {
        setFormData(prev => ({ ...prev, category: created.name }));
        setNewCatName('');
        setIsAddingCategory(false);
      }
    } finally {
      setIsCreatingCat(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tipo</label>
          <select className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold appearance-none cursor-pointer" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
            <option value="Entrada">Entrada</option>
            <option value="Saída">Saída</option>
            <option value="Investimento">Investimento</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Data</label>
          <input type="date" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Categoria</label>
          <button type="button" onClick={() => setIsAddingCategory(!isAddingCategory)} className="text-[10px] font-black text-blue-600 uppercase hover:underline">
            {isAddingCategory ? 'Cancelar' : '+ Nova Categoria'}
          </button>
        </div>

        {!isAddingCategory ? (
          <select className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold appearance-none cursor-pointer" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
            {availableCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
        ) : (
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-2">
              <input type="text" placeholder="Nome da categoria..." className="flex-1 p-2 text-sm bg-white border border-gray-200 rounded-lg outline-none font-bold" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} autoFocus />
              <div className="flex items-center gap-2 px-2 bg-white border border-gray-200 rounded-lg">
                <Palette className="w-3.5 h-3.5 text-gray-400" />
                <input type="color" className="w-5 h-5 border-none cursor-pointer bg-transparent" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} title="Cor da Categoria" />
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={isCreatingCat}
              className="w-full py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
            >
              {isCreatingCat ? 'Criando...' : 'Criar Categoria'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Valor (R$)</label>
          <input type="number" step="0.01" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-black" value={formData.value || ''} onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })} required />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Status</label>
          <select className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold appearance-none cursor-pointer" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
            <option value="Pago">Pago</option>
            <option value="Agendado">Agendado</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Recorrência</label>
          <select className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold appearance-none cursor-pointer" value={formData.recurrence} onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as any })}>
            <option value="Variável">Variável</option>
            <option value="Fixo">Fixo</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Descrição</label>
        <input type="text" placeholder="Ex: Mercado mensal (Opcional)" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>

      <div className="pt-4 flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 py-3 text-sm font-extrabold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
        <button type="submit" className="flex-1 py-3 text-sm font-extrabold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Salvar Registro</button>
      </div>
    </form>
  );
};

export default Records;
