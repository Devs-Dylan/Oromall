import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import { PageTransitionLoader } from '@/components/layout/PageTransitionLoader'
import { useSubscriptionNotifications } from '@/hooks/useSubscriptionNotifications'

// Code-Splitting : Chargement à la demande (Lazy Loading) avec affichage fluide
const MarketplacePage = lazy(() => import('@/pages/shop/MarketplacePage'))
const ProductDetailPage = lazy(() => import('@/pages/product/ProductDetailPage'))
const ShopDetailPage = lazy(() => import('@/pages/shop/ShopDetailPage'))
const HousingCatalogPage = lazy(() => import('@/pages/housing/HousingCatalogPage'))
const HousingDetailPage = lazy(() => import('@/pages/housing/HousingDetailPage'))
const InteractiveMapPage = lazy(() => import('@/pages/map/InteractiveMapPage'))
const CartPage = lazy(() => import('@/pages/cart/CartPage'))
const OrdersPage = lazy(() => import('@/pages/orders/OrdersPage'))
const WishlistPage = lazy(() => import('@/pages/wishlist/WishlistPage'))
const P2PPage = lazy(() => import('@/pages/p2p/P2PPage'))
const ReferralPage = lazy(() => import('@/pages/referral/ReferralPage'))
const FaqPage = lazy(() => import('@/pages/faq/FaqPage'))
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'))

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const AdminLoginPage = lazy(() => import('@/pages/auth/AdminLoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const RoleSelectPage = lazy(() => import('@/pages/auth/RoleSelectPage'))

const SellerDashboard = lazy(() => import('@/pages/seller/SellerDashboard'))
const SellerOnboardingPage = lazy(() => import('@/pages/seller/SellerOnboardingPage'))

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AssociateDashboardPage = lazy(() => import('@/pages/associate/AssociateDashboardPage'))
const ProjectExplorer = lazy(() => import('@/pages/project/ProjectExplorer'))
const CustomerAvailabilityPage = lazy(() => import('@/pages/customer/CustomerAvailabilityPage'))
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'))

export default function App() {
  useSubscriptionNotifications()

  return (
    <Suspense fallback={<PageTransitionLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Public discovery routes */}
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/shop/:id" element={<ShopDetailPage />} />
          
          {/* Housing & Map routes */}
          <Route path="/housing" element={<HousingCatalogPage />} />
          <Route path="/housing/:id" element={<HousingDetailPage />} />
          <Route path="/map" element={<InteractiveMapPage />} />

          {/* Protected customer routes (Requiert connexion) */}
          <Route path="/cart" element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          } />
          <Route path="/wishlist" element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          } />
          <Route path="/p2p" element={
            <ProtectedRoute>
              <P2PPage />
            </ProtectedRoute>
          } />
          <Route path="/referral" element={
            <ProtectedRoute>
              <ReferralPage />
            </ProtectedRoute>
          } />

          {/* Informational routes */}
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/role" element={<RoleSelectPage />} />

          {/* Protected user account routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
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

          {/* Associate routes */}
          <Route path="/associate" element={
            <ProtectedRoute requireAssociate>
              <AssociateDashboardPage />
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
    </Suspense>
  )
}
