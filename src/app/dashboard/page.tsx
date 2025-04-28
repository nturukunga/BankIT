'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card as UICard } from "@/components/ui/card";
import { Card } from "@/components/card";
import SavingsCard from "@/components/SavingsCard";
import ExpenseForm from "@/components/ExpenseForm";
import { RecentTransactions } from "@/components/RecentTransactions";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Transaction } from '@/types/transactions';
import { PlusCircle, AlertCircle, CreditCard, Wallet, ChevronRight, PiggyBank, BarChart4, Loader2 } from 'lucide-react';
import { toast } from "sonner";

interface CardData {
  id: string;
  number: string;
  name: string;
  expiry: string;
  balance: number;
  type: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>([]);
  const [regularCards, setRegularCards] = useState<CardData[]>([]);
  const [savingsCard, setSavingsCard] = useState<CardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    
    // Redirect to auth page if not authenticated
    if (status === 'unauthenticated') {
      console.log('User not authenticated, redirecting to auth page');
      router.push('/auth');
      return;
    }

    // Only fetch data if authenticated
    if (status === 'authenticated' && session?.user) {
      console.log('User authenticated, fetching dashboard data');
      fetchDashboardData();
    }
  }, [status, session, router]);

  // Separate function to fetch dashboard data that can be called after transactions
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch cards
      const cardsResponse = await fetch('/api/cards');
      if (!cardsResponse.ok) throw new Error('Failed to fetch cards');
      const cardsData = await cardsResponse.json();
      
      // Separate regular cards from virtual savings card
      const regularCardsArray = cardsData.cards.filter((card: CardData) => 
        !card.number.includes('VIRTUAL_SAVINGS')
      );
      const savingsCardData = cardsData.cards.find((card: CardData) => 
        card.number.includes('VIRTUAL_SAVINGS')
      );
      
      setCards(cardsData.cards);
      setRegularCards(regularCardsArray);
      setSavingsCard(savingsCardData || null);

      // Fetch transactions
      const transactionsResponse = await fetch('/api/transactions');
      if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions');
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSavings = () => {
    // If no savings card exists, create one
    if (!savingsCard) {
      createSavingsCard();
    } else {
      // Open modal or redirect to add to savings
      router.push('/savings/add');
    }
  };

  const createSavingsCard = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': sessionStorage.getItem('csrfToken') || '',
        },
        body: JSON.stringify({
          number: `VIRTUAL_SAVINGS_${Date.now()}`,
          name: session?.user?.name || 'Virtual Savings',
          expiry: '12/99',
          type: 'savings',
          balance: 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create savings card');
      }

      const data = await response.json();
      setSavingsCard(data.card);
      setCards([...cards, data.card]);
      
      toast.success("Virtual Savings Created");
      
    } catch (err) {
      toast.error("Failed to create savings account.");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh dashboard data when transactions are made
  useEffect(() => {
    // Listen for the custom event fired when transactions are made
    const handleTransactionComplete = () => {
      fetchDashboardData();
    };
    
    window.addEventListener('transaction-complete', handleTransactionComplete);
    
    return () => {
      window.removeEventListener('transaction-complete', handleTransactionComplete);
    };
  }, []);

  // Show loading state while checking authentication or fetching data
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state if something went wrong
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline 
              points="0,90 20,70 40,65 60,40 80,35 100,10" 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="1" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="animate-pulse" 
            />
          </svg>
        </div>
        <UICard className="p-8 text-center backdrop-blur-md bg-white/5 border border-white/10 max-w-md">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="text-xl font-semibold mt-4 text-white">Error Loading Dashboard</h2>
          <p className="mt-2 text-gray-400">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-6 bg-green-500 hover:bg-green-600 text-white"
          >
            Retry
          </Button>
        </UICard>
      </div>
    );
  }

  // Redirect if not authenticated (this is a backup check)
  if (!session) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="min-h-screen pt-16 pb-8 bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Background graph */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline 
            points="0,90 20,70 40,65 60,40 80,35 100,10" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="1" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <polyline 
            points="0,80 30,75 50,60 70,30 100,20" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>
      
      <div className="container mx-auto relative z-10 px-4">
        <h1 className="text-3xl font-bold text-green-500 mb-8">Welcome, {session.user?.name || 'User'}</h1>
        
        <div className="grid gap-6 md:grid-cols-3">
          <section className="md:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-white flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-green-500" />
              Your Cards
            </h2>
            <div className="space-y-6">
              {regularCards.length === 0 ? (
                <UICard className="p-6 text-center backdrop-blur-md bg-white/5 border border-white/10">
                  <p className="text-gray-400">No cards found</p>
                  <Button 
                    asChild 
                    className="mt-4 bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Link href="/cards">Add a Card</Link>
                  </Button>
                </UICard>
              ) : (
                <div className="grid gap-6 sm:grid-cols-1">
                  {regularCards.map((card) => (
                    <div key={card.id} className="group cursor-pointer" onClick={() => router.push(`/cards/${card.id}`)}>
                      <Card
                        type={card.type as "credit" | "debit"}
                        number={card.number}
                        name={card.name}
                        expiry={card.expiry}
                        balance={card.balance}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <Button 
                asChild
                variant="outline" 
                className="w-full mt-4 border-green-500/20 backdrop-blur-sm hover:border-green-500/40 hover:bg-green-500/5 text-white"
              >
                <Link href="/cards">
                  <PlusCircle className="mr-2 h-4 w-4 text-green-500" />
                  Add New Card
                </Link>
              </Button>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white flex items-center">
              <PiggyBank className="mr-2 h-5 w-5 text-pink-500" />
              Savings
            </h2>
            {savingsCard ? (
              <SavingsCard 
                balance={savingsCard.balance} 
                onAddSavings={handleAddSavings} 
              />
            ) : (
              <UICard className="p-6 text-center backdrop-blur-md bg-white/5 border border-white/10 border-pink-500/20">
                <p className="text-gray-400">Start saving today!</p>
                <Button 
                  onClick={handleAddSavings}
                  className="mt-4 bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Create Savings Account
                </Button>
              </UICard>
            )}
          </section>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mt-8">
          <section className="md:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-white flex items-center">
              <BarChart4 className="mr-2 h-5 w-5 text-green-500" />
              Recent Transactions
            </h2>
            <UICard className="p-6 backdrop-blur-md bg-white/5 border border-white/10">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-1 mb-4">
                    Use the expense form to record your first transaction
                  </p>
                </div>
              ) : (
                <RecentTransactions transactions={transactions} />
              )}
            </UICard>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white flex items-center">
              <Wallet className="mr-2 h-5 w-5 text-green-500" />
              Add Expense
            </h2>
            <UICard className="p-6 backdrop-blur-md bg-white/5 border border-white/10">
              <ExpenseForm />
            </UICard>
          </section>
        </div>
      </div>
    </div>
  );
} 