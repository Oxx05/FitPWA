import { loadStripe } from '@stripe/stripe-js'

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || ''
export const stripePromise = loadStripe(stripePublicKey)

export const PREMIUM_PRICE_ID = 'price_placeholder'

/**
 * Redirect to Stripe Checkout
 */
export async function createCheckoutSession(userId: string) {
  // In a real app, this would call a Supabase Edge Function to create the session
  console.log('Redirecting to checkout for user:', userId)
  
  // Mocking the behavior for the prototype
  alert('A redirecionar para o checkout do Stripe... (Mock)')
}
