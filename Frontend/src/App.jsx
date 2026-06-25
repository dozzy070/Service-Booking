// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket, socketService } from './context/SocketContext';

// Layouts (Sidebars are integrated inside these layouts)
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/Layout/AdminLayout';
import CustomerLayout from './components/Layout/CustomerLayout';
import ProviderLayout from './components/Layout/ProviderLayout';

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
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import HelpCenter from './pages/HelpCenter';

// Customer Pages/Components
import CustomerDashboard from './components/customer/CustomerDashboard';
import Bookings from './components/customer/Bookings';
import Notifications from './components/customer/Notifications';
import Reviews from './components/customer/Review';
import Favorites from './components/customer/Favorites';
import Wallet from './components/customer/Wallet';
import BookingHistory from './components/customer/BookingHistory';
import CustomerSettings from './components/customer/CustomerSettings';

// Provider Pages/Components
import ProviderDashboard from './components/provider/ProviderDashboard';
import CreateService from './components/provider/CreateService';
import MyServices from './components/provider/MyServices';
import ProviderBookings from './components/provider/ProviderBookings';
import ProviderReviews from './components/provider/ProviderReviews';
import ProviderProfile from './components/provider/ProviderProfile';
import ProviderWallet from './components/provider/ProviderWallet';
import ProviderHelpCenter from './components/provider/ProviderHelpCenter';
import ProviderSettings from './components/provider/ProviderSettings';
import ProviderChat from './components/provider/ProviderChat';

// Admin Pages (Lazy-loaded)
const AdminDashboardLazy = React.lazy(() => import('./components/admin/AdminDashboard'));
const UserManagementLazy = React.lazy(() => import('./components/admin/UserManagement'));
const ServiceManagementLazy = React.lazy(() => import('./components/admin/ServiceManagement'));
const AdminBookingsLazy = React.lazy(() => import('./components/admin/AdminBookings'));
const AdminCategoriesLazy = React.lazy(() => import('./components/admin/AdminCategories'));
const AnalyticsLazy = React.lazy(() => import('./components/admin/Analytics'));
const AdminPaymentsLazy = React.lazy(() => import('./components/admin/AdminPayments'));
const AdminReportsLazy = React.lazy(() => import('./components/admin/AdminReports'));
const SettingsLazy = React.lazy(() => import('./components/admin/AdminSettings'));
const AdminActivityLazy = React.lazy(() => import('./components/admin/AdminActivity'));

// Payment Pages
import PaymentMethods from './pages/PaymentMethods';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import PaymentPage from './pages/PaymentPage';

// Info Pages
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

// ================= COMPONENTS =================

// WebSocket Initialization Component
const WebSocketInitializer = () => {
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      console.log('🔌 Initializing WebSocket connection from App');
      socketService.connect(token, user.id);
    }
    
    // Cleanup on unmount or when user logs out
    return () => {
      if (!token || !user) {
        console.log('🔌 Cleaning up WebSocket connection');
        socketService.disconnect();
      }
    };
  }, [token, user]);

  return null;
};

// WebSocket Status Component
const WebSocketStatus = () => {
  const { isConnected, onlineUsers, getConnectionStatus } = useSocket();
  
  // Don't show on login/register pages
  const location = useLocation();
  const hiddenPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }
  
  const status = getConnectionStatus?.();
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 transition-all duration-300 ${
          isConnected 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
        title={status ? `Socket ID: ${status.socketId || 'N/A'}` : 'Connection status'}
      >
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white animate-pulse' : 'bg-red-200'}`} />
        <span>{isConnected ? 'Connected' : status?.reconnectAttempts ? `Reconnecting (${status.reconnectAttempts}/10)` : 'Connecting...'}</span>
        {isConnected && onlineUsers && onlineUsers.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
            {onlineUsers.length} online
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

// ================= APP CONTENT =================
function AppContent() {
  const { user, loading, token } = useAuth();
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
              <CustomerLayout><CustomerSettings /></CustomerLayout>
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
              <ProviderLayout><ProviderBookings /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/bookings/:id" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><ProviderBookings /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/reviews" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><ProviderReviews /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/profile" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><ProviderProfile /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/profile/:section" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><ProviderProfile /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/wallet" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><ProviderWallet /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/help" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><ProviderHelpCenter /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/settings" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><ProviderSettings /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/chat" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><ProviderChat /></ProviderLayout>
            </ProtectedRoute>
          } />
          <Route path="/provider/chat/:conversationId" element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderLayout><ProviderChat /></ProviderLayout>
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
              <React.Suspense fallback={<div className="text-center p-5">Loading admin dashboard...</div>}>
                <AdminLayout><AdminDashboardLazy /></AdminLayout>
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <React.Suspense fallback={<div className="text-center p-5">Loading user management...</div>}>
                <AdminLayout><UserManagementLazy /></AdminLayout>
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <React.Suspense fallback={<div className="text-center p-5">Loading user details...</div>}>
                <AdminLayout><UserManagementLazy /></AdminLayout>
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/services" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <React.Suspense fallback={<div className="text-center p-5">Loading service management...</div>}>
                <AdminLayout><ServiceManagementLazy /></AdminLayout>
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/services/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <React.Suspense fallback={<div className="text-center p-5">Loading service details...</div>}>
                <AdminLayout><ServiceManagementLazy /></AdminLayout>
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/bookings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <React.Suspense fallback={<div className="text-center p-5">Loading bookings...</div>}>
                <AdminLayout><AdminBookingsLazy /></AdminLayout>
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/bookings/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <React.Suspense fallback={<div className="text-center p-5">Loading booking details...</div>}>
                <AdminLayout><AdminBookingsLazy /></AdminLayout>
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <React.Suspense fallback={<div className="text-center p-5">Loading categories...</div>}>
                <AdminLayout><AdminCategoriesLazy /></AdminLayout>
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <React.Suspense fallback={<div className="text-center p-5">Loading analytics...</div>}>
                <AdminLayout><AnalyticsLazy /></AdminLayout>
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/payments" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <React.Suspense fallback={<div className="text-center p-5">Loading payment data...</div>}>
                <AdminLayout><AdminPaymentsLazy /></AdminLayout>
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <React.Suspense fallback={<div className="text-center p-5">Loading reports...</div>}>
                <AdminLayout><AdminReportsLazy /></AdminLayout>
              </React.Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <React.Suspense fallback={<div className="text-center p-5">Loading settings...</div>}>
                <AdminLayout><SettingsLazy /></AdminLayout>
              </React.Suspense>
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

      {/* WebSocket Initializer */}
      <WebSocketInitializer />

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