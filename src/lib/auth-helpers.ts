import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a client with the anon key
export const supabase = supabaseUrl && supabaseAnonKey ? 
  createClient(supabaseUrl, supabaseAnonKey) : 
  null;

if (!supabase) {
  console.error('Supabase client could not be initialized - missing URL or key');
}

/**
 * Create a new user in Supabase Auth
 */
export async function createUserWithEmailAndPassword(
  email: string,
  password: string,
  userData: { name: string; image?: string }
) {
  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          image: userData.image,
        },
      },
    });

    if (authError) throw authError;
    
    // The trigger will automatically create the user in the User table
    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('Error in createUserWithEmailAndPassword:', error);
    throw error;
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmailAndPassword(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error in signInWithEmailAndPassword:', error);
    throw error;
  }
}

/**
 * Get user by email from the User table
 */
export async function getUserByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      // If not found, don't throw
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    return null;
  }
}

/**
 * Get user by ID from the User table
 */
export async function getUserById(id: string) {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // If not found, don't throw
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
}

/**
 * Manually create user in the User table if not created by trigger
 */
export async function createUserRecord(user: any) {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(user.email);
    if (existingUser) return existingUser;
    
    // Create user in database
    const { data, error } = await supabase
      .from('User')
      .insert({
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        image: user.image,
        emailVerified: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in createUserRecord:', error);
    return null;
  }
} 