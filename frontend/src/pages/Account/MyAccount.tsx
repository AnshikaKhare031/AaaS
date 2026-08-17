import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, Heart, Sparkles, LogOut, Shield, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

export const MyAccountPage: React.FC = () => {
  const { user, isAdmin, signOut, updateProfile } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ full_name: fullName, phone });
    setIsEditing(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DFD7] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C6A15B] block mb-1">
            Customer Atelier
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D2E24]">
            My Account
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="px-4 py-2 bg-[#C6A15B] text-[#3D2E24] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#b08d47] flex items-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" /> Admin Dashboard
            </Link>
          )}
          <button
            onClick={() => {
              signOut();
              navigate('/');
            }}
            className="px-4 py-2 border border-[#C96A6A]/40 text-[#C96A6A] text-xs font-semibold rounded-xl hover:bg-[#C96A6A]/10 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Navigation Quick Cards */}
        <Link
          to="/wishlist"
          className="p-6 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs hover:border-[#C6A15B] transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#EADCCF]/50 flex items-center justify-center text-[#5A4335] group-hover:bg-[#5A4335] group-hover:text-white transition-colors">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#3D2E24]">My Wishlist</h3>
            <p className="text-xs text-[#7B6656]">{wishlistItems.length} saved favorites</p>
          </div>
        </Link>

        <Link
          to="/custom-orders"
          className="p-6 bg-white rounded-2xl border border-[#E7DFD7] shadow-2xs hover:border-[#C6A15B] transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#EADCCF]/50 flex items-center justify-center text-[#5A4335] group-hover:bg-[#5A4335] group-hover:text-white transition-colors">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#3D2E24]">Custom Orders</h3>
            <p className="text-xs text-[#7B6656]">Request bespoke creations</p>
          </div>
        </Link>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white rounded-3xl border border-[#E7DFD7] p-6 sm:p-10 shadow-sm max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-semibold text-[#3D2E24]">Profile Information</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold uppercase tracking-wider text-[#C6A15B] hover:underline"
            >
              Edit Details
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5A4335] mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A4335] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24] focus:outline-none focus:border-[#C6A15B]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#5A4335] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D2E24]"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 border border-[#E7DFD7] text-xs font-semibold text-[#7B6656] rounded-xl hover:bg-[#F8F5F0]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-[#F8F5F0] rounded-xl">
              <User className="w-4 h-4 text-[#C6A15B]" />
              <div>
                <p className="text-[#7B6656]">Name</p>
                <p className="font-semibold text-[#3D2E24] text-sm">{user?.full_name || 'Valued Patron'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#F8F5F0] rounded-xl">
              <Mail className="w-4 h-4 text-[#C6A15B]" />
              <div>
                <p className="text-[#7B6656]">Email</p>
                <p className="font-semibold text-[#3D2E24] text-sm">{user?.email || 'customer@aaascrochet.com'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#F8F5F0] rounded-xl">
              <Phone className="w-4 h-4 text-[#C6A15B]" />
              <div>
                <p className="text-[#7B6656]">Phone</p>
                <p className="font-semibold text-[#3D2E24] text-sm">{user?.phone || '+91 98765 12345'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
