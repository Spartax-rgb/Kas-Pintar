
import React from 'react';

interface StatCardProps {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'balance';
}

export const StatCard: React.FC<StatCardProps> = ({ title, amount, type }) => {
  const getColors = () => {
    switch (type) {
      case 'income': return 'text-green-600 bg-green-50 border-green-100';
      case 'expense': return 'text-red-600 bg-red-50 border-red-100';
      case 'balance': return 'text-blue-600 bg-blue-50 border-blue-100';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all hover:shadow-md ${getColors()}`}>
      <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
    </div>
  );
};
