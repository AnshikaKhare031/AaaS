import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { CustomOrdersPage } from './pages/CustomOrders/CustomOrders';
import { WishlistPage } from './pages/Wishlist/Wishlist';
import { CartPage } from './pages/Cart/Cart';
import { CheckoutPage } from './pages/Checkout/Checkout';
import { MyAccountPage } from './pages/Account/MyAccount';
import { LoginPage } from './pages/Auth/Login';
import { RegisterPage } from './pages/Auth/Register';
import { ForgotPasswordPage } from './pages/Auth/ForgotPassword';
import { LegalPage } from './pages/Legal/LegalPage';
import { NotFoundPage } from './pages/NotFound/NotFound';

// Active Admin Pages
import { AdminDashboardPage } from './pages/Admin/AdminDashboard';
import { AdminProductsListPage } from './pages/Admin/AdminProductsList';
import { AdminProductFormPage } from './pages/Admin/AdminProductForm';
import { AdminOrdersPage } from './pages/Admin/AdminOrders';
import { AdminAnalyticsPage } from './pages/Admin/AdminAnalytics';
import { AdminLoginPage } from './pages/Admin/AdminLogin';

import { AdminRoute, CustomerRoute } from './components/auth/ProtectedRoute';

export function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                {/* Storefront Layout Routes */}
                <Route element={<StoreLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:slug" element={<ProductDetailsPage />} />
                  <Route path="/custom-orders" element={<CustomOrdersPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route
                    path="/account"
                    element={
                      <CustomerRoute>
                        <MyAccountPage />
                      </CustomerRoute>
                    }
                  />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/privacy-policy" element={<LegalPage />} />
                  <Route path="/terms-conditions" element={<LegalPage />} />
                  <Route path="/shipping-returns" element={<LegalPage />} />
                </Route>

                {/* Admin Authentication Route */}
                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* Protected Admin Portal Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsListPage />} />
                  <Route path="products/new" element={<AdminProductFormPage />} />
                  <Route path="products/:id/edit" element={<AdminProductFormPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
