import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

console.log('Initializing stripe-webhook function')
console.log('STRIPE_SECRET_KEY exists:', !!stripeSecretKey)
console.log('STRIPE_SECRET_KEY starts with:', stripeSecretKey?.substring(0, 10))
console.log('STRIPE_WEBHOOK_SECRET exists:', !!webhookSecret)

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://voluiferhsehqrlwsjaq.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

console.log('SUPABASE_URL:', supabaseUrl)
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret!
    )

    console.log(`Processing event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const subscriptionId = session.subscription as string

        console.log(`checkout.session.completed - userId: ${userId}, subscriptionId: ${subscriptionId}`)

        if (userId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = subscription.items.data[0].price.id

          // Determine tier based on price ID
          let tier = 'basic'
          let billingPeriod = 'monthly'

          // Map price IDs to tiers (get from environment or Stripe metadata)
          const priceMetadata = subscription.items.data[0].price.metadata
          const priceTierMap: Record<string, string> = {
            // These will be populated from actual price IDs
            // Basic tier price IDs would map to 'basic'
            // Pro tier price IDs would map to 'pro'
            // Premium tier price IDs would map to 'premium'
          }

          // Try metadata first, then fall back to price ID mapping
          if (priceMetadata?.tier) {
            tier = priceMetadata.tier
          } else if (priceTierMap[priceId]) {
            tier = priceTierMap[priceId]
          } else {
            // Try to infer from product name or price nickname
            const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string)
            const productName = product.name.toLowerCase()

            if (productName.includes('premium')) {
              tier = 'premium'
            } else if (productName.includes('pro')) {
              tier = 'pro'
            } else if (productName.includes('basic')) {
              tier = 'basic'
            }

            console.log(`Inferred tier '${tier}' from product name: ${product.name}`)
          }

          if (subscription.items.data[0].price.recurring?.interval === 'year') {
            billingPeriod = 'yearly'
          }

          console.log(`Upserting subscription for user ${userId}: tier=${tier}, status=active`)

          // Update user subscription in database
          const { data, error } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              tier: tier,
              status: 'active',
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer as string,
              billing_period: billingPeriod,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }, {
              onConflict: 'user_id'
            })

          if (error) {
            console.error('Error upserting subscription:', error)
            throw error
          }

          console.log('Successfully upserted subscription:', data)
        } else {
          console.log(`Missing userId or subscriptionId - userId: ${userId}, subscriptionId: ${subscriptionId}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          // Get current_period_end from the subscription item
          const currentPeriodEnd = subscription.items.data[0]?.current_period_end || subscription.current_period_end

          const updateData: any = {
            status: subscription.status,
          }

          // Only add current_period_end if it exists and is valid
          if (currentPeriodEnd && !isNaN(currentPeriodEnd)) {
            updateData.current_period_end = new Date(currentPeriodEnd * 1000).toISOString()
          }

          await supabase
            .from('user_subscriptions')
            .update(updateData)
            .eq('stripe_subscription_id', subscription.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // Record successful payment
          await supabase
            .from('stripe_payments')
            .insert({
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: invoice.customer as string,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'succeeded',
              paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
            })

          // Reset monthly usage limits on successful payment
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (subscription?.user_id) {
            // Reset usage tracking for new billing period
            await supabase
              .from('usage_tracking')
              .update({
                words_used: 0,
                ai_scans_used: 0,
                essays_generated: 0,
                humanizations_used: 0,
                plagiarism_scans_used: 0,
                reset_at: new Date().toISOString(),
              })
              .eq('user_id', subscription.user_id)
              .eq('period_start', new Date(invoice.period_start * 1000).toISOString().slice(0, 7)) // YYYY-MM format
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // Record failed payment
          await supabase
            .from('stripe_payments')
            .insert({
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: invoice.customer as string,
              amount: invoice.amount_due,
              currency: invoice.currency,
              status: 'failed',
              failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
            })

          // Update subscription status
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('stripe_subscription_id', subscriptionId)

          // Send payment failure email notification
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('user_id, users!inner(email)')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (subscription?.users?.email) {
            // Queue email notification
            await supabase
              .from('email_queue')
              .insert({
                to_email: subscription.users.email,
                template_id: 'payment_failed',
                data: {
                  amount: (invoice.amount_due / 100).toFixed(2),
                  currency: invoice.currency.toUpperCase(),
                },
              })
          }
        }
        break
      }

      case 'customer.subscription.paused':
      case 'customer.subscription.resumed': {
        const subscription = event.data.object as Stripe.Subscription
        const status = event.type === 'customer.subscription.paused' ? 'paused' : 'active'

        await supabase
          .from('user_subscriptions')
          .update({
            status: status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'payment_method.attached':
      case 'payment_method.updated': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod

        // Update default payment method info
        if (paymentMethod.customer) {
          await supabase
            .from('user_payment_methods')
            .upsert({
              stripe_customer_id: paymentMethod.customer as string,
              stripe_payment_method_id: paymentMethod.id,
              type: paymentMethod.type,
              last4: paymentMethod.card?.last4,
              brand: paymentMethod.card?.brand,
              exp_month: paymentMethod.card?.exp_month,
              exp_year: paymentMethod.card?.exp_year,
              is_default: true,
            }, {
              onConflict: 'stripe_payment_method_id'
            })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
