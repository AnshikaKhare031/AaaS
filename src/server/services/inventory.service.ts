import { store, supabaseClient, isProduction } from '../database';
import { Product } from '../types';

export class InventoryService {
  async adjustStock(productId: string, delta: number, reason?: string): Promise<Product> {
    if (supabaseClient) {
      const { data: currentProd, error: fetchErr } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchErr || !currentProd) {
        if (isProduction) {
          const err = new Error(`Product '${productId}' not found.`) as any;
          err.status = 404;
          throw err;
        }
      } else {
        const current = currentProd.stock_quantity ?? 0;
        if (delta < 0 && current < Math.abs(delta)) {
          const err = new Error(
            `Insufficient stock for '${currentProd.name}'. Available: ${current}, Requested: ${Math.abs(delta)}.`
          ) as any;
          err.status = 400;
          throw err;
        }

        const newStock = Math.max(0, current + delta);
        let updateQuery = supabaseClient
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', productId);

        // Atomic concurrency check: ensure stock has not been reduced concurrently
        if (delta < 0) {
          updateQuery = updateQuery.gte('stock_quantity', Math.abs(delta));
        }

        const { data: updated, error: updErr } = await updateQuery.select().single();

        if (updErr || !updated) {
          if (delta < 0) {
            const err = new Error(
              `Concurrent stock conflict or insufficient stock for product '${currentProd.name}'.`
            ) as any;
            err.status = 400;
            throw err;
          }
          if (isProduction) {
            const err = new Error(updErr?.message || 'Failed to update product stock.') as any;
            err.status = 400;
            throw err;
          }
        } else {
          // Keep local store in sync if present
          if (store.products[productId]) {
            store.products[productId].stock_quantity = newStock;
            store.products[productId].inventory_count = newStock;
          }
          return updated as Product;
        }
      }
    } else if (isProduction) {
      throw new Error('Supabase database client required for inventory operations in production.');
    }

    const prod = store.products[productId];
    if (!prod) {
      const err = new Error('Product not found') as any;
      err.status = 404;
      throw err;
    }

    const current = prod.stock_quantity ?? 0;
    if (delta < 0 && current < Math.abs(delta)) {
      const err = new Error(
        `Insufficient stock for '${prod.name || 'Product'}'. Available: ${current}, Requested: ${Math.abs(delta)}.`
      ) as any;
      err.status = 400;
      throw err;
    }

    const newStock = Math.max(0, current + delta);
    prod.stock_quantity = newStock;
    prod.inventory_count = newStock;
    return prod;
  }
}

export const inventoryService = new InventoryService();
