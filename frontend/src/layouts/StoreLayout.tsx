import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { CartDrawer } from '../components/cart/CartDrawer';
import { SearchModal } from '../components/search/SearchModal';

export const StoreLayout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5F0] text-[#5A4335] font-sans selection:bg-[#EADCCF] selection:text-[#3D2E24]">
      {/* Top Navbar */}
      <Navbar onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Main Content Body */}
      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      {/* Global Shopping Drawer & Search Modal */}
      <CartDrawer />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Footer */}
      <Footer />
    </div>
  );
};
