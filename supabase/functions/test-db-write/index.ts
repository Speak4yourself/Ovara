import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://voluiferhsehqrlwsjaq.supabase.co'
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')

    console.log('SUPABASE_URL:', supabaseUrl)
    console.log('SERVICE_ROLE_KEY exists:', !!supabaseServiceKey)

    if (!supabaseServiceKey) {
      throw new Error('SERVICE_ROLE_KEY not found')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { userId } = await req.json()

    if (!userId) {
      throw new Error('userId is required')
    }

    console.log('Attempting to insert subscription for user:', userId)

    // Try to insert a test subscription
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        tier: 'premium',
        status: 'active',
        billing_period: 'monthly',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()

    console.log('Insert result:', { data, error })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
