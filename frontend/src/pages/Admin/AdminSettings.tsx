import React, { useEffect, useState } from 'react';
import { Settings, Save, Store, Truck, Bell, ShieldCheck } from 'lucide-react';
import { AdminSettings } from '../../types';
import { getAdminSettings, updateAdminSettings } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    id: 'default',
    store_name: 'AaaS - Handmade Crochet',
    store_email: 'hello@aaascrochet.com',
    store_phone: '+91 98765 43210',
    fixed_shipping_fee: 99,
    free_shipping_threshold: 1499,
    enable_free_shipping: true,
    low_stock_threshold: 3,
    currency: 'INR',
    currency_symbol: '₹',
    instagram_url: 'https://instagram.com/aaas_crochet',
    is_store_open: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

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
      success('Store settings saved successfully ♡');
    } catch (err) {
      error('Failed to update store settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#C6A15B]" />
          <h1 className="font-serif text-3xl font-bold text-[#3D2E24]">Store Settings</h1>
        </div>
        <p className="text-xs text-[#7B6656] mt-1">
          Configure fixed shipping charges, free shipping thresholds, low stock alerts, and store contacts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Store Information */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7DFD7] shadow-xs space-y-4">
          <h3 className="font-serif text-xl font-bold text-[#3D2E24] flex items-center gap-2">
            <Store className="w-4 h-4 text-[#C6A15B]" /> Brand Profile & Contacts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#5A4335] mb-1">Store Name</label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4335] mb-1">Support Email</label>
              <input
                type="email"
                value={settings.store_email}
                onChange={(e) => setSettings({ ...settings, store_email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4335] mb-1">Support Phone</label>
              <input
                type="tel"
                value={settings.store_phone}
                onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4335] mb-1">Instagram URL</label>
              <input
                type="url"
                value={settings.instagram_url}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Shipping Rules */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7DFD7] shadow-xs space-y-4">
          <h3 className="font-serif text-xl font-bold text-[#3D2E24] flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#C6A15B]" /> Shipping & Threshold Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#5A4335] mb-1">
                Fixed Shipping Charge (₹)
              </label>
              <input
                type="number"
                min="0"
                value={settings.fixed_shipping_fee}
                onChange={(e) =>
                  setSettings({ ...settings, fixed_shipping_fee: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
              />
              <p className="text-[10px] text-[#7B6656] mt-1">Applied to standard orders.</p>
            </div>

            <div>
              <label className="block font-semibold text-[#5A4335] mb-1">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                value={settings.free_shipping_threshold}
                onChange={(e) =>
                  setSettings({ ...settings, free_shipping_threshold: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
              />
              <p className="text-[10px] text-[#7B6656] mt-1">Orders above this receive 100% free delivery.</p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#5A4335] cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={settings.enable_free_shipping}
              onChange={(e) =>
                setSettings({ ...settings, enable_free_shipping: e.target.checked })
              }
              className="rounded text-[#5A4335]"
            />
            <span>Enable Free Shipping Threshold</span>
          </label>
        </div>

        {/* Section 3: Inventory Alerts & Store Status */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7DFD7] shadow-xs space-y-4">
          <h3 className="font-serif text-xl font-bold text-[#3D2E24] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#C6A15B]" /> Inventory & Store Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#5A4335] mb-1">
                Default Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                value={settings.low_stock_threshold}
                onChange={(e) =>
                  setSettings({ ...settings, low_stock_threshold: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4335] mb-1">Currency Code</label>
              <input
                type="text"
                disabled
                value="INR (₹)"
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#7B6656] font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#5A4335] cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={settings.is_store_open}
              onChange={(e) => setSettings({ ...settings, is_store_open: e.target.checked })}
              className="rounded text-[#5A4335]"
            />
            <span>Online Store Open for Purchases</span>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
