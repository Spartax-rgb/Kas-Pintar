import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, AIInsight, User } from './types';
import { Icons, CATEGORIES } from './constants';
import { StatCard } from './components/StatCard';
import { TransactionForm } from './components/TransactionForm';
import { AuthForm } from './components/AuthForm';
import { analyzeFinances } from './services/gemini';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<'dashboard' | 'ledger' | 'settings'>('dashboard');

  // Load User Session on Init
  useEffect(() => {
    const session = localStorage.getItem('kaspintar_session');
    if (session) {
      try {
        setCurrentUser(JSON.parse(session));
      } catch (e) {
        console.error("Failed to parse session", e);
        localStorage.removeItem('kaspintar_session');
      }
    }
  }, []);

  // Load User-Specific Data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const storageKey = `kaspintar_data_${currentUser.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setTransactions(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse user data", e);
          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }
      setAiInsight(null);
      setView('dashboard');
    }
  }, [currentUser]);

  // Sync with LocalStorage per User
  useEffect(() => {
    if (currentUser) {
      const storageKey = `kaspintar_data_${currentUser.id}`;
      localStorage.setItem(storageKey, JSON.stringify(transactions));
    }
  }, [transactions, currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('kaspintar_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    if (confirm('Anda yakin ingin keluar?')) {
      setCurrentUser(null);
      localStorage.removeItem('kaspintar_session');
    }
  };

  const summary = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === TransactionType.INCOME) {
        acc.income += curr.amount;
        acc.balance += curr.amount;
      } else {
        acc.expense += curr.amount;
        acc.balance -= curr.amount;
      }
      return acc;
    }, { income: 0, expense: 0, balance: 0 });
  }, [transactions]);

  const transactionsWithRunningBalance = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    const withRunning = sorted.map(tx => {
      if (tx.type === TransactionType.INCOME) running += tx.amount;
      else running -= tx.amount;
      return { ...tx, runningBalance: running };
    });
    return withRunning.reverse(); // Newest first for display
  }, [transactions]);

  const handleAdd = (data: Omit<Transaction, 'id'>) => {
    const tx: Transaction = { ...data, id: Math.random().toString(36).substr(2, 9) };
    setTransactions([tx, ...transactions]);
  };

  const handleUpdate = (updated: Transaction) => {
    setTransactions(transactions.map(t => t.id === updated.id ? updated : t));
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus transaksi ini?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleResetData = () => {
    if (confirm('PERINGATAN: Ini akan menghapus SELURUH data Anda secara permanen. Lanjutkan?')) {
      setTransactions([]);
      if (currentUser) {
        localStorage.removeItem(`kaspintar_data_${currentUser.id}`);
      }
      alert('Data telah direset.');
      setView('dashboard');
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const insight = await analyzeFinances(transactions);
      setAiInsight(insight);
    } catch (e) {
      console.error("Analysis error", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(val);
  };

  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} />;
  }

  const chartData = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc: { name: string; value: number }[], t) => {
    const existing = acc.find(x => x.name === t.category);
    if (existing) {
      existing.value += t.amount;
    } else {
      acc.push({ name: t.category, value: t.amount });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-white border-b md:border-r border-slate-200 p-6 flex flex-col gap-8 sticky top-0 md:h-screen print:hidden z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">K</div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">KasPintar</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buku Kas Digital</p>
          </div>
        </div>

        <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
            <p className="text-[9px] text-slate-400 truncate">{currentUser.email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <button onClick={() => setView('dashboard')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-indigo-100 shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Icons.Dashboard /> Dashboard
          </button>
          <button onClick={() => setView('ledger')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'ledger' ? 'bg-indigo-600 text-white shadow-indigo-100 shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Icons.Ledger /> Buku Kas Umum
          </button>
          <button onClick={() => setView('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'settings' ? 'bg-indigo-600 text-white shadow-indigo-100 shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Icons.Settings /> Pengaturan
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-50 mt-4 font-semibold text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Keluar
          </button>
        </div>

        <div className="mt-auto bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-2 text-indigo-600">
            <Icons.Sparkles /> <span className="text-xs font-bold uppercase">Gemini AI</span>
          </div>
          <p className="text-[10px] text-indigo-400 leading-relaxed mb-3">Dapatkan wawasan finansial otomatis untuk bisnis Anda.</p>
          <button onClick={handleAnalyze} disabled={isAnalyzing || transactions.length === 0} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:bg-slate-200">
            {isAnalyzing ? 'Menganalisis...' : 'Analisis Data'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 space-y-8 print:p-0">
        <header className="flex justify-between items-end print:mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {view === 'dashboard' ? 'Overview Finansial' : view === 'ledger' ? 'Buku Kas Umum' : 'Pengaturan'}
            </h2>
            <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
          </div>
          {view === 'ledger' && (
            <button onClick={() => window.print()} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm print:hidden">
              <Icons.Printer />
            </button>
          )}
        </header>

        {view !== 'settings' && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Pemasukan" amount={summary.income} type="income" />
            <StatCard title="Total Pengeluaran" amount={summary.expense} type="expense" />
            <StatCard title="Saldo Kas" amount={summary.balance} type="balance" />
          </section>
        )}

        {view === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <TransactionForm onAdd={handleAdd} onUpdate={handleUpdate} editingTransaction={null} onCancel={() => {}} />
              {aiInsight && (
                <div className={`p-6 rounded-2xl border-2 shadow-sm animate-in fade-in duration-500 ${aiInsight.status === 'good' ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                  <h3 className="font-bold mb-2 flex items-center gap-2">Wawasan AI <Icons.Sparkles /></h3>
                  <p className="text-sm text-slate-700 italic mb-4">"{aiInsight.message}"</p>
                  <div className="space-y-2">
                    {aiInsight.recommendations.map((r, i) => (
                      <div key={i} className="text-xs bg-white p-2 rounded-lg border border-slate-100 flex gap-2">
                        <span>{i+1}.</span> {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="font-bold text-slate-800 mb-6 self-start">Alokasi Pengeluaran</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={chartData} 
                      innerRadius={60} 
                      outerRadius={80} 
                      paddingAngle={5} 
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : view === 'ledger' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 print:bg-slate-100">
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Keterangan</th>
                    <th className="px-6 py-4 text-right">Debit (+)</th>
                    <th className="px-6 py-4 text-right">Kredit (-)</th>
                    <th className="px-6 py-4 text-right">Saldo</th>
                    <th className="px-6 py-4 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {transactionsWithRunningBalance.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {tx.date.split('-').reverse().join('/')}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {tx.description}
                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{tx.category}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 font-bold">
                        {tx.type === TransactionType.INCOME ? formatCurrency(tx.amount) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-red-600 font-bold">
                        {tx.type === TransactionType.EXPENSE ? formatCurrency(tx.amount) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                        {formatCurrency(tx.runningBalance)}
                      </td>
                      <td className="px-6 py-4 text-center print:hidden">
                        <button onClick={() => handleDelete(tx.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Icons.Trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">Belum ada catatan transaksi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="max-w-md space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800">Manajemen Aplikasi</h3>
              <p className="text-sm text-slate-500">Gunakan pengaturan ini untuk mengelola data lokal yang tersimpan di browser Anda.</p>
              <div className="pt-4 space-y-3">
                <button onClick={handleResetData} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 hover:bg-red-100 transition-all">
                  <Icons.Trash /> Reset Semua Data BKU
                </button>
              </div>
            </div>
            <div className="bg-indigo-900 p-8 rounded-2xl text-white shadow-xl">
              <h3 className="font-bold mb-2">KasPintar Clean v2.1</h3>
              <p className="text-xs text-indigo-300 leading-relaxed">Aplikasi ini dirancang untuk kecepatan dan kemudahan pencatatan finansial. Semua data disimpan secara lokal di perangkat Anda.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
