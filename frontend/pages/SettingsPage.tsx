import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { settingsService } from '../services/settings.service';
import { Github, Key, Save, Loader2, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { githubAccount, login } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoRetryFailedTasks, setAutoRetryFailedTasks] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then((s) => {
      setEmailNotifications(s.emailNotifications);
      setAutoRetryFailedTasks(s.autoRetryFailedTasks);
    }).catch(() => {});
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await settingsService.updateSettings({
        emailNotifications,
        autoRetryFailedTasks,
        theme: theme as 'dark' | 'light',
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer
      title="Platform Settings"
      description="Manage account credentials, OAuth integrations, notification preferences, and themes."
      action={
        <Button
          size="sm"
          disabled={isSaving}
          onClick={handleSaveSettings}
          leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      }
    >
      <div className="space-y-6 max-w-3xl">
        {savedSuccess && (
          <Card className="p-3 bg-emerald-950/40 border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings successfully saved and persisted!</span>
          </Card>
        )}

        {/* GitHub OAuth Integration */}
        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5 text-slate-100" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">GitHub OAuth 2.0 Integration</h3>
              <p className="text-xs text-slate-400">Connected account for repository sync and access tokens</p>
            </div>
          </div>
          {githubAccount ? (
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono text-slate-200">@{githubAccount.githubUsername}</span>
                <span className="text-slate-500 block">ID: {githubAccount.githubUserId}</span>
              </div>
              <Button variant="outline" size="sm" onClick={login}>
                Re-authenticate
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={login}>Connect GitHub Account</Button>
          )}
        </Card>

        {/* Preferences */}
        <Card className="space-y-4 p-6">
          <h3 className="font-semibold text-slate-100 text-sm">System Preferences</h3>
          <div className="space-y-3">
            <Switch
              label="Enable Dark Theme"
              checked={theme === 'dark'}
              onChange={(val) => setTheme(val ? 'dark' : 'light')}
            />
            <Switch
              label="Email Notifications on Security Warnings"
              checked={emailNotifications}
              onChange={(val) => setEmailNotifications(val)}
            />
            <Switch
              label="Auto-retry Failed Tasks in Queue"
              checked={autoRetryFailedTasks}
              onChange={(val) => setAutoRetryFailedTasks(val)}
            />
          </div>
        </Card>

        {/* Security & Access */}
        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Session Security & Tokens</h3>
              <p className="text-xs text-slate-400 font-normal">HTTP-only cookie auth with in-memory access token rotation</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            NexusFlow uses HTTP-only refresh cookies paired with short-lived in-memory JWT access tokens for optimal security against XSS and token exfiltration.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
};
