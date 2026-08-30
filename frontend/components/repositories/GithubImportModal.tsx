import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Github,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Lock,
  Globe,
  Star,
  GitFork,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { repositoryService } from '../../services/repository.service';
import { GithubRepositoryItem, Repository } from '../../types';

interface GithubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (repo: Repository) => void;
}

export const GithubImportModal: React.FC<GithubImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [githubRepos, setGithubRepos] = useState<GithubRepositoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [importingRepoName, setImportingRepoName] = useState<string | null>(null);
  const [importedRepoNames, setImportedRepoNames] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'browser' | 'manual'>('browser');

  const fetchGithubRepos = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const repos = await repositoryService.getGithubRepositories({ per_page: 100 });
      setGithubRepos(repos);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to fetch GitHub repositories. Please ensure your GitHub account is connected.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGithubRepos();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGithubRepos();
  };

  const handleImport = async (fullName: string) => {
    setImportingRepoName(fullName);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await repositoryService.importRepository({ fullName });
      setImportedRepoNames((prev) => new Set(prev).add(fullName));
      setSuccessMessage(`Successfully imported ${fullName}! Synchronization initiated.`);
      onImportSuccess(result.repository);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || `Failed to import ${fullName}`;
      setErrorMessage(msg);
    } finally {
      setImportingRepoName(null);
    }
  };

  const handleManualImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim() || !manualInput.includes('/')) {
      setErrorMessage('Please enter a valid GitHub repository in owner/repository format.');
      return;
    }
    handleImport(manualInput.trim());
  };

  const filteredRepos = githubRepos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Import GitHub Repository</h3>
              <p className="text-xs text-slate-400">Import repositories from your authenticated GitHub account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('browser')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'browser'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            GitHub Account Repositories
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Manual Repository Name
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'browser' ? (
          <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
            {/* Search & Actions Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your GitHub repositories..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors border border-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Repositories List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  <p className="text-sm">Fetching your GitHub repositories...</p>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FolderPlus className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">No repositories found matching your filter.</p>
                </div>
              ) : (
                filteredRepos.map((repo) => {
                  const isImporting = importingRepoName === repo.full_name;
                  const isImported = importedRepoNames.has(repo.full_name);

                  return (
                    <div
                      key={repo.id}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-200 hover:text-indigo-400 transition-colors truncate">
                            {repo.full_name}
                          </span>
                          {repo.private ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Lock className="w-2.5 h-2.5 mr-1" /> Private
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Globe className="w-2.5 h-2.5 mr-1" /> Public
                            </span>
                          )}
                        </div>

                        {repo.description && (
                          <p className="text-xs text-slate-400 line-clamp-1">{repo.description}</p>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                          {repo.language && <span className="text-indigo-400 font-medium">{repo.language}</span>}
                          <span className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-amber-400" />
                            <span>{repo.stargazers_count}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <GitFork className="w-3 h-3 text-slate-400" />
                            <span>{repo.forks_count}</span>
                          </span>
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-slate-300 flex items-center space-x-0.5"
                          >
                            <span>GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div>
                        {isImported ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Imported
                          </span>
                        ) : (
                          <button
                            onClick={() => handleImport(repo.full_name)}
                            disabled={isImporting}
                            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all shadow-sm hover:shadow-indigo-500/20 disabled:opacity-50"
                          >
                            {isImporting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Importing...</span>
                              </>
                            ) : (
                              <>
                                <FolderPlus className="w-3.5 h-3.5" />
                                <span>Import</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualImportSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">Repository Full Name</label>
              <p className="text-xs text-slate-400">
                Enter any public or accessible GitHub repository in <code className="text-indigo-400">owner/repository</code> format.
              </p>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. facebook/react"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!manualInput.trim() || importingRepoName !== null}
                className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                {importingRepoName ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4" />
                    <span>Import Repository</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
