import { store, supabaseClient } from '../database';
import {
  AdminDashboardOverviewResponse,
  AdminSettings,
  AdminSettingsUpdate,
  AdminAnalyticsResponse,
  AnalyticsTimelineItem,
  AnalyticsCategoryItem,
  AnalyticsTopProduct,
  OperationalAlert,
} from '../types';

export class AdminService {
  async getDashboardOverview(): Promise<AdminDashboardOverviewResponse> {
    const allOrders = Object.values(store.orders);
    const totalOrders = allOrders.length;
    const paidOrders = allOrders.filter((o) => o.payment_status === 'paid').length;
    const pendingOrders = allOrders.filter((o) => o.payment_status === 'pending').length;
    const failedPayments = allOrders.filter((o) => o.payment_status === 'failed').length;
    const expiredPayments = allOrders.filter((o) => o.payment_status === 'expired').length;

    const totalRevenue = Math.round(
      allOrders
        .filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0) * 100
    ) / 100;

    const products = Object.values(store.products);
    const totalProducts = products.length;
    const lowStockCount = products.filter(
      (p) => (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 3)
    ).length;

    const sortedOrders = [...allOrders].sort((a, b) =>
      (b.created_at || '').localeCompare(a.created_at || '')
    );
    const recentOrders = sortedOrders.slice(0, 8).map((o) => ({
      ...o,
      items: store.order_items[o.id] || o.items || [],
    }));

    const alerts: OperationalAlert[] = [];
    if (lowStockCount > 0) {
      alerts.push({
        type: 'warning',
        title: `Low Inventory Alert: ${lowStockCount} item${lowStockCount > 1 ? 's' : ''}`,
        description: 'Handcrafted creations running low in stock; consider restocking yarn batches.',
        action_link: '/admin/inventory',
      });
    }
    if (failedPayments > 0) {
      alerts.push({
        type: 'danger',
        title: `Failed Payment Gateways: ${failedPayments} order${failedPayments > 1 ? 's' : ''}`,
        description: 'Transactions failed at payment provider; inspect orders for recovery.',
        action_link: '/admin/orders',
      });
    }
    if (pendingOrders > 0) {
      alerts.push({
        type: 'info',
        title: `Orders Awaiting Action: ${pendingOrders} pending`,
        description: 'Incoming patron orders awaiting payment confirmation or fulfillment dispatch.',
        action_link: '/admin/orders',
      });
    }

    const customOrderCount = Object.keys(store.custom_orders).length;
    const pendingReviewsCount = Object.values(store.reviews).filter((r) => !r.is_approved).length;

    return {
      total_orders: totalOrders,
      paid_orders: paidOrders,
      pending_orders: pendingOrders,
      failed_payments: failedPayments,
      expired_payments: expiredPayments,
      total_revenue: totalRevenue,
      low_stock_count: lowStockCount,
      total_products: totalProducts,
      recent_orders: recentOrders,
      payment_health: {
        paid: paidOrders,
        pending: pendingOrders,
        failed: failedPayments,
        expired: expiredPayments,
      },
      operational_alerts: alerts,
      custom_order_count: customOrderCount,
      pending_reviews_count: pendingReviewsCount,
    };
  }

  async getStoreSettings(): Promise<AdminSettings> {
    if (supabaseClient) {
      try {
        const { data } = await supabaseClient.from('admin_settings').select('*').single();
        if (data) {
          return data as AdminSettings;
        }
      } catch {
        // Fallback
      }
    }
    return store.settings;
  }

  async updateStoreSettings(settingsIn: AdminSettingsUpdate): Promise<AdminSettings> {
    Object.assign(store.settings, settingsIn);
    store.settings.updated_at = new Date().toISOString();

    if (supabaseClient) {
      try {
        await supabaseClient
          .from('admin_settings')
          .update(store.settings)
          .eq('id', store.settings.id);
      } catch (e) {
        console.warn('Supabase settings update error:', e);
      }
    }

    return store.settings;
  }

  async getAnalytics(timeRange = '30d'): Promise<AdminAnalyticsResponse> {
    const now = new Date();
    let days = 30;
    if (timeRange === '7d') days = 7;
    else if (timeRange === '30d') days = 30;
    else if (timeRange === '90d') days = 90;
    else if (timeRange === 'ytd') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      days = Math.max(1, Math.floor((now.getTime() - startOfYear.getTime()) / 86400000));
    }

    const currStart = new Date(now.getTime() - days * 86400000);
    const prevStart = new Date(currStart.getTime() - days * 86400000);

    const allOrders = Object.values(store.orders);
    const currOrders: any[] = [];
    const prevOrders: any[] = [];

    for (const o of allOrders) {
      if (o.status === 'cancelled') continue;
      const createdStr = o.created_at;
      if (!createdStr) continue;

      const createdDt = new Date(createdStr);
      if (createdDt >= currStart && createdDt <= now) {
        currOrders.push(o);
      } else if (createdDt >= prevStart && createdDt < currStart) {
        prevOrders.push(o);
      }
    }

    const currPaidOrders = currOrders.filter((o) => o.payment_status === 'paid');
    const prevPaidOrders = prevOrders.filter((o) => o.payment_status === 'paid');

    const currRev = Math.round(currPaidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) * 100) / 100;
    const prevRev = Math.round(prevPaidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) * 100) / 100;

    const currVol = currOrders.length;
    const prevVol = prevOrders.length;

    const currAov = currPaidOrders.length > 0 ? Math.round((currRev / currPaidOrders.length) * 100) / 100 : 0.0;
    const prevAov = prevPaidOrders.length > 0 ? Math.round((prevRev / prevPaidOrders.length) * 100) / 100 : 0.0;

    const calcPctChange = (curr: number, prev: number): number => {
      if (prev > 0) {
        return Math.round(((curr - prev) / prev) * 1000) / 10;
      }
      return curr > 0 ? 100.0 : 0.0;
    };

    const revChange = calcPctChange(currRev, prevRev);
    const volChange = calcPctChange(currVol, prevVol);
    const aovChange = calcPctChange(currAov, prevAov);

    // 1. Daily timeline
    const timelineDict: Record<string, { revenue: number; orders: number }> = {};
    for (let d = 0; d < days; d++) {
      const dayDate = new Date(currStart.getTime() + d * 86400000).toISOString().slice(0, 10);
      timelineDict[dayDate] = { revenue: 0.0, orders: 0 };
    }

    for (const o of currOrders) {
      const createdStr = o.created_at;
      const dayStr = createdStr ? createdStr.slice(0, 10) : now.toISOString().slice(0, 10);
      if (timelineDict[dayStr]) {
        if (o.payment_status === 'paid') {
          timelineDict[dayStr].revenue += Number(o.total_amount || 0);
        }
        timelineDict[dayStr].orders += 1;
      }
    }

    const timeline: AnalyticsTimelineItem[] = Object.entries(timelineDict)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, val]) => ({
        date,
        revenue: Math.round(val.revenue * 100) / 100,
        orders: val.orders,
      }));

    // 2. Category breakdown
    const categoryRev: Record<string, { revenue: number; count: number }> = {};
    let totalCatRev = 0.0;

    for (const o of currOrders) {
      const items = store.order_items[o.id] || o.items || [];
      for (const item of items) {
        const prod = store.products[item.product_id] || {};
        let catName = prod.category?.name || 'Crochet Flowers & Bouquets';
        const sub = Number(item.subtotal || 0);

        if (!categoryRev[catName]) {
          categoryRev[catName] = { revenue: 0.0, count: 0 };
        }
        categoryRev[catName].revenue += sub;
        categoryRev[catName].count += Number(item.quantity || 1);
        totalCatRev += sub;
      }
    }

    let categoryBreakdown: AnalyticsCategoryItem[] = [];
    if (totalCatRev > 0) {
      for (const [catName, data] of Object.entries(categoryRev)) {
        const pct = Math.round((data.revenue / totalCatRev) * 1000) / 10;
        categoryBreakdown.push({
          category: catName,
          revenue: Math.round(data.revenue * 100) / 100,
          percentage: pct,
          orders_count: data.count,
        });
      }
    } else {
      categoryBreakdown = [
        { category: 'Crochet Flowers & Bouquets', revenue: 0.0, percentage: 45.0, orders_count: 0 },
        { category: 'Handbags & Clutches', revenue: 0.0, percentage: 35.0, orders_count: 0 },
        { category: 'Artisan Accessories', revenue: 0.0, percentage: 20.0, orders_count: 0 },
      ];
    }

    // 3. Top products
    const prodSales: Record<string, { name: string; image?: string | null; units: number; revenue: number }> = {};
    for (const o of currOrders) {
      const items = store.order_items[o.id] || o.items || [];
      for (const item of items) {
        const pId = item.product_id;
        if (!pId) continue;
        if (!prodSales[pId]) {
          prodSales[pId] = {
            name: item.product_name || 'Handmade Creation',
            image: item.product_image,
            units: 0,
            revenue: 0.0,
          };
        }
        prodSales[pId].units += Number(item.quantity || 1);
        prodSales[pId].revenue += Number(item.subtotal || 0);
      }
    }

    const topProducts: AnalyticsTopProduct[] = Object.entries(prodSales)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([id, data]) => ({
        id,
        name: data.name,
        image: data.image,
        units_sold: data.units,
        revenue: Math.round(data.revenue * 100) / 100,
      }));

    if (topProducts.length === 0) {
      for (const p of Object.values(store.products).slice(0, 4)) {
        topProducts.push({
          id: p.id,
          name: p.name,
          image: p.images?.[0]?.image_url || null,
          units_sold: 0,
          revenue: 0.0,
        });
      }
    }

    return {
      time_range: timeRange,
      total_revenue: currRev,
      order_volume: currVol,
      aov: currAov,
      revenue_change_pct: revChange,
      order_volume_change_pct: volChange,
      aov_change_pct: aovChange,
      timeline,
      category_breakdown: categoryBreakdown,
      top_products: topProducts,
      payment_health: {
        paid: currOrders.filter((o) => o.payment_status === 'paid').length,
        pending: currOrders.filter((o) => o.payment_status === 'pending').length,
        failed: currOrders.filter((o) => o.payment_status === 'failed').length,
        expired: currOrders.filter((o) => o.payment_status === 'expired').length,
      },
    };
  }
}

export const adminService = new AdminService();
