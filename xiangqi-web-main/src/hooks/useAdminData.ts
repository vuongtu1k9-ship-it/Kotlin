import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';
import { API_URL } from '../auth/auth';

export function useAdminData(activeTab: string, authState: any) {
  const [data, setData] = useState<any>({
    users: [],
    matches: [],
    puzzles: [],
    tournaments: [],
    comments: [],
    gifts: [],
    bots: [],
    settings: {},
    cacheStats: null
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const resetPagination = useCallback(() => {
    setPagination(p => ({ ...p, page: 1 }));
    setSearch('');
    setFilter('');
  }, []);

  const fetchData = useCallback(async () => {
    if (authState.status !== 'auth') return;
    setLoading(true);
    try {
      let endpoint = '';
      const params = new URLSearchParams();
      if (['users', 'matches', 'puzzles', 'tournaments', 'comments', 'shop', 'bots'].includes(activeTab)) {
        params.append('page', String(pagination.page));
        params.append('limit', activeTab === 'tournaments' ? '20' : '50');
        if (search) params.append('search', search);
        if (filter) {
          if (activeTab === 'users') params.append('role', filter);
          else if (activeTab === 'comments') params.append('type', filter);
          else if (activeTab === 'matches' || activeTab === 'tournaments') params.append('status', filter);
        }
      }

      if (activeTab === 'users') endpoint = `/admin/users?${params.toString()}`;
      else if (activeTab === 'matches') endpoint = `/admin/matches?${params.toString()}`;
      else if (activeTab === 'puzzles') endpoint = `/admin/puzzles?${params.toString()}`;
      else if (activeTab === 'tournaments') endpoint = `/admin/tournaments?${params.toString()}`;
      else if (activeTab === 'comments') endpoint = `/admin/comments?${params.toString()}`;
      else if (activeTab === 'shop') endpoint = '/admin/gifts';
      else if (activeTab === 'settings') endpoint = '/admin/settings';
      else if (activeTab === 'cache') endpoint = '/admin/cache';
      else if (activeTab === 'bots') endpoint = '/admin/bots';
      else if (['practice', 'analytics', 'ai', 'server', 'dashboard', 'push'].includes(activeTab)) {
        setLoading(false);
        return;
      }

      const headers: Record<string, string> = {};
      if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;

      const res = await fetch(`${API_URL}${endpoint}`, {
        headers,
        credentials: 'include'
      });
      const result = await res.json();
      if (result.ok) {
        if (['users', 'matches', 'puzzles', 'tournaments', 'comments', 'shop', 'bots'].includes(activeTab)) {
          const key = activeTab === 'shop' ? 'gifts' : activeTab;
          setData((prev: any) => ({ ...prev, [key]: result[key] || [] }));
          setPagination(prev => ({
            ...prev,
            totalPages: result.pages || 1,
            totalCount: result.total || 0
          }));
        } else if (activeTab === 'settings') {
          setData((prev: any) => ({ ...prev, settings: result.settings || {} }));
        } else if (activeTab === 'cache') {
          setData((prev: any) => ({ ...prev, cacheStats: result }));
        }
      }
    } catch (e) {
      logger.error(`Failed to load ${activeTab}`, e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, authState.status, authState.token, pagination.page, search, filter]);

  useEffect(() => {
    if (authState.status === 'auth') {
      // Clear data and reset pagination ONLY when activeTab changes
      setData((prev: any) => ({
        ...prev,
        users: [],
        matches: [],
        puzzles: [],
        tournaments: [],
        comments: [],
        gifts: [],
        bots: [],
        cacheStats: null
      }));
      setPagination(p => ({ ...p, page: 1, totalPages: 1, totalCount: 0 }));
      setSearch('');
      setFilter('');
    }
  }, [activeTab, authState.status]);

  useEffect(() => {
    if (authState.status === 'auth') {
      fetchData();
    }
  }, [activeTab, authState.status, pagination.page, filter, fetchData]);

  return {
    data,
    setData,
    loading,
    pagination,
    setPagination,
    search,
    setSearch,
    filter,
    setFilter,
    resetPagination,
    fetchData
  };
}
