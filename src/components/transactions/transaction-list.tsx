import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ArrowDownCircle, ArrowUpCircle, ArrowRightCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TransactionWithRelations } from '@/data/transaction'
import { formatCurrency } from '@/lib/utils'

// Types for transaction icon and colors
const transactionTypeIcons = {
  deposit: <ArrowDownCircle className="h-4 w-4 text-emerald-500" />,
  withdrawal: <ArrowUpCircle className="h-4 w-4 text-rose-500" />,
  transfer: <ArrowRightCircle className="h-4 w-4 text-blue-500" />,
  expense: <ArrowUpCircle className="h-4 w-4 text-rose-500" />,
  income: <ArrowDownCircle className="h-4 w-4 text-emerald-500" />,
  savings: <ArrowRightCircle className="h-4 w-4 text-blue-500" />,
}

const transactionTypeColors = {
  deposit: 'bg-emerald-100 text-emerald-800',
  withdrawal: 'bg-rose-100 text-rose-800',
  transfer: 'bg-blue-100 text-blue-800',
  expense: 'bg-rose-100 text-rose-800',
  income: 'bg-emerald-100 text-emerald-800',
  savings: 'bg-blue-100 text-blue-800',
}

type TransactionListProps = {
  transactions: TransactionWithRelations[]
  totalCount: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export default function TransactionList({
  transactions,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TransactionListProps) {
  const totalPages = Math.ceil(totalCount / pageSize)

  // Format the transaction date
  const formatTransactionDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown date';
    
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch (error) {
      console.error('Invalid date:', dateStr);
      return 'Invalid date';
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <div className="flex items-center space-x-2">
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="10 items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 items</SelectItem>
              <SelectItem value="10">10 items</SelectItem>
              <SelectItem value="20">20 items</SelectItem>
              <SelectItem value="50">50 items</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-muted-foreground mb-2">No transactions found</p>
            <p className="text-sm text-muted-foreground">
              Create your first transaction to see it here
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Card</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transactionTypeIcons[transaction.type as keyof typeof transactionTypeIcons] || 
                          transactionTypeIcons.transfer}
                        <Badge className={transactionTypeColors[transaction.type as keyof typeof transactionTypeColors] || 
                          transactionTypeColors.transfer}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className={Number(transaction.amount) >= 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                      {Number(transaction.amount) >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-medium">{transaction.Card?.name || transaction.Card?.name || 'Unknown Card'}</span>
                      <span className="text-muted-foreground block text-xs">
                        {(transaction.Card?.number && transaction.Card.number.slice(-4)) || 
                         (transaction.Card?.number && transaction.Card.number.slice(-4)) || 
                         'xxxx'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                      {transaction.description}
                      {transaction.category && (
                        <span className="text-muted-foreground block text-xs">
                          {transaction.category}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatTransactionDate(transaction.createdAt || transaction.date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} transactions
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 