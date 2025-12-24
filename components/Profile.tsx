
import React, { useState } from 'react';
import { User as UserIcon, Mail, Shield, LogOut, Settings, CreditCard, ChevronRight, Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { User } from '../types';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  canInstall?: boolean;
  onInstallApp?: () => Promise<boolean>;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, canInstall, onInstallApp }) => {
  const [showInstallModal, setShowInstallModal] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  // Função para abrir o modal ou tentar instalação direta
  const handleMainInstallClick = async () => {
    // No iOS, sempre mostramos o modal de instruções
    if (isIOS) {
      setShowInstallModal(true);
      return;
    }

    // Se temos o prompt nativo pronto, tentamos disparar direto
    if (canInstall && onInstallApp) {
      const success = await onInstallApp();
      if (success) return; // Se aceitou, não precisa de modal
    }

    // Caso contrário (ou se recusou antes), mostramos o modal explicativo
    setShowInstallModal(true);
  };

  // Função disparada pelo botão "Instalar Agora" dentro do modal
  const handleModalInstallClick = async () => {
    if (onInstallApp) {
      const success = await onInstallApp();
      if (success) {
        setShowInstallModal(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-24 px-4 max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 overflow-hidden shadow-inner">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-12 h-12 text-blue-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
        <p className="text-gray-500">Membro desde Janeiro 2025</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Conta</h3>
        <ProfileItem icon={<Mail className="w-5 h-5 text-gray-400" />} label="Email" value={user.email} />
        <ProfileItem icon={<Shield className="w-5 h-5 text-gray-400" />} label="Privacidade" value="Ativa" />
        <ProfileItem icon={<CreditCard className="w-5 h-5 text-gray-400" />} label="Plano" value="Premium (Gratuito)" />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Sistema</h3>
        
        {!isStandalone && (
          <button 
            onClick={handleMainInstallClick}
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-blue-50 hover:bg-blue-50/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
               <Download className="w-5 h-5 text-blue-500 group-hover:bounce" />
               <div className="text-left">
                 <span className="font-bold text-gray-700 block text-sm">Instalar Aplicativo</span>
                 <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                   Acesso rápido e offline
                 </span>
               </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        )}

        <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
             <Settings className="w-5 h-5 text-gray-400" />
             <span className="font-medium text-gray-700">Configurações</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-rose-100 hover:bg-rose-50 transition-colors text-rose-600"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold">Sair do Econix</span>
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">Versão 1.0.0 (Alpha)</p>

      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
                <button 
                  onClick={() => setShowInstallModal(false)}
                  className="absolute -top-2 -right-2 p-1 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors border-2 border-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-2">Instalar Econix</h3>
              <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
                {isIOS 
                  ? "Tenha uma experiência nativa no seu iPhone adicionando o Econix à sua tela de início."
                  : "Acesse suas finanças com um toque, direto da sua tela inicial e com suporte offline."
                }
              </p>

              {isIOS ? (
                <div className="w-full space-y-4 bg-blue-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Share className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-blue-900">1. Toque no ícone de Compartilhar</p>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <PlusSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-blue-900">2. Escolha 'Adicionar à Tela de Início'</p>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleModalInstallClick}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Instalar Agora
                </button>
              )}

              <button 
                onClick={() => setShowInstallModal(false)}
                className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
              >
                Talvez depois
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium text-gray-700">{label}</span>
    </div>
    <span className="text-sm text-gray-500">{value}</span>
  </div>
);

export default Profile;
