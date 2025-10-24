import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe with the publishable key
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// Stripe price IDs for each tier and billing period
// These should match your Stripe dashboard product/price IDs
export const STRIPE_PRICES = {
  basic: {
    monthly: import.meta.env.VITE_STRIPE_BASIC_MONTHLY_PRICE_ID,
    yearly: import.meta.env.VITE_STRIPE_BASIC_YEARLY_PRICE_ID,
  },
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID,
    yearly: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID,
  },
  premium: {
    monthly: import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    yearly: import.meta.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID,
  },
}
