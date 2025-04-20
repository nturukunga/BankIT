import React from 'react'
import Link from 'next/link'
import { ArrowDownCircle, ArrowUpCircle, ArrowRightCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Transaction } from '@prisma/client'

type TransactionSummaryProps = {
  totalDeposits: number
  totalWithdrawals: number
  totalTransactions: number
  recentActivity: Transaction[]
}

export default function TransactionSummary({
  totalDeposits,
  totalWithdrawals,
  totalTransactions,
  recentActivity,
}: TransactionSummaryProps) {
  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
      case 'withdrawal':
        return <ArrowUpCircle className="h-4 w-4 text-rose-500" />
      case 'transfer':
        return <ArrowRightCircle className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  // Format date to show only month and day
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Summary</CardTitle>
        <CardDescription>Your financial activity in the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Deposits</p>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalDeposits)}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Withdrawals</p>
            <p className="text-2xl font-bold text-rose-500">{formatCurrency(totalWithdrawals)}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">Net Balance</p>
            <p className={`text-2xl font-bold ${
              totalDeposits - totalWithdrawals >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {formatCurrency(totalDeposits - totalWithdrawals)}
            </p>
          </div>
        </div>

        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Recent Activity</h4>
            <div className="space-y-2">
              {recentActivity.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>
                  <p 
                    className={`text-sm font-medium ${
                      transaction.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No recent transactions found</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/transactions">View All Transactions</Link>
        </Button>
      </CardFooter>
    </Card>
  )
} 