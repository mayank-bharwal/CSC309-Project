import { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadcrumb';
import Alert from '../../components/common/Alert';
import api from '../../utils/api';

// Simple Bar Chart Component
const BarChart = ({ data, label, color = 'bg-brand-500' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate" title={item.label}>
            {item.label}
          </div>
          <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-16 text-sm font-medium text-gray-800 dark:text-white text-right">
            {item.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

// Donut Chart Component
const DonutChart = ({ data, size = 120 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const segments = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...item, startAngle, angle, color: colors[index % colors.length] };
  });

  const createArcPath = (startAngle, angle, radius, innerRadius) => {
    const start = startAngle * Math.PI / 180;
    const end = (startAngle + angle) * Math.PI / 180;
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = radius + radius * Math.sin(start);
    const y1 = radius - radius * Math.cos(start);
    const x2 = radius + radius * Math.sin(end);
    const y2 = radius - radius * Math.cos(end);

    const ix1 = radius + innerRadius * Math.sin(start);
    const iy1 = radius - innerRadius * Math.cos(start);
    const ix2 = radius + innerRadius * Math.sin(end);
    const iy2 = radius - innerRadius * Math.cos(end);

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
  };

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((seg, i) => (
          <path
            key={i}
            d={createArcPath(seg.startAngle, seg.angle - 1, size/2, size/3)}
            fill={seg.color}
            className="transition-all duration-300 hover:opacity-80"
          />
        ))}
      </svg>
      <div className="space-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600 dark:text-gray-400">{seg.label}</span>
            <span className="font-medium text-gray-800 dark:text-white">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Line Chart Component
const LineChart = ({ data, height = 150 }) => {
  if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = 0;
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1 || 1)) * 100,
    y: 100 - ((d.value - minValue) / range) * 100
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#lineGradient)" />
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#6366f1" className="hover:r-3 transition-all" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        {data.length > 0 && (
          <>
            <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon, color = 'from-brand-500 to-brand-600', trend }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
        {trend !== undefined && (
          <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={trend >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
            </svg>
            {Math.abs(trend)}% from last period
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.get('/analytics');
        setAnalytics(data);
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error">{error}</Alert>;
  }

  const userRoleData = analytics?.users?.byRole
    ? Object.entries(analytics.users.byRole).map(([label, value]) => ({ label, value }))
    : [];

  const transactionTypeData = analytics?.transactions?.byType
    ? Object.entries(analytics.transactions.byType).map(([label, data]) => ({
        label,
        value: data.count
      }))
    : [];

  const dailyTransactionData = analytics?.transactions?.daily?.map(d => ({
    date: d.date,
    value: d.count
  })) || [];

  const dailyUserData = analytics?.users?.dailyNew?.map(d => ({
    date: d.date,
    value: d.count
  })) || [];

  return (
    <>
      <PageMeta title="Analytics Dashboard" description="View system analytics and statistics" />
      <PageBreadcrumb pageTitle="Analytics Dashboard" />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={analytics?.users?.total || 0}
          subtitle={`${analytics?.users?.newLast30Days || 0} new this month`}
          color="from-blue-500 to-blue-600"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Transactions"
          value={analytics?.transactions?.total || 0}
          subtitle={`${analytics?.transactions?.last30Days || 0} this month`}
          color="from-green-500 to-green-600"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          title="Points Awarded"
          value={analytics?.transactions?.totalPointsAwarded || 0}
          subtitle={`${analytics?.transactions?.totalPointsRedeemed || 0} redeemed`}
          color="from-purple-500 to-purple-600"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Active Events"
          value={analytics?.events?.upcoming || 0}
          subtitle={`${analytics?.events?.total || 0} total events`}
          color="from-orange-500 to-orange-600"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Transactions Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Transactions (Last 30 Days)
          </h3>
          <LineChart data={dailyTransactionData} height={180} />
        </div>

        {/* New Users Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            New Users (Last 30 Days)
          </h3>
          <LineChart data={dailyUserData} height={180} />
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Users by Role */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Users by Role
          </h3>
          {userRoleData.length > 0 ? (
            <DonutChart data={userRoleData} size={140} />
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        {/* Transactions by Type */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Transactions by Type
          </h3>
          {transactionTypeData.length > 0 ? (
            <BarChart data={transactionTypeData} color="bg-gradient-to-r from-brand-500 to-brand-600" />
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Verified Users</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
            {analytics?.users?.verified || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics?.users?.total ? Math.round((analytics.users.verified / analytics.users.total) * 100) : 0}% of total
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Users (7 days)</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
            {analytics?.users?.activeLast7Days || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics?.users?.total ? Math.round((analytics.users.activeLast7Days / analytics.users.total) * 100) : 0}% engagement
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Promotions</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
            {analytics?.promotions?.active || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics?.promotions?.totalRedemptions || 0} total redemptions
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Event Registrations</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
            {analytics?.events?.totalGuests || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics?.events?.totalPointsAwarded || 0} points awarded
          </p>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Top Users by Points
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.users?.topByPoints?.map((user, index) => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <td className="py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="py-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.utorid}</p>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                        user.role === 'superuser' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        user.role === 'manager' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        user.role === 'cashier' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-semibold text-brand-500">{user.points.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Recent Transactions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium text-right">Points</th>
                  <th className="pb-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.transactions?.recent?.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <td className="py-3 text-sm text-gray-800 dark:text-white">{tx.utorid}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                        tx.type === 'purchase' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        tx.type === 'redemption' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        tx.type === 'transfer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        tx.type === 'event' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`text-sm font-medium ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount}
                      </span>
                    </td>
                    <td className="py-3 text-right text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsDashboard;
