import React from 'react';
import { BrowserRouter as Router, Routes, Route, ScrollRestoration } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import { StoreLayout } from './layouts/StoreLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Storefront Pages
import { HomePage } from './pages/Home/Home';
import { ShopPage } from './pages/Shop/Shop';
import { ProductDetailsPage } from './pages/Product/ProductDetails';
import { CategoriesPage } from './pages/Categories/Categories';
import { AboutPage } from './pages/About/About';
import { CustomOrdersPage } from './pages/CustomOrders/CustomOrders';
import { ContactPage } from './pages/Contact/Contact';
import { WishlistPage } from './pages/Wishlist/Wishlist';
import { CartPage } from './pages/Cart/Cart';
import { CheckoutPage } from './pages/Checkout/Checkout';
import { OrderSuccessPage } from './pages/OrderSuccess/OrderSuccess';
import { MyAccountPage } from './pages/Account/MyAccount';
import { MyOrdersPage } from './pages/Orders/MyOrders';
import { OrderDetailPage } from './pages/Orders/OrderDetail';
import { LoginPage } from './pages/Auth/Login';
import { RegisterPage } from './pages/Auth/Register';
import { ForgotPasswordPage } from './pages/Auth/ForgotPassword';
import { LegalPage } from './pages/Legal/LegalPage';
import { NotFoundPage } from './pages/NotFound/NotFound';

// Admin Pages
import { AdminDashboardPage } from './pages/Admin/AdminDashboard';
import { AdminInventoryPage } from './pages/Admin/AdminInventory';
import { AdminProductsPage } from './pages/Admin/AdminProducts';
import { AdminCategoriesPage } from './pages/Admin/AdminCategories';
import { AdminOrdersPage } from './pages/Admin/AdminOrders';
import { AdminCustomOrdersPage } from './pages/Admin/AdminCustomOrders';
import { AdminReviewsPage } from './pages/Admin/AdminReviews';
import { AdminSettingsPage } from './pages/Admin/AdminSettings';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <Routes>
                {/* Storefront Layout Routes */}
                <Route element={<StoreLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:slug" element={<ProductDetailsPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/custom-orders" element={<CustomOrdersPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/account" element={<MyAccountPage />} />
                  <Route path="/account/orders" element={<MyOrdersPage />} />
                  <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/privacy-policy" element={<LegalPage />} />
                  <Route path="/terms-conditions" element={<LegalPage />} />
                  <Route path="/shipping-returns" element={<LegalPage />} />
                </Route>

                {/* Distraction-Free Checkout and Order Confirmation */}
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />

                {/* Protected Admin Portal Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="inventory" element={<AdminInventoryPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="custom-orders" element={<AdminCustomOrdersPage />} />
                  <Route path="reviews" element={<AdminReviewsPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
