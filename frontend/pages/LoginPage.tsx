import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldCheck, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/useAuthStore';

type Mode = 'login' | 'signup';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithPassword, signup, isAuthenticated, isLoading, authError } = useAuthStore();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Already signed in (saved session restored) -> straight to the app.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Clear stale errors when switching between sign in / create account.
  useEffect(() => {
    setLocalError(null);
    useAuthStore.setState({ authError: null });
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setLocalError('Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    const ok =
      mode === 'signup'
        ? await signup({ email: cleanEmail, password, name: name.trim() || undefined })
        : await loginWithPassword(cleanEmail, password);
    setSubmitting(false);

    if (ok) navigate('/dashboard', { replace: true });
  };

  const errorMessage = localError || authError;

  return (
    <div className="auth-scene flex flex-col items-center justify-center p-4">
      {/* Ambient backdrop: technical grid + drifting gradient mesh */}
      <div className="auth-scene__grid" aria-hidden="true" />
      <div className="auth-scene__orb auth-scene__orb--blue" aria-hidden="true" />
      <div className="auth-scene__orb auth-scene__orb--purple" aria-hidden="true" />
      <div className="auth-scene__orb auth-scene__orb--cyan" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-1.5 mb-5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured by NexusFlow Identity Verification</span>
        </div>

        <Card className="auth-glass space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-display font-bold text-xl mx-auto shadow-lg shadow-indigo-500/30">
              N
            </div>
            <h1 className="font-display text-2xl font-semibold text-slate-50 tracking-tight mt-4">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {mode === 'login'
                ? 'Sign in to continue to NexusFlow.'
                : 'Sign up with your email to get started.'}
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 text-left rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'signup' && (
              <Input
                label="Name (optional)"
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
              />
            )}

            <Input
              label="Email"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="pointer-events-auto hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full auth-btn-primary"
              disabled={submitting}
            >
              {submitting
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          <p className="text-center text-[10px] text-slate-500 leading-relaxed">
            You'll stay signed in on this device until you log out.
          </p>
        </Card>
      </div>
    </div>
  );
};
