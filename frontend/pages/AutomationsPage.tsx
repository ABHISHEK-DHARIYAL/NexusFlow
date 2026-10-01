import React, { useEffect, useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Clock,
  Play,
  Pause,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  History,
  RefreshCw,
  Calendar,
  Globe,
  Loader2,
  X,
  Sparkles,
  Check,
} from 'lucide-react';
import { scheduleService } from '../services/schedule.service';
import { ScheduledJob, ScheduledJobExecution, AutomationTemplate, AutomationSummary } from '../types';

export const AutomationsPage: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduledJob[]>([]);
  const [summary, setSummary] = useState<AutomationSummary | null>(null);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'FAILED' | 'NEEDS_ATTENTION'>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ScheduledJob | null>(null);
  const [selectedJobHistory, setSelectedJobHistory] = useState<ScheduledJob | null>(null);
  const [executionsHistory, setExecutionsHistory] = useState<ScheduledJobExecution[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    jobType: 'GITHUB_SYNC',
    frequency: 'DAILY',
    time: '09:00',
    timezone: 'UTC',
    schedule: '',
    resourceId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedList, summ, tplList] = await Promise.all([
        scheduleService.getSchedules(),
        scheduleService.getSummary(),
        scheduleService.getTemplates(),
      ]);
      setSchedules(schedList);
      setSummary(summ);
      setTemplates(tplList);
    } catch (err: any) {
      showToast('error', 'Failed to fetch automation schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleOpenCreateModal = (template?: AutomationTemplate) => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        jobType: template.jobType,
        frequency: template.frequency,
        time: template.time,
        timezone: template.timezone,
        schedule: '',
        resourceId: '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        jobType: 'GITHUB_SYNC',
        frequency: 'DAILY',
        time: '09:00',
        timezone: 'UTC',
        schedule: '',
        resourceId: '',
      });
    }
    setEditingJob(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (job: ScheduledJob) => {
    setEditingJob(job);
    setFormData({
      name: job.name,
      description: job.description || '',
      jobType: job.jobType,
      frequency: job.frequency as string,
      time: job.time || '09:00',
      timezone: job.timezone || 'UTC',
      schedule: job.schedule || '',
      resourceId: job.resourceId || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await scheduleService.updateSchedule(editingJob.id, formData);
        showToast('success', `Updated schedule "${formData.name}"`);
      } else {
        await scheduleService.createSchedule(formData);
        showToast('success', `Created schedule "${formData.name}"`);
      }
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Error saving schedule');
    }
  };

  const handleToggleEnable = async (job: ScheduledJob) => {
    try {
      if (job.enabled) {
        await scheduleService.disableSchedule(job.id);
        showToast('success', `Paused automation "${job.name}"`);
      } else {
        await scheduleService.enableSchedule(job.id);
        showToast('success', `Enabled automation "${job.name}"`);
      }
      fetchData();
    } catch (err: any) {
      showToast('error', 'Failed to toggle schedule state');
    }
  };

  const handleRunNow = async (job: ScheduledJob) => {
    try {
      showToast('success', `Triggered immediate run for "${job.name}"`);
      await scheduleService.runNow(job.id);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Failed to trigger run now');
    }
  };

  const handleDeleteSchedule = async (job: ScheduledJob) => {
    if (!window.confirm(`Are you sure you want to delete "${job.name}"?`)) return;
    try {
      await scheduleService.deleteSchedule(job.id);
      showToast('success', `Deleted schedule "${job.name}"`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Failed to delete schedule');
    }
  };

  const handleOpenHistory = async (job: ScheduledJob) => {
    setSelectedJobHistory(job);
    setLoadingHistory(true);
    try {
      const execs = await scheduleService.getExecutions(job.id);
      setExecutionsHistory(execs);
    } catch (err: any) {
      showToast('error', 'Failed to load execution history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredSchedules = schedules.filter((s) => {
    if (activeTab === 'ACTIVE') return s.enabled && s.status === 'ACTIVE';
    if (activeTab === 'PAUSED') return !s.enabled || s.status === 'PAUSED';
    if (activeTab === 'FAILED') return s.status === 'FAILED';
    if (activeTab === 'NEEDS_ATTENTION') return s.status === 'NEEDS_ATTENTION' || (s.consecutiveFailures && s.consecutiveFailures >= 3);
    return true;
  });

  return (
    <PageContainer title="Automated Career Intelligence Scheduler">
      {actionMessage && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center justify-between text-sm ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-400" />
            <span>Automated Career Intelligence</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure recurring background syncs, report generation, application follow-up reminders & AI career insights.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={fetchData}
            className="text-slate-400 hover:text-white border border-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => handleOpenCreateModal()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Automation</span>
          </Button>
        </div>
      </div>

      {/* Summary Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Active Automations</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {summary?.activeCount ?? 0} <span className="text-xs text-slate-400 font-normal">/ {summary?.totalCount ?? 0}</span>
          </div>
          <p className="text-xs text-slate-400">Recurring background tasks enabled</p>
        </Card>

        <Card className="p-5 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Runs Completed Today</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {summary?.completedTodayCount ?? 0}
          </div>
          <p className="text-xs text-slate-400">Executions completed successfully</p>
        </Card>

        <Card className="p-5 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Next Scheduled Run</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-white truncate mb-1">
            {summary?.nextScheduledRun?.name || 'None Scheduled'}
          </div>
          <p className="text-xs text-slate-400 truncate">
            {summary?.nextScheduledRun?.nextRunAt
              ? new Date(summary.nextScheduledRun.nextRunAt).toLocaleString()
              : 'All schedules paused'}
          </p>
        </Card>

        <Card className="p-5 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Needs Attention</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mb-1">
            {summary?.needsAttentionCount ?? 0}
          </div>
          <p className="text-xs text-slate-400">Failed runs requiring configuration check</p>
        </Card>
      </div>

      {/* Recommended Templates Grid */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Recommended Automation Templates</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <Card
              key={tpl.id}
              className="p-4 bg-slate-900/60 border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {tpl.jobType}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {tpl.frequency} @ {tpl.time}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{tpl.name}</h3>
                <p className="text-xs text-slate-400 mb-4">{tpl.description}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCreateModal(tpl)}
                className="w-full border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 text-xs"
              >
                1-Click Configure
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Schedules List */}
      <Card className="bg-slate-900/80 border-slate-800 overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            {(['ALL', 'ACTIVE', 'PAUSED', 'NEEDS_ATTENTION', 'FAILED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Showing {filteredSchedules.length} of {schedules.length} Automations
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
            <p className="text-xs">Loading scheduled automations...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No automation schedules found</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Create a custom schedule or choose from the recommended templates above.
            </p>
            <Button size="sm" onClick={() => handleOpenCreateModal()}>
              Create Automation
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredSchedules.map((job) => (
              <div
                key={job.id}
                className="p-5 hover:bg-slate-800/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                    <span className="text-base font-semibold text-white">{job.name}</span>

                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {job.jobType}
                    </span>

                    {job.status === 'ACTIVE' && job.enabled && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </span>
                    )}

                    {(!job.enabled || job.status === 'PAUSED') && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1">
                        <Pause className="w-3 h-3" />
                        <span>PAUSED</span>
                      </span>
                    )}

                    {(job.status === 'FAILED' || job.status === 'NEEDS_ATTENTION') && (
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{job.status}</span>
                      </span>
                    )}
                  </div>

                  {job.description && <p className="text-xs text-slate-400">{job.description}</p>}

                  <div className="flex items-center space-x-4 text-xs text-slate-400 flex-wrap gap-y-1 pt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        {job.frequency} @ {job.time || '09:00'}
                      </span>
                    </span>

                    <span className="flex items-center space-x-1">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span>{job.timezone}</span>
                    </span>

                    {job.lastRunAt && (
                      <span>Last Run: {new Date(job.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}

                    {job.nextRunAt && job.enabled && (
                      <span className="text-indigo-300">
                        Next Run: {new Date(job.nextRunAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {job.lastError && (
                    <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-500/20">
                      <strong>Last Failure Error:</strong> {job.lastError}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-start lg:self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRunNow(job)}
                    className="text-xs text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20"
                    title="Trigger Run Now"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    <span>Run Now</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleEnable(job)}
                    className="text-xs text-slate-300 hover:bg-slate-800 border border-slate-700"
                  >
                    {job.enabled ? <Pause className="w-3.5 h-3.5 mr-1 text-amber-400" /> : <Play className="w-3.5 h-3.5 mr-1 text-emerald-400" />}
                    <span>{job.enabled ? 'Pause' : 'Enable'}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenHistory(job)}
                    className="text-xs text-slate-300 hover:bg-slate-800 border border-slate-700"
                    title="Execution History"
                  >
                    <History className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditModal(job)}
                    className="text-xs text-slate-300 hover:bg-slate-800 border border-slate-700"
                    title="Edit Schedule"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSchedule(job)}
                    className="text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20"
                    title="Delete Schedule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create / Edit Schedule Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingJob ? 'Edit Schedule' : 'Create New Automation Schedule'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Automation Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Daily GitHub & Repository Sync"
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of what this schedule automates"
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Job Type *</label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="GITHUB_SYNC">GitHub Repository Sync</option>
                    <option value="LEETCODE_SYNC">LeetCode Sync</option>
                    <option value="CODEFORCES_SYNC">Codeforces Sync</option>
                    <option value="PORTFOLIO_REFRESH">Portfolio Refresh</option>
                    <option value="RESUME_ANALYSIS">Resume Re-Analysis</option>
                    <option value="PROFILE_REFRESH">Cross-Platform Profile Refresh</option>
                    <option value="JOB_READINESS_REFRESH">Job Readiness Analysis</option>
                    <option value="CAREER_REPORT">Career Report Generation</option>
                    <option value="APPLICATION_FOLLOWUP_CHECK">Application Follow-up Check</option>
                    <option value="CAREER_INSIGHT">AI Career Insight Synthesis</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Frequency *</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="CUSTOM_CRON">Custom Cron Expression</option>
                    <option value="INTERVAL">Fixed Interval</option>
                  </select>
                </div>
              </div>

              {formData.frequency === 'CUSTOM_CRON' ? (
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Cron Expression * (5 fields)</label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="0 9 * * *"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Standard format: min hour dom month dow (e.g. "0 9 * * 1" for Monday 9am)</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Execution Time (HH:MM)</label>
                    <input
                      type="text"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="09:00"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Timezone</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  {editingJob ? 'Save Changes' : 'Create Automation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Execution History Modal */}
      {selectedJobHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Execution History</h3>
                <p className="text-xs text-slate-400">{selectedJobHistory.name}</p>
              </div>
              <button onClick={() => setSelectedJobHistory(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                <p className="text-xs">Fetching execution logs...</p>
              </div>
            ) : executionsHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No execution history records found for this schedule.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-800 text-xs">
                {executionsHistory.map((exec) => (
                  <div key={exec.id} className="py-3 px-2 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            exec.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : exec.status === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {exec.status}
                        </span>

                        <span className="text-slate-300 font-mono">
                          {new Date(exec.startedAt).toLocaleString()}
                        </span>
                      </div>

                      {exec.error && <p className="text-rose-400 text-[11px] font-mono">{exec.error}</p>}
                    </div>

                    <div className="text-right text-slate-400">
                      <div>{exec.durationMs ? `${exec.durationMs}ms` : '—'}</div>
                      {exec.taskId && <div className="text-[10px] font-mono text-slate-500">Task: {exec.taskId}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button variant="ghost" onClick={() => setSelectedJobHistory(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
