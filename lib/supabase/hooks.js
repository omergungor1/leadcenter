'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, onAuthStateChange } from './auth';

/**
 * Hook to get current authenticated user
 * @returns {{user: User | null, loading: boolean, error: Error | null}}
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial user
    getCurrentUser().then(({ user, error }) => {
      setUser(user);
      setError(error);
      setLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}

/**
 * Hook to check if user is authenticated
 * @returns {boolean}
 */
export function useIsAuthenticated() {
  const { user, loading } = useAuth();
  return !loading && user !== null;
}

