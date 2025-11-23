import { useDashboardContext } from '@/contexts/DashBoardContext';
import { Role } from '@/types/engagement';
import { ProfileNameLink } from '@/utils/ProfileNameLink';
import {
  ArrowRight,
  Users,
  Calendar,
  Heart,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import Card from '@mui/material/Card';
import { useAuth } from '@/contexts/AuthContext';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import { IconButton } from '@mui/material';
import { useNotification } from '@/contexts/NotificationContext';
import { Share } from '@mui/icons-material';

export default function RecommendedProjects() {
  const {
    projects = [],
    error: { projects: projectError } = {
      projects: null,
    },
    loading: { projects: projectLoading } = {
      projects: false,
    },
    getSuggestedProjects,
  } = useDashboardContext();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { isDark } = useTheme();

  const containerClasses = isDark
    ? 'rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow bg-neutral-900 border-neutral-700 text-emerald-100'
    : 'bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-shadow';

  // Run projects fetch once when user session mounts to avoid repeated calls
  const projectsInitRef = useRef(false);
  useEffect(() => {
    if (projectsInitRef.current) return;
    projectsInitRef.current = true;
    if (projects.length === 0) {
      getSuggestedProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format date to be more readable (accepts string or Date)
  const formatDate = (dateInput: string | Date): string => {
    const date =
      typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (!date || isNaN(date.getTime())) return 'Unknown date';

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await getSuggestedProjects();
    } finally {
      setRefreshing(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'IDEA':
        return 'bg-purple-100 text-purple-700';
      case 'PLANNING':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'IDEA':
        return 'Idea';
      case 'PLANNING':
        return 'Planning';
      default:
        return status;
    }
  };

  // Project card classes and variants for dark mode
  const projectCardClass = isDark
    ? 'group flex gap-4 p-4 rounded-lg border border-neutral-700 hover:border-sky-500 hover:bg-neutral-800 transition-all cursor-pointer'
    : 'group flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer';

  const titleClass = isDark
    ? 'font-semibold text-neutral-100 hover:text-sky-300 transition-colors line-clamp-1'
    : 'font-semibold text-gray-900 hover:text-emerald-600 transition-colors line-clamp-1';

  const tagClass = isDark
    ? 'text-xs px-2 py-1 bg-neutral-800 text-neutral-200 rounded-full'
    : 'text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full';

  const statContainerClass = isDark
    ? 'flex items-center justify-between gap-4 text-xs text-neutral-300'
    : 'flex items-center justify-between gap-4 text-xs text-gray-500';

  const getStatusColorClass = (status: string) => {
    if (!isDark) return getStatusColor(status);
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-900 text-green-300';
      case 'IN_PROGRESS':
        return 'bg-blue-900 text-blue-300';
      case 'IDEA':
        return 'bg-purple-900 text-purple-300';
      case 'PLANNING':
        return 'bg-yellow-900 text-yellow-300';
      default:
        return 'bg-neutral-800 text-neutral-300';
    }
  };

  if (projectLoading) {
    return (
      <Card className={containerClasses}>
        <div className="flex items-center justify-between mb-6">
          <h2
            className={
              isDark
                ? 'text-xl font-bold text-emerald-100'
                : 'text-xl font-bold text-gray-900'
            }
          >
            Recommended Projects
          </h2>
          <div className="w-20 h-4 bg-emerald-100 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="flex gap-4 p-4 rounded-lg border border-gray-200 animate-pulse"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="h-4 bg-emerald-100 rounded w-3/4" />
                  <div className="h-6 bg-emerald-100 rounded w-16" />
                </div>
                <div className="h-3 bg-emerald-100 rounded w-full" />
                <div className="h-3 bg-emerald-100 rounded w-2/3" />
                <div className="flex gap-4">
                  <div className="h-3 bg-emerald-100 rounded w-16" />
                  <div className="h-3 bg-emerald-100 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (projectError) {
    return (
      <Card className={containerClasses}>
        <div className="flex items-center justify-between mb-6">
          <h2
            className={
              isDark
                ? 'text-xl font-bold text-emerald-100'
                : 'text-xl font-bold text-gray-900'
            }
          >
            Recommended Projects
          </h2>
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
              Failed to load projects
            </p>
            <p className="text-sm text-rose-600">{projectError}</p>
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

  if (!projects || projects.length === 0) {
    return (
      <Card className={containerClasses}>
        <div className="flex items-center justify-between mb-6">
          <h2
            className={
              isDark
                ? 'text-xl font-bold text-emerald-100'
                : 'text-xl font-bold text-gray-900'
            }
          >
            Recommended Projects
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || projectLoading}
          className="text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
          title="Refresh stats"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
          />
        </button>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8 text-emerald-600" />
          </div>
          <h3
            className={
              isDark
                ? 'font-semibold text-emerald-100 mb-2'
                : 'font-semibold text-gray-900 mb-2'
            }
          >
            No projects yet
          </h3>
          <p
            className={
              isDark
                ? 'text-sm text-neutral-300 mb-4'
                : 'text-sm text-gray-600 mb-4'
            }
          >
            Discover amazing projects from our alumni community
          </p>
          <button
            onClick={() => getSuggestedProjects()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Find Projects
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={containerClasses}>
      <div className="flex items-center justify-between mb-6">
        <h2
          className={
            isDark
              ? 'text-xl font-bold text-neutral-100'
              : 'text-xl font-bold text-gray-900'
          }
        >
          Recommended Projects
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing || projectLoading}
            className={`${isDark ? 'text-sky-300 hover:text-sky-200' : 'text-emerald-600 hover:text-emerald-700'} transition-colors disabled:opacity-50 flex items-center gap-1`}
            title="Refresh stats"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => {
              navigate('/projects');
            }}
            className={`${isDark ? 'text-sky-300 hover:text-sky-200' : 'text-emerald-600 hover:text-emerald-700'} font-medium text-sm flex items-center gap-1 transition-colors`}
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className={projectCardClass}>
            <div className="w-20 h-20 flex-shrink-0">
              <img
                loading="lazy"
                decoding="async"
                src={
                  project.imageUrl ||
                  'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=400'
                }
                alt={project.title}
                className="w-20 h-20 rounded-lg object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=400';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3>
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className={`${titleClass} bg-transparent p-0 m-0 text-left w-full`}
                  >
                    {project.title}
                  </button>
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColorClass(project.status)}`}
                  >
                    {getStatusText(project.status)}
                  </span>
                  {project.seekingCollaboration && (
                    <span
                      className={
                        isDark
                          ? 'text-xs font-medium px-2 py-1 bg-neutral-800 text-emerald-200 rounded-full'
                          : 'text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full'
                      }
                    >
                      🤝 Seeking Collaboration
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {project.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className={tagClass}>
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className={tagClass}>
                      +{project.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Owner Info */}
              <ProfileNameLink
                user={{
                  id: project.owner?.id || '',
                  name: project.owner?.name || 'Unknown User',
                  role: (project.owner?.role as Role) || undefined,
                  profile: {
                    avatarUrl: project.owner?.profile?.avatarUrl || undefined,
                  },
                }}
                showAvatar={true}
                avatarSize={20}
                fontSize="0.75rem"
                badgeSize={2}
                fontWeight={500}
                linkToProfile={true}
              />

              {/* Stats */}
              <div className={`${statContainerClass} mt-3`}>
                <div className={statContainerClass}>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const isSupported = project.supporters?.some(
                        (s) => s.userId === user?.id
                      );
                      return (
                        <Heart
                          className={`w-4 h-4 ${isSupported ? 'fill-red-600 text-red-600' : isDark ? 'text-neutral-400 hover:text-emerald-300' : 'text-gray-400 hover:text-emerald-600'}`}
                        />
                      );
                    })()}
                    <span>{project._count?.supporters || 0} supporters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const isFollowing = project.followers?.some(
                        (f) => f.userId === user?.id
                      );
                      return (
                        <Users
                          className={`w-3.5 h-3.5 ${isFollowing ? 'color-emerald-600 fill-emerald-600' : 'text-gray-400'}`}
                        />
                      );
                    })()}
                    <span>{project._count?.followers || 0} followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <Tooltip title="Share">
                    <IconButton
                      className="w-3.5 h-3.5"
                      onClick={() => {
                        return navigator.clipboard
                          .writeText(
                            `${window.location.origin}/projects/${project.id}`
                          )
                          .then(() =>
                            showNotification?.(
                              'Project URL copied to clipboard',
                              'success'
                            )
                          )
                          .catch(() =>
                            showNotification?.(
                              'Failed to copy project URL',
                              'error'
                            )
                          );
                      }}
                    >
                      <Share
                        sx={{
                          width: 15,
                          height: 15,
                          color: isDark ? '#9ca3af' : '#6b7280',
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
