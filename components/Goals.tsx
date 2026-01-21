
import React, { useState, useMemo } from 'react';
import { Goal, Category, FinancialRecord, RecordType } from '../types';
import { formatCurrency, getMonthName, addMonthsToYearMonth } from '../utils/finance';
import { Flag, Plus, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface GoalsProps {
    goals: Goal[];
    categories: Category[];
    records: FinancialRecord[];
    onAddGoal: (goal: Omit<Goal, 'id'>) => void;
    onDeleteGoal: (id: string) => void;
}

const Goals: React.FC<GoalsProps> = ({ goals, categories, records, onAddGoal, onDeleteGoal }) => {
    const currentMonthISO = new Date().toISOString().slice(0, 7);
    const [viewMonth, setViewMonth] = useState(currentMonthISO);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<RecordType>('Saída');

    // Form State
    const [formData, setFormData] = useState({
        category_id: '',
        target_value: '',
        month: currentMonthISO
    });

    const handlePrevMonth = () => setViewMonth(prev => addMonthsToYearMonth(prev, -1));
    const handleNextMonth = () => setViewMonth(prev => addMonthsToYearMonth(prev, 1));

    const filteredGoals = useMemo(() => {
        return goals.filter(g => g.month === viewMonth && g.type === activeTab);
    }, [goals, viewMonth, activeTab]);

    // Calculate Progress for each goal
    const goalsWithProgress = useMemo(() => {
        return filteredGoals.map(goal => {
            const category = categories.find(c => c.id === goal.category_id);

            // Filter records: SAME MONTH, SAME CATEGORY, STATUS PAID
            const currentAmount = records
                .filter(r =>
                    r.status === 'Pago' &&
                    r.date.startsWith(viewMonth) &&
                    // Match category name is tricky if ID vs Name. 
                    // Previous code used category NAME in records. Let's check if we can map ID.
                    // App.tsx passes records with category NAME.
                    // Goal stores category ID.
                    // We need to match Goal.category_id -> Category.name -> Record.category
                    (category ? r.category === category.name : false)
                )
                .reduce((sum, r) => sum + Number(r.value), 0);

            const percent = Math.min((currentAmount / goal.target_value) * 100, 100);
            const isExceeded = currentAmount > goal.target_value;
            const isMet = currentAmount >= goal.target_value; // For savings/income, met is good. For expense, exceeded is bad.

            return {
                ...goal,
                categoryName: category?.name || 'Categoria Excluída',
                categoryColor: category?.color || '#9ca3af',
                currentAmount,
                percent,
                isExceeded,
                isMet
            };
        });
    }, [filteredGoals, records, categories, viewMonth]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.category_id || !formData.target_value) return;

        onAddGoal({
            category_id: formData.category_id,
            type: activeTab,
            month: formData.month,
            target_value: Number(formData.target_value)
        });

        setIsModalOpen(false);
        setFormData({ ...formData, category_id: '', target_value: '' });
    };

    const availableCategories = useMemo(() => {
        return categories.filter(c => c.type === activeTab);
    }, [categories, activeTab]);

    return (
        <div className="space-y-6 pb-24 px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Metas Mensais</h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Defina e acompanhe seus objetivos</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-1 mr-2 shadow-sm">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-gray-900 capitalize min-w-[100px] text-center">{getMonthName(viewMonth)}</span>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => { setIsModalOpen(true); setFormData({ ...formData, month: viewMonth }); }}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-bold">Nova Meta</span>
                    </button>
                </div>
            </div>

            {/* Type Tabs */}
            <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                {(['Saída', 'Entrada', 'Investimento'] as RecordType[]).map((tab) => {
                    const isActive = activeTab === tab;
                    const color = tab === 'Entrada' ? 'emerald' : tab === 'Saída' ? 'rose' : 'blue';
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${isActive
                                    ? `bg-${color}-50 text-${color}-600 shadow-sm`
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab === 'Saída' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                            {tab === 'Saída' ? 'Despesas' : tab === 'Entrada' ? 'Receitas' : 'Investimentos'}
                        </button>
                    );
                })}
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goalsWithProgress.length > 0 ? (
                    goalsWithProgress.map(goal => {
                        // UI Logic for colors
                        let statusColor = 'bg-blue-500';
                        let statusText = 'Em progresso';
                        let barColor = 'bg-blue-500';

                        // Expense Logic
                        if (goal.type === 'Saída') {
                            if (goal.isExceeded) {
                                statusColor = 'text-rose-600';
                                barColor = 'bg-rose-500';
                                statusText = 'Excedido!';
                            } else if (goal.percent >= 80) {
                                statusColor = 'text-amber-600';
                                barColor = 'bg-amber-500';
                                statusText = 'Atenção';
                            } else {
                                statusColor = 'text-emerald-600';
                                barColor = 'bg-emerald-500';
                                statusText = 'Na meta';
                            }
                        }
                        // Income/Investment Logic
                        else {
                            if (goal.isMet) {
                                statusColor = 'text-emerald-600';
                                barColor = 'bg-emerald-500';
                                statusText = 'Atingida!';
                            } else {
                                statusColor = 'text-blue-600';
                                barColor = 'bg-blue-500';
                                statusText = 'Em progresso';
                            }
                        }

                        return (
                            <div key={goal.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: goal.categoryColor }}>
                                            <Flag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{goal.categoryName}</h3>
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${statusColor}`}>{statusText}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => onDeleteGoal(goal.id)} className="text-gray-300 hover:text-rose-500 transition-colors p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                                        <span>{formatCurrency(goal.currentAmount)}</span>
                                        <span className="text-gray-900">{formatCurrency(goal.target_value)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                            style={{ width: `${goal.percent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Feedback Message */}
                                {goal.isExceeded && goal.type === 'Saída' && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-rose-600 bg-rose-50 p-2 rounded-lg">
                                        <AlertCircle className="w-3 h-3" />
                                        Meta de gastos ultrapassada!
                                    </div>
                                )}
                                {goal.isMet && goal.type !== 'Saída' && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Objetivo alcançado! Parabéns!
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <Flag className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium">Nenhuma meta definida para {getMonthName(viewMonth)}.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Nova Meta</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 font-medium text-center mb-2">
                                Definindo meta de <strong>{activeTab}</strong> para <strong>{getMonthName(formData.month)}</strong>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Categoria</label>
                                <select
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold appearance-none cursor-pointer"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione uma categoria...</option>
                                    {availableCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Valor Alvo (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold"
                                    value={formData.target_value}
                                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                                    placeholder="0,00"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-extrabold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 text-sm font-extrabold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Salvar Meta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Goals;
