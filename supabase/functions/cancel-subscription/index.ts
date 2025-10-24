import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the auth token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      throw new Error('Missing subscription ID')
    }

    // Verify that the subscription belongs to the user
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (subError || !subscription) {
      throw new Error('Subscription not found or unauthorized')
    }

    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId)

    // Update the subscription status in the database
    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        canceled_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', subscriptionId)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      throw new Error('Failed to update subscription status')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription canceled successfully',
        cancel_at: canceledSubscription.cancel_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
