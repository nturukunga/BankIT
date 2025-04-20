'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpCircle, ArrowDownCircle, RefreshCcw } from 'lucide-react';
import { Transaction } from '@/types/transactions';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

// Helper function for safe date formatting
const formatDate = (dateStr?: string): string => {
  if (!dateStr) {
    return new Date().toLocaleDateString(); // Default to current date
  }
  
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch (error) {
    console.error("Invalid date:", dateStr);
    return new Date().toLocaleDateString();
  }
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [filter, setFilter] = useState<'all' | 'expense' | 'income' | 'savings' | 'deposit' | 'withdrawal' | 'transfer'>('all');

  // Map database transaction types to display types for UI consistency
  const getDisplayType = (transaction: Transaction) => {
    // If amount is negative, it's an expense regardless of the type
    if (transaction.amount < 0) {
      return 'expense';
    }
    
    // Map deposit to income for UI
    if (transaction.type === 'deposit') {
      return 'income';
    }
    
    // Handle each transaction type
    switch (transaction.type) {
      case 'withdrawal': return 'expense';
      case 'transfer': return 'transfer'; 
      default: return transaction.type;
    }
  };

  const filteredTransactions = transactions.filter(
    (transaction) => {
      if (filter === 'all') return true;
      
      // For expense filter, include withdrawals and any negative amounts
      if (filter === 'expense') {
        return transaction.type === 'expense' || 
               transaction.type === 'withdrawal' || 
               transaction.amount < 0;
      }
      
      // For income filter, include deposits and positive amounts
      if (filter === 'income') {
        return transaction.type === 'income' || 
               transaction.type === 'deposit' && transaction.amount > 0;
      }
      
      return transaction.type === filter;
    }
  );

  return (
    <Card className="p-6 bg-black/40 backdrop-blur-xl border border-white/10">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          <Select
            value={filter}
            onValueChange={(value: any) => setFilter(value)}
          >
            <SelectTrigger className="w-[180px] bg-white/10 border-white/20">
              <SelectValue placeholder="Filter transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="transfer">Transfers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No transactions found
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const displayType = getDisplayType(transaction);
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {displayType === 'expense' || transaction.amount < 0 ? (
                      <ArrowDownCircle className="h-8 w-8 text-red-500" />
                    ) : displayType === 'income' ? (
                      <ArrowUpCircle className="h-8 w-8 text-green-500" />
                    ) : displayType === 'transfer' ? (
                      <RefreshCcw className="h-8 w-8 text-blue-500" />
                    ) : (
                      <ArrowUpCircle className="h-8 w-8 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium text-white">{transaction.description}</p>
                      <p className="text-sm text-gray-400">
                        {transaction.category}{' '}
                        <span className="mx-2">•</span>
                        {formatDate(transaction.date || transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      displayType === 'expense' || transaction.amount < 0
                        ? 'text-red-500'
                        : displayType === 'income'
                        ? 'text-green-500'
                        : 'text-blue-500'
                    }`}
                  >
                    {transaction.amount < 0 ? '-' : '+'}$
                    {Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
} 