import { Hono } from 'hono';
import { requireAuth, requireAdmin } from '../lib/auth';
import { paymentService } from '../services/payment.service';

export const paymentsRouter = new Hono();

paymentsRouter.post('/payment/create-order', async (c) => {
  const userOrRes = await requireAuth(c);
  if (userOrRes instanceof Response) return userOrRes;

  const body = await c.req.json();
  try {
    const res = await paymentService.createProviderOrder(body.order_id, userOrRes.id);
    return c.json(res);
  } catch (err: any) {
    return c.json({ detail: err.message || 'Order not found' }, err.status || 404);
  }
});

paymentsRouter.post('/payment/verify', async (c) => {
  const userOrRes = await requireAuth(c);
  if (userOrRes instanceof Response) return userOrRes;

  const body = await c.req.json();
  const isValid = paymentService.verifyPaymentSignature(
    body.order_id,
    body.razorpay_order_id,
    body.razorpay_payment_id,
    body.razorpay_signature
  );

  if (!isValid) {
    return c.json(
      { detail: 'Payment verification failed: Invalid cryptographic payment signature.' },
      400
    );
  }

  try {
    const reconciled = await paymentService.reconcileOrderPayment(
      body.order_id,
      body.razorpay_order_id,
      body.razorpay_payment_id,
      'verification_route'
    );

    return c.json({
      success: true,
      message: 'Payment verified and order successfully confirmed.',
      payment_status: reconciled.payment_status || 'paid',
      order_id: reconciled.id,
      order_number: reconciled.order_number,
    });
  } catch (err: any) {
    return c.json({ detail: err.message || 'Payment reconciliation failed' }, err.status || 400);
  }
});

paymentsRouter.post('/payment/webhook', async (c) => {
  const signature = c.req.header('x-razorpay-signature') || c.req.header('X-Razorpay-Signature');
  const rawBody = await c.req.text();

  try {
    const res = await paymentService.processWebhook(rawBody, signature);
    return c.json(res);
  } catch (err: any) {
    return c.json({ detail: err.message || 'Webhook processing failed' }, err.status || 400);
  }
});

paymentsRouter.post('/admin/payments/recovery-sweep', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const thresholdParam = c.req.query('threshold_minutes');
  const threshold = thresholdParam ? parseInt(thresholdParam, 10) : 30;

  const res = await paymentService.runRecoverySweep(threshold);
  return c.json(res);
});
