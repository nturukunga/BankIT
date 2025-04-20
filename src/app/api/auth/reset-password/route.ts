import { NextResponse } from 'next/server';
import { supabase } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: { message: "Email is required" } }, { status: 400 });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXTAUTH_URL}/auth/reset-password`,
    });

    if (error) {
      console.error('Reset password error:', error);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: { message: error.message || 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
} 