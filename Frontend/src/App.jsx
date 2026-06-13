// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import AdminLayout from './components/Layout/AdminLayout';
import CustomerLayout from './components/Layout/CustomerLayout';
import ProviderLayout from './components/Layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Settings from './pages/Settings';
import Solutions from './pages/Solutions';

// Dashboard Pages
import CustomerDashboard from './pages/Dashboard/CustomerDashboard';
import ProviderDashboard from './pages/Dashboard/ProviderDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';

// User Pages
import Profile from './pages/Profile';
import Bookings from './pages/Bookings';
import Chat from './pages/Chat';
import CreateService from './pages/CreateService';
import MyServices from './pages/MyServices';
import Notifications from './pages/Notifications';
import Reviews from './pages/Review';
import Favorites from './pages/Favorites';
import Wallet from './pages/Wallet';
import BookingHistory from './pages/BookingHistory';
import HelpCenter from './pages/HelpCenter';
import CustomerSettings from './pages/CustomerSettings';

// Payment Pages
import PaymentMethods from './pages/PaymentMethods';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import PaymentPage from './pages/PaymentPage';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import ServiceManagement from './pages/admin/ServiceManagement';
import AdminBookings from './pages/admin/AdminBookings';
import AdminCategories from './pages/admin/AdminCategories';
import Analytics from './pages/admin/Analytics';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReports from './pages/admin/AdminReports';

// Info Pages
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';

// WebSocket Status Component
const WebSocketStatus = () => {
  const { isConnected, onlineUsers } = useSocket();
  
  // Don't show on login/register pages
  const location = useLocation();
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 ${
        isConnected 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white animate-pulse' : 'bg-red-200'}`} />
        <span>{isConnected ? 'Connected' : 'Reconnecting...'}</span>
        {isConnected && onlineUsers.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
            {onlineUsers.length}
          </span>
        )}
      </div>
    </div>
  );
};

// Token initialization helper
const initializeToken = () => {
  let token = localStorage.getItem('token');
  if (token && (token.includes('Bearer ') || token.includes(' '))) {
    const clean = token.replace(/^Bearer\s+/i, '').trim();
    localStorage.setItem('token', clean);
    console.log('🧹 Token cleaned automatically');
  }
};

// Call token initialization
initializeToken();

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  // Determine if navbar/footer should be hidden
  const shouldShowNavbarFooter = React.useMemo(() => {
    // Hide navbar/footer on admin, provider, customer dashboards and auth pages
    const hiddenPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    const dashboardPaths = ['/admin', '/provider', '/customer'];
    
    if (hiddenPaths.includes(pathname)) return false;
    if (dashboardPaths.some(path => pathname.startsWith(path))) return false;
    return true;
  }, [pathname]);

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar - only show on public pages */}
      {shouldShowNavbarFooter && <Navbar />}

      <div className="flex-grow-1">
        <Routes>
          {/* ========== PUBLIC ROUTES ========== */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/solutions" element={<Solutions />} />
          
          {/* ========== PAYMENT ROUTES (Standalone) ========== */}
          <Route path="/payment-success" element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          } />
          <Route path="/payment-cancel" element={
            <ProtectedRoute>
              <PaymentCancel />
            </ProtectedRoute>
          } />
          <Route path="/payment/:bookingId" element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          } />
          <Route path="/payment-methods" element={
            <ProtectedRoute>
              <PaymentMethods />
            </ProtectedRoute>
          } />

          {/* ========== CUSTOMER ROUTES ========== */}
          <Route path="/customer/dashboard" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><CustomerDashboard /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/bookings" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><Bookings /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/bookings/:id" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><Bookings /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/favorites" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><Favorites /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/reviews" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><Reviews /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/wallet" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><Wallet /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/booking-history" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><BookingHistory /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/help" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><HelpCenter /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/profile" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><Profile /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/profile/:section" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><Profile /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/notifications" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><Notifications /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/settings" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><Settings /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/chat" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><Chat /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/chat/:conversationId" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><Chat /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/payment-methods" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><PaymentMethods /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/payment/:bookingId" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><PaymentPage /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/payment-success" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><PaymentSuccess /></CustomerLayout>
            </ProtectedRoute>
          } />
          <Route path="/customer/payment-cancel" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout><PaymentCancel /></CustomerLayout>
            </ProtectedRoute>
          } />

          {/* ========== PROVIDER ROUTES ========== */}
          <Route path="/provider/dashboard" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><ProviderDashboard /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/my-services" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><MyServices /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/create-service" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><CreateService /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/edit-service/:id" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><CreateService /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/bookings" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><Bookings /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/bookings/:id" element={
            <ProtectedRoute allowedRoles={'provider'}>
              <ProviderLayout><Bookings /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/reviews" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><Reviews /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/profile" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><Profile /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/profile/:section" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><Profile /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/wallet" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><Wallet /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/help" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><HelpCenter /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/settings" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><Settings /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/chat" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><Chat /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/chat/:conversationId" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><Chat /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/payment-methods" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><PaymentMethods /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/payment/:bookingId" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><PaymentPage /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/payment-success" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><PaymentSuccess /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/payment-cancel" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><PaymentCancel /></ProviderLayout>
            </ProtectedRoute>
          } />

          {/* ========== ADMIN ROUTES ========== */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><UserManagement /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><UserManagement /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/services" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><ServiceManagement /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/services/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><ServiceManagement /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/bookings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><AdminBookings /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/bookings/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><AdminBookings /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><AdminCategories /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><Analytics /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/payments" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><AdminPayments /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><AdminReports /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout><Settings /></AdminLayout>
            </ProtectedRoute>
          } />
          
          {/* ========== REDIRECTS ========== */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/provider" element={<Navigate to="/provider/dashboard" replace />} />
          <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />

          <Route path="/dashboard" element={
            user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
              user?.role === 'provider' ? <Navigate to="/provider/dashboard" replace /> :
                user?.role === 'customer' ? <Navigate to="/customer/dashboard" replace /> :
                  <Navigate to="/login" replace />
          } />

          {/* ========== ERROR ROUTES ========== */}
          <Route path="/401" element={<Unauthorized />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </div>

      {/* Footer - only show on public pages */}
      {shouldShowNavbarFooter && <Footer />}

      {/* WebSocket Status Indicator */}
      <WebSocketStatus />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
            duration: 3000,
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
            duration: 4000,
          },
          loading: {
            duration: 2000,
          },
        }}
      />
    </div>
  );
}

// ================= MAIN APP =================
function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;