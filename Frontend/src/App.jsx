// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket, socketService } from './context/SocketContext';

// Layouts
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/Layout/AdminLayout';
import CustomerLayout from './components/Layout/CustomerLayout';
import ProviderLayout from './components/Layout/ProviderLayout';

// Public Pages - ✅ Make sure these files exist
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

// Customer Pages - ✅ Make sure these files exist
import CustomerDashboard from './components/customer/CustomerDashboard';
import Bookings from './components/customer/Bookings';
import Notifications from './components/customer/Notifications';
import Reviews from './components/customer/Review';
import Favorites from './components/customer/Favorites';
import Wallet from './components/customer/Wallet';
import BookingHistory from './components/customer/BookingHistory';
import CustomerSettings from './components/customer/CustomerSettings';

// Provider Pages - ✅ Make sure these files exist
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

initializeToken();

// ================= APP CONTENT =================
function AppContent() {
  const { user, loading, token } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  const shouldShowNavbarFooter = React.useMemo(() => {
    const hiddenPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    const dashboardPaths = ['/admin', '/provider', '/customer'];
    
    if (hiddenPaths.includes(pathname)) return false;
    if (dashboardPaths.some(path => pathname.startsWith(path))) return false;
    return true;
  }, [pathname]);

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

          {/* ========== CUSTOMER ROUTES (Nested with Layout) ========== */}
          <Route 
            path="/customer" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/:id" element={<Bookings />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="booking-history" element={<BookingHistory />} />
            <Route path="help" element={<HelpCenter />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:section" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<CustomerSettings />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:conversationId" element={<Chat />} />
            <Route path="payment-methods" element={<PaymentMethods />} />
            <Route path="payment/:bookingId" element={<PaymentPage />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
            <Route path="payment-cancel" element={<PaymentCancel />} />
          </Route>

          {/* ========== PROVIDER ROUTES (Nested with Layout) ========== */}
          <Route 
            path="/provider" 
            element={
              <ProtectedRoute allowedRoles={['provider']}>
                <ProviderLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/provider/dashboard" replace />} />
            <Route path="dashboard" element={<ProviderDashboard />} />
            <Route path="my-services" element={<MyServices />} />
            <Route path="create-service" element={<CreateService />} />
            <Route path="edit-service/:id" element={<CreateService />} />
            <Route path="bookings" element={<ProviderBookings />} />
            <Route path="bookings/:id" element={<ProviderBookings />} />
            <Route path="reviews" element={<ProviderReviews />} />
            <Route path="profile" element={<ProviderProfile />} />
            <Route path="profile/:section" element={<ProviderProfile />} />
            <Route path="wallet" element={<ProviderWallet />} />
            <Route path="help" element={<ProviderHelpCenter />} />
            <Route path="settings" element={<ProviderSettings />} />
            <Route path="chat" element={<ProviderChat />} />
            <Route path="chat/:conversationId" element={<ProviderChat />} />
            <Route path="payment-methods" element={<PaymentMethods />} />
            <Route path="payment/:bookingId" element={<PaymentPage />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
            <Route path="payment-cancel" element={<PaymentCancel />} />
          </Route>

          {/* ========== ADMIN ROUTES (Nested with Layout) ========== */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route 
              path="dashboard" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading admin dashboard...</div>}>
                  <AdminDashboardLazy />
                </React.Suspense>
              } 
            />
            <Route 
              path="users" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading user management...</div>}>
                  <UserManagementLazy />
                </React.Suspense>
              } 
            />
            <Route 
              path="users/:id" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading user details...</div>}>
                  <UserManagementLazy />
                </React.Suspense>
              } 
            />
            <Route 
              path="services" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading service management...</div>}>
                  <ServiceManagementLazy />
                </React.Suspense>
              } 
            />
            <Route 
              path="services/:id" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading service details...</div>}>
                  <ServiceManagementLazy />
                </React.Suspense>
              } 
            />
            <Route 
              path="bookings" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading bookings...</div>}>
                  <AdminBookingsLazy />
                </React.Suspense>
              } 
            />
            <Route 
              path="bookings/:id" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading booking details...</div>}>
                  <AdminBookingsLazy />
                </React.Suspense>
              } 
            />
            <Route 
              path="categories" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading categories...</div>}>
                  <AdminCategoriesLazy />
                </React.Suspense>
              } 
            />
            <Route 
              path="analytics" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading analytics...</div>}>
                  <AnalyticsLazy />
                </React.Suspense>
              } 
            />
            <Route 
              path="payments" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading payment data...</div>}>
                  <AdminPaymentsLazy />
                </React.Suspense>
              } 
            />
            <Route 
              path="reports" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading reports...</div>}>
                  <AdminReportsLazy />
                </React.Suspense>
              } 
            />
            <Route 
              path="settings" 
              element={
                <React.Suspense fallback={<div className="text-center p-5">Loading settings...</div>}>
                  <SettingsLazy />
                </React.Suspense>
              } 
            />
          </Route>
          
          {/* ========== REDIRECTS ========== */}
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

      {shouldShowNavbarFooter && <Footer />}

      <WebSocketStatus />
      <WebSocketInitializer />

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