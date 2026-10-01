import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { Modal } from '../components/ui/Modal';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { settingsService } from '../services/settings.service';
import { Github, Key, Save, Loader2, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { githubAccount, connectGithub, deleteAccount, authError } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [searchParams] = useSearchParams();
  const githubJustConnected = searchParams.get('github') === 'connected';

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoRetryFailedTasks, setAutoRetryFailedTasks] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const ok = await deleteAccount();
      if (ok) {
        navigate('/login', { replace: true });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteConfirmText('');
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

        {githubJustConnected && (
          <Card className="p-3 bg-emerald-950/40 border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>GitHub account connected successfully.</span>
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
              <Button variant="outline" size="sm" onClick={connectGithub}>
                Re-authenticate
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={connectGithub}>Connect GitHub Account</Button>
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

        {/* Danger Zone */}
        <Card className="space-y-4 p-6 border-red-900/50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Danger Zone</h3>
              <p className="text-xs text-slate-400 font-normal">Irreversible account actions</p>
            </div>
          </div>
          <div className="p-3 bg-red-950/20 rounded-lg border border-red-900/40 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-200">Delete my account</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanently deletes your profile, connected GitHub account, repositories, and reports. This cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-800/60 text-red-300 hover:bg-red-950/50 hover:text-red-200 shrink-0"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete your account?"
        description="This permanently removes your account and all associated data. There is no undo."
        maxWidth="sm"
      >
        <div className="space-y-4">
          {authError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Type <span className="font-mono text-slate-200">DELETE</span> below to confirm.
          </p>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            autoFocus
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={closeDeleteModal} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-500 border-red-500/30"
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              leftIcon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? 'Deleting...' : 'Permanently delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
