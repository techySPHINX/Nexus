import { useDashboardContext } from '@/contexts/DashBoardContext';
import {
  Users,
  TrendingUp,
  Target,
  UserPlus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NetworkOverview() {
  const {
    connectionStats,
    loading: { stats: statsLoading },
    error: { stats: statsError },
    getConnectionStats,
  } = useDashboardContext();
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getConnectionStats().then(() => {
      setLastUpdated(new Date());
    });
  }, [getConnectionStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await getConnectionStats();
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  const format = (v: number | undefined) =>
    typeof v === 'number' ? v.toLocaleString() : '0';

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Calculate growth percentage (mock data - you might want to get this from your API)
  const growthPercentage = connectionStats?.recent30Days
    ? Math.round(
        (connectionStats.recent30Days / (connectionStats.total || 1)) * 100
      )
    : 0;

  const statsToShow = [
    {
      label: 'Total Connections',
      value: format(connectionStats?.total),
      icon: Users,
      trend: growthPercentage > 0 ? `+${growthPercentage}% growth` : null,
    },
    {
      label: 'Alumni Connections',
      value: format(connectionStats?.byRole?.alumni),
      icon: Users,
      subtitle: connectionStats?.byRole?.students
        ? `${format(connectionStats.byRole.students)} students`
        : '',
    },
    {
      label: 'Recent Connections',
      value: format(connectionStats?.recent30Days),
      icon: TrendingUp,
      highlight:
        connectionStats?.recent30Days && connectionStats.recent30Days > 0,
    },
    {
      label: 'Pending Requests',
      value: format(connectionStats?.pendingReceived),
      icon: UserPlus,
      alert:
        connectionStats?.pendingReceived && connectionStats.pendingReceived > 0,
    },
  ];

  // Skeleton Loading
  if (statsLoading && !connectionStats) {
    return (
      <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-48 bg-emerald-100 rounded animate-pulse" />
          <div className="h-5 w-20 bg-emerald-100 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg animate-pulse" />
              </div>
              <div className="h-8 bg-emerald-100 rounded animate-pulse mb-2 mx-auto w-16" />
              <div className="h-4 bg-emerald-100 rounded animate-pulse w-20 mx-auto" />
            </div>
          ))}
        </div>

        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 animate-pulse">
          <div className="h-4 bg-emerald-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  // Error State
  if (statsError) {
    return (
      <div className="bg-white rounded-xl border border-rose-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Network Overview</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-rose-600 hover:text-rose-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-lg border border-rose-200 mb-6">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-rose-800">
              Failed to load stats
            </p>
            <p className="text-sm text-rose-600">{statsError}</p>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            {refreshing ? 'Refreshing...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Network Overview</h2>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Updated {formatTimeAgo(lastUpdated)}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || statsLoading}
          className="text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
          title="Refresh stats"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statsToShow.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`text-center p-3 rounded-lg transition-all ${
                stat.highlight
                  ? 'bg-emerald-50 border border-emerald-200'
                  : stat.alert
                    ? 'bg-amber-50 border border-amber-200'
                    : ''
              }`}
            >
              <div className="flex justify-center mb-2">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    stat.alert ? 'bg-amber-100' : 'bg-emerald-100'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      stat.alert ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  />
                </div>
              </div>
              <p
                className={`text-2xl font-bold mb-1 ${
                  stat.alert ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {statsLoading ? (
                  <div className="h-7 bg-emerald-100 rounded animate-pulse w-16 mx-auto" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {stat.label}
              </p>
              <div className="space-y-1">
                {stat.trend && (
                  <p className="text-xs text-emerald-600 font-medium">
                    {stat.trend}
                  </p>
                )}
                {stat.subtitle && (
                  <p className="text-xs text-gray-400">{stat.subtitle}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Insights */}
      {(connectionStats?.total || 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Connection Strength */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Network Strength
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(((connectionStats.total || 0) / 100) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-blue-700 mt-1">
              {connectionStats.total} connections • {growthPercentage}% growth
              this month
            </p>
          </div>

          {/* Quick Action */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">
                Quick Action
              </span>
            </div>
            <p className="text-xs text-emerald-700 mb-2">
              {connectionStats.pendingReceived
                ? `You have ${connectionStats.pendingReceived} pending connection requests`
                : 'Expand your network by connecting with alumni'}
            </p>
            <button
              onClick={() => navigate('/connections')}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded transition-colors"
            >
              {connectionStats.pendingReceived
                ? 'View Requests'
                : 'Find Connections'}
            </button>
          </div>
        </div>
      )}

      {/* Tip Section */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200">
        <p className="text-sm text-emerald-800">
          <span className="font-semibold">Tip:</span>{' '}
          {/* {connectionStats?.total
            ? 'Keep growing your network! Connect with 5 new people this week to unlock new opportunities.'
            :  */}
          {/* ' */}
          Complete your profile to unlock more networking opportunities and get
          recommendations from alumni.
          {/* '} */}
        </p>
      </div>
    </div>
  );
}
