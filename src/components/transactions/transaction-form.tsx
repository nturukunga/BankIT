import React, { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

// Define categories for transactions
const transactionCategories = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'housing', label: 'Housing & Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'dining', label: 'Dining & Restaurants' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'travel', label: 'Travel' },
  { value: 'education', label: 'Education' },
  { value: 'personal', label: 'Personal Care' },
  { value: 'savings', label: 'Savings & Investments' },
  { value: 'income', label: 'Income' },
  { value: 'other', label: 'Other' },
]

// Define transaction types
const transactionTypes = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer', label: 'Transfer' },
]

// Define card type for form
type Card = {
  id: string
  name: string
  number: string
  type: string
  balance: number
}

const transactionFormSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Amount must be a positive number"
    ),
  type: z.enum(["deposit", "withdrawal", "transfer"]),
  description: z.string().min(1, "Description is required").max(100, "Description is too long"),
  cardId: z.string().min(1, "Card is required"),
  category: z.string().optional(),
})

type TransactionFormValues = z.infer<typeof transactionFormSchema>

type TransactionFormProps = {
  cards: Card[]
  onTransactionCreated?: () => void
}

export default function TransactionForm({ cards, onTransactionCreated }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: "",
      type: "deposit",
      description: "",
      cardId: cards.length > 0 ? cards[0].id : "",
      category: "",
    },
  })

  // Get the selected card to show balance
  const selectedCardId = form.watch("cardId")
  const selectedCard = cards.find(card => card.id === selectedCardId)
  
  const onSubmit = async (data: TransactionFormValues) => {
    try {
      setIsSubmitting(true)
      
      // Convert amount to number
      const numericAmount = parseFloat(data.amount)
      
      // Check for insufficient funds for withdrawals
      if (data.type === "withdrawal" && selectedCard && numericAmount > selectedCard.balance) {
        form.setError("amount", {
          type: "manual",
          message: "Insufficient funds for this transaction"
        })
        setIsSubmitting(false)
        return
      }
      
      // API call to create transaction
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numericAmount,
          type: data.type,
          description: data.description,
          cardId: data.cardId,
          category: data.category || undefined,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create transaction')
      }
      
      // Success notification
      toast.success('Transaction created successfully')
      
      // Reset form
      form.reset({
        amount: "",
        type: "deposit",
        description: "",
        cardId: selectedCardId,
        category: "",
      })
      
      // Call the callback
      if (onTransactionCreated) {
        onTransactionCreated()
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create transaction')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Transaction</CardTitle>
        <CardDescription>Add a new transaction to your account</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) => form.setValue("type", value as "deposit" | "withdrawal" | "transfer")}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="card">Card</Label>
            <Select
              value={form.watch("cardId")}
              onValueChange={(value) => form.setValue("cardId", value)}
            >
              <SelectTrigger id="card">
                <SelectValue placeholder="Select card" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name} ({card.number.slice(-4)}) - Balance: ${card.balance.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCard && (
              <p className="text-sm text-muted-foreground">
                Available balance: ${selectedCard.balance.toFixed(2)}
              </p>
            )}
            {form.formState.errors.cardId && (
              <p className="text-sm text-red-500">{form.formState.errors.cardId.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Transaction description"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Select
              value={form.watch("category") || ""}
              onValueChange={(value) => form.setValue("category", value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {transactionCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Transaction'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 