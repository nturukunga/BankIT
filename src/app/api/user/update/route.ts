import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { ensureUuid } from '@/lib/utils'

// Validation schema for profile updates
const ProfileUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
  currency: z.string().optional(),
  darkMode: z.boolean().optional(),
  emailNotifications: z.boolean().optional()
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate input data
    const rawData = await req.json()
    const validationResult = ProfileUpdateSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid data', errors: validationResult.error.format() },
        { status: 400 }
      )
    }
    
    const { name, email, currentPassword, newPassword, currency, darkMode, emailNotifications } = validationResult.data

    // Get the current user
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // If changing password, verify via Supabase Auth
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: 'Current password is required to set a new password' },
          { status: 400 }
        )
      }

      // Sign in to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });

      if (signInError) {
        return NextResponse.json(
          { message: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      // Update password in Supabase Auth
      const { error: updatePasswordError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updatePasswordError) {
        throw new Error(`Failed to update password: ${updatePasswordError.message}`);
      }
    }

    // Prepare update data - use camelCase column names for Supabase
    const updateData: any = {};
    if (name) updateData.name = name;
    
    // Use updatedAt for Supabase table
    updateData.updatedAt = new Date().toISOString();

    // Convert user ID to UUID format for the query
    const userUuid = ensureUuid(user.id);

    // Update user data in the User table
    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', userUuid)
      .select()
      .single();

    if (updateError) {
      console.error('Update error details:', updateError);
      throw new Error(`Failed to update user profile: ${updateError.message}`);
    }

    // Fetch or create user settings using camelCase column names
    const { data: userSettings, error: settingsError } = await supabase
      .from('UserSettings')
      .upsert({
        userId: userUuid,
        currency: currency || 'USD',
        darkMode: darkMode !== undefined ? darkMode : true,
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (settingsError) {
      throw new Error(`Failed to update user settings: ${settingsError.message}`);
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        settings: userSettings
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { message: 'Failed to update profile', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 