import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Github, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/useAuthStore';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'Your sign-in request expired or could not be verified. Please try again.',
  oauth_unauthorized: 'GitHub could not authorize this sign-in. Please try again.',
  oauth_failed: 'Something went wrong signing in with GitHub. Please try again.',
  github_already_connected: 'That GitHub account is already connected to a different NexusFlow account.',
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, isLoading } = useAuthStore();

  const errorCode = searchParams.get('error');
  const oauthErrorMessage = useMemo(() => {
    if (!errorCode) return null;
    return OAUTH_ERROR_MESSAGES[errorCode] || OAUTH_ERROR_MESSAGES.oauth_failed;
  }, [errorCode]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGithubLogin = () => {
    login();
  };

  return (
    <div className="auth-scene flex flex-col items-center justify-center p-4">
      {/* Ambient backdrop: technical grid + drifting gradient mesh */}
      <div className="auth-scene__grid" aria-hidden="true" />
      <div className="auth-scene__orb auth-scene__orb--blue" aria-hidden="true" />
      <div className="auth-scene__orb auth-scene__orb--purple" aria-hidden="true" />
      <div className="auth-scene__orb auth-scene__orb--cyan" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        {/* Verification badge, echoing NexusFlow's core purpose */}
        <div className="flex items-center justify-center gap-1.5 mb-5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured by NexusFlow Identity Verification</span>
        </div>

        <Card className="auth-glass text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-display font-bold text-xl mx-auto shadow-lg shadow-indigo-500/30">
            N
          </div>

          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-50 tracking-tight">
              Welcome to NexusFlow
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Automated AI verification for developer portfolios and repositories.
            </p>
          </div>

          {oauthErrorMessage && (
            <div className="flex items-start gap-2 text-left rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{oauthErrorMessage}</span>
            </div>
          )}

          <Button
            onClick={handleGithubLogin}
            size="lg"
            className="w-full auth-btn-primary"
            leftIcon={<Github className="w-5 h-5" />}
          >
            Continue with GitHub
          </Button>

          <p className="text-[10px] text-slate-500 pt-1 leading-relaxed">
            By signing in, you agree to NexusFlow's verification of your public GitHub profile and repositories.
          </p>
        </Card>
      </div>
    </div>
  );
};
