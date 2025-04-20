import { supabase } from "@/lib/supabase";
import { ensureUuid } from "@/lib/utils";

export interface Card {
  id: string;
  userId: string;
  number: string;
  name: string;
  expiry: string;
  type: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all cards for a user
 */
export async function getCards(userId: string) {
  const uuidUserId = ensureUuid(userId);
  
  const { data, error } = await supabase
    .from("Card")
    .select("*")
    .eq("userId", uuidUserId)
    .order("createdAt", { ascending: false });
    
  if (error) {
    console.error("Error fetching cards:", error);
    throw new Error("Failed to fetch cards");
  }
  
  return data || [];
}

/**
 * Get a card by ID
 */
export async function getCardById(cardId: string, userId: string) {
  const uuidCardId = ensureUuid(cardId);
  const uuidUserId = ensureUuid(userId);
  
  const { data, error } = await supabase
    .from("Card")
    .select("*")
    .eq("id", uuidCardId)
    .eq("userId", uuidUserId)
    .single();
    
  if (error) {
    console.error("Error fetching card:", error);
    throw new Error("Failed to fetch card");
  }
  
  return data;
}

/**
 * Create a new card
 */
export async function createCard(card: Omit<Card, "id" | "userId" | "createdAt" | "updatedAt">, userId: string) {
  const uuidUserId = ensureUuid(userId);
  
  const { data, error } = await supabase
    .from("Card")
    .insert({
      ...card,
      userId: uuidUserId,
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating card:", error);
    throw new Error("Failed to create card");
  }
  
  return data;
}

/**
 * Update a card
 */
export async function updateCard(cardId: string, updates: Partial<Omit<Card, "id" | "userId" | "createdAt" | "updatedAt">>, userId: string) {
  const uuidCardId = ensureUuid(cardId);
  const uuidUserId = ensureUuid(userId);
  
  // Verify the card belongs to the user
  const { data: existingCard, error: fetchError } = await supabase
    .from("Card")
    .select("id")
    .eq("id", uuidCardId)
    .eq("userId", uuidUserId)
    .single();
    
  if (fetchError || !existingCard) {
    console.error("Error fetching card for update:", fetchError);
    throw new Error("Card not found or does not belong to user");
  }
  
  const { data, error } = await supabase
    .from("Card")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", uuidCardId)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating card:", error);
    throw new Error("Failed to update card");
  }
  
  return data;
}

/**
 * Delete a card
 */
export async function deleteCard(cardId: string, userId: string) {
  const uuidCardId = ensureUuid(cardId);
  const uuidUserId = ensureUuid(userId);
  
  // Verify the card belongs to the user
  const { data: existingCard, error: fetchError } = await supabase
    .from("Card")
    .select("id")
    .eq("id", uuidCardId)
    .eq("userId", uuidUserId)
    .single();
    
  if (fetchError || !existingCard) {
    console.error("Error fetching card for deletion:", fetchError);
    throw new Error("Card not found or does not belong to user");
  }
  
  const { error } = await supabase
    .from("Card")
    .delete()
    .eq("id", uuidCardId);
    
  if (error) {
    console.error("Error deleting card:", error);
    throw new Error("Failed to delete card");
  }
  
  return true;
} 