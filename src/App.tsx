import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'

import MarketplacePage from '@/pages/shop/MarketplacePage'
import ProductDetailPage from '@/pages/product/ProductDetailPage'
import ShopDetailPage from '@/pages/shop/ShopDetailPage'
import HousingCatalogPage from '@/pages/housing/HousingCatalogPage'
import HousingDetailPage from '@/pages/housing/HousingDetailPage'
import InteractiveMapPage from '@/pages/map/InteractiveMapPage'
import CartPage from '@/pages/cart/CartPage'
import OrdersPage from '@/pages/orders/OrdersPage'
import WishlistPage from '@/pages/wishlist/WishlistPage'
import P2PPage from '@/pages/p2p/P2PPage'
import ReferralPage from '@/pages/referral/ReferralPage'
import FaqPage from '@/pages/faq/FaqPage'

import LoginPage from '@/pages/auth/LoginPage'
import AdminLoginPage from '@/pages/auth/AdminLoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import RoleSelectPage from '@/pages/auth/RoleSelectPage'

import SellerDashboard from '@/pages/seller/SellerDashboard'
import SellerOnboardingPage from '@/pages/seller/SellerOnboardingPage'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import ProjectExplorer from '@/pages/project/ProjectExplorer'

import CustomerAvailabilityPage from '@/pages/customer/CustomerAvailabilityPage'
import { useSubscriptionNotifications } from '@/hooks/useSubscriptionNotifications'

export default function App() {
  useSubscriptionNotifications()

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route path="/" element={<MarketplacePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/shop/:id" element={<ShopDetailPage />} />
        
        {/* Housing & Map routes */}
        <Route path="/housing" element={<HousingCatalogPage />} />
        <Route path="/housing/:id" element={<HousingDetailPage />} />
        <Route path="/map" element={<InteractiveMapPage />} />

        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/p2p" element={<P2PPage />} />
        <Route path="/referral" element={<ReferralPage />} />
        <Route path="/faq" element={<FaqPage />} />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/role" element={<RoleSelectPage />} />

        {/* Protected routes */}
        <Route path="/orders" element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/my-availability" element={
          <ProtectedRoute>
            <CustomerAvailabilityPage />
          </ProtectedRoute>
        } />

        {/* Seller routes */}
        <Route path="/seller" element={
          <ProtectedRoute requireSeller>
            <SellerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/seller/onboarding" element={
          <ProtectedRoute>
            <SellerOnboardingPage />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/project" element={
          <ProtectedRoute requireAdmin>
            <ProjectExplorer />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
