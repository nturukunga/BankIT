import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface RateLimitConfig {
  maxRequests?: number
  windowSeconds?: number
}

export async function checkRateLimit(
  endpoint: string,
  config: RateLimitConfig = {}
) {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') ?? '127.0.0.1'
  const userId = headersList.get('x-user-id')

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_user_id: userId,
    p_ip_address: ip,
    p_endpoint: endpoint,
    p_max_requests: config.maxRequests ?? 100,
    p_window_seconds: config.windowSeconds ?? 60
  })

  if (error) {
    console.error('Rate limit check failed:', error)
    // Default to allowing the request if the check fails
    return { allowed: true, remaining: 100 }
  }

  if (!data) {
    const { data: remaining } = await supabase.rpc('get_remaining_requests', {
      p_user_id: userId,
      p_ip_address: ip,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests ?? 100,
      p_window_seconds: config.windowSeconds ?? 60
    })

    return {
      allowed: false,
      remaining: remaining ?? 0
    }
  }

  return {
    allowed: true,
    remaining: data
  }
} 