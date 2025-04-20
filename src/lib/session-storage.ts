/**
 * Utility for safely handling session storage with server-side rendering support
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Safely get an item from sessionStorage with SSR support
 */
export function getSessionItem(key: string): string | null {
  if (!isBrowser) return null;
  
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    console.error('Error accessing sessionStorage:', error);
    return null;
  }
}

/**
 * Safely set an item in sessionStorage with SSR support
 */
export function setSessionItem(key: string, value: string): boolean {
  if (!isBrowser) return false;
  
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('Error setting sessionStorage item:', error);
    return false;
  }
}

/**
 * Safely remove an item from sessionStorage with SSR support
 */
export function removeSessionItem(key: string): boolean {
  if (!isBrowser) return false;
  
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing sessionStorage item:', error);
    return false;
  }
}

/**
 * Safely clear all sessionStorage items with SSR support
 */
export function clearSessionStorage(): boolean {
  if (!isBrowser) return false;
  
  try {
    sessionStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
    return false;
  }
}

/**
 * Generate a CSRF token and store it in sessionStorage
 */
export function generateCsrfToken(): string {
  const token = Math.random().toString(36).substring(2, 15);
  setSessionItem('csrfToken', token);
  return token;
}

/**
 * Get the stored CSRF token or generate a new one
 */
export function getCsrfToken(): string {
  const token = getSessionItem('csrfToken');
  return token || generateCsrfToken();
} 