import React, { useEffect, useState, useCallback } from 'react';
import {
  Application,
  ApplicationStats,
  CreateApplicationInput,
  ApplicationStatus,
  FollowUpDraft,
} from '../types';
import { PageContainer } from '../components/layout/PageContainer';
import { ApplicationOverviewCards } from '../components/applications/ApplicationOverviewCards';
import { ApplicationFunnelAnalytics } from '../components/applications/ApplicationFunnelAnalytics';
import { ApplicationPipelineBoard } from '../components/applications/ApplicationPipelineBoard';
import { ApplicationListView } from '../components/applications/ApplicationListView';
import { CreateApplicationModal } from '../components/applications/CreateApplicationModal';
import { ApplicationDetailModal } from '../components/applications/ApplicationDetailModal';
import { useAuthStore } from '../store/useAuthStore';
import {
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  TrendingUp,
  Briefcase,
  AlertCircle,
  Filter,
} from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const { accessToken: token } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeHealthFilter, setActiveHealthFilter] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Fetch applications & stats from backend
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const [appsRes, statsRes] = await Promise.all([
        fetch('/api/applications', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/applications/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!appsRes.ok) throw new Error('Failed to load applications');
      if (!statsRes.ok) throw new Error('Failed to load application statistics');

      const appsData = await appsRes.json();
      const statsData = await statsRes.json();

      setApplications(appsData.data || []);
      setStats(statsData.data || null);
    } catch (err: any) {
      setError(err.message || 'An error occurred loading application tracker data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler: Create Application
  const handleCreateApplication = async (input: CreateApplicationInput) => {
    if (!token) return;
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to create application');
    }

    await fetchData();
  };

  // Handler: Update Application Status
  const handleUpdateStatus = async (
    applicationId: string,
    newStatus: ApplicationStatus,
    force?: boolean
  ) => {
    if (!token) return;
    const res = await fetch(`/api/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus, force }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to update status');
    }

    await fetchData();

    // Update selected app if open in detail modal
    if (selectedApplication && selectedApplication.id === applicationId) {
      const updated = await res.json();
      setSelectedApplication(updated.data);
    }
  };

  // Handler: Delete Application
  const handleDeleteApplication = async (applicationId: string) => {
    if (!token) return;
    const res = await fetch(`/api/applications/${applicationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error?.message || 'Failed to delete application');
      return;
    }

    if (selectedApplication?.id === applicationId) {
      setSelectedApplication(null);
    }
    await fetchData();
  };

  // Handler: Add Event
  const handleAddEvent = async (
    applicationId: string,
    title: string,
    type: string,
    description?: string
  ) => {
    if (!token) return;
    const res = await fetch(`/api/applications/${applicationId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, type, description }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to add timeline event');
    }

    // Refresh modal application
    const appRes = await fetch(`/api/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (appRes.ok) {
      const updated = await appRes.json();
      setSelectedApplication(updated.data);
    }
    await fetchData();
  };

  // Handler: Add Follow-up
  const handleAddFollowUp = async (
    applicationId: string,
    title: string,
    followUpDate: string,
    note?: string
  ) => {
    if (!token) return;
    const res = await fetch(`/api/applications/${applicationId}/follow-ups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, followUpDate, followUpNote: note }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to add follow-up reminder');
    }

    const appRes = await fetch(`/api/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (appRes.ok) {
      const updated = await appRes.json();
      setSelectedApplication(updated.data);
    }
    await fetchData();
  };

  // Handler: Toggle Follow-Up Completed
  const handleToggleFollowUp = async (
    applicationId: string,
    followUpId: string,
    completed: boolean
  ) => {
    if (!token) return;
    const res = await fetch(`/api/applications/${applicationId}/follow-ups/${followUpId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error?.message || 'Failed to update follow-up');
      return;
    }

    const appRes = await fetch(`/api/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (appRes.ok) {
      const updated = await appRes.json();
      setSelectedApplication(updated.data);
    }
    await fetchData();
  };

  // Handler: Gemini Follow-Up Email Draft
  const handleDraftFollowUp = async (applicationId: string): Promise<FollowUpDraft> => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`/api/applications/${applicationId}/draft-followup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to generate email draft');
    }

    const json = await res.json();
    return json.data;
  };

  // Filtered applications by top health card click
  const displayApplications = applications.filter((app) => {
    if (!activeHealthFilter || activeHealthFilter === 'ALL') return true;
    if (activeHealthFilter === 'STALLED') return app.health === 'STALLED';
    if (activeHealthFilter === 'NEEDS_ACTION') return app.health === 'NEEDS_ACTION';
    if (activeHealthFilter === 'ACTIVE')
      return !['OFFER', 'ACCEPTED', 'REJECTED', 'SAVED'].includes(app.status);
    if (activeHealthFilter === 'INTERVIEWS')
      return ['SCREENING', 'ASSESSMENT', 'INTERVIEW', 'FINAL_ROUND'].includes(app.status);
    if (activeHealthFilter === 'OFFERS') return ['OFFER', 'ACCEPTED'].includes(app.status);
    return true;
  });

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <Briefcase className="w-4 h-4" /> NexusFlow Application Intelligence
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Job / Application Tracker</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Manage application pipeline integrated with Job Matching, Readiness, & Career Intelligence
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-2 ${
                showAnalytics
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Funnel Analytics
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Kanban Pipeline Board"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Table List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={fetchData}
              className="p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Refresh applications"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-lg flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Track Application
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Overview Stat Cards */}
        <ApplicationOverviewCards
          stats={stats}
          loading={loading}
          onFilterHealth={setActiveHealthFilter}
          activeHealthFilter={activeHealthFilter}
        />

        {/* Funnel Analytics Dropdown */}
        {showAnalytics && <ApplicationFunnelAnalytics stats={stats} />}

        {/* Main Application Views */}
        {viewMode === 'kanban' ? (
          <ApplicationPipelineBoard
            applications={displayApplications}
            onSelectApplication={(app) => setSelectedApplication(app)}
            onUpdateStatus={handleUpdateStatus}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <ApplicationListView
            applications={displayApplications}
            onSelectApplication={(app) => setSelectedApplication(app)}
            onDeleteApplication={handleDeleteApplication}
          />
        )}

        {/* Modals */}
        <CreateApplicationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateApplication}
        />

        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdateStatus={handleUpdateStatus}
          onAddEvent={handleAddEvent}
          onAddFollowUp={handleAddFollowUp}
          onToggleFollowUp={handleToggleFollowUp}
          onDraftFollowUp={handleDraftFollowUp}
        />
      </div>
    </PageContainer>
  );
};
