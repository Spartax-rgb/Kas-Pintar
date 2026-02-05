
import React, { useState, useEffect } from 'react';
import { TransactionType, Transaction } from '../types';
import { CATEGORIES, Icons } from '../constants';

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate: (transaction: Transaction) => void;
  editingTransaction: Transaction | null;
  onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onAdd, 
  onUpdate, 
  editingTransaction, 
  onCancel 
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState(CATEGORIES.EXPENSE[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
    } else {
      resetForm();
    }
  }, [editingTransaction]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setType(TransactionType.EXPENSE);
    setCategory(CATEGORIES.EXPENSE[0]);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const data = {
      description,
      amount: parseFloat(amount),
      type,
      category,
      date
    };

    if (editingTransaction) {
      onUpdate({ ...editingTransaction, ...data });
    } else {
      onAdd(data);
    }
    resetForm();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-2 text-indigo-600">
        {editingTransaction ? <Icons.Edit /> : <Icons.Add />}
        <h2 className="text-lg font-bold">{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deskripsi</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nominal (Rp)</label>
          <input
            type="number"
            required
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipe</label>
          <select
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={type}
            onChange={(e) => {
              const newType = e.target.value as TransactionType;
              setType(newType);
              setCategory(CATEGORIES[newType][0]);
            }}
          >
            <option value={TransactionType.INCOME}>Pemasukan (+)</option>
            <option value={TransactionType.EXPENSE}>Pengeluaran (-)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kategori</label>
          <select
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES[type].map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal</label>
          <input
            type="date"
            required
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {editingTransaction && (
          <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 py-2.5 rounded-xl font-bold text-slate-600 text-sm">Batal</button>
        )}
        <button type="submit" className="flex-[2] bg-indigo-600 py-2.5 rounded-xl font-bold text-white text-sm shadow-md hover:bg-indigo-700 transition-all">
          {editingTransaction ? 'Update' : 'Simpan'}
        </button>
      </div>
    </form>
  );
};
