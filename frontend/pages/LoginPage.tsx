import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Github, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/useAuthStore';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'Your sign-in request expired or could not be verified. Please try again.',
  oauth_unauthorized: 'GitHub could not authorize this sign-in. Please try again.',
  oauth_failed: 'Something went wrong signing in with GitHub. Please try again.',
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, isLoading } = useAuthStore();

  const errorCode = searchParams.get('error');
  const errorMessage = useMemo(() => {
    if (!errorCode) return null;
    return OAUTH_ERROR_MESSAGES[errorCode] || OAUTH_ERROR_MESSAGES.oauth_failed;
  }, [errorCode]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6 bg-slate-900/90 border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-lg">
          N
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-100">Sign in to NexusFlow</h1>
          <p className="text-xs text-slate-400 mt-1">
            Production-grade developer SaaS platform for automated AI verification.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 text-left rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleLogin}
            size="lg"
            className="w-full"
            leftIcon={<Github className="w-5 h-5" />}
          >
            Continue with GitHub
          </Button>
        </div>

        <p className="text-[10px] text-slate-500 pt-4">
          By signing in, you agree to NexusFlow Security Rules & OAuth 2.0 Auth Terms.
        </p>
      </Card>
    </div>
  );
};
