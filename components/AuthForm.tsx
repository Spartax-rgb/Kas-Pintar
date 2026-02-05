import React, { useState } from 'react';
import { User } from '../types';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Hardcoded Admin Credentials
    if (isLogin && email === 'admin@kaspintar.com' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin-001',
        email: 'admin@kaspintar.com',
        name: 'Super Admin',
        passwordHash: btoa('admin123'),
        role: 'admin'
      };
      onLogin(adminUser);
      return;
    }

    const users: User[] = JSON.parse(localStorage.getItem('kaspintar_users') || '[]');

    if (isLogin) {
      const user = users.find(u => u.email === email && u.passwordHash === btoa(password));
      if (user) {
        onLogin(user);
      } else {
        setError('Email atau password salah.');
      }
    } else {
      if (users.find(u => u.email === email) || email === 'admin@kaspintar.com') {
        setError('Email sudah terdaftar.');
        return;
      }
      
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        passwordHash: btoa(password),
        role: 'user'
      };
      
      localStorage.setItem('kaspintar_users', JSON.stringify([...users, newUser]));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-900 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 bg-indigo-600 rounded-2xl items-center justify-center text-white font-bold text-3xl mb-4 shadow-xl shadow-indigo-200">
            K
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isLogin ? 'Selamat Datang' : 'Buat Akun'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isLogin ? 'Masuk untuk mengelola buku kas Anda' : 'Mulai kelola keuangan bisnis Anda dengan cerdas'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
              <input
                type="text"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
          >
            {isLogin ? 'Masuk Sekarang' : 'Daftar Gratis'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {isLogin ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
          </button>
        </div>
        
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Login:</p>
          <p className="text-[10px] text-slate-300">admin@kaspintar.com / admin123</p>
        </div>
      </div>
    </div>
  );
};
