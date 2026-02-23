import express from 'express';
import Stripe from 'stripe';
import { env } from '../config/environment.js';

const router = express.Router();
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

interface PaymentIntentBody {
  userId: string;
  amount: number;
}

router.post('/payment-intent', async (req, res) => {
  const body = req.body as PaymentIntentBody;
  const { userId, amount } = body;

  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId et amount sont requis' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      metadata: { userId },
      automatic_payment_methods: { enabled: true },
    });

    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
      return res.status(500).json({ error: 'Impossible de créer le paiement', detail: err.message });
    } else {
      console.error(err);
      return res.status(500).json({ error: 'Impossible de créer le paiement' });
    }
  }
});

export default router;
