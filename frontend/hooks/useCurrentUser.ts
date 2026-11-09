import { useState, useEffect } from 'react';
import { userService } from '../services/user.service';
import { User } from '../types';
import { useAuthStore } from '../store/useAuthStore';

export const useCurrentUser = () => {
  const authUser = useAuthStore((state) => state.user);
  const [user, setUser] = useState<User | null>(authUser);
  const [isLoading, setIsLoading] = useState<boolean>(!authUser);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getProfile();
      setUser(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    } else {
      fetchProfile();
    }
  }, [authUser]);

  return { user, isLoading, error, refetch: fetchProfile };
};
