import React, { useEffect, useState } from "react";
import { Settings, Save, Loader2, Store, Truck, Bell, ShieldCheck } from "lucide-react";
import { AdminSettings } from "../../types";
import { getAdminSettings, updateAdminSettings } from "../../services/api";
import { useToast } from "../../components/admin/Toast";

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>({
    id: "default",
    store_name: "AaaS - Handmade Crochet",
    store_email: "hello@aaascrochet.com",
    store_phone: "+91 98765 43210",
    fixed_shipping_fee: 99,
    free_shipping_threshold: 1499,
    enable_free_shipping: true,
    low_stock_threshold: 3,
    currency: "INR",
    currency_symbol: "₹",
    instagram_url: "https://instagram.com/aaas_crochet",
    is_store_open: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    getAdminSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateAdminSettings(settings);
      setSettings(updated);
      showToast("Store settings saved successfully!", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to update store settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-4xl">
      {/* Page Header */}
      <div className="border-b border-slate-100 pb-6">
        <h1 className="font-serif text-3xl font-semibold tracking-wide text-slate-900">
          Settings
        </h1>
        <p className="text-sm font-sans text-slate-500 font-light mt-1">
          Configure store credentials, shipping charges, free shipping thresholds, and inventory alerts.
        </p>
      </div>

      {isLoading ? (
        <div className="p-16 flex flex-col justify-center items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm">Loading settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card 1: Store Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Store size={18} className="text-accent" />
              <h2 className="font-serif text-lg font-semibold text-slate-800">Store Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="store-name" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                  Store Name
                </label>
                <input
                  id="store-name"
                  type="text"
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent text-sm text-slate-800 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="store-email" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                  Support Email
                </label>
                <input
                  id="store-email"
                  type="email"
                  value={settings.store_email}
                  onChange={(e) => setSettings({ ...settings, store_email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent text-sm text-slate-800 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="store-phone" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                  Phone / WhatsApp
                </label>
                <input
                  id="store-phone"
                  type="text"
                  value={settings.store_phone}
                  onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent text-sm text-slate-800 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="instagram-url" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                  Instagram Link
                </label>
                <input
                  id="instagram-url"
                  type="url"
                  value={settings.instagram_url}
                  onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent text-sm text-slate-800 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Shipping Policy */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Truck size={18} className="text-accent" />
              <h2 className="font-serif text-lg font-semibold text-slate-800">Shipping & Delivery Rates</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="fixed-shipping" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                  Fixed Shipping Fee (₹)
                </label>
                <input
                  id="fixed-shipping"
                  type="number"
                  min="0"
                  value={settings.fixed_shipping_fee}
                  onChange={(e) =>
                    setSettings({ ...settings, fixed_shipping_fee: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent text-sm text-slate-800 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="free-shipping-threshold" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                  Free Shipping Minimum Cart Value (₹)
                </label>
                <input
                  id="free-shipping-threshold"
                  type="number"
                  min="0"
                  value={settings.free_shipping_threshold}
                  onChange={(e) =>
                    setSettings({ ...settings, free_shipping_threshold: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent text-sm text-slate-800 transition-colors"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={settings.enable_free_shipping}
                onChange={(e) => setSettings({ ...settings, enable_free_shipping: e.target.checked })}
                className="w-4.5 h-4.5 rounded text-accent focus:ring-accent accent-accent"
              />
              <span className="text-xs font-semibold text-slate-700">
                Enable Free Shipping Promotion when cart threshold is reached
              </span>
            </label>
          </div>

          {/* Card 3: Inventory Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Bell size={18} className="text-accent" />
              <h2 className="font-serif text-lg font-semibold text-slate-800">Inventory & Operations</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="low-stock" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                  Low Stock Alert Threshold (Units)
                </label>
                <input
                  id="low-stock"
                  type="number"
                  min="1"
                  value={settings.low_stock_threshold}
                  onChange={(e) =>
                    setSettings({ ...settings, low_stock_threshold: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent text-sm text-slate-800 transition-colors"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.is_store_open}
                    onChange={(e) => setSettings({ ...settings, is_store_open: e.target.checked })}
                    className="w-4.5 h-4.5 rounded text-accent focus:ring-accent accent-accent"
                  />
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-slate-800 block">Store Open for Orders</span>
                    <span className="text-xs text-slate-400 font-light block">
                      When unchecked, customers cannot place new orders.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3.5 bg-accent hover:bg-accent/90 text-white text-xs font-semibold tracking-wider uppercase rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-75 cursor-pointer font-sans"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AdminSettingsPage;
