export interface Transaction {
  id: string;
  type: 'expense' | 'income' | 'savings' | 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  category?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  cardId?: string;
  Card?: {
    id: string;
    number: string;
    type: string;
  };
} 