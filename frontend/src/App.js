import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

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

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Dashboard Layout */}
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />

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
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
