// hooks/useConnections.ts
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import type {
  Connection,
  PendingRequest,
  ConnectionSuggestion,
  ConnectionStats,
  ConnectionResponse
} from '../types/connections';

const useConnections = () => {
  // State declarations
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<PendingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Main fetch function
  const fetchAll = useCallback(async (filters: {
    page: number;
    limit: number;
    role?: 'STUDENT' | 'ALUM' | 'ADMIN';
    search?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const [connectionsRes, pendingReceivedRes, pendingSentRes, suggestionsRes, statsRes] = 
        await Promise.all([
          apiService.connections.getAll(filters),
          apiService.connections.getPendingReceived({ page: 1, limit: 10 }),
          apiService.connections.getPendingSent({ page: 1, limit: 10 }),
          apiService.connections.getSuggestions({ limit: filters.limit }),
          apiService.connections.getStats()
        ]);

      // Transform responses to match expected frontend structure
      setConnections(connectionsRes.data?.connections || []);
      setPendingReceived(pendingReceivedRes.data?.requests || []);
      setPendingSent(pendingSentRes.data?.requests || []);
      setSuggestions(suggestionsRes.data?.suggestions || []);
      setStats(statsRes.data || null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, []);

  // Individual action functions
  const sendRequest = async (userId: string) => {
    try {
      await apiService.connections.send(userId);
      setSuggestions(prev => prev.filter(s => s.user.id !== userId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request');
      return false;
    }
  };

  const respondToRequest = async (connectionId: string, status: 'ACCEPTED' | 'REJECTED' | 'BLOCKED') => {
    try {
      await apiService.connections.updateStatus(connectionId, status);
      setPendingReceived(prev => prev.filter(c => c.id !== connectionId));
      if (status === 'ACCEPTED') {
        await fetchAll({ page: 1, limit: 20 }); // Refresh connections
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to request');
      return false;
    }
  };

  return {
    // State
    connections,
    pendingReceived,
    pendingSent,
    suggestions,
    stats,
    loading,
    error,
    
    // State setters
    setConnections,
    setPendingReceived,
    setPendingSent,
    setSuggestions,
    setError,
    
    // Actions
    fetchAll,
    sendRequest,
    respondToRequest,
    
    // Basic actions
    cancelConnection: async (connectionId: string) => {
      try {
        await apiService.connections.cancel(connectionId);
        setPendingSent(prev => prev.filter(c => c.id !== connectionId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel connection');
        return false;
      }
    },
    
    removeConnection: async (connectionId: string) => {
      try {
        await apiService.connections.remove(connectionId);
        setConnections(prev => prev.filter(c => c.id !== connectionId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove connection');
        return false;
      }
    }
  };
};

export default useConnections;