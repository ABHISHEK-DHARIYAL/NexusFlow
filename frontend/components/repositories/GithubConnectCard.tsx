import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Github, CheckCircle2, AlertTriangle, Loader2, ExternalLink, Unplug } from 'lucide-react';
import { Button } from '../ui/Button';
import { authService } from '../../services/auth.service';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'The GitHub request expired or could not be verified. Please try connecting again.',
  oauth_unauthorized: 'GitHub could not authorize the connection. Please try again.',
  oauth_failed: 'Something went wrong connecting to GitHub. Please try again.',
  github_already_connected: 'That GitHub account is already connected to a different NexusFlow account.',
};

interface GithubStatus {
  connected: boolean;
  configured: boolean;
  githubAccount: { githubUsername: string; profileUrl: string; avatarUrl: string } | null;
}

interface Props {
  /** Called whenever the connected state is (re)loaded or changes. */
  onStatusChange?: (connected: boolean) => void;
}

export const GithubConnectCard: React.FC<Props> = ({ onStatusChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justConnected, setJustConnected] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await authService.getGithubStatus();
      setStatus(s);
      onStatusChange?.(s.connected);
    } catch (err: any) {
      setError(err?.message || 'Could not check your GitHub connection.');
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  // Pick up the result of the OAuth round-trip from the URL, then clean it.
  useEffect(() => {
    const err = searchParams.get('github_error');
    const ok = searchParams.get('github');
    if (err) setError(ERROR_MESSAGES[err] || ERROR_MESSAGES.oauth_failed);
    if (ok === 'connected') setJustConnected(true);
    if (err || ok) {
      const next = new URLSearchParams(searchParams);
      next.delete('github_error');
      next.delete('github');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConnect = async () => {
    setBusy(true);
    setError(null);
    try {
      await authService.connectGithub(); // navigates away on success
    } catch (err: any) {
      setError(err?.message || 'Could not start the GitHub connection.');
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Remove GitHub access? NexusFlow will delete the saved connection and revoke its access on GitHub. Your imported repositories stay, but you will need to connect again to import more.')) return;
    setBusy(true);
    setError(null);
    try {
      await authService.disconnectGithub();
      setJustConnected(false);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not disconnect GitHub.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        Checking GitHub connection...
      </div>
    );
  }

  const errorBox = error && (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{error}</span>
    </div>
  );

  // Connected
  if (status?.connected && status.githubAccount) {
    const acc = status.githubAccount;
    return (
      <div className="space-y-3">
        {justConnected && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            GitHub connected successfully. You can now import your repositories.
          </div>
        )}
        {errorBox}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {acc.avatarUrl ? (
              <img src={acc.avatarUrl} alt="" className="w-9 h-9 rounded-full border border-slate-700" />
            ) : (
              <Github className="w-9 h-9 text-slate-400" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                GitHub connected
              </div>
              <p className="text-[11px] text-slate-500">Saved to your account - no need to connect again.</p>
              <a
                href={acc.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-blue-400 inline-flex items-center gap-1"
              >
                @{acc.githubUsername} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleConnect} disabled={busy}>
              Reconnect
            </Button>
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={busy} leftIcon={<Unplug className="w-3.5 h-3.5" />}>
              Remove access
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not connected
  return (
    <div className="space-y-3">
      {errorBox}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
            <Github className="w-5 h-5 text-slate-100" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Connect your GitHub account</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Link GitHub to browse and import your repositories for AI verification and analysis. You'll be sent to
              GitHub to approve access, then brought right back here.
            </p>
            {status && !status.configured && (
              <p className="text-xs text-amber-300 mt-2">
                GitHub isn't set up on this server yet. The administrator needs to add GITHUB_CLIENT_ID and
                GITHUB_CLIENT_SECRET.
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleConnect}
          disabled={busy || (status ? !status.configured : false)}
          leftIcon={busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
          className="shrink-0"
        >
          {busy ? 'Redirecting...' : 'Connect GitHub'}
        </Button>
      </div>
    </div>
  );
};
