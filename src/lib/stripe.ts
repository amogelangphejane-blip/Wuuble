import { loadStripe, Stripe } from '@stripe/stripe-js';

// This is your test publishable API key.
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Stripe publishable key not found. Payment processing will use mock mode.');
}

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey || '');
  }
  return stripePromise;
};

export const isStripeEnabled = () => !!stripePublishableKey;