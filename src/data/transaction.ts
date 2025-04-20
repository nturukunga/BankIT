import { supabase } from "@/lib/supabase";
import { ensureUuid } from "@/lib/utils";
import { Transaction } from "@/types/transactions";
import { Card } from "./card";

export interface TransactionWithRelations extends Transaction {
  Card?: Card;
}

/**
 * Get transactions for a user with pagination
 */
export async function getTransactions(
  userId: string,
  { page = 1, limit = 10, cardId }: { page?: number; limit?: number; cardId?: string } = {}
): Promise<{ transactions: TransactionWithRelations[]; count: number }> {
  const uuidUserId = ensureUuid(userId);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("Transaction")
    .select(
      `
      *,
      Card:cardId (
        id,
        number,
        name,
        type,
        balance
      )
    `,
      { count: "exact" }
    )
    .eq("userId", uuidUserId)
    .order("createdAt", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by card if provided
  if (cardId) {
    const cardUuid = ensureUuid(cardId);
    query = query.eq("cardId", cardUuid);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Failed to fetch transactions");
  }

  return {
    transactions: (data as TransactionWithRelations[]) || [],
    count: count || 0,
  };
}

/**
 * Get a transaction by ID
 */
export async function getTransactionById(
  transactionId: string,
  userId: string
): Promise<TransactionWithRelations> {
  const uuidTransactionId = ensureUuid(transactionId);
  const uuidUserId = ensureUuid(userId);

  const { data, error } = await supabase
    .from("Transaction")
    .select(
      `
      *,
      Card:cardId (
        id,
        number,
        name,
        type,
        balance
      )
    `
    )
    .eq("id", uuidTransactionId)
    .eq("userId", uuidUserId)
    .single();

  if (error) {
    console.error("Error fetching transaction:", error);
    throw new Error("Failed to fetch transaction");
  }

  return data as TransactionWithRelations;
}

/**
 * Create a transaction (use the update_card_balance RPC instead for atomic operations)
 */
export async function createTransaction(
  transaction: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">,
  userId: string
) {
  const uuidUserId = ensureUuid(userId);
  const uuidCardId = ensureUuid(transaction.cardId || "");

  // Instead of direct insert, use the RPC for atomic operations
  const { data, error } = await supabase.rpc("update_card_balance", {
    p_user_id: uuidUserId,
    p_card_id: uuidCardId,
    p_amount: Math.abs(transaction.amount),
    p_type: transaction.amount >= 0 ? "deposit" : "withdrawal",
    p_description: transaction.description,
  });

  if (error) {
    console.error("Error creating transaction:", error);
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return data;
}

/**
 * Get transaction statistics for a user
 */
export async function getTransactionStats(
  userId: string,
  days: number = 30
): Promise<{
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransactions: number;
  recentActivity: Transaction[];
}> {
  const uuidUserId = ensureUuid(userId);
  
  // Calculate the date range (last X days)
  const endDate = new Date().toISOString();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateString = startDate.toISOString();
  
  // Get deposits sum
  const { data: deposits, error: depositsError } = await supabase
    .from("Transaction")
    .select("amount")
    .eq("userId", uuidUserId)
    .eq("type", "deposit")
    .gte("createdAt", startDateString)
    .lte("createdAt", endDate);
    
  if (depositsError) {
    console.error("Error fetching deposits:", depositsError);
  }
  
  // Get withdrawals sum
  const { data: withdrawals, error: withdrawalsError } = await supabase
    .from("Transaction")
    .select("amount")
    .eq("userId", uuidUserId)
    .eq("type", "withdrawal")
    .gte("createdAt", startDateString)
    .lte("createdAt", endDate);
    
  if (withdrawalsError) {
    console.error("Error fetching withdrawals:", withdrawalsError);
  }
  
  // Get total transaction count
  const { count, error: countError } = await supabase
    .from("Transaction")
    .select("*", { count: "exact", head: true })
    .eq("userId", uuidUserId)
    .gte("createdAt", startDateString)
    .lte("createdAt", endDate);
    
  if (countError) {
    console.error("Error fetching transaction count:", countError);
  }
  
  // Get recent activity
  const { data: recentActivity, error: recentError } = await supabase
    .from("Transaction")
    .select("*")
    .eq("userId", uuidUserId)
    .order("createdAt", { ascending: false })
    .limit(5);
    
  if (recentError) {
    console.error("Error fetching recent activity:", recentError);
  }
  
  // Calculate total deposits and withdrawals
  const totalDeposits = deposits?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
  const totalWithdrawals = withdrawals?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
  
  return {
    totalDeposits,
    totalWithdrawals,
    totalTransactions: count || 0,
    recentActivity: recentActivity as Transaction[] || [],
  };
}