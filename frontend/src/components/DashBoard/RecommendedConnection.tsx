import { useDashboardContext } from '@/contexts/DashBoardContext';
import { Interests } from '@mui/icons-material';
import {
  UserPlus,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function RecommendedConnection() {
  const {
    suggestedConnections = [],
    getSuggestedConnections,
    connectToUser,
    error: { connections: connectionError, connecting: connectingError } = {
      connections: null,
      connecting: null,
    },
    loading: {
      connections: connectionLoading,
      connecting: connectingLoading,
    } = {
      connections: false,
      connecting: false,
    },
  } = useDashboardContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (suggestedConnections.length === 0) {
      getSuggestedConnections(10);
    }
  }, [getSuggestedConnections, suggestedConnections.length]);

  // Clear local error when component mounts or when suggestions change
  useEffect(() => {
    setLocalError(null);
  }, [suggestedConnections]);

  const nextSuggestion = () => {
    setCurrentIndex((prev) =>
      prev === suggestedConnections.length - 1 ? 0 : prev + 1
    );
    setLocalError(null); // Clear error when navigating
  };

  const prevSuggestion = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? suggestedConnections.length - 1 : prev - 1
    );
    setLocalError(null); // Clear error when navigating
  };

  const goToSuggestion = (index: number) => {
    setCurrentIndex(index);
    setLocalError(null); // Clear error when navigating
  };

  const handleConnect = async (userId: string) => {
    setConnectingUserId(userId);
    setLocalError(null); // Clear previous errors

    try {
      await connectToUser(userId);
      // Remove the connected user from suggestions
      const updatedSuggestions = suggestedConnections.filter(
        (suggestion) => suggestion.user.id !== userId
      );

      // Update current index if needed
      if (
        currentIndex >= updatedSuggestions.length &&
        updatedSuggestions.length > 0
      ) {
        setCurrentIndex(updatedSuggestions.length - 1);
      }

      // Refresh suggestions if we're running low
      if (updatedSuggestions.length <= 2) {
        getSuggestedConnections(10);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to connect. Please try again.';
      setLocalError(errorMessage);
      console.error('Failed to connect:', error);
    } finally {
      setConnectingUserId(null);
    }
  };

  // Display connection loading state
  if (connectionLoading) {
    return (
      <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Recommended Connections
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto" />
          <div className="h-4 bg-emerald-100 rounded w-3/4 mx-auto" />
          <div className="h-3 bg-emerald-100 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  // Display connection error state
  if (connectionError) {
    return (
      <div className="bg-white rounded-xl border border-rose-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Recommended Connections
        </h3>
        <div className="flex items-center gap-2 text-rose-600 mb-3">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Connection Error</span>
        </div>
        <p className="text-sm text-rose-600 mb-4">
          {connectionError || 'Failed to load connection suggestions.'}
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => getSuggestedConnections(10)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!suggestedConnections || suggestedConnections.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Recommended Connections
        </h3>
        <p className="text-sm text-gray-600 text-center mb-4">
          No connection suggestions yet.
        </p>
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => getSuggestedConnections(10)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Find Suggestions
          </button>
        </div>
      </div>
    );
  }

  const currentSuggestion = suggestedConnections[currentIndex];
  const { user, matchScore, reasons } = currentSuggestion;
  const name = user?.name || 'Unknown Name';
  const avatarUrl = user?.profile?.avatarUrl || null;
  const role = user?.role || 'STUDENT';
  const location = user?.profile?.location || 'Unknown location';
  const interests = user?.profile?.interests || 'Various interests';
  const skills = user?.profile?.skills?.map((skill) => skill.name) || [];
  const bio =
    user?.profile?.bio ||
    'I mentor young professionals in the tech industry and love connecting with alumni who are passionate about growth.';

  const isConnecting = connectingUserId === user.id || connectingLoading;

  return (
    <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Recommended Connections
        </h3>
      </div>

      {/* Progress Dots */}
      {suggestedConnections.length > 1 && (
        <div className="flex justify-center gap-1 mb-4">
          {suggestedConnections.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSuggestion(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-emerald-600 w-4'
                  : 'bg-emerald-200 hover:bg-emerald-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Connection Error Display */}
      {(connectingError || localError) && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Connection Failed</span>
          </div>
          <p className="text-sm text-rose-600 mt-1">
            {localError || connectingError}
          </p>
        </div>
      )}

      {/* Connection Card */}
      <div className="grid grid-cols-[15px_1fr_15px] items-center gap-3 mb-4">
        {/* Left - Prev Button (small column) */}
        <div className="flex items-center justify-center">
          <button
            onClick={prevSuggestion}
            aria-label="Previous suggestion"
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-gray-500 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={suggestedConnections.length <= 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Center - Avatar + Name + Meta (flexible column) */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-sm overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h4 className="font-bold text-gray-900 mb-1 text-lg">{name}</h4>
          <div className="flex items-center gap-2 mb-1 flex-wrap justify-center">
            <span className="text-sm text-emerald-600 font-medium">{role}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
              {matchScore}/15 match
            </span>
          </div>
        </div>

        {/* Right - Next Button (small column) */}
        <div className="flex items-center justify-center">
          <button
            onClick={nextSuggestion}
            aria-label="Next suggestion"
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-gray-500 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={suggestedConnections.length <= 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {interests && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Interests className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              {(() => {
                const arr =
                  typeof interests === 'string'
                    ? interests
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : Array.isArray(interests)
                      ? interests
                      : [];
                const firstFive = arr.slice(0, 5);
                return firstFive.length > 0
                  ? firstFive.join(', ') + (arr.length > 5 ? ', ...' : '')
                  : 'Various interests';
              })()}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{location}</span>
        </div>
      </div>

      {/* Bio */}
      <div className="text-sm text-gray-600 mb-4 leading-relaxed border-l-2 border-emerald-200 pl-3">
        {skills.length > 0 && (
          <div className="mb-2">
            <strong className="text-gray-800">Skills:</strong>{' '}
            <span className="text-gray-700">{skills.join(', ')}</span>
          </div>
        )}
        {bio}
      </div>

      {/* Reasons */}
      {reasons?.length > 0 && (
        <div className="mb-4 p-3 bg-emerald-50 rounded-lg">
          <div className="text-xs font-medium text-emerald-700 mb-2">
            Why we think you should connect:
          </div>
          <ul className="text-sm text-emerald-800 space-y-1">
            {reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1 h-1 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow ${
            isConnecting
              ? 'bg-emerald-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
          onClick={() => handleConnect(user.id)}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Connect
            </>
          )}
        </button>
        <a
          href={`/profile/${user.id}`}
          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors inline-flex items-center justify-center shadow-sm hover:shadow"
        >
          View Profile
        </a>
      </div>

      {/* Quick Navigation Hint */}
      {suggestedConnections.length > 1 && (
        <div className="text-xs text-gray-400 text-center mt-3">
          Use arrows or dots to browse more suggestions
        </div>
      )}
    </div>
  );
}
