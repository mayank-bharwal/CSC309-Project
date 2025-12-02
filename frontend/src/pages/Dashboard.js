import { useAuth } from '../context/AuthContext';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadcrumb';
import ComponentCard from '../components/common/ComponentCard';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, isManager } = useAuth();

  const managerStats = [
    {
      title: 'Users',
      path: '/manager/users',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      description: 'Manage all users',
    },
    {
      title: 'Transactions',
      path: '/manager/transactions',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'from-green-500 to-green-600',
      description: 'View all transactions',
    },
    {
      title: 'Promotions',
      path: '/manager/promotions',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
      description: 'Manage promotions',
    },
    {
      title: 'Events',
      path: '/manager/events',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-orange-500 to-orange-600',
      description: 'Manage events',
    },
  ];

  return (
    <>
      <PageMeta title="Dashboard" description="Welcome to the loyalty program dashboard" />
      <PageBreadcrumb pageTitle="Dashboard" />

      {/* Welcome Card */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="mt-1 opacity-90">
          You are logged in as a <span className="font-semibold capitalize">{user?.role}</span>
        </p>
        {user?.points !== undefined && (
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <span className="text-sm">Your Points:</span>
            <span className="text-2xl font-bold">{user.points}</span>
          </div>
        )}
      </div>

      {/* Manager Quick Actions */}
      {isManager() && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Manager Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {managerStats.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}
                />
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} text-white mb-4`}
                >
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {item.description}
                </p>
                <div className="mt-4 flex items-center text-brand-500 text-sm font-medium group-hover:gap-2 transition-all">
                  View all
                  <svg
                    className="w-4 h-4 ml-1 group-hover:ml-2 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* User Info Card */}
      <ComponentCard title="Account Information" desc="Your profile details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">UTORid</p>
            <p className="text-gray-800 dark:text-white font-medium">{user?.utorid}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
            <p className="text-gray-800 dark:text-white font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
            <p className="text-gray-800 dark:text-white font-medium capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Verified</p>
            <p className={`font-medium ${user?.verified ? 'text-green-600' : 'text-yellow-600'}`}>
              {user?.verified ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </ComponentCard>
    </>
  );
};

export default Dashboard;

