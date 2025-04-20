"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CreditCard, DollarSign, Check } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface CardData {
  id: string
  number: string
  name: string
  expiry: string
  balance: number
  type: string
}

// Create schema for expense form
const expenseFormSchema = z.object({
  amount: z.string().min(1, { message: 'Amount is required' }),
  cardId: z.string().min(1, { message: 'Please select a card' }),
  category: z.string().min(1, { message: 'Please select a category' }),
  description: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseFormSchema>

// Define available expense categories
const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Dining' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'transportation', name: 'Transportation' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'utilities', name: 'Utilities' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'travel', name: 'Travel' },
  { id: 'other', name: 'Other' },
]

export default function ExpenseForm() {
  const router = useRouter()
  const [cards, setCards] = useState<CardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)

  // Initialize the form
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: '',
      cardId: '',
      category: '',
      description: '',
    },
  })

  // Fetch user's cards
  useEffect(() => {
    const fetchUserCards = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/cards')
        
        if (response.ok) {
          const data = await response.json()
          // Filter out virtual savings card
          const regularCards = data.cards.filter((card: CardData) => 
            !card.number.includes('VIRTUAL_SAVINGS')
          )
          setCards(regularCards)
        } else {
          toast.error('Failed to load cards')
        }
      } catch (error) {
        console.error('Error fetching cards:', error)
        toast.error('Failed to load cards')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserCards()
  }, [])

  // Handle form submission
  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      setIsSubmitting(true)

      // Parse amount to number
      const amount = parseFloat(values.amount)
      
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount')
        return
      }

      // Get selected card for validation
      const selectedCard = cards.find(card => card.id === values.cardId)
      if (!selectedCard) {
        toast.error('Please select a valid card')
        return
      }

      // Check if the card has sufficient balance
      if (selectedCard.balance < amount) {
        toast.error(`Insufficient funds. Your current balance is ${selectedCard.balance.toFixed(2)}`)
        return
      }

      // Use the server-side balance update endpoint for atomic transactions
      const response = await fetch('/api/cards/update-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': sessionStorage.getItem('csrfToken') || '',
        },
        body: JSON.stringify({
          cardId: values.cardId,
          amount: amount * -1, // Negative amount for expenses
          reason: values.description || `Expense: ${EXPENSE_CATEGORIES.find(c => c.id === values.category)?.name || values.category}`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFormSuccess(true)
        toast.success('Expense recorded successfully')
        
        // Dispatch a custom event to notify the dashboard of the transaction
        const transactionCompleteEvent = new Event('transaction-complete')
        window.dispatchEvent(transactionCompleteEvent)
        
        // Reset form after success
        setTimeout(() => {
          form.reset()
          setFormSuccess(false)
          router.refresh() // Refresh the page to update card balances
        }, 1500)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to record expense')
      }
    } catch (error) {
      console.error('Error submitting expense:', error)
      toast.error('Failed to record expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-400 mb-2">No cards available for expenses</p>
        <Button
          variant="outline"
          onClick={() => router.push('/cards')}
          className="text-green-500 border-green-500/30 hover:bg-green-500/10"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Add a Card
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium text-white">Record Expense</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Card Selection */}
          <FormField
            control={form.control}
            name="cardId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Select Card</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="bg-transparent border-gray-700 text-white">
                      <SelectValue placeholder="Select a card" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-900 border-gray-700">
                    {cards.map((card) => (
                      <SelectItem 
                        key={card.id} 
                        value={card.id}
                        className="text-white"
                      >
                        {card.type} •••• {card.number.slice(-4)} (${card.balance.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Amount ($)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="bg-transparent border-gray-700 text-white pl-9"
                      disabled={isSubmitting}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="bg-transparent border-gray-700 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-900 border-gray-700">
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                        className="text-white"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Description (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="What was this expense for?"
                    className="bg-transparent border-gray-700 text-white"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full ${
              formSuccess ? 'bg-green-500 hover:bg-green-600' : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : formSuccess ? (
              <Check className="mr-2 h-4 w-4" />
            ) : null}
            {formSuccess ? 'Expense Recorded!' : 'Record Expense'}
          </Button>
        </form>
      </Form>
    </div>
  )
} 