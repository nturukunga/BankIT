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

export async function getTransactionStats(
  userId: string,
  days: number = 30
): Promise<{
  totalDeposits: number
  totalWithdrawals: number
  totalTransactions: number
  recentActivity: Transaction[]
}> {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - days)

  const [deposits, withdrawals, total, recentActivity] = await Promise.all([
    db.transaction.aggregate({
      where: {
        userId,
        type: "deposit",
        createdAt: {
          gte: startDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),
    db.transaction.aggregate({
      where: {
        userId,
        type: "withdrawal",
        createdAt: {
          gte: startDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),
    db.transaction.count({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
    }),
    db.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ])

  return {
    totalDeposits: deposits._sum.amount || 0,
    totalWithdrawals: withdrawals._sum.amount || 0,
    totalTransactions: total,
    recentActivity,
  }
}