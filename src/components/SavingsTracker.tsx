'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, MinusCircle } from 'lucide-react';

interface SavingsTrackerProps {
  currentSavings: number;
  savingsGoal: number;
  onAddSavings: (amount: number, description: string) => void;
  onWithdraw: (amount: number, description: string) => void;
}

export function SavingsTracker({
  currentSavings,
  savingsGoal,
  onAddSavings,
  onWithdraw,
}: SavingsTrackerProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(true);

  const progress = (currentSavings / savingsGoal) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      if (isAdding) {
        onAddSavings(numAmount, description);
      } else {
        onWithdraw(numAmount, description);
      }
      setAmount('');
      setDescription('');
    }
  };

  return (
    <Card className="p-6 bg-black/40 backdrop-blur-xl border border-white/10">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Savings Progress</h3>
            <span className="text-sm text-gray-400">
              ${currentSavings.toFixed(2)} / ${savingsGoal.toFixed(2)}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-white/10" />
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={isAdding ? "default" : "outline"}
              onClick={() => setIsAdding(true)}
              className={isAdding ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Savings
            </Button>
            <Button
              variant={!isAdding ? "default" : "outline"}
              onClick={() => setIsAdding(false)}
              className={!isAdding ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              <MinusCircle className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="bg-white/10 border-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isAdding ? "Monthly savings" : "Emergency expense"}
                required
                className="bg-white/10 border-white/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              {isAdding ? "Add to Savings" : "Withdraw from Savings"}
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
} 