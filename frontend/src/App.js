import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Chat Widget
import ChatWidget from './components/chat/ChatWidget';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';

// Dashboard
import Dashboard from './pages/Dashboard';

// Manager Pages
import UsersListPage from './pages/manager/UsersListPage';
import UserEditPage from './pages/manager/UserEditPage';
import TransactionsListPage from './pages/manager/TransactionsListPage';
import TransactionDetailPage from './pages/manager/TransactionDetailPage';
import PromotionsListPage from './pages/manager/PromotionsListPage';
import PromotionCreatePage from './pages/manager/PromotionCreatePage';
import PromotionEditPage from './pages/manager/PromotionEditPage';
import EventsListPage from './pages/manager/EventsListPage';
import EventCreatePage from './pages/manager/EventCreatePage';
import EventEditPage from './pages/manager/EventEditPage';


// Regular Pages
import PointsPage from './pages/Regular/PointsPage';
import QRCodePage from './pages/Regular/QRCodePage';
import TransferPoints from './pages/Regular/TransferPoints';
import RedemptionReq from './pages/Regular/RedemptionReq';
import ListPromotionsPage from './pages/Regular/ListPromotionsPage';
import ListEventsPage from "./pages/Regular/ListEventsPage";
import EventDetailPage from "./pages/Regular/EventsDetailPage";
import ListTransactionsPage from './pages/Regular/PastTransactionPage';
import UnprocessedRedemptionPage from './pages/Regular/UnprocessedQRPage';

// Cashier Pages
import CreateTransactionPage from './pages/cashier/CreateTransactionPage';
import ProcessRedemptionPage from './pages/cashier/ProcessRedemptionPage';
import RegisterUserPage from './pages/cashier/RegisterUserPage';

// Protected Route for Manager
const ManagerRoute = ({ children }) => {
  const { user, loading, isManager } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isManager()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Protected Route for Cashier
const CashierRoute = ({ children }) => {
  const { user, loading, isCashier } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isCashier()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />

            {/* Dashboard Layout */}
            <Route element={<AppLayout />}>
              {/* Dashboard accessible to all authenticated users */}
              <Route index element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* Manager Routes */}
              <Route
                path="/manager/users"
                element={
                  <ManagerRoute>
                    <UsersListPage />
                  </ManagerRoute>
                }
              />
              <Route
                path="/manager/users/:userId"
                element={
                  <ManagerRoute>
                    <UserEditPage />
                  </ManagerRoute>
                }
              />
              <Route
                path="/manager/transactions"
                element={
                  <ManagerRoute>
                    <TransactionsListPage />
                  </ManagerRoute>
                }
              />
              <Route
                path="/manager/transactions/:transactionId"
                element={
                  <ManagerRoute>
                    <TransactionDetailPage />
                  </ManagerRoute>
                }
              />
              <Route
                path="/manager/promotions"
                element={
                  <ManagerRoute>
                    <PromotionsListPage />
                  </ManagerRoute>
                }
              />
              <Route
                path="/manager/promotions/create"
                element={
                  <ManagerRoute>
                    <PromotionCreatePage />
                  </ManagerRoute>
                }
              />
              <Route
                path="/manager/promotions/:promotionId"
                element={
                  <ManagerRoute>
                    <PromotionEditPage />
                  </ManagerRoute>
                }
              />
              <Route
                path="/manager/events"
                element={
                  <ManagerRoute>
                    <EventsListPage />
                  </ManagerRoute>
                }
              />
              <Route
                path="/manager/events/create"
                element={
                  <ManagerRoute>
                    <EventCreatePage />
                  </ManagerRoute>
                }
              />
              <Route
                path="/manager/events/:eventId"
                element={
                  <ManagerRoute>
                    <EventEditPage />
                  </ManagerRoute>
                }
              />

            {/* ---- Cashier pages ---- */}
              <Route
                path="/cashier/create-transaction"
                element={
                  <CashierRoute>
                    <CreateTransactionPage />
                  </CashierRoute>
                }
              />
              <Route
                path="/cashier/process-redemption"
                element={
                  <CashierRoute>
                    <ProcessRedemptionPage />
                  </CashierRoute>
                }
              />
              <Route
                path="/cashier/register-user"
                element={
                  <CashierRoute>
                    <RegisterUserPage />
                  </CashierRoute>
                }
              />

            {/* ---- Regular authenticated user pages ---- */}
              <Route path="/regular/points" element={
                <ProtectedRoute><PointsPage /></ProtectedRoute>
              } />

              <Route path="/regular/qr" element={
                <ProtectedRoute><QRCodePage /></ProtectedRoute>
              } />

              <Route path="/regular/transfer" element={
                <ProtectedRoute><TransferPoints /></ProtectedRoute>
              } />

              <Route path="/regular/redemption" element={
                <ProtectedRoute><RedemptionReq /></ProtectedRoute>
              } />

              <Route path="/regular/promotions" element={
                <ProtectedRoute><ListPromotionsPage /></ProtectedRoute>
              } />

              <Route path="/regular/events" element={
                <ProtectedRoute><ListEventsPage /></ProtectedRoute>
              } />

              <Route path="/regular/events/:eventId" element={
                <ProtectedRoute><EventDetailPage /></ProtectedRoute>
              } />

              <Route path="/regular/transactions" element={
                <ProtectedRoute><ListTransactionsPage /></ProtectedRoute>
              } />

              <Route path="/regular/unprocessed-redemption" element={
                <ProtectedRoute><UnprocessedRedemptionPage /></ProtectedRoute>
              } />
            </Route>



            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Chat widget - available on all authenticated pages */}
          <ChatWidget />
          </Router>
        </AuthProvider>
      </ThemeProvider>
      <Analytics />
    </HelmetProvider>
  );
}

export default App;
