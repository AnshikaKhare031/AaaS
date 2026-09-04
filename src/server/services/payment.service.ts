import crypto from 'crypto';
import { store, supabaseClient, isProduction } from '../database';
import { settings } from '../config';
import { verifyPaymentSignature, verifyWebhookSignature } from '../lib/razorpay';
import {
  Order,
  PaymentCreateOrderResponse,
  PaymentRecoveryItem,
  PaymentRecoverySweepResponse,
} from '../types';

export class PaymentService {
  keyId = settings.RAZORPAY_KEY_ID;
  keySecret = settings.RAZORPAY_KEY_SECRET;
  webhookSecret = settings.RAZORPAY_WEBHOOK_SECRET;

  async createProviderOrder(orderId: string, userId: string): Promise<PaymentCreateOrderResponse> {
    let order = store.orders[orderId];

    // Serverless persistent lookup via Supabase if not in memory
    if (!order && supabaseClient) {
      try {
        const { data } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (data) {
          order = {
            id: data.id,
            order_number: data.order_number,
            user_id: data.user_id,
            total_amount: Number(data.total || 0),
            status: data.order_status || data.status || 'pending',
            payment_status: data.payment_status || 'pending',
            provider_order_id: data.provider_order_id,
            items: [],
            shipping_address: {},
            shipping_fee: Number(data.shipping_fee || 0),
            discount_amount: Number(data.discount_amount || 0),
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          store.orders[orderId] = order;
        }
      } catch {
        // Fallback
      }
    }

    if (!order) {
      const err = new Error('Order not found') as any;
      err.status = 404;
      throw err;
    }

    if (order.user_id !== userId && userId !== 'admin') {
      const err = new Error('Unauthorized access to order') as any;
      err.status = 403;
      throw err;
    }

    const providerOrderId = `order_${crypto.randomBytes(7).toString('hex')}`;
    order.provider_order_id = providerOrderId;
    order.updated_at = new Date().toISOString();

    if (supabaseClient) {
      try {
        await supabaseClient
          .from('orders')
          .update({
            provider_order_id: providerOrderId,
            updated_at: order.updated_at,
          })
          .eq('id', orderId);
      } catch (e) {
        console.warn('Supabase provider order id update note:', e);
      }
    }

    return {
      order_id: orderId,
      provider_order_id: providerOrderId,
      amount: order.total_amount,
      currency: 'INR',
      key_id: this.keyId,
    };
  }

  verifyPaymentSignature(
    orderId: string,
    providerOrderId: string,
    providerPaymentId: string,
    signature: string
  ): boolean {
    return verifyPaymentSignature(providerOrderId, providerPaymentId, signature);
  }

  async reconcileOrderPayment(
    orderId: string,
    providerOrderId: string | null | undefined,
    providerPaymentId: string,
    source = 'verification'
  ): Promise<Order> {
    // Payment ID Integrity Check
    const cleanPaymentId = (providerPaymentId || '').trim();
    if (!cleanPaymentId || cleanPaymentId.length < 5 || cleanPaymentId.toLowerCase() === 'null') {
      const err = new Error(
        'Payment ID integrity violation: Provider payment ID must be a valid, non-empty identifier.'
      ) as any;
      err.status = 400;
      throw err;
    }

    let targetOrder = store.orders[orderId];

    // Serverless persistent lookup via Supabase
    if (!targetOrder && supabaseClient) {
      try {
        let query = supabaseClient.from('orders').select('*');
        if (orderId) {
          query = query.or(
            `id.eq.${orderId},provider_order_id.eq.${orderId}${
              providerOrderId ? `,provider_order_id.eq.${providerOrderId}` : ''
            }`
          );
        } else if (providerOrderId) {
          query = query.eq('provider_order_id', providerOrderId);
        }
        const { data } = await query.maybeSingle();
        if (data) {
          targetOrder = {
            id: data.id,
            order_number: data.order_number,
            user_id: data.user_id,
            customer_email: data.shipping_email,
            customer_name: data.shipping_name,
            total_amount: Number(data.total || 0),
            status: data.order_status || data.status || 'pending',
            payment_status: data.payment_status || 'pending',
            payment_id: data.payment_id,
            provider_payment_id: data.provider_payment_id,
            provider_order_id: data.provider_order_id,
            items: [],
            shipping_address: {},
            shipping_fee: Number(data.shipping_fee || 0),
            discount_amount: Number(data.discount_amount || 0),
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          orderId = data.id;
          store.orders[orderId] = targetOrder;
        }
      } catch {
        // Fallback to in-memory lookup
      }
    }

    if (!targetOrder) {
      // In-memory fallback lookup by provider_order_id or order_id
      for (const o of Object.values(store.orders)) {
        if (
          o.provider_order_id === providerOrderId ||
          o.provider_order_id === orderId ||
          o.id === orderId
        ) {
          targetOrder = o;
          orderId = o.id;
          break;
        }
      }
    }

    if (!targetOrder) {
      const err = new Error(`Order '${orderId}' not found for payment reconciliation.`) as any;
      err.status = 404;
      throw err;
    }

    const currentPaymentStatus = targetOrder.payment_status || 'pending';

    // Idempotent re-check
    if (currentPaymentStatus === 'paid') {
      if (
        targetOrder.provider_payment_id === cleanPaymentId ||
        targetOrder.payment_id === cleanPaymentId
      ) {
        return targetOrder;
      }
    }

    // Allowed recovery states: pending, failed, expired, completed -> paid
    const allowedPreviousStates = new Set(['pending', 'failed', 'expired', 'completed', 'paid']);
    if (!allowedPreviousStates.has(currentPaymentStatus)) {
      const err = new Error(
        `Cannot reconcile payment: Order payment status '${currentPaymentStatus}' is not eligible for transition to paid.`
      ) as any;
      err.status = 400;
      throw err;
    }

    // Apply narrowly-scoped mutation to target order only
    const nowStr = new Date().toISOString();
    targetOrder.payment_status = 'paid';
    targetOrder.payment_method = 'razorpay';
    targetOrder.payment_id = cleanPaymentId;
    targetOrder.provider_payment_id = cleanPaymentId;
    if (providerOrderId) {
      targetOrder.provider_order_id = providerOrderId;
    }
    targetOrder.updated_at = nowStr;

    if (supabaseClient) {
      try {
        const updateFields: any = {
          payment_status: 'paid',
          payment_method: 'razorpay',
          payment_id: cleanPaymentId,
          provider_payment_id: cleanPaymentId,
          updated_at: nowStr,
        };
        if (providerOrderId) {
          updateFields.provider_order_id = providerOrderId;
        }
        await supabaseClient.from('orders').update(updateFields).eq('id', orderId);
      } catch (e) {
        console.warn('Supabase payment reconciliation note:', e);
      }
    }

    // Idempotent confirmation email dispatch
    this.dispatchPaymentConfirmationEmailIdempotent(targetOrder, source);

    return targetOrder;
  }

  async processWebhook(
    rawBody: string | Buffer,
    signatureHeader?: string
  ): Promise<{ status: string; event_type?: string; details?: any; message?: string }> {
    if (!signatureHeader) {
      const err = new Error('Missing X-Razorpay-Signature header') as any;
      err.status = 400;
      throw err;
    }

    const isValid = verifyWebhookSignature(rawBody, signatureHeader);
    if (!isValid) {
      const err = new Error('Invalid webhook signature') as any;
      err.status = 400;
      throw err;
    }

    let payload: any;
    try {
      const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
      payload = JSON.parse(bodyStr);
    } catch {
      const err = new Error('Invalid JSON webhook payload') as any;
      err.status = 400;
      throw err;
    }

    const eventId = payload.id || payload.event_id;
    const eventType = payload.event || 'unknown';

    // Deduplication check: local in-memory cache + persistent Supabase check
    if (eventId) {
      if (store.webhook_events[eventId]) {
        return {
          status: 'duplicate_ignored',
          event_type: eventType,
          details: { event_id: eventId },
          message: 'Webhook event already processed previously',
        };
      }

      if (supabaseClient) {
        try {
          const { data: existingEv } = await supabaseClient
            .from('webhook_events')
            .select('event_id')
            .eq('event_id', eventId)
            .maybeSingle();

          if (existingEv) {
            store.webhook_events[eventId] = { status: 'processed' };
            return {
              status: 'duplicate_ignored',
              event_type: eventType,
              details: { event_id: eventId },
              message: 'Webhook event already processed previously',
            };
          }
        } catch {
          // Proceed safely
        }
      }
    }

    let resultDetails: any = {};

    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const providerPaymentId = paymentEntity.id;
      const providerOrderId = paymentEntity.order_id;
      const notes = paymentEntity.notes || {};
      let orderId = notes.order_id;

      if (!orderId && providerOrderId) {
        if (supabaseClient) {
          try {
            const { data } = await supabaseClient
              .from('orders')
              .select('id')
              .eq('provider_order_id', providerOrderId)
              .maybeSingle();
            if (data) {
              orderId = data.id;
            }
          } catch {
            // Fallback
          }
        }
        if (!orderId) {
          for (const o of Object.values(store.orders)) {
            if (o.provider_order_id === providerOrderId) {
              orderId = o.id;
              break;
            }
          }
        }
      }

      if (orderId && providerPaymentId) {
        const reconciled = await this.reconcileOrderPayment(
          orderId,
          providerOrderId,
          providerPaymentId,
          'webhook'
        );
        resultDetails = {
          reconciled_order_id: orderId,
          order_number: reconciled.order_number,
          payment_status: reconciled.payment_status,
        };
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const providerOrderId = paymentEntity.order_id;
      const notes = paymentEntity.notes || {};
      let orderId = notes.order_id;

      if (!orderId && providerOrderId) {
        if (supabaseClient) {
          try {
            const { data } = await supabaseClient
              .from('orders')
              .select('id')
              .eq('provider_order_id', providerOrderId)
              .maybeSingle();
            if (data) {
              orderId = data.id;
            }
          } catch {
            // Fallback
          }
        }
        if (!orderId) {
          for (const o of Object.values(store.orders)) {
            if (o.provider_order_id === providerOrderId) {
              orderId = o.id;
              break;
            }
          }
        }
      }

      if (orderId) {
        const order = store.orders[orderId];
        if (order) {
          order.payment_status = 'failed';
          order.updated_at = new Date().toISOString();
        }
        if (supabaseClient) {
          try {
            await supabaseClient
              .from('orders')
              .update({
                payment_status: 'failed',
                updated_at: new Date().toISOString(),
              })
              .eq('id', orderId);
          } catch {
            // Log notice
          }
        }
        resultDetails = { failed_order_id: orderId };
      }
    }

    if (eventId) {
      store.webhook_events[eventId] = {
        event_id: eventId,
        event_type: eventType,
        processed_at: new Date().toISOString(),
        status: 'processed',
        details: resultDetails,
      };
      if (supabaseClient) {
        try {
          await supabaseClient.from('webhook_events').insert({
            event_id: eventId,
            event_type: eventType,
            payload,
            processed_at: new Date().toISOString(),
            status: 'processed',
          });
        } catch (e) {
          console.warn('Supabase webhook audit note:', e);
        }
      }
    }

    return {
      status: 'processed',
      event_type: eventType,
      details: resultDetails,
    };
  }

  async runRecoverySweep(staleThresholdMinutes = 30): Promise<PaymentRecoverySweepResponse> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - staleThresholdMinutes * 60000);
    const maxExpiryCutoff = new Date(now.getTime() - 24 * 3600000);

    let scanned = 0;
    let recoveredPaid = 0;
    let markedFailedOrExpired = 0;
    let unchanged = 0;
    const details: PaymentRecoveryItem[] = [];

    // Serverless persistent sync from Supabase
    if (supabaseClient) {
      try {
        const { data: pendingOrders } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('payment_status', 'pending')
          .lte('created_at', cutoff.toISOString());

        if (pendingOrders && pendingOrders.length > 0) {
          for (const row of pendingOrders) {
            if (!store.orders[row.id]) {
              store.orders[row.id] = {
                id: row.id,
                order_number: row.order_number,
                user_id: row.user_id,
                customer_email: row.shipping_email,
                customer_name: row.shipping_name,
                total_amount: Number(row.total || 0),
                status: row.order_status || 'pending',
                payment_status: row.payment_status || 'pending',
                provider_order_id: row.provider_order_id,
                items: [],
                shipping_address: {},
                shipping_fee: Number(row.shipping_fee || 0),
                discount_amount: Number(row.discount_amount || 0),
                created_at: row.created_at,
                updated_at: row.updated_at,
              };
            }
          }
        }
      } catch (e) {
        console.warn('Supabase recovery sweep query note:', e);
      }
    }

    for (const order of Object.values(store.orders)) {
      if (order.payment_status !== 'pending') {
        continue;
      }

      const createdStr = order.created_at;
      if (!createdStr) continue;

      const createdDt = new Date(createdStr);
      if (createdDt > cutoff) {
        continue; // within active checkout window
      }

      scanned++;
      const orderId = order.id;
      const providerOrderId = order.provider_order_id;

      // Check payment records for captured payment
      let matchingRecord = null;
      for (const p of Object.values(store.payment_records)) {
        if (
          p.order_id === orderId ||
          (providerOrderId && p.gateway_order_id === providerOrderId)
        ) {
          if (p.status === 'paid' || p.status === 'completed') {
            matchingRecord = p;
            break;
          }
        }
      }

      if (matchingRecord && matchingRecord.payment_id) {
        await this.reconcileOrderPayment(
          orderId,
          providerOrderId,
          matchingRecord.payment_id,
          'recovery_sweep'
        );
        recoveredPaid++;
        details.push({
          order_id: orderId,
          order_number: order.order_number,
          previous_payment_status: 'pending',
          new_payment_status: 'paid',
          provider_payment_id: matchingRecord.payment_id,
          reason: 'Recovered captured payment from provider ledger',
        });
      } else if (createdDt < maxExpiryCutoff) {
        order.payment_status = 'expired';
        order.updated_at = now.toISOString();
        if (supabaseClient) {
          try {
            await supabaseClient
              .from('orders')
              .update({
                payment_status: 'expired',
                updated_at: now.toISOString(),
              })
              .eq('id', orderId);
          } catch {
            // Note
          }
        }
        markedFailedOrExpired++;
        details.push({
          order_id: orderId,
          order_number: order.order_number,
          previous_payment_status: 'pending',
          new_payment_status: 'expired',
          provider_payment_id: null,
          reason: 'Exceeded 24-hour pending checkout window without capture',
        });
      } else {
        unchanged++;
      }
    }

    return {
      scanned_count: scanned,
      recovered_paid: recoveredPaid,
      marked_failed_or_expired: markedFailedOrExpired,
      unchanged,
      details,
    };
  }

  private dispatchPaymentConfirmationEmailIdempotent(order: Order, source: string) {
    if (order.payment_confirmation_sent_at) {
      return; // Already sent
    }

    const nowStr = new Date().toISOString();
    order.payment_confirmation_sent_at = nowStr;

    const recipient = order.customer_email || (order.shipping_address?.email as string);
    if (!recipient) return;

    const orderNum = order.order_number || 'ORD-XXXXX';
    const total = order.total_amount;

    if (settings.RESEND_API_KEY) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${settings.PROJECT_NAME} <orders@aaascrochet.com>`,
          to: [recipient],
          subject: `Payment Received: Order ${orderNum} Confirmed!`,
          html: `
            <div style='font-family: serif; color: #3D2E24; padding: 24px; background: #F8F5F0; max-width: 600px; margin: 0 auto; border-radius: 16px;'>
              <h2 style='color: #5A4335;'>Payment Successfully Confirmed!</h2>
              <p>Dear Valued Patron,</p>
              <p>We have successfully received your payment of <strong>₹${total}</strong> for order <strong>${orderNum}</strong> via Razorpay.</p>
              <p>Our master artisans are now preparing your handcrafted piece.</p>
              <p style='font-size: 12px; color: #7B6656;'>Thank you for supporting slow, sustainable handcrafted crochet art</p>
            </div>
          `,
        }),
      }).catch((e) => console.warn('Resend payment confirmation email error:', e));
    } else {
      console.log(
        `[TRANSACTIONAL EMAIL MOCK] Payment confirmation sent to ${recipient} for ${orderNum} (Source: ${source})`
      );
    }
  }
}

export const paymentService = new PaymentService();
