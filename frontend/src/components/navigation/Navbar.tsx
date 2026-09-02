import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  Shield,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const location = useLocation();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { user, isAdmin, isAuthenticated, signOut } = useAuth();

  // Scroll detection for transparent to solid ivory transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAccountDropdownOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#F8F5F0]/95 backdrop-blur-md shadow-xs border-b border-[#E7DFD7]/80 py-3.5'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Mobile menu button & Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-[#3D2E24] hover:text-[#C6A15B] transition-colors rounded-lg"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Logo size="md" />
            </div>

            {/* Center: Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive =
                  link.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`text-sm tracking-widest uppercase transition-colors duration-200 font-medium relative py-1 ${
                      isActive
                        ? 'text-[#3D2E24] font-semibold'
                        : 'text-[#7B6656] hover:text-[#3D2E24]'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#C6A15B]"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Actions (Search, Wishlist, Account, Cart) */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search Button */}
              <button
                type="button"
                onClick={onOpenSearch}
                className="p-2 text-[#3D2E24] hover:text-[#C6A15B] transition-colors rounded-full hover:bg-[#EADCCF]/40"
                aria-label="Search products"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist Link */}
              <Link
                to="/wishlist"
                className="p-2 text-[#3D2E24] hover:text-[#C6A15B] transition-colors rounded-full hover:bg-[#EADCCF]/40 relative"
                aria-label="View wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#C6A15B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Account Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="p-2 text-[#3D2E24] hover:text-[#C6A15B] transition-colors rounded-full hover:bg-[#EADCCF]/40 flex items-center gap-1"
                  aria-label="Account menu"
                >
                  <User className="w-5 h-5" />
                  <ChevronDown className="w-3 h-3 text-[#7B6656] hidden sm:inline" />
                </button>

                <AnimatePresence>
                  {isAccountDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-[#E7DFD7] rounded-xl shadow-xl py-2 z-50 text-[#3D2E24]"
                    >
                      {isAuthenticated ? (
                        <>
                          <div className="px-4 py-2 border-b border-[#E7DFD7]">
                            <p className="text-xs text-[#7B6656]">Signed in as</p>
                            <p className="text-sm font-semibold truncate">{user?.full_name}</p>
                            <span className="inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#EADCCF]/70 text-[#5A4335] rounded-full font-medium">
                              {user?.role}
                            </span>
                          </div>

                          {isAdmin && (
                            <Link
                              to="/admin"
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#C6A15B] font-semibold hover:bg-[#F8F5F0] transition-colors"
                              onClick={() => setIsAccountDropdownOpen(false)}
                            >
                              <Shield className="w-4 h-4" /> Admin Dashboard
                            </Link>
                          )}

                          <Link
                            to="/account"
                            className="block px-4 py-2 text-sm text-[#5A4335] hover:bg-[#F8F5F0] hover:text-[#3D2E24] transition-colors"
                            onClick={() => setIsAccountDropdownOpen(false)}
                          >
                            My Account
                          </Link>
                          <Link
                            to="/custom-orders"
                            className="block px-4 py-2 text-sm text-[#5A4335] hover:bg-[#F8F5F0] hover:text-[#3D2E24] transition-colors"
                            onClick={() => setIsAccountDropdownOpen(false)}
                          >
                            Custom Requests
                          </Link>
                          <button
                            onClick={() => {
                              signOut();
                              setIsAccountDropdownOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-[#C96A6A] hover:bg-[#F8F5F0] transition-colors border-t border-[#E7DFD7] mt-1"
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-2 border-b border-[#E7DFD7]">
                            <p className="text-xs text-[#7B6656]">Welcome to AaaS</p>
                            <p className="text-sm font-medium">Handmade with love</p>
                          </div>
                          <Link
                            to="/login"
                            className="block px-4 py-2 text-sm font-semibold text-[#3D2E24] hover:bg-[#F8F5F0] transition-colors"
                            onClick={() => setIsAccountDropdownOpen(false)}
                          >
                            Sign In
                          </Link>
                          <Link
                            to="/register"
                            className="block px-4 py-2 text-sm text-[#7B6656] hover:bg-[#F8F5F0] hover:text-[#3D2E24] transition-colors"
                            onClick={() => setIsAccountDropdownOpen(false)}
                          >
                            Create Account
                          </Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart Navigation Link */}
              <Link
                to="/cart"
                className="p-2 text-[#3D2E24] hover:text-[#C6A15B] transition-colors rounded-full hover:bg-[#EADCCF]/40 relative flex items-center"
                aria-label={`Shopping Cart with ${itemCount} items`}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#5A4335] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-[82%] max-w-sm bg-[#F8F5F0] z-50 p-6 flex flex-col justify-between shadow-2xl lg:hidden overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-[#E7DFD7]">
                  <Logo size="md" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-[#3D2E24] hover:text-[#C6A15B] rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="flex flex-col gap-4 mt-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`text-lg font-serif tracking-wide py-2 px-2 rounded-lg transition-colors ${
                        location.pathname === link.path
                          ? 'bg-[#EADCCF] text-[#3D2E24] font-bold'
                          : 'text-[#5A4335] hover:bg-[#EADCCF]/40'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-lg font-serif text-[#C6A15B] font-bold py-2 px-2 rounded-lg bg-[#C6A15B]/10 flex items-center gap-2 mt-2"
                    >
                      <Shield className="w-5 h-5" /> Admin Dashboard
                    </Link>
                  )}
                </nav>
              </div>

              <div className="pt-6 border-t border-[#E7DFD7] flex flex-col gap-3">

                {isAuthenticated ? (
                  <button
                    onClick={signOut}
                    className="w-full py-2.5 px-4 rounded-xl border border-[#C96A6A]/30 text-[#C96A6A] text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      className="flex-1 py-2.5 text-center bg-[#5A4335] text-white rounded-xl text-sm font-semibold hover:bg-[#3D2E24]"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 py-2.5 text-center border border-[#5A4335] text-[#5A4335] rounded-xl text-sm font-semibold hover:bg-[#EADCCF]/40"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
