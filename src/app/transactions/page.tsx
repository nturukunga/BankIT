'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getCards } from '@/data/card'
import { TransactionWithRelations } from '@/data/transaction'
import TransactionList from '@/components/transactions/transaction-list'
import TransactionForm from '@/components/transactions/transaction-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [activeTab, setActiveTab] = useState('list')
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/transactions')
    }
  }, [status, router])
  
  // Fetch cards for the transaction form
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('/api/cards')
        const data = await response.json()
        
        if (data.cards) {
          setCards(data.cards)
        }
      } catch (error) {
        console.error('Error fetching cards:', error)
        toast.error('Failed to load your cards')
      }
    }
    
    if (session?.user) {
      fetchCards()
    }
  }, [session])
  
  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/transactions?page=${page}&limit=${pageSize}`)
      const data = await response.json()
      
      if (response.ok) {
        setTransactions(data.transactions || [])
        setTotalCount(data.count || 0)
      } else {
        throw new Error(data.error || 'Failed to fetch transactions')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load your transactions')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    if (session?.user) {
      fetchTransactions()
    }
  }, [session, page, pageSize])
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }
  
  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1) // Reset to first page when changing page size
  }
  
  // Handle transaction created event
  const handleTransactionCreated = () => {
    fetchTransactions()
    setActiveTab('list')
  }
  
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (status === 'unauthenticated') {
    return null // Will redirect to login
  }
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>
      
      <Tabs 
        defaultValue="list" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="list">Transaction History</TabsTrigger>
          <TabsTrigger value="create">Create Transaction</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          {isLoading ? (
            <Card>
              <CardContent className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : (
            <TransactionList
              transactions={transactions}
              totalCount={totalCount}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </TabsContent>
        
        <TabsContent value="create">
          {cards.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Cards Available</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  You need to add a card before you can create transactions.
                </p>
                <button
                  onClick={() => router.push('/cards')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded"
                >
                  Add a Card
                </button>
              </CardContent>
            </Card>
          ) : (
            <TransactionForm 
              cards={cards}
              onTransactionCreated={handleTransactionCreated}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 