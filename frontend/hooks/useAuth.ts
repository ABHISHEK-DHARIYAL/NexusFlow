import { useAuthStore } from '../store/useAuthStore';

export const useAuth = () => {
  const {
    user,
    githubAccount,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshSession,
    initializeAuth,
  } = useAuthStore();

  return {
    user,
    githubAccount,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshSession,
    initializeAuth,
  };
};
