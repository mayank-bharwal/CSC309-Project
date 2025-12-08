import { Outlet, Navigate } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import Loading from '../common/Loading';

const LayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loading size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900">
      <div>
        <AppSidebar />
        {/* Backdrop for mobile */}
        {isMobileOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
        )}
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]'
        } ${isMobileOpen ? 'ml-0' : ''}`}
      >
        <AppHeader />
        <main className="p-4 mx-auto max-w-7xl md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;

