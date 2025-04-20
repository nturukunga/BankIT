"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { 
  CreditCard, 
  PlusCircle, 
  Trash2, 
  CheckCircle, 
  ChevronRight, 
  AlertCircle,
  Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

// Card validation regex patterns
const CARD_NUMBER_REGEX = /^[0-9]{16}$/
const CVV_REGEX = /^[0-9]{3,4}$/
const EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/([0-9]{2})$/

// Default card types
const CARD_TYPES = [
  { id: "visa", name: "Visa" },
  { id: "mastercard", name: "Mastercard" },
  { id: "amex", name: "American Express" },
  { id: "discover", name: "Discover" }
]

// Initial card form state
const INITIAL_CARD_STATE = {
  number: "",
  name: "",
  expiry: "",
  cvv: "",
  type: "visa",
  isDefault: false,
  creditLimit: 5000,
  balance: 0
}

export default function CardsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(false)
  const [cards, setCards] = useState<any[]>([])
  const [currentCard, setCurrentCard] = useState({ ...INITIAL_CARD_STATE })
  const [isFormValid, setIsFormValid] = useState(false)
  const [showCardForm, setShowCardForm] = useState(true)
  
  // Validate form whenever card details change
  useEffect(() => {
    const { number, name, expiry, cvv } = currentCard
    const isValid = 
      CARD_NUMBER_REGEX.test(number) && 
      name.trim().length > 3 && 
      EXPIRY_REGEX.test(expiry) && 
      CVV_REGEX.test(cvv)
    
    setIsFormValid(isValid)
  }, [currentCard])
  
  // Check auth status
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth")
    } else if (status === "authenticated") {
      // Check if user has any saved cards
      fetchUserCards()
    }
  }, [status, router])
  
  // Fetch user's cards
  const fetchUserCards = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/cards", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCards(data.cards || [])
        
        // If user already has cards, hide the form initially
        if (data.cards && data.cards.length > 0) {
          setShowCardForm(false)
        }
      }
    } catch (error) {
      console.error("Error fetching cards:", error)
      toast.error("Failed to load your cards")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Format card number with spaces for display (purely visual)
    if (name === "number" && value) {
      // Only allow numbers
      if (!/^[0-9]*$/.test(value.replace(/\s/g, ""))) return
      
      // Limit to 16 digits
      if (value.replace(/\s/g, "").length > 16) return
    }
    
    // Format expiry date (MM/YY)
    if (name === "expiry") {
      // Only allow numbers and slash
      if (!/^[0-9/]*$/.test(value)) return
      
      // Auto-format expiry date
      if (value.length === 2 && currentCard.expiry.length === 1) {
        setCurrentCard({ ...currentCard, expiry: value + "/" })
        return
      }
      
      // Limit to MM/YY format (5 chars)
      if (value.length > 5) return
    }
    
    // Basic validation for CVV (3-4 digits)
    if (name === "cvv") {
      // Only allow numbers
      if (!/^[0-9]*$/.test(value)) return
      
      // Limit to 3-4 digits
      if (value.length > 4) return
    }
    
    setCurrentCard({ ...currentCard, [name]: value })
  }
  
  // Handle card type selection
  const handleCardTypeChange = (value: string) => {
    setCurrentCard({ ...currentCard, type: value })
  }
  
  // Handle adding a new card
  const handleAddCard = async () => {
    try {
      setIsLoading(true)
      
      // Prepare card data for API
      const cardData = {
        ...currentCard,
        isDefault: cards.length === 0 ? true : currentCard.isDefault
      }
      
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardData)
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Add new card to list
        setCards([...cards, data.card])
        
        // Reset form
        setCurrentCard({ ...INITIAL_CARD_STATE })
        setShowCardForm(false)
        
        toast.success("Card added successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to add card")
      }
    } catch (error) {
      console.error("Error adding card:", error)
      toast.error("Failed to add card")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle removing a card
  const handleRemoveCard = async (cardId: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        // Remove card from list
        setCards(cards.filter(card => card.id !== cardId))
        toast.success("Card removed successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to remove card")
      }
    } catch (error) {
      console.error("Error removing card:", error)
      toast.error("Failed to remove card")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle setting a card as default
  const handleSetDefault = async (cardId: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/cards/${cardId}/default`, {
        method: "PUT"
      })
      
      if (response.ok) {
        // Update cards list
        setCards(cards.map(card => ({
          ...card,
          isDefault: card.id === cardId
        })))
        
        toast.success("Default card updated")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update default card")
      }
    } catch (error) {
      console.error("Error setting default card:", error)
      toast.error("Failed to update default card")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle proceeding to dashboard
  const handleProceedToDashboard = () => {
    if (cards.length > 0) {
      localStorage.setItem("onboardingComplete", "true")
      router.push("/dashboard")
    } else {
      toast.error("Please add at least one card before proceeding")
    }
  }
  
  // Loading state
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="container relative min-h-screen px-4 py-8 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Your Cards</h1>
          <p className="mt-2 text-gray-400">
            Add your cards to start tracking your expenses
          </p>
        </div>
        
        {/* Existing Cards Section */}
        {cards.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Your Cards</h2>
            
            <div className="grid gap-6 sm:grid-cols-2">
              {cards.map((card) => (
                <div 
                  key={card.id}
                  className="relative overflow-hidden rounded-xl backdrop-blur-md border border-white/10 bg-white/5 shadow-lg p-0.5"
                >
                  <div className={`h-full rounded-lg p-6 ${card.isDefault ? 'ring-2 ring-green-500' : ''}`}>
                    {/* Card type and actions */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-green-500" />
                        <span className="font-medium text-white">{card.type.charAt(0).toUpperCase() + card.type.slice(1)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!card.isDefault && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-gray-400 hover:text-green-500" 
                            onClick={() => handleSetDefault(card.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="sr-only">Set as default</span>
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500" 
                          onClick={() => handleRemoveCard(card.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove card</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Card details */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-400">Card Number</p>
                        <p className="font-mono text-white">
                          •••• •••• •••• {card.number.slice(-4)}
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-gray-400">Card Holder</p>
                          <p className="text-white">{card.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Expires</p>
                          <p className="text-white">{card.expiry}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Default indicator */}
                    {card.isDefault && (
                      <div className="absolute top-2 right-2 bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full text-xs">
                        Default
                      </div>
                    )}
                    
                    {/* Balance indicator */}
                    <div className={`mt-4 px-3 py-2 rounded-md ${
                      Number(card.balance) < 0 
                        ? 'bg-red-500/20 text-red-500' 
                        : 'bg-green-500/20 text-green-500'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">Current Balance</span>
                        <span className="font-semibold">${Number(card.balance).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                </div>
              ))}
              
              {/* Add Card Button */}
              <button
                onClick={() => setShowCardForm(true)}
                className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-transparent p-6 text-center hover:border-gray-500 hover:bg-white/5 transition-all"
              >
                <PlusCircle className="h-8 w-8 text-gray-500" />
                <span className="mt-2 block text-sm font-medium text-gray-400">Add a new card</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Add Card Form */}
        {showCardForm && (
          <div className="overflow-hidden rounded-xl backdrop-blur-md border border-white/20 bg-white/5 shadow-lg">
            <div className="p-6">
              <h2 className="text-xl font-medium text-white mb-6">
                {cards.length === 0 ? "Add Your First Card" : "Add a New Card"}
              </h2>
              
              <div className="space-y-6">
                {/* Card Number */}
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-gray-300">Card Number</Label>
                  <Input
                    id="number"
                    name="number"
                    placeholder="1234 5678 9012 3456"
                    value={currentCard.number}
                    onChange={handleChange}
                    className="bg-transparent border-gray-700 text-white"
                  />
                </div>
                
                {/* Card Holder Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Card Holder Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={currentCard.name}
                    onChange={handleChange}
                    className="bg-transparent border-gray-700 text-white"
                  />
                </div>
                
                {/* Card Type and Expiry Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-type" className="text-gray-300">Card Type</Label>
                    <Select value={currentCard.type} onValueChange={handleCardTypeChange}>
                      <SelectTrigger id="card-type" className="bg-transparent border-gray-700 text-white">
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-gray-700">
                        {CARD_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id} className="text-white">
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-gray-300">Expiry Date</Label>
                    <Input
                      id="expiry"
                      name="expiry"
                      placeholder="MM/YY"
                      value={currentCard.expiry}
                      onChange={handleChange}
                      className="bg-transparent border-gray-700 text-white"
                    />
                  </div>
                </div>
                
                {/* CVV and Balance */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-gray-300">CVV</Label>
                    <Input
                      id="cvv"
                      name="cvv"
                      type="password"
                      placeholder="•••"
                      value={currentCard.cvv}
                      onChange={handleChange}
                      className="bg-transparent border-gray-700 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="balance" className="text-gray-300">Current Balance ($)</Label>
                    <Input
                      id="balance"
                      name="balance"
                      type="number"
                      placeholder="0.00"
                      value={currentCard.balance.toString()}
                      onChange={(e) => setCurrentCard({ ...currentCard, balance: Number(e.target.value) })}
                      className="bg-transparent border-gray-700 text-white"
                    />
                  </div>
                </div>
                
                {/* Credit Limit */}
                <div className="space-y-2">
                  <Label htmlFor="creditLimit" className="text-gray-300">Credit Limit ($)</Label>
                  <Input
                    id="creditLimit"
                    name="creditLimit"
                    type="number"
                    placeholder="5000"
                    value={currentCard.creditLimit.toString()}
                    onChange={(e) => setCurrentCard({ ...currentCard, creditLimit: Number(e.target.value) })}
                    className="bg-transparent border-gray-700 text-white"
                  />
                </div>
                
                {/* Form Actions */}
                <div className="flex justify-end space-x-4">
                  {cards.length > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCardForm(false)}
                      className="border-gray-700 text-white hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleAddCard}
                    disabled={!isFormValid || isLoading}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Card
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Proceed to Dashboard Button */}
        <div className="flex justify-center pt-8">
          <Button 
            onClick={handleProceedToDashboard}
            disabled={cards.length === 0 || isLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-8"
            size="lg"
          >
            Proceed to Dashboard
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }
      `}</style>
    </div>
  )
} 