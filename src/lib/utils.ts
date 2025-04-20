import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Ensures a string is in UUID format
 * If it's already a UUID, returns it unchanged
 * Otherwise, generates a deterministic UUID based on the input
 */
export function ensureUuid(id: string): string {
  if (!id) return crypto.randomUUID();
  
  // If it's already a UUID, return as is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  
  // Generate a deterministic UUID from the ID
  const md5 = crypto.createHash('md5').update(id).digest('hex');
  // Format as UUID (version 4)
  return `${md5.substring(0, 8)}-${md5.substring(8, 12)}-4${md5.substring(13, 16)}-${md5.substring(16, 20)}-${md5.substring(20, 32)}`;
} 