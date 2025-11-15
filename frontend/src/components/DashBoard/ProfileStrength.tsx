import { useDashboardContext } from '@/contexts/DashBoardContext';
import { CheckCircle2, Circle, AlertCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Card from '@mui/material/Card';

interface ProfileCompletionItem {
  label: string;
  completed: boolean;
  type: 'boolean' | 'count';
  currentCount?: number;
  requiredCount?: number;
}

export default function ProfileStrength() {
  const {
    profileCompletionStats,
    getProfileCompletionStats,
    error: { profileCompletion: profileCompletionError },
    loading: { profileCompletion: loadingProfileCompletion },
  } = useDashboardContext();

  const { isDark } = useTheme();

  const containerClasses = isDark
    ? 'rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow bg-neutral-900 border-neutral-700 text-neutral-100'
    : 'bg-white rounded-xl border border-emerald-100 p-6 shadow-sm';

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await getProfileCompletionStats();
    } finally {
      setRefreshing(false);
    }
  };

  // Check if profile is 100% complete
  const isProfileComplete =
    profileCompletionStats?.completionPercentage === 100;

  // Calculate completion items based on the API response
  const getCompletionItems = (): ProfileCompletionItem[] => {
    // If profile is 100% complete, all items are completed
    if (isProfileComplete) {
      return [
        {
          label: 'Profile Photo',
          completed: true,
          type: 'boolean',
        },
        {
          label: 'Bio & About',
          completed: true,
          type: 'boolean',
        },
        {
          label: 'Location',
          completed: true,
          type: 'boolean',
        },
        {
          label: 'Branch',
          completed: true,
          type: 'boolean',
        },
        {
          label: 'Graduation Year',
          completed: true,
          type: 'boolean',
        },
        {
          label: 'Department',
          completed: true,
          type: 'boolean',
        },
        {
          label: 'Skills',
          completed: true,
          type: 'count',
          currentCount: 5, // Assuming minimum 5 when complete
          requiredCount: 5,
        },
        {
          label: 'Interests',
          completed: true,
          type: 'count',
          currentCount: 5, // Assuming minimum 5 when complete
          requiredCount: 5,
        },
        {
          label: 'Courses/Certifications',
          completed: true,
          type: 'count',
          currentCount: 5, // Assuming minimum 5 when complete
          requiredCount: 5,
        },
      ];
    }

    // If details are not available, return empty array
    if (!profileCompletionStats?.details) {
      return [];
    }

    const { details } = profileCompletionStats;

    return [
      {
        label: 'Profile Photo',
        completed: details.avatar,
        type: 'boolean',
      },
      {
        label: 'Bio & About',
        completed: details.bio,
        type: 'boolean',
      },
      {
        label: 'Location',
        completed: details.location,
        type: 'boolean',
      },
      {
        label: 'Branch',
        completed: details.branch,
        type: 'boolean',
      },
      {
        label: 'Graduation Year',
        completed: details.year,
        type: 'boolean',
      },
      {
        label: 'Department',
        completed: details.dept,
        type: 'boolean',
      },
      {
        label: 'Skills',
        completed: details.skillsCount >= 5,
        type: 'count',
        currentCount: details.skillsCount,
        requiredCount: 5,
      },
      {
        label: 'Interests',
        completed: details.interestsCount >= 5,
        type: 'count',
        currentCount: details.interestsCount,
        requiredCount: 5,
      },
      {
        label: 'Courses/Certifications',
        completed: details.courseCount >= 5,
        type: 'count',
        currentCount: details.courseCount,
        requiredCount: 5,
      },
    ];
  };

  const getCompletionPercentage = (): number => {
    // If profile is 100% complete, return 100
    if (isProfileComplete) {
      return 100;
    }

    // If no details available, return 0
    if (!profileCompletionStats?.details) {
      return 0;
    }

    const items = getCompletionItems();

    // Calculate contribution per item:
    // - boolean items: 1 if completed, else 0
    // - count items: if completed -> 1, else (currentCount/requiredCount) (clamped 0..1)
    const totalContribution = items.reduce((sum, item) => {
      if (item.type === 'boolean') {
        return sum + (item.completed ? 1 : 0);
      }

      // count type
      if (item.type === 'count') {
        if (item.completed) return sum + 1;
        const cur = item.currentCount ?? 0;
        const req = item.requiredCount ?? 1;
        const ratio = req > 0 ? Math.min(cur / req, 1) : 0;
        return sum + ratio;
      }

      return sum;
    }, 0);

    const raw = (totalContribution / items.length) * 100;
    return Math.round(raw);
  };

  const getCompletedCount = (): number => {
    const items = getCompletionItems();
    return items.filter((item) => item.completed).length;
  };

  const getTotalRequiredCount = (): number => {
    const items = getCompletionItems();
    return items.length;
  };

  const percentage = getCompletionPercentage();
  const completed = getCompletedCount();
  const totalRequired = getTotalRequiredCount();
  const items = getCompletionItems();

  // Loading state
  if (loadingProfileCompletion && !profileCompletionStats) {
    return (
      <Card className={containerClasses}>
        <h3
          className={
            isDark
              ? 'text-lg font-bold text-neutral-100 mb-4'
              : 'text-lg font-bold text-gray-900 mb-4'
          }
        >
          Profile Strength
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-emerald-100 rounded w-20"></div>
              <div className="h-4 bg-emerald-100 rounded w-12"></div>
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-2.5"></div>
          </div>
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-emerald-100 rounded-full"></div>
              <div className="h-4 bg-emerald-100 rounded w-3/4"></div>
            </div>
          ))}
          <div className="h-10 bg-emerald-100 rounded-lg mt-5"></div>
        </div>
      </Card>
    );
  }

  // Error state
  if (profileCompletionError) {
    return (
      <Card className={containerClasses}>
        <div className="flex items-center justify-between mb-4">
          <h3
            className={
              isDark
                ? 'text-lg font-bold text-neutral-100'
                : 'text-lg font-bold text-gray-900'
            }
          >
            Profile Strength
          </h3>
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
        <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-lg border border-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-rose-800">
              Failed to load profile stats
            </p>
            <p className="text-sm text-rose-600">{profileCompletionError}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
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
      </Card>
    );
  }

  // Profile is 100% complete
  if (isProfileComplete) {
    return (
      <Card className={containerClasses}>
        <div className="flex items-center justify-between mb-4">
          <h3
            className={
              isDark
                ? 'text-lg font-bold text-neutral-100'
                : 'text-lg font-bold text-gray-900'
            }
          >
            Profile Strength
          </h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h4
            className={
              isDark
                ? 'font-bold text-emerald-100 text-lg mb-2'
                : 'font-bold text-gray-900 text-lg mb-2'
            }
          >
            Profile Complete!
          </h4>
          <p
            className={
              isDark
                ? 'text-sm text-neutral-300 mb-4'
                : 'text-sm text-gray-600 mb-4'
            }
          >
            Your profile is fully optimized for networking and opportunities
          </p>
          <div className="w-full bg-emerald-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full"
              style={{ width: '100%' }}
            />
          </div>
          <p
            className={
              isDark
                ? 'text-xs text-emerald-200 font-semibold'
                : 'text-xs text-emerald-600 font-semibold'
            }
          >
            {completed}/{totalRequired} • 100% Complete
          </p>
        </div>

        <button
          onClick={() => (window.location.href = '/profile')}
          className="w-full mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
        >
          View Profile
        </button>
      </Card>
    );
  }

  // No data state (should not happen with proper API, but as fallback)
  if (!profileCompletionStats?.details) {
    console.log('profileCompletionStats', profileCompletionStats);
    return (
      <Card className={containerClasses}>
        <div className="flex items-center justify-between mb-4">
          <h3
            className={
              isDark
                ? 'text-lg font-bold text-neutral-100'
                : 'text-lg font-bold text-gray-900'
            }
          >
            Profile Strength
          </h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={
              isDark
                ? 'text-sky-300 hover:text-sky-200 transition-colors disabled:opacity-50 flex items-center gap-1'
                : 'text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1'
            }
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Circle className="w-8 h-8 text-emerald-600" />
          </div>
          <h4
            className={
              isDark
                ? 'font-bold text-neutral-100 text-lg mb-2'
                : 'font-bold text-gray-900 text-lg mb-2'
            }
          >
            Profile Incomplete
          </h4>
          <p
            className={
              isDark
                ? 'text-sm text-neutral-300 mb-4'
                : 'text-sm text-gray-600 mb-4'
            }
          >
            Start building your profile to unlock networking features
          </p>
          <button
            onClick={() => (window.location.href = '/profile')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Building Profile
          </button>
        </div>
      </Card>
    );
  }

  // Profile is incomplete - show progress
  return (
    <Card className={containerClasses}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className={
            isDark
              ? 'text-lg font-bold text-neutral-100'
              : 'text-lg font-bold text-gray-900'
          }
        >
          Profile Strength
        </h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loadingProfileCompletion}
          className={
            isDark
              ? 'text-sky-300 hover:text-sky-200 transition-colors disabled:opacity-50 flex items-center gap-1'
              : 'text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1'
          }
          title="Refresh profile stats"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span
            className={
              isDark
                ? 'text-sm font-medium text-gray-300'
                : 'text-sm font-medium text-gray-700'
            }
          >
            {percentage}% Complete
          </span>
          <span
            className={
              isDark
                ? 'text-xs text-sky-600 font-semibold'
                : 'text-xs text-emerald-600 font-semibold'
            }
          >
            {completed}/{totalRequired}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={
              isDark
                ? 'bg-gradient-to-r from-sky-400 to-sky-500 h-2.5 rounded-full transition-all duration-500'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all duration-500'
            }
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Completion Items */}
      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            {item.completed ? (
              <CheckCircle2
                className={
                  isDark
                    ? 'w-5 h-5 text-sky-100 flex-shrink-0'
                    : 'w-5 h-5 text-emerald-600 flex-shrink-0'
                }
              />
            ) : (
              <Circle
                className={
                  isDark
                    ? 'w-5 h-5 text-neutral-500 flex-shrink-0'
                    : 'w-5 h-5 text-gray-300 flex-shrink-0'
                }
              />
            )}
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm ${item.completed ? (isDark ? 'text-neutral-400 font-medium' : 'text-gray-900 font-medium') : isDark ? 'text-neutral-300' : 'text-gray-500'}`}
              >
                {item.label}
              </span>
              {item.type === 'count' && !item.completed && (
                <p
                  className={
                    isDark
                      ? 'text-xs text-neutral-300 mt-1'
                      : 'text-xs text-gray-400 mt-1'
                  }
                >
                  {item.currentCount}/{item.requiredCount} required
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button
        onClick={() => (window.location.href = '/profile')}
        className={
          isDark
            ? 'w-full px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
            : 'w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
        }
      >
        Complete Profile
        {percentage > 0 && (
          <span
            className={
              isDark
                ? 'text-xs bg-sky-700 px-2 py-1 rounded-full'
                : 'text-xs bg-emerald-700 px-2 py-1 rounded-full'
            }
          >
            {percentage}%
          </span>
        )}
      </button>

      {/* Tip */}
      {percentage < 50 && (
        <p
          className={
            isDark
              ? 'text-xs text-neutral-400 text-center mt-3'
              : 'text-xs text-gray-500 text-center mt-3'
          }
        >
          Complete your profile to get Recommended connection requests
        </p>
      )}
    </Card>
  );
}
