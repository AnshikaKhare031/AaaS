import crypto from 'crypto';
import { store, supabaseClient, isProduction } from '../database';
import { inventoryService } from './inventory.service';
import { settings } from '../config';
import {
  Order,
  OrderItem,
  OrderCreate,
  OrderStatusUpdatePayload,
  Product,
} from '../types';

export class OrderService {
  private async fetchProduct(productId: string): Promise<Product | null> {
    if (supabaseClient) {
      try {
        const { data } = await supabaseClient
          .from('products')
          .select('*, product_images(*)')
          .eq('id', productId)
          .single();
        if (data) {
          return data as Product;
        }
      } catch {
        // Fallback
      }
    }
    return store.products[productId] || null;
  }

  async createOrder(userId: string, orderIn: OrderCreate): Promise<Order> {
    if (!orderIn.items || orderIn.items.length === 0) {
      const err = new Error('Order must contain at least one item.') as any;
      err.status = 400;
      throw err;
    }

    const orderId = crypto.randomUUID();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `ORD-${datePart}-${randPart}`;
    const nowStr = new Date().toISOString();

    const validatedItems: OrderItem[] = [];

    // 1. Stock check & authoritative price calculation
    for (const item of orderIn.items) {
      const prod = await this.fetchProduct(item.product_id);
      if (!prod) {
        const err = new Error(`Product with id '${item.product_id}' not found.`) as any;
        err.status = 404;
        throw err;
      }

      const availableStock = prod.stock_quantity ?? 0;
      if (availableStock < item.quantity) {
        const err = new Error(
          `Insufficient stock for '${prod.name || 'Product'}'. Available: ${availableStock}, Requested: ${item.quantity}.`
        ) as any;
        err.status = 400;
        throw err;
      }

      const salePrice = prod.sale_price;
      const basePrice = prod.price ?? 0;
      const unitPrice =
        salePrice !== null && salePrice !== undefined && salePrice < basePrice
          ? Number(salePrice)
          : Number(basePrice);
      const subtotal = Math.round(unitPrice * item.quantity * 100) / 100;

      let imageUrl: string | null = null;
      if (prod.images && Array.isArray(prod.images) && prod.images.length > 0) {
        const first = prod.images[0];
        imageUrl = typeof first === 'string' ? first : first.image_url;
      } else if (prod.image_url) {
        imageUrl = prod.image_url;
      } else if (prod.image) {
        imageUrl = prod.image;
      }

      const orderItem: OrderItem = {
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: item.product_id,
        product_name: prod.name || 'Artisan Handmade Piece',
        product_image: imageUrl,
        unit_price: unitPrice,
        price: unitPrice,
        quantity: item.quantity,
        subtotal,
        total: subtotal,
      };
      validatedItems.push(orderItem);
    }

    // 2. Server-side computation of totals
    const subtotal = Math.round(validatedItems.reduce((sum, i) => sum + i.subtotal, 0) * 100) / 100;
    const settingsData = store.settings;
    const freeThresh = settingsData.free_shipping_threshold ?? 1499.0;
    const fixedShip = settingsData.fixed_shipping_fee ?? 99.0;
    const freeEnabled = settingsData.enable_free_shipping ?? true;

    const computedShippingFee = freeEnabled && subtotal >= freeThresh ? 0.0 : fixedShip;
    const discount = Math.max(0, Number(orderIn.discount_amount || 0));
    const totalAmount = Math.round(Math.max(0, subtotal - discount + computedShippingFee) * 100) / 100;

    // 3. Reserve / deduct stock for each item via inventoryService
    for (const item of validatedItems) {
      await inventoryService.adjustStock(
        item.product_id,
        -item.quantity,
        `Order ${orderNumber} reservation`
      );
    }

    // 4. Construct Order Record
    const orderRecord: Order = {
      id: orderId,
      order_number: orderNumber,
      user_id: userId,
      customer_name: typeof orderIn.shipping_address === 'object' ? orderIn.shipping_address?.fullName || null : null,
      customer_email: typeof orderIn.shipping_address === 'object' ? orderIn.shipping_address?.email || null : null,
      customer_phone: typeof orderIn.shipping_address === 'object' ? orderIn.shipping_address?.phone || null : null,
      items: validatedItems,
      shipping_address: orderIn.shipping_address,
      subtotal,
      total_amount: totalAmount,
      discount_amount: discount,
      shipping_fee: computedShippingFee,
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'razorpay',
      created_at: nowStr,
      updated_at: nowStr,
    };

    // 5. Persist to Supabase if connected
    if (supabaseClient) {
      try {
        const dbOrder = {
          id: orderId,
          order_number: orderNumber,
          user_id: userId,
          subtotal,
          shipping_fee: computedShippingFee,
          total: totalAmount,
          currency: 'INR',
          order_status: 'pending',
          payment_status: 'pending',
          shipping_name: typeof orderIn.shipping_address === 'object' ? orderIn.shipping_address?.fullName || '' : '',
          shipping_email: typeof orderIn.shipping_address === 'object' ? orderIn.shipping_address?.email || '' : '',
          shipping_phone: typeof orderIn.shipping_address === 'object' ? orderIn.shipping_address?.phone || '' : '',
          shipping_address: typeof orderIn.shipping_address === 'object' ? orderIn.shipping_address?.address || '' : String(orderIn.shipping_address),
          shipping_city: typeof orderIn.shipping_address === 'object' ? orderIn.shipping_address?.city || '' : '',
          shipping_state: typeof orderIn.shipping_address === 'object' ? orderIn.shipping_address?.state || '' : '',
          shipping_pincode: typeof orderIn.shipping_address === 'object' ? orderIn.shipping_address?.pincode || '' : '',
          created_at: nowStr,
          updated_at: nowStr,
        };
        await supabaseClient.from('orders').insert(dbOrder);

        for (const item of validatedItems) {
          await supabaseClient.from('order_items').insert({
            id: item.id,
            order_id: orderId,
            product_id: item.product_id,
            product_name: item.product_name,
            product_image: item.product_image,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
          });
        }
      } catch (err: any) {
        console.warn('Supabase order persistence error:', err);
        if (isProduction) {
          throw new Error(`Failed to persist order to database: ${err.message || err}`);
        }
      }
    } else if (isProduction) {
      throw new Error('Supabase database client required for order creation in production.');
    }

    store.orders[orderId] = orderRecord;
    store.order_items[orderId] = validatedItems;

    return orderRecord;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    if (supabaseClient) {
      try {
        const { data } = await supabaseClient
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (data) {
          return data.map((row: any) => ({
            id: row.id,
            order_number: row.order_number,
            user_id: row.user_id,
            customer_name: row.shipping_name,
            customer_email: row.shipping_email,
            customer_phone: row.shipping_phone,
            items: row.order_items || [],
            shipping_address: {
              fullName: row.shipping_name,
              email: row.shipping_email,
              phone: row.shipping_phone,
              address: row.shipping_address,
              city: row.shipping_city,
              state: row.shipping_state,
              pincode: row.shipping_pincode,
            },
            subtotal: Number(row.subtotal || 0),
            discount_amount: 0,
            shipping_fee: Number(row.shipping_fee || 0),
            total_amount: Number(row.total || 0),
            status: row.order_status || row.status || 'pending',
            payment_status: row.payment_status || 'pending',
            payment_method: row.payment_method || 'razorpay',
            payment_id: row.payment_id,
            provider_order_id: row.provider_order_id,
            provider_payment_id: row.provider_payment_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase get_user_orders error:', err);
      }
    }

    const userOrders = Object.values(store.orders)
      .filter((o) => o.user_id === userId)
      .map((o) => ({
        ...o,
        items: store.order_items[o.id] || o.items || [],
      }));

    userOrders.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return userOrders;
  }

  async getOrderById(orderId: string, userId: string, isAdmin = false): Promise<Order> {
    let order: Order | null = null;

    if (supabaseClient) {
      try {
        const { data } = await supabaseClient
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single();

        if (data) {
          order = {
            id: data.id,
            order_number: data.order_number,
            user_id: data.user_id,
            customer_name: data.shipping_name,
            customer_email: data.shipping_email,
            customer_phone: data.shipping_phone,
            items: data.order_items || [],
            shipping_address: {
              fullName: data.shipping_name,
              email: data.shipping_email,
              phone: data.shipping_phone,
              address: data.shipping_address,
              city: data.shipping_city,
              state: data.shipping_state,
              pincode: data.shipping_pincode,
            },
            subtotal: Number(data.subtotal || 0),
            discount_amount: 0,
            shipping_fee: Number(data.shipping_fee || 0),
            total_amount: Number(data.total || 0),
            status: data.order_status || data.status || 'pending',
            payment_status: data.payment_status || 'pending',
            payment_method: data.payment_method || 'razorpay',
            payment_id: data.payment_id,
            provider_order_id: data.provider_order_id,
            provider_payment_id: data.provider_payment_id,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch {
        // Fallback
      }
    }

    if (!order) {
      const stored = store.orders[orderId];
      if (stored) {
        order = {
          ...stored,
          items: store.order_items[orderId] || stored.items || [],
        };
      }
    }

    if (!order) {
      const err = new Error('Order not found') as any;
      err.status = 404;
      throw err;
    }

    // STRICT OWNERSHIP CHECK: Non-admins cannot view other users' orders (404 to prevent IDOR enumeration)
    if (!isAdmin && order.user_id !== userId) {
      const err = new Error('Order not found') as any;
      err.status = 404;
      throw err;
    }

    return order;
  }

  async getAllOrders(adminUserId: string): Promise<Order[]> {
    if (supabaseClient) {
      try {
        const { data } = await supabaseClient
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false });

        if (data) {
          return data.map((row: any) => ({
            id: row.id,
            order_number: row.order_number,
            user_id: row.user_id,
            customer_name: row.shipping_name,
            customer_email: row.shipping_email,
            customer_phone: row.shipping_phone,
            items: row.order_items || [],
            shipping_address: {
              fullName: row.shipping_name,
              email: row.shipping_email,
              phone: row.shipping_phone,
              address: row.shipping_address,
              city: row.shipping_city,
              state: row.shipping_state,
              pincode: row.shipping_pincode,
            },
            subtotal: Number(row.subtotal || 0),
            discount_amount: 0,
            shipping_fee: Number(row.shipping_fee || 0),
            total_amount: Number(row.total || 0),
            status: row.order_status || row.status || 'pending',
            payment_status: row.payment_status || 'pending',
            payment_method: row.payment_method || 'razorpay',
            payment_id: row.payment_id,
            provider_order_id: row.provider_order_id,
            provider_payment_id: row.provider_payment_id,
            carrier_name: row.carrier_name,
            tracking_number: row.tracking_number,
            notes: row.notes,
            created_at: row.created_at,
            updated_at: row.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase get_all_orders error:', err);
      }
    }

    const allOrders = Object.values(store.orders).map((o) => ({
      ...o,
      items: store.order_items[o.id] || o.items || [],
    }));

    allOrders.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return allOrders;
  }

  async updateOrderStatus(
    orderId: string,
    statusIn: OrderStatusUpdatePayload,
    adminUserId: string
  ): Promise<Order> {
    const order = await this.getOrderById(orderId, adminUserId, true);
    const currentStatus = order.status;
    const newStatus = statusIn.status;

    // Enforce state transitions
    if (newStatus !== currentStatus) {
      const validTransitions: Record<string, string[]> = {
        pending: ['confirmed', 'processing', 'cancelled'],
        confirmed: ['processing', 'shipped', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered', 'cancelled'],
        delivered: [],
        cancelled: [],
      };

      const allowed = validTransitions[currentStatus] || [];
      if (!allowed.includes(newStatus)) {
        const err = new Error(
          `Invalid order transition: Cannot transition order from '${currentStatus}' to '${newStatus}' directly.`
        ) as any;
        err.status = 400;
        throw err;
      }
    }

    // Carrier and Tracking code required when shipping
    if (newStatus === 'shipped') {
      const carrier = (statusIn.carrier_name || order.carrier_name || '').trim();
      const tracking = (statusIn.tracking_number || order.tracking_number || '').trim();
      if (!carrier || !tracking) {
        const err = new Error(
          'Carrier name and tracking number are required when marking an order as shipped.'
        ) as any;
        err.status = 400;
        throw err;
      }
      order.carrier_name = carrier;
      order.tracking_number = tracking;

      // Dispatch shipping email notification
      this.dispatchShippingNotification(order, carrier, tracking);
    }

    // If cancelled, restore reserved stock back to inventory
    if (newStatus === 'cancelled' && currentStatus !== 'cancelled') {
      for (const item of order.items || []) {
        if (item.product_id && item.quantity > 0) {
          await inventoryService.adjustStock(
            item.product_id,
            item.quantity,
            `Order ${order.order_number} cancellation restock`
          );
        }
      }
    }

    const nowStr = new Date().toISOString();
    order.status = newStatus;
    if (statusIn.notes !== undefined) {
      order.notes = statusIn.notes;
    }
    order.updated_at = nowStr;

    if (supabaseClient) {
      try {
        const updateFields: any = {
          order_status: newStatus,
          updated_at: nowStr,
        };
        if (order.carrier_name) updateFields.carrier_name = order.carrier_name;
        if (order.tracking_number) updateFields.tracking_number = order.tracking_number;
        if (order.notes) updateFields.notes = order.notes;

        await supabaseClient.from('orders').update(updateFields).eq('id', orderId);
      } catch (err) {
        console.warn('Supabase order status update error:', err);
      }
    }

    store.orders[orderId] = order;
    return order;
  }

  private dispatchShippingNotification(order: Order, carrierName: string, trackingNumber: string) {
    const recipient = order.customer_email || (order.shipping_address?.email as string);
    if (!recipient) return;

    const orderNum = order.order_number || 'ORD-XXXXX';
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
          subject: `Your Handcrafted Order ${orderNum} Has Shipped! ??`,
          html: `
            <div style='font-family: serif; color: #3D2E24; padding: 24px; background: #F8F5F0; max-width: 600px; margin: 0 auto; border-radius: 16px;'>
              <h2 style='color: #5A4335;'>Your Creation Has Been Dispatched! ??</h2>
              <p>Dear Valued Patron,</p>
              <p>We are delighted to share that your artisan crochet order <strong>${orderNum}</strong> has been packaged with care and is on its way.</p>
              <div style='background: #FFFFFF; border: 1px solid #E7DFD7; border-radius: 12px; padding: 18px; margin: 20px 0;'>
                <p style='margin: 4px 0;'><strong>Carrier:</strong> ${carrierName}</p>
                <p style='margin: 4px 0;'><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p style='margin: 4px 0;'><strong>Total Amount:</strong> ?${order.total_amount}</p>
              </div>
              <p style='font-size: 12px; color: #7B6656;'>Thank you for cherishing handmade artistry ?</p>
            </div>
          `,
        }),
      }).catch((e) => console.warn('Resend shipping notification error:', e));
    } else {
      console.log(`[TRANSACTIONAL EMAIL MOCK] Shipped notification sent to ${recipient} for ${orderNum} via ${carrierName} (#${trackingNumber})`);
    }
  }
}

export const orderService = new OrderService();
