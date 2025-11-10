import { useDashboardContext } from '@/contexts/DashBoardContext';
import { ProfileNameLink } from '@/utils/ProfileNameLink';
import {
  Heart,
  MessageCircle,
  Share2,
  AlertCircle,
  Clock,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { useEffect, useState, CSSProperties } from 'react';
import AttachmentIcon from '@mui/icons-material/Attachment';
import { useNavigate } from 'react-router-dom';

export default function RecentPosts() {
  const {
    posts = [],
    getSuggestedPosts,
    loading: { posts: postsLoading },
    error: { posts: postsError },
  } = useDashboardContext();
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);

  const renderPosts = posts;

  useEffect(() => {
    if (renderPosts.length === 0) {
      getSuggestedPosts();
    }
  }, [getSuggestedPosts, renderPosts.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await getSuggestedPosts();
    } finally {
      setRefreshing(false);
    }
  };

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

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700';
      case 'DISCUSSION':
        return 'bg-green-100 text-green-700';
      case 'QUESTION':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'UPDATE':
        return 'Update';
      case 'DISCUSSION':
        return 'Discussion';
      case 'QUESTION':
        return 'Question';
      default:
        return type;
    }
  };

  // Skeleton Loading
  if (postsLoading && renderPosts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-32 bg-emerald-100 rounded animate-pulse" />
          <div className="h-5 w-20 bg-emerald-100 rounded animate-pulse" />
        </div>
        <div className="space-y-5">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="border-b border-gray-200 pb-5 last:border-0 last:pb-0 animate-pulse"
            >
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-emerald-100 rounded w-24" />
                  <div className="h-3 bg-emerald-100 rounded w-32" />
                </div>
              </div>
              <div className="h-4 bg-emerald-100 rounded w-full mb-2" />
              <div className="h-3 bg-emerald-100 rounded w-3/4 mb-4" />
              <div className="flex gap-6">
                <div className="h-4 bg-emerald-100 rounded w-12" />
                <div className="h-4 bg-emerald-100 rounded w-12" />
                <div className="h-4 bg-emerald-100 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (postsError && renderPosts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-rose-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
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
              Failed to load posts
            </p>
            <p className="text-sm text-rose-600">{postsError}</p>
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
      </div>
    );
  }

  // Empty State
  if (!renderPosts || renderPosts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No posts yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Be the first to share an update with the community
          </p>
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors">
            Create Post
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing || postsLoading}
            className="text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
            title="Refresh posts"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => navigate('/feed')}
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-5">
        {renderPosts.map((post) => {
          const authorName = post.author?.name || 'Unknown User';
          const avatarUrl = post.author?.profile?.avatarUrl;
          const avatarChar = authorName.charAt(0).toUpperCase();

          return (
            <div
              key={post.id}
              className="border-b border-gray-200 pb-5 last:border-0 last:pb-0 group hover:bg-gray-50/50 rounded-lg p-3 -m-3 transition-all"
            >
              {/* Author Header */}
              <div className="flex gap-3 mb-3">
                <div className="flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={authorName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {avatarChar}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <ProfileNameLink user={post.author} badgeSize={20} />
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getPostTypeColor(post.type)}`}
                    >
                      {getPostTypeLabel(post.type)}
                    </span>
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{formatDate(post.createdAt)}</span>
                    </p>
                    {/* {post.isUrgent && (
                      <span className="text-xs font-medium px-2 py-1 bg-rose-100 text-rose-700 rounded-full">
                        Urgent
                      </span>
                    )} */}
                  </div>
                </div>
              </div>

              {/* Post Content */}
              {post.subject && (
                <h3 className="font-semibold text-gray-900 text-sm mb-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/posts/${post.id}`)}
                    className="hover:text-emerald-600 text-left p-0 m-0"
                  >
                    {post.subject}
                  </button>
                </h3>
              )}
              <p
                className="text-gray-700 text-sm mb-2 leading-relaxed overflow-hidden"
                style={
                  {
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal',
                  } as CSSProperties
                }
              >
                {post.content}
              </p>

              {/* Post Image */}
              {post.imageUrl && (
                <div className="mb-2">
                  <AttachmentIcon fontSize="small" sx={{ mr: 1 }} />
                  <span className="text-sm text-gray-500">image</span>
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <button
                  className="flex items-center gap-2 transition-colors"
                  aria-pressed={post.hasVoted}
                >
                  <Heart
                    className={`w-4 h-4 ${post.hasVoted ? 'fill-red-600 text-red-600' : 'text-gray-400 hover:text-emerald-600'}`}
                  />
                  <span>{post._count?.Vote ?? 0}</span>
                </button>
                <button className="flex items-center gap-2 hover:text-emerald-600 transition-colors group/action">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post._count?.Comment ?? 0}</span>
                </button>
                <button className="flex items-center gap-2 hover:text-emerald-600 transition-colors group/action">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                {/* {post.score && (
                  <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                    <span>Score:</span>
                    <span className="font-medium text-emerald-600">
                      {post.score.toFixed(1)}
                    </span>
                  </div>
                )} */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
