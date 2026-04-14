'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, BarChart3, Calculator } from 'lucide-react';
import { useStore } from '@/lib/store-context';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, register } = useStore();
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [registerName, setRegisterName] = useState('');
  const [registerStore, setRegisterStore] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(loginEmail, loginPassword);
      if (success) router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerPassword !== registerConfirm) {
      alert('Password tidak cocok');
      return;
    }
    setIsLoading(true);
    try {
      const success = await register({
        name: registerName,
        storeName: registerStore,
        email: registerEmail,
        password: registerPassword,
      });
      if (success) router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const phone = '6281320123657';
    const message = encodeURIComponent('Halo, saya lupa password akun UMKMify saya. Mohon bantuannya.');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };
  
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
          <Store className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-[28px] md:text-4xl font-bold text-foreground">UMKMify</h1>
        <p className="text-muted-foreground text-sm md:text-base mt-1">Platform All-in-One untuk UMKM</p>
      </div>
      
      <div className="w-full max-w-md bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 md:p-8">
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'register'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Daftar
          </button>
        </div>
        
        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="nama@email.com"
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Masukkan password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-primary hover:underline transition-colors"
              >
                Lupa password?
              </button>
            </div>
          </form>
        )}
        
        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-foreground mb-1.5">
                Nama Lengkap
              </label>
              <input
                id="register-name"
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>
            <div>
              <label htmlFor="register-store" className="block text-sm font-medium text-foreground mb-1.5">
                Nama Toko
              </label>
              <input
                id="register-store"
                type="text"
                value={registerStore}
                onChange={(e) => setRegisterStore(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Masukkan nama toko"
                required
              />
            </div>
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="nama@email.com"
                required
              />
            </div>
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Buat password"
                required
              />
            </div>
            <div>
              <label htmlFor="register-confirm" className="block text-sm font-medium text-foreground mb-1.5">
                Konfirmasi Password
              </label>
              <input
                id="register-confirm"
                type="password"
                value={registerConfirm}
                onChange={(e) => setRegisterConfirm(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Ulangi password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Memproses...' : 'Daftar'}
            </button>
          </form>
        )}
      </div>
      
      <div className="flex flex-wrap justify-center gap-6 mt-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm">Analitik Real-time</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <Calculator className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm">Kasir Digital</span>
        </div>
      </div>
    </main>
  );
}