"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, ChevronRight, CreditCard, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

type CardDetails = {
  cardNumber: string
  cardHolder: string
  expiryDate: string
  type: string
}

type CardConfirmation = CardDetails & {
  isSubmitting: boolean
  error?: string
  success?: boolean
}

export default function OnboardingCardsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [cardSubmissions, setCardSubmissions] = useState<CardConfirmation[]>([])
  
  const [cards, setCards] = useState<CardDetails[]>([
    {
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      type: "credit"
    }
  ])

  // Protect page for authenticated users only
  if (status === "unauthenticated") {
    router.push("/auth")
    return null
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  const addCard = () => {
    setCards([
      ...cards,
      {
        cardNumber: "",
        cardHolder: "",
        expiryDate: "",
        type: "credit"
      }
    ])
  }

  const removeCard = (index: number) => {
    if (cards.length === 1) {
      toast.error("You need at least one card")
      return
    }
    setCards(cards.filter((_, i) => i !== index))
  }

  const updateCard = (index: number, field: keyof CardDetails, value: string) => {
    const updatedCards = [...cards]
    updatedCards[index] = {
      ...updatedCards[index],
      [field]: value
    }
    setCards(updatedCards)
  }

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")
    // Format with spaces every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ")
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19)
  }

  const formatExpiryDate = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")
    // Format as MM/YY
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
    }
    return digits
  }

  const validateCards = () => {
    for (const card of cards) {
      if (!card.cardNumber.trim() || card.cardNumber.replace(/\s/g, "").length < 12) {
        toast.error("Please enter a valid card number (at least 12 digits)")
        return false
      }
      if (!card.cardHolder.trim()) {
        toast.error("Please enter the cardholder name")
        return false
      }
      if (!card.expiryDate.trim() || card.expiryDate.length < 5) {
        toast.error("Please enter a valid expiry date (MM/YY)")
        return false
      }
    }
    return true
  }

  const handleConfirmation = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateCards()) return
    
    // Set up confirmation data
    const confirmationData = cards.map(card => ({
      ...card,
      isSubmitting: false,
      success: false
    }))
    
    setCardSubmissions(confirmationData)
    setShowConfirmation(true)
  }
  
  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setCardSubmissions([])
  }

  const submitCards = async () => {
    try {
      setIsLoading(true)
      let allSuccessful = true;
      const updatedSubmissions = [...cardSubmissions];
      
      // Submit cards one by one
      for (let i = 0; i < cards.length; i++) {
        try {
          // Update submission status
          updatedSubmissions[i] = {
            ...updatedSubmissions[i],
            isSubmitting: true,
          };
          setCardSubmissions(updatedSubmissions);
          
          // Format card for API
          const cardData = {
            cardNumber: cards[i].cardNumber.replace(/\s/g, ""),
            cardHolder: cards[i].cardHolder,
            expiryDate: cards[i].expiryDate,
            type: cards[i].type
          };
          
          // Submit individual card
          const response = await fetch("/api/cards", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(cardData)
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            updatedSubmissions[i] = {
              ...updatedSubmissions[i],
              isSubmitting: false,
              error: result.message || "Failed to save card",
              success: false
            };
            allSuccessful = false;
          } else {
            updatedSubmissions[i] = {
              ...updatedSubmissions[i],
              isSubmitting: false,
              success: true
            };
          }
        } catch (error: any) {
          updatedSubmissions[i] = {
            ...updatedSubmissions[i],
            isSubmitting: false,
            error: error.message || "An error occurred",
            success: false
          };
          allSuccessful = false;
        }
        
        setCardSubmissions([...updatedSubmissions]);
      }
      
      if (allSuccessful) {
        toast.success("All cards saved successfully!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while saving your cards");
    } finally {
      setIsLoading(false);
    }
  }

  // Render confirmation screen
  if (showConfirmation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-black to-emerald-950 p-4">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        
        <div className="container max-w-2xl px-4 z-10">
          <Card className="w-full p-6 shadow-xl bg-background/70 backdrop-blur-md border border-emerald-500/10">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-emerald-500 text-center">Confirm Your Cards</CardTitle>
              <CardDescription className="text-center">Please verify your card information before proceeding</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {cardSubmissions.map((card, index) => (
                <div key={index} className="p-4 rounded-lg border border-emerald-500/20 bg-background/30 backdrop-blur-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-emerald-500" />
                        Card {index + 1}
                        {card.success && (
                          <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                        )}
                        {card.error && (
                          <AlertCircle className="h-4 w-4 ml-2 text-red-500" />
                        )}
                      </h3>
                      
                      <div className="text-sm mt-2 space-y-1 text-muted-foreground">
                        <p><span className="font-medium text-foreground">Number:</span> {card.cardNumber}</p>
                        <p><span className="font-medium text-foreground">Name:</span> {card.cardHolder}</p>
                        <p><span className="font-medium text-foreground">Expires:</span> {card.expiryDate}</p>
                        <p><span className="font-medium text-foreground">Type:</span> {card.type}</p>
                      </div>
                    </div>
                    
                    {card.isSubmitting && (
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                    )}
                  </div>
                  
                  {card.error && (
                    <div className="mt-2 text-sm text-red-500">
                      {card.error}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCancelConfirmation}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Back to Edit
              </Button>
              
              <Button
                onClick={submitCards}
                disabled={isLoading}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-black to-emerald-950 p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <div className="container max-w-3xl px-4 z-10">
        <Card className="w-full p-8 shadow-xl bg-background/70 backdrop-blur-md border border-emerald-500/10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-emerald-500">Add Your Cards</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Add at least one card to get started
            </p>
          </div>
          
          <form onSubmit={handleConfirmation} className="space-y-8">
            {cards.map((card, index) => (
              <div key={index} className="p-6 rounded-lg border border-emerald-500/20 bg-background/30 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-emerald-500" />
                    <h2 className="text-lg font-semibold">Card {index + 1}</h2>
                  </div>
                  
                  {cards.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive/90"
                      onClick={() => removeCard(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor={`card-number-${index}`}>Card Number</Label>
                    <Input
                      id={`card-number-${index}`}
                      placeholder="1234 5678 9012 3456"
                      value={card.cardNumber}
                      onChange={(e) => updateCard(index, "cardNumber", formatCardNumber(e.target.value))}
                      className="bg-background/50 backdrop-blur-sm border-emerald-500/20"
                      maxLength={19}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`card-holder-${index}`}>Cardholder Name</Label>
                    <Input
                      id={`card-holder-${index}`}
                      placeholder="John Doe"
                      value={card.cardHolder}
                      onChange={(e) => updateCard(index, "cardHolder", e.target.value)}
                      className="bg-background/50 backdrop-blur-sm border-emerald-500/20"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`expiry-date-${index}`}>Expiry Date</Label>
                      <Input
                        id={`expiry-date-${index}`}
                        placeholder="MM/YY"
                        value={card.expiryDate}
                        onChange={(e) => updateCard(index, "expiryDate", formatExpiryDate(e.target.value))}
                        className="bg-background/50 backdrop-blur-sm border-emerald-500/20"
                        maxLength={5}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`card-type-${index}`}>Card Type</Label>
                      <Select 
                        value={card.type} 
                        onValueChange={(value) => updateCard(index, "type", value)}
                      >
                        <SelectTrigger id={`card-type-${index}`} className="bg-background/50 backdrop-blur-sm border-emerald-500/20">
                          <SelectValue placeholder="Select card type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit">Credit</SelectItem>
                          <SelectItem value="debit">Debit</SelectItem>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="mastercard">Mastercard</SelectItem>
                          <SelectItem value="amex">American Express</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-dashed border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5"
              onClick={addCard}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Another Card
            </Button>
            
            <div className="flex justify-end mt-8">
              <Button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
} 