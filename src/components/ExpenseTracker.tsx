"use client"

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

const categories = [
  'Food',
  'Transportation',
  'Housing',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Other'
];

const ExpenseTracker: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.category) return;

    const expense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: new Date().toISOString().split('T')[0],
      description: newExpense.description
    };

    setExpenses([...expenses, expense]);
    setNewExpense({ amount: '', category: '', description: '' });
  };

  const getChartData = () => {
    const categoryTotals = categories.map(category => {
      const total = expenses
        .filter(expense => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0);
      return { category, total };
    });
    return categoryTotals;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Expense Tracker</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="backdrop-blur-md bg-white/5 p-6 rounded-lg shadow-[0_8px_32px_0_rgba(6,214,64,0.1)] border border-[rgba(6,214,64,0.18)]">
          <h3 className="text-xl font-semibold mb-4 text-white">Add New Expense</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80">Amount</label>
              <input
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="mt-1 block w-full rounded-md bg-white/10 border-[rgba(6,214,64,0.3)] text-white placeholder-white/50 focus:border-[rgba(6,214,64,0.5)] focus:ring-[rgba(6,214,64,0.5)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80">Category</label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="mt-1 block w-full rounded-md bg-white/10 border-[rgba(6,214,64,0.3)] text-white placeholder-white/50 focus:border-[rgba(6,214,64,0.5)] focus:ring-[rgba(6,214,64,0.5)]"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800">{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80">Description</label>
              <input
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="mt-1 block w-full rounded-md bg-white/10 border-[rgba(6,214,64,0.3)] text-white placeholder-white/50 focus:border-[rgba(6,214,64,0.5)] focus:ring-[rgba(6,214,64,0.5)]"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[rgba(6,214,64,0.2)] text-white py-2 px-4 rounded-md hover:bg-[rgba(6,214,64,0.3)] focus:outline-none focus:ring-2 focus:ring-[rgba(6,214,64,0.5)] focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
            >
              Add Expense
            </button>
          </form>
        </div>

        <div className="backdrop-blur-md bg-white/5 p-6 rounded-lg shadow-[0_8px_32px_0_rgba(6,214,64,0.1)] border border-[rgba(6,214,64,0.18)]">
          <h3 className="text-xl font-semibold mb-4 text-white">Expense Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="category" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(6,214,64,0.3)',
                    borderRadius: '4px'
                  }}
                />
                <Legend />
                <Bar dataKey="total" fill="rgba(6,214,64,0.6)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 backdrop-blur-md bg-white/5 p-6 rounded-lg shadow-[0_8px_32px_0_rgba(6,214,64,0.1)] border border-[rgba(6,214,64,0.18)]">
        <h3 className="text-xl font-semibold mb-4 text-white">Recent Expenses</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[rgba(6,214,64,0.2)]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(6,214,64,0.2)]">
              {expenses.map(expense => (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">{expense.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">{expense.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">{expense.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">${expense.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker; 