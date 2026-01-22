
import React, { useState, useMemo } from 'react';
import { Category, RecordType } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { Plus, Edit3, Trash2, Palette, List, TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react';

interface CategoriesProps {
    categories: Category[];
    onAdd: (category: Category) => Promise<Category | null>;
    onEdit: (category: Category) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const Categories: React.FC<CategoriesProps> = ({ categories, onAdd, onEdit, onDelete }) => {
    const [activeTab, setActiveTab] = useState<RecordType>('Saída');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    // Form states
    const [formData, setFormData] = useState<Partial<Category>>({
        name: '',
        color: '#3b82f6',
        type: 'Saída'
    });

    const filteredCategories = useMemo(() => {
        return categories.filter(c => c.type === activeTab);
    }, [categories, activeTab]);

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ ...category });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                color: '#3b82f6',
                type: activeTab
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.type) return;

        try {
            if (editingCategory) {
                await onEdit({ ...editingCategory, ...formData } as Category);
            } else {
                await onAdd(formData as Category);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const isDefaultCategory = (id: string) => {
        return DEFAULT_CATEGORIES.some(dc => dc.id === id);
    };

    const getTabIcon = (type: RecordType) => {
        switch (type) {
            case 'Entrada': return <TrendingUp className="w-4 h-4" />;
            case 'Saída': return <TrendingDown className="w-4 h-4" />;
            case 'Investimento': return <TrendingUp className="w-4 h-4" />;
        }
    };

    const getTabColor = (type: RecordType) => {
        switch (type) {
            case 'Entrada': return 'emerald';
            case 'Saída': return 'rose';
            case 'Investimento': return 'blue';
        }
    };

    return (
        <div className="space-y-6 pb-24 px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Categorias</h2>
                    <p className="text-sm text-gray-500 font-medium">Gerencie suas categorias por tipo</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-bold">Nova Categoria</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                {(['Saída', 'Entrada', 'Investimento'] as RecordType[]).map((tab) => {
                    const isActive = activeTab === tab;
                    const color = getTabColor(tab);
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${isActive
                                ? `bg-${color}-50 text-${color}-600 shadow-sm`
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {getTabIcon(tab)}
                            {tab === 'Saída' ? 'Despesas' : tab === 'Entrada' ? 'Receitas' : 'Investimentos'}
                        </button>
                    );
                })}
            </div>

            {/* Grid of Cards (Single Column) */}
            <div className="grid grid-cols-1 gap-4">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <div key={category.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm"
                                        style={{ backgroundColor: category.color }}
                                    >
                                        <List className="w-5 h-5 opacity-90" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 truncate">{category.name}</h3>
                                        {isDefaultCategory(category.id) && (
                                            <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">Padrão</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Editar"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => isDefaultCategory(category.id) ? null : setCategoryToDelete(category)}
                                        disabled={isDefaultCategory(category.id)}
                                        className={`p-2 rounded-lg transition-all ${isDefaultCategory(category.id)
                                            ? 'text-gray-200 cursor-not-allowed'
                                            : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                            }`}
                                        title={isDefaultCategory(category.id) ? "Categorias padrão não podem ser excluídas" : "Excluir"}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <List className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium">Nenhuma categoria personalizada encontrada para {activeTab.toLowerCase()}.</p>
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
                                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Assinaturas"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Cor</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm border border-gray-200 shrink-0">
                                        <input
                                            type="color"
                                            className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">{formData.color}</span>
                                    <div className="flex-1 text-right">
                                        <Palette className="w-5 h-5 text-gray-400 inline-block" />
                                    </div>
                                </div>
                            </div>

                            {/* Hidden Type Input (Managed by Tabs) */}
                            {/* Note: We could allow changing type, but it might mess with existing records. Keeping it fixed to the active tab for creation is safer. */}
                            {!editingCategory && (
                                <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 font-medium text-center">
                                    Criando categoria em: <strong>{activeTab}</strong>
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-extrabold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 text-sm font-extrabold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {categoryToDelete && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xs rounded-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-gray-900 mb-2">Excluir Categoria?</h3>
                        <p className="text-sm text-gray-500 font-medium mb-6">
                            Você tem certeza que deseja excluir <strong>{categoryToDelete.name}</strong>?
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setCategoryToDelete(null)} className="flex-1 py-2 text-sm font-bold bg-gray-100 rounded-lg transition-colors hover:bg-gray-200">Cancelar</button>
                            <button
                                onClick={async () => {
                                    if (categoryToDelete) {
                                        await onDelete(categoryToDelete.id);
                                        setCategoryToDelete(null);
                                    }
                                }}
                                className="flex-1 py-2 text-sm font-bold bg-rose-600 text-white rounded-lg shadow-lg shadow-rose-200 hover:bg-rose-700 transition-colors"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
