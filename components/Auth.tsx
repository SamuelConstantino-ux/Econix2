
import React, { useState } from 'react';
import { User as UserType } from '../types';
import { Mail, Lock, Phone, ArrowRight, Chrome, Loader2, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onLogin: (user: UserType) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        
        if (data.user) {
          onLogin({
            id: data.user.id,
            name: data.user.user_metadata.name || data.user.email?.split('@')[0] || 'Usuário',
            email: data.user.email || '',
          });
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });
        if (authError) throw authError;
        
        if (data.user) {
          alert('Conta criada! Verifique seu email para confirmar o cadastro.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 sm:bg-gray-50">
      <div className="w-full max-w-md bg-white sm:p-10 sm:rounded-3xl sm:shadow-xl sm:border sm:border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600 tracking-tighter mb-2">ECONIX</h1>
          <p className="text-gray-500 font-medium">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta gratuita'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <UserIcon className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder="Nome completo" 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-4 h-4" />
            </span>
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-4 h-4" />
            </span>
            <input 
              type="password" 
              placeholder="Senha" 
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Entrar' : 'Criar conta'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-gray-100"></div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ou continue com</span>
          <div className="h-[1px] flex-1 bg-gray-100"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 py-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700"
        >
          <Chrome className="w-5 h-5 text-red-500" />
          Acessar com Google
        </button>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
          >
            {isLogin ? (
              <>Não tem uma conta? <span className="text-blue-600">Cadastre-se</span></>
            ) : (
              <>Já tem uma conta? <span className="text-blue-600">Fazer login</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
