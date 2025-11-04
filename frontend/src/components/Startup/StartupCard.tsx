// StartupCard.tsx
import React from 'react';
import { StartupSummary } from '@/types/StartupType';
import { motion } from 'framer-motion';
import Tooltip from '@mui/material/Tooltip';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  startup: StartupSummary;
  onFollowToggle?: (startup: StartupSummary, isFollowing: boolean) => void;
  onView?: () => void;
  onEdit?: (startup: StartupSummary) => void;
  onDelete?: (startupId: string) => void;
}

const StartupCard: React.FC<Props> = ({
  startup,
  onFollowToggle,
  onView,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const getStatusColor = (status: string) => {
    const colors = {
      LAUNCHED: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      },
      BETA: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      },
      PROTOTYPING: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      },
      IDEA: {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
      },
    };
    return colors[status as keyof typeof colors] || colors.IDEA;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      LAUNCHED: '🚀',
      BETA: '🔧',
      PROTOTYPING: '🛠️',
      IDEA: '💡',
    };
    return icons[status as keyof typeof icons] || '💡';
  };

  const statusColor = getStatusColor(startup.status || 'IDEA');
  const statusIcon = getStatusIcon(startup.status || 'IDEA');
  const isOwner = user?.id === startup.founderId;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num}`;
  };

  const fundingProgress = startup.fundingGoal
    ? Math.min(100, ((startup.fundingRaised || 0) / startup.fundingGoal) * 100)
    : 0;

  return (
    <motion.article
      // make card focusable and keyboard accessible
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView?.();
        }
      }}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Image Section */}
      <div className="relative overflow-hidden">
        {startup.imageUrl ? (
          <img
            src={startup.imageUrl}
            alt={startup.name}
            className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
            <div className="text-4xl opacity-20">🚀</div>
          </div>
        )}

        {/* Status Badge */}
        <div
          className={`absolute top-3 left-3 px-3 py-1.5 rounded-full ${statusColor.bg} ${statusColor.text} ${statusColor.border} border backdrop-blur-sm flex items-center gap-1.5 text-xs font-medium`}
        >
          <span>{statusIcon}</span>
          <span className="capitalize">
            {startup.status?.toLowerCase() || 'idea'}
          </span>
        </div>

        {/* Owner Actions */}
        {isOwner && (
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(startup);
              }}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </motion.button>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(startup.id);
              }}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </motion.button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title and Basic Info */}
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors duration-200">
            {startup.name}
          </h3>
        </div>

        {/* Funding Progress */}
        {startup.fundingGoal && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span className="font-medium">Funding Progress</span>
              <span className="font-semibold">
                {formatNumber(startup.fundingRaised || 0)} /{' '}
                {formatNumber(startup.fundingGoal)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${fundingProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{fundingProgress.toFixed(1)}% funded</span>
              <span>
                {(
                  ((startup.fundingRaised || 0) / startup.fundingGoal) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
          </div>
        )}

        {/* Stats and Metadata */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <motion.span
                // animate a subtle pop when followersCount changes
                key={startup.followersCount ?? 0}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 0.35 }}
                className="font-semibold text-gray-900"
                aria-live="polite"
              >
                {startup.followersCount ?? 0}
              </motion.span>
            </div>

            {startup.monetizationModel && (
              <div className="hidden sm:flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                <span className="truncate max-w-[80px]">
                  {startup.monetizationModel}
                </span>
              </div>
            )}
          </div>

          {/* View Button - Always visible */}
          <motion.button
            onClick={onView}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors duration-200"
            whileHover={{ x: 2 }}
          >
            View
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Action Footer */}
      {!isOwner && (
        <div className="px-5 pb-4">
          <Tooltip title={startup.isFollowing ? 'Unfollow' : 'Follow'} arrow>
            <motion.button
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                startup.isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md'
              }`}
              onClick={() => onFollowToggle?.(startup, !!startup.isFollowing)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-pressed={!!startup.isFollowing}
              aria-label={
                startup.isFollowing ? 'Unfollow startup' : 'Follow startup'
              }
            >
              {startup.isFollowing ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Following
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Follow Startup
                </>
              )}
            </motion.button>
          </Tooltip>
        </div>
      )}
    </motion.article>
  );
};

export default StartupCard;
