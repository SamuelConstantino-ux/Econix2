
import React, { useState, useEffect, useCallback } from 'react';
import { ViewType, FinancialRecord, DashboardFilters, Category, User } from './types';
import { DEFAULT_CATEGORIES } from './constants';
import { LayoutDashboard, List, User as UserIcon, Loader2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Profile from './components/Profile';
import Auth from './components/Auth';
import Toast from './components/ui/Toast';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-black text-blue-600 tracking-tighter">ECONIX</h1>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs font-bold text-gray-500 uppercase tracking-widest">{user.name.split(' ')[0]}</span>
            <div 
              className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all"
              onClick={() => navigate('profile')}
            >
              {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full pt-6">
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

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-3 px-6 flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <NavItem 
          active={activeView === 'dashboard'} 
          onClick={() => navigate('dashboard')} 
          icon={<LayoutDashboard className="w-6 h-6" />} 
          label="Início" 
        />
        <NavItem 
          active={activeView === 'records'} 
          onClick={() => navigate('records')} 
          icon={<List className="w-6 h-6" />} 
          label="Registros" 
        />
        <NavItem 
          active={activeView === 'profile'} 
          onClick={() => navigate('profile')} 
          icon={<UserIcon className="w-6 h-6" />} 
          label="Perfil" 
        />
      </nav>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
  >
    {icon}
    <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-70'}`}>
      {label}
    </span>
  </button>
);

export default App;
