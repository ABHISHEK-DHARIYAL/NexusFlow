import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Play,
  Sparkles,
  Eye,
  Star,
  GitFork,
  Clock
} from 'lucide-react';
import { Repository, AIAnalysisReport } from '../../types';
import { ImportRepoModal } from './ImportRepoModal';
import { RepoDetailModal } from './RepoDetailModal';

interface RepositoryListProps {
  repositories: Repository[];
  reports: AIAnalysisReport[];
  onImportRepository: (fullName: string, description: string, language: string) => void;
  onSyncRepository: (id: string) => void;
  onTriggerAnalysis: (repoId: string) => void;
}

export const RepositoryList: React.FC<RepositoryListProps> = ({
  repositories,
  reports,
  onImportRepository,
  onSyncRepository,
  onTriggerAnalysis,
}) => {
  const [search, setSearch] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

  const filteredRepos = repositories.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.language?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-indigo-400" />
            Tracked Repositories
          </h2>
          <p className="text-xs text-slate-400">
            Import and inspect GitHub repositories analyzed by NexusFlow
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter repositories..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition shrink-0"
          >
            <Plus className="h-4 w-4" /> Import Repo
          </button>
        </div>
      </div>

      {/* Repositories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRepos.map((repo) => {
          const report = reports.find((rep) => rep.repositoryId === repo.id);
          return (
            <div
              key={repo.id}
              className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-indigo-500/50 hover:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300 font-mono border border-indigo-500/20">
                      {repo.visibility}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 mt-1.5 group-hover:text-indigo-300 transition">
                      {repo.fullName}
                    </h3>
                  </div>
                  <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                    {repo.healthScore || 85}/100
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {repo.description || 'No description provided.'}
                </p>

                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-400">{repo.language || 'Code'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {repo.starsCount}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><GitFork className="h-3 w-3" /> {repo.forksCount}</span>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-800/80 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedRepo(repo)}
                    className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    title="Inspect Details"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-400" /> Details
                  </button>
                  <button
                    onClick={() => onSyncRepository(repo.id)}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                    title="Sync GitHub"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onTriggerAnalysis(repo.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-600/40 transition"
                >
                  <Play className="h-3 w-3 fill-indigo-300" /> Gemini Audit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Import Modal */}
      <ImportRepoModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={onImportRepository}
      />

      {/* Repo Detail Modal */}
      <RepoDetailModal
        isOpen={!!selectedRepo}
        onClose={() => setSelectedRepo(null)}
        repository={selectedRepo}
        report={reports.find((r) => r.repositoryId === selectedRepo?.id) || null}
        tasks={[]}
        onTriggerAnalysis={onTriggerAnalysis}
      />
    </div>
  );
};
