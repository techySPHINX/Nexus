import { useDashboardContext } from '@/contexts/DashBoardContext';
import { Role } from '@/types/engagement';
import { ProfileNameLink } from '@/utils/ProfileNameLink';
import { ArrowRight, Users, Calendar, Heart, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  useEffect(() => {
    if (projects.length === 0) {
      getSuggestedProjects();
    }
  }, [getSuggestedProjects, projects.length]);

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

  if (projectLoading) {
    return (
      <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
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
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="bg-white rounded-xl border border-rose-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Recommended Projects
          </h2>
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
            onClick={() => getSuggestedProjects()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Recommended Projects
          </h2>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Discover amazing projects from our alumni community
          </p>
          <button
            onClick={() => getSuggestedProjects()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Find Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Recommended Projects
        </h2>
        <button
          onClick={() => {
            navigate('/projects');
          }}
          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1 transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer"
          >
            <div className="w-20 h-20 flex-shrink-0">
              <img
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
                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                  {project.title}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(project.status)}`}
                  >
                    {getStatusText(project.status)}
                  </span>
                  {project.seekingCollaboration && (
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      🤝 Seeking Collaboration
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {project.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
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
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                <div className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  <span>{project._count?.supporters || 0} supporters</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{project._count?.followers || 0} followers</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
