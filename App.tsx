
import React, { useState, useEffect, useCallback } from 'react';
import { ViewType, FinancialRecord, DashboardFilters, Category, User, Goal, RecordTemplate } from './types';
import { DEFAULT_CATEGORIES } from './constants';
import { LayoutDashboard, List, User as UserIcon, Loader2, Tags, Flag, Menu } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Categories from './components/Categories';
import Goals from './components/Goals';
import Profile from './components/Profile';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Recurrences from './components/Recurrences';
import Toast from './components/ui/Toast';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [templates, setTemplates] = useState<RecordTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  const [filters, setFilters] = useState<DashboardFilters>({
    month: new Date().toISOString().slice(0, 7),
  });

  // Listener para instalação do PWA
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      console.log('PWA: Prompt de instalação capturado');
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Registro do Service Worker e detecção de atualizações
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('SW: Registrado com sucesso');

        // Verifica se já existe um SW esperando
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdateBanner(true);
        }

        // Listener para novas atualizações enquanto o app está aberto
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão instalada e pronta para ativar
                setWaitingWorker(newWorker);
                setShowUpdateBanner(true);
              }
            });
          }
        });
      });

      // Listener para quando o novo SW assume o controle
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdateApp = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setShowUpdateBanner(false);
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      console.log('PWA: Prompt não disponível no momento');
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA: Usuário aceitou a instalação');
      setDeferredPrompt(null);
      return true;
    }

    console.log('PWA: Usuário recusou a instalação');
    return false;
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setIsLoading(true);

    try {
      let { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (catError) throw catError;

      if (!catData || catData.length === 0) {
        const categoriesToInsert = DEFAULT_CATEGORIES.map(c => ({
          user_id: user.id,
          name: c.name,
          color: c.color,
          type: c.type
        }));

        const { data: seededData, error: seedError } = await supabase
          .from('categories')
          .insert(categoriesToInsert)
          .select();

        if (seedError) throw seedError;
        catData = seededData;
      }

      setCategories(catData || []);

      const { data: recData, error: recError } = await supabase
        .from('financial_records')
        .select(`
          *,
          categories (
            name,
            color
          )
        `)
        .order('date', { ascending: false });

      if (recError) throw recError;

      const mappedRecords: FinancialRecord[] = (recData || []).map(r => ({
        id: r.id,
        type: r.type,
        date: r.date,
        value: Number(r.value),
        category: r.categories?.name || 'Sem Categoria',
        description: r.description,
        status: r.status,
        recurrence: r.recurrence_type
      }));

      setRecords(mappedRecords);
      setRecords(mappedRecords);

      // Load Goals from LocalStorage (Simulated Backend)
      const storedGoals = localStorage.getItem(`goals_${user.id}`);
      if (storedGoals) {
        setGoals(JSON.parse(storedGoals));
      } else {
        setGoals([]);
      }

      // Load Templates
      const storedTemplates = localStorage.getItem(`templates_${user.id}`);
      if (storedTemplates) {
        setTemplates(JSON.parse(storedTemplates));
      } else {
        const fixedRecords = mappedRecords.filter(r => r.recurrence === 'Fixo');
        const uniqueTemplates: RecordTemplate[] = [];
        const seenKeys = new Set();
        
        fixedRecords.forEach(r => {
          const key = `${r.type}-${r.category}-${r.value}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            const dateObj = new Date(r.date);
            // Handle parsing date to get the day safely
            const day = !isNaN(dateObj.getTime()) ? dateObj.getUTCDate() : 5;
            uniqueTemplates.push({
              id: crypto.randomUUID(),
              type: r.type,
              value: r.value,
              category: r.category,
              description: r.description,
              dayOfMonth: day
            });
          }
        });
        
        setTemplates(uniqueTemplates);
        localStorage.setItem(`templates_${user.id}`, JSON.stringify(uniqueTemplates));
      }

    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
        });
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
        });
      } else {
        setUser(null);
        setGoals([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    showToast('Sessão encerrada', 'info');
  };

  const ensureCategory = async (catName: string, type: string): Promise<string> => {
    const existing = categories.find(c => c.name === catName);
    if (existing) return existing.id;

    const defaultRef = DEFAULT_CATEGORIES.find(c => c.name === catName);
    const color = defaultRef?.color || '#9ca3af';

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user?.id,
        name: catName,
        color: color,
        type: type
      })
      .select()
      .single();

    if (error) throw error;

    setCategories(prev => [...prev, data]);
    return data.id;
  };

  const handleAddRecord = async (recordData: Omit<FinancialRecord, 'id'>) => {
    try {
      const categoryId = await ensureCategory(recordData.category, recordData.type);

      const { error } = await supabase
        .from('financial_records')
        .insert({
          user_id: user?.id,
          type: recordData.type,
          value: recordData.value,
          category_id: categoryId,
          description: recordData.description,
          date: recordData.date,
          status: recordData.status,
          recurrence_type: recordData.recurrence
        });

      if (error) throw error;
      showToast('Registro criado com sucesso!');
      fetchData(true); // Atualização silenciosa
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleEditRecord = async (updatedRecord: FinancialRecord) => {
    try {
      const categoryId = await ensureCategory(updatedRecord.category, updatedRecord.type);

      const { error } = await supabase
        .from('financial_records')
        .update({
          type: updatedRecord.type,
          value: updatedRecord.value,
          category_id: categoryId,
          description: updatedRecord.description,
          date: updatedRecord.date,
          status: updatedRecord.status,
          recurrence_type: updatedRecord.recurrence
        })
        .eq('id', updatedRecord.id);

      if (error) throw error;
      showToast('Registro atualizado!');
      fetchData(true); // Atualização silenciosa
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Registro removido', 'info');
      fetchData(true);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleAddCategory = async (newCat: Category) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user?.id,
          name: newCat.name,
          color: newCat.color,
          type: newCat.type
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      showToast(`Categoria "${newCat.name}" criada!`);
      return data;
    } catch (error: any) {
      showToast(error.message, 'error');
      return null;
    }
  };

  const handleEditCategory = async (updatedCat: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: updatedCat.name,
          color: updatedCat.color
        })
        .eq('id', updatedCat.id);

      if (error) throw error;

      setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
      showToast('Categoria atualizada!');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      // Check if there are records using this category
      const { count, error: countError } = await supabase
        .from('financial_records')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        showToast('Não é possível excluir: existem registros usando esta categoria.', 'error');
        return;
      }

      // Also check goals
      const hasGoal = goals.some(g => g.category_id === id);
      if (hasGoal) {
        showToast('Não é possível excluir: existem metas vinculadas a esta categoria.', 'error');
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== id));
      showToast('Categoria excluída!');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleAddGoal = (goalData: Omit<Goal, 'id'>) => {
    if (!user) return;
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      ...goalData
    };
    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    localStorage.setItem(`goals_${user.id}`, JSON.stringify(updatedGoals));
    showToast('Meta criada com sucesso!');
  };

  const handleDeleteGoal = (id: string) => {
    if (!user) return;
    const updatedGoals = goals.filter(g => g.id !== id);
    setGoals(updatedGoals);
    localStorage.setItem(`goals_${user.id}`, JSON.stringify(updatedGoals));
    showToast('Meta removida!');
  };

  const handleAddTemplate = (templateData: Omit<RecordTemplate, 'id'>) => {
    if (!user) return;
    const newTemplate: RecordTemplate = { id: crypto.randomUUID(), ...templateData };
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem(`templates_${user.id}`, JSON.stringify(updatedTemplates));
    showToast('Template criado com sucesso!');
  };

  const handleEditTemplate = (updatedTemplate: RecordTemplate) => {
    if (!user) return;
    const updatedTemplates = templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
    setTemplates(updatedTemplates);
    localStorage.setItem(`templates_${user.id}`, JSON.stringify(updatedTemplates));
    showToast('Template atualizado!');
  };

  const handleDeleteTemplate = (id: string) => {
    if (!user) return;
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    localStorage.setItem(`templates_${user.id}`, JSON.stringify(updatedTemplates));
    showToast('Template removido!');
  };

  const handleApplyTemplates = async (selectedTemplates: RecordTemplate[], month: string) => {
    if (!user) return;
    setIsLoading(true);
    let successCount = 0;
    for (const t of selectedTemplates) {
      const dateStr = `${month}-${String(t.dayOfMonth).padStart(2, '0')}`;
      try {
        const categoryId = await ensureCategory(t.category, t.type);
        const { error } = await supabase.from('financial_records').insert({
          user_id: user.id,
          type: t.type,
          value: t.value,
          category_id: categoryId,
          description: t.description,
          date: dateStr,
          status: 'Agendado',
          recurrence_type: 'Fixo'
        });
        if (!error) successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    
    if (successCount > 0) {
      showToast(`${successCount} registros agendados criados!`);
      fetchData(true);
      navigate('records');
    } else {
      showToast('Erro ao aplicar templates.', 'error');
    }
    setIsLoading(false);
  };

  const navigate = (view: ViewType) => {
    setIsLoading(true);
    setActiveView(view);
    setTimeout(() => setIsLoading(false), 300);
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Auth onLogin={handleLogin} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-row">
      <Sidebar
        activeView={activeView}
        onNavigate={navigate}
        user={user}
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 w-full">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="px-4 h-16 flex items-center justify-between">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black text-blue-600 tracking-tighter">ECONIX</h1>
            <div
              className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs overflow-hidden cursor-pointer"
              onClick={() => navigate('profile')}
            >
              {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-full md:max-w-7xl mx-auto px-2 py-4 md:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="font-medium">Sincronizando dados...</p>
            </div>
          ) : (
            <div className="view-transition">
              {activeView === 'dashboard' && (
                <Dashboard
                  records={records}
                  filters={filters}
                  setFilters={setFilters}
                  categories={categories}
                />
              )}
              {activeView === 'records' && (
                <Records
                  records={records}
                  categories={categories}
                  onAdd={handleAddRecord}
                  onEdit={handleEditRecord}
                  onDelete={handleDeleteRecord}
                  onAddCategory={handleAddCategory}
                />
              )}
              {activeView === 'categories' && (
                <Categories
                  categories={categories}
                  onAdd={handleAddCategory}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                />
              )}
              {activeView === 'goals' && (
                <Goals
                  goals={goals}
                  categories={categories}
                  records={records}
                  onAddGoal={handleAddGoal}
                  onDeleteGoal={handleDeleteGoal}
                />
              )}
              {activeView === 'recurrences' && (
                <Recurrences
                  templates={templates}
                  categories={categories}
                  onAddTemplate={handleAddTemplate}
                  onEditTemplate={handleEditTemplate}
                  onDeleteTemplate={handleDeleteTemplate}
                  onApplyTemplates={handleApplyTemplates}
                />
              )}
              {activeView === 'profile' && (
                <Profile
                  user={user}
                  onLogout={handleLogout}
                  canInstall={!!deferredPrompt}
                  onInstallApp={handleInstallApp}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Update Banner */}
      {showUpdateBanner && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-blue-500/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-extrabold tracking-tight">Nova versão disponível!</p>
                <p className="text-[10px] font-medium text-blue-100 italic">Atualize para as melhorias mais recentes.</p>
              </div>
            </div>
            <button
              onClick={handleUpdateApp}
              className="px-4 py-2 bg-white text-blue-600 text-xs font-black uppercase rounded-lg shadow-sm hover:bg-gray-50 active:scale-95 transition-all whitespace-nowrap"
            >
              Atualizar Agora
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
