import Stripe from 'stripe';
import { env } from '../config/environment';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);
