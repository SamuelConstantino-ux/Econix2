import React, { useState, useMemo } from 'react';
import { RecordTemplate, Category, RecordType } from '../types';
import { formatCurrency, getMonthName } from '../utils/finance';
import { Repeat, Plus, Trash2, Edit2, CalendarCheck, CheckSquare, Square, TrendingDown, TrendingUp } from 'lucide-react';

interface RecurrencesProps {
    templates: RecordTemplate[];
    categories: Category[];
    onAddTemplate: (template: Omit<RecordTemplate, 'id'>) => void;
    onEditTemplate: (template: RecordTemplate) => void;
    onDeleteTemplate: (id: string) => void;
    onApplyTemplates: (templates: RecordTemplate[], month: string) => void;
}

const Recurrences: React.FC<RecurrencesProps> = ({ templates, categories, onAddTemplate, onEditTemplate, onDeleteTemplate, onApplyTemplates }) => {
    const nextMonthISO = new Date();
    nextMonthISO.setMonth(nextMonthISO.getMonth() + 1);
    const defaultMonthStr = nextMonthISO.toISOString().slice(0, 7);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<RecordTemplate | null>(null);
    const [activeTab, setActiveTab] = useState<RecordType>('Saída');

    const [applyMonth, setApplyMonth] = useState(defaultMonthStr);
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        type: 'Saída' as RecordType,
        value: '',
        category: '',
        description: '',
        dayOfMonth: '5'
    });

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => t.type === activeTab);
    }, [templates, activeTab]);

    const handleOpenApplyModal = () => {
        const tabTemplates = templates.filter(t => t.type === activeTab);
        setSelectedTemplateIds(tabTemplates.map(t => t.id));
        setIsApplyModalOpen(true);
    };

    const toggleTemplateSelection = (id: string) => {
        setSelectedTemplateIds(prev => 
            prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
        );
    };

    const handleApply = () => {
        const templatesToApply = templates.filter(t => selectedTemplateIds.includes(t.id));
        onApplyTemplates(templatesToApply, applyMonth);
        setIsApplyModalOpen(false);
    };

    const handleEdit = (t: RecordTemplate) => {
        setEditingTemplate(t);
        setFormData({
            type: t.type,
            value: t.value.toString(),
            category: t.category,
            description: t.description || '',
            dayOfMonth: t.dayOfMonth.toString()
        });
        setIsModalOpen(true);
    };

    const handleOpenNew = () => {
        setEditingTemplate(null);
        setFormData({
            type: activeTab,
            value: '',
            category: '',
            description: '',
            dayOfMonth: '5'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.category || !formData.value || !formData.dayOfMonth) return;

        const dataToSave = {
            type: formData.type,
            category: formData.category,
            value: Number(formData.value),
            description: formData.description,
            dayOfMonth: Number(formData.dayOfMonth)
        };

        if (editingTemplate) {
            onEditTemplate({ ...dataToSave, id: editingTemplate.id });
        } else {
            onAddTemplate(dataToSave);
        }

        setIsModalOpen(false);
    };

    const availableCategories = useMemo(() => {
        return categories.filter(c => c.type === formData.type);
    }, [categories, formData.type]);

    return (
        <div className="space-y-6 pb-24 px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Recorrências</h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Gerencie seus templates de registros</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenApplyModal}
                        disabled={filteredTemplates.length === 0}
                        className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <CalendarCheck className="w-4 h-4" />
                        <span className="text-xs font-bold">Lançar no Mês</span>
                    </button>
                    <button
                        onClick={handleOpenNew}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-bold">Novo Template</span>
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

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.length > 0 ? (
                    filteredTemplates.map(template => {
                        const cat = categories.find(c => c.name === template.category);
                        const catColor = cat?.color || '#9ca3af';

                        return (
                            <div key={template.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 group hover:border-blue-200 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: catColor }}>
                                            <Repeat className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{template.category}</h3>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Dia {template.dayOfMonth}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(template)} className="text-gray-300 hover:text-blue-500 transition-colors p-1">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDeleteTemplate(template.id)} className="text-gray-300 hover:text-rose-500 transition-colors p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end mt-1">
                                    <span className="text-xs text-gray-500 truncate max-w-[150px]">{template.description || 'Sem descrição'}</span>
                                    <span className="text-sm font-bold text-gray-900">{formatCurrency(template.value)}</span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <Repeat className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium">Nenhum template de {activeTab.toLowerCase()} definido.</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">{editingTemplate ? 'Editar Template' : 'Novo Template'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tipo</label>
                                <select
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as RecordType, category: '' })}
                                >
                                    <option value="Saída">Saída</option>
                                    <option value="Entrada">Entrada</option>
                                    <option value="Investimento">Investimento</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Categoria</label>
                                <select
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold appearance-none cursor-pointer"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione uma categoria...</option>
                                    {availableCategories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        placeholder="0,00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Dia Padrão</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold"
                                        value={formData.dayOfMonth}
                                        onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Descrição</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ex: Conta de Luz"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-extrabold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 text-sm font-extrabold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Apply Templates Modal */}
            {isApplyModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Lançar {activeTab === 'Saída' ? 'Despesas' : activeTab === 'Entrada' ? 'Receitas' : 'Investimentos'}</h3>
                            <button onClick={() => setIsApplyModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-700 font-medium mb-4">
                                Lançando templates de <strong>{activeTab === 'Saída' ? 'despesas' : activeTab === 'Entrada' ? 'receitas' : 'investimentos'}</strong>. Selecione o mês e quais deseja incluir. Serão criados com status <strong>Agendado</strong>.
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Mês de Lançamento</label>
                                <input
                                    type="month"
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold"
                                    value={applyMonth}
                                    onChange={(e) => setApplyMonth(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Templates Selecionados ({selectedTemplateIds.length})</label>
                                <div className="space-y-2">
                                    {filteredTemplates.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-100 transition-colors" onClick={() => toggleTemplateSelection(t.id)}>
                                            <div className="flex items-center gap-3">
                                                {selectedTemplateIds.includes(t.id) ? (
                                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-gray-300" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{t.category}</p>
                                                    <p className="text-[10px] text-gray-500">{t.type} • Dia {t.dayOfMonth}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-700">{formatCurrency(t.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                            <button type="button" onClick={() => setIsApplyModalOpen(false)} className="flex-1 py-3 text-sm font-extrabold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button 
                                onClick={handleApply} 
                                disabled={selectedTemplateIds.length === 0}
                                className="flex-1 py-3 text-sm font-extrabold text-white bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                Lançar Selecionados
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recurrences;
