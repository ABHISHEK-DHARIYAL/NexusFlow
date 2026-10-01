import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  Users,
  CircleDot,
  GitPullRequest,
  Code2,
  ExternalLink,
  ShieldCheck,
  ListTodo,
  CheckCircle2,
  Clock,
  Tag,
  AlertCircle,
  FileCode,
  Loader2,
} from 'lucide-react';
import { repositoryService } from '../../services/repository.service';
import {
  Repository,
  RepositoryBranch,
  RepositoryCommit,
  RepositoryContributor,
  RepositoryIssue,
  RepositoryPullRequest,
  RepositoryLanguage,
} from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface RepositoryDetailTabsProps {
  repository: Repository;
}

export const RepositoryDetailTabs: React.FC<RepositoryDetailTabsProps> = ({ repository }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'branches' | 'commits' | 'contributors' | 'issues' | 'pulls' | 'languages'>('details');

  // Sub-resource states
  const [branches, setBranches] = useState<RepositoryBranch[]>([]);
  const [commits, setCommits] = useState<RepositoryCommit[]>([]);
  const [contributors, setContributors] = useState<RepositoryContributor[]>([]);
  const [issues, setIssues] = useState<RepositoryIssue[]>([]);
  const [pulls, setPulls] = useState<RepositoryPullRequest[]>([]);
  const [languages, setLanguages] = useState<RepositoryLanguage[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [issueFilter, setIssueFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [prFilter, setPrFilter] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    const loadTabContent = async () => {
      setLoading(true);
      try {
        if (activeTab === 'branches') {
          const res = await repositoryService.getBranches(repository.id);
          setBranches(res);
        } else if (activeTab === 'commits') {
          const res = await repositoryService.getCommits(repository.id);
          setCommits(res);
        } else if (activeTab === 'contributors') {
          const res = await repositoryService.getContributors(repository.id);
          setContributors(res);
        } else if (activeTab === 'issues') {
          const res = await repositoryService.getIssues(repository.id, issueFilter);
          setIssues(res);
        } else if (activeTab === 'pulls') {
          const res = await repositoryService.getPullRequests(repository.id, prFilter);
          setPulls(res);
        } else if (activeTab === 'languages') {
          const res = await repositoryService.getLanguages(repository.id);
          setLanguages(res);
        }
      } catch (err) {
        console.error(`Failed to load ${activeTab} for repo ${repository.id}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadTabContent();
  }, [activeTab, repository.id, issueFilter, prFilter]);

  const tabs = [
    { id: 'details', label: 'Repository Details', icon: <FileCode className="w-4 h-4" /> },
    { id: 'branches', label: 'Branches', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'commits', label: 'Commits', icon: <GitCommit className="w-4 h-4" /> },
    { id: 'contributors', label: 'Contributors', icon: <Users className="w-4 h-4" /> },
    { id: 'issues', label: 'Issues', icon: <CircleDot className="w-4 h-4" /> },
    { id: 'pulls', label: 'Pull Requests', icon: <GitPullRequest className="w-4 h-4" /> },
    { id: 'languages', label: 'Languages', icon: <Code2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Sub Tab Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-xs">Loading {activeTab} data...</p>
        </div>
      ) : (
        <>
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Repository Metadata</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Full Name</span>
                    <span className="font-mono text-slate-200">{repository.fullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Owner</span>
                    <span className="text-slate-200">{repository.owner}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Default Branch</span>
                    <span className="font-mono text-indigo-400">{repository.defaultBranch}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Visibility</span>
                    <Badge variant={repository.visibility === 'PRIVATE' ? 'slate' : 'blue'} size="sm">
                      {repository.visibility}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Primary Language</span>
                    <span className="font-medium text-slate-200">{repository.language || 'N/A'}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GitHub URLs & Clone Info</h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">GitHub Web URL</span>
                    <a
                      href={repository.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-indigo-400 hover:underline flex items-center space-x-1 truncate"
                    >
                      <span className="truncate">{repository.githubUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">HTTPS Clone Endpoint</span>
                    <code className="block p-2 bg-slate-950 border border-slate-800 rounded font-mono text-slate-300 text-[11px] overflow-x-auto">
                      {repository.cloneUrl}
                    </code>
                  </div>
                  <div className="pt-2 flex justify-between text-slate-400 text-[11px]">
                    <span>Last Synced: {repository.lastSyncedAt ? new Date(repository.lastSyncedAt).toLocaleString() : 'Never'}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === 'branches' && (
            <Card className="p-4 space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Repository Branches ({branches.length})
              </h4>
              {branches.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No branch metadata synced yet.</p>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {branches.map((b) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <GitBranch className="w-4 h-4 text-indigo-400" />
                        <span className="font-mono font-medium text-slate-200">{b.name}</span>
                        {b.name === repository.defaultBranch && (
                          <Badge variant="emerald" size="sm">default</Badge>
                        )}
                        {b.isProtected && (
                          <Badge variant="amber" size="sm">protected</Badge>
                        )}
                      </div>
                      {b.commitSha && (
                        <code className="text-[11px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {b.commitSha.substring(0, 7)}
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Commits Tab */}
          {activeTab === 'commits' && (
            <Card className="p-4 space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Recent Commits ({commits.length})
              </h4>
              {commits.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No commit history synced yet.</p>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {commits.map((c) => (
                    <div key={c.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3 min-w-0">
                        {c.authorAvatarUrl ? (
                          <img src={c.authorAvatarUrl} alt={c.authorName || 'Author'} className="w-7 h-7 rounded-full mt-0.5" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold mt-0.5">
                            {(c.authorName || 'A').substring(0, 1)}
                          </div>
                        )}
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-medium text-slate-200 line-clamp-2">{c.message}</p>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                            <span className="text-slate-400">{c.authorName || 'Anonymous'}</span>
                            <span>•</span>
                            <span>{new Date(c.commitDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center space-x-2">
                        <code className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                          {c.sha.substring(0, 7)}
                        </code>
                        {c.githubUrl && (
                          <a href={c.githubUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Contributors Tab */}
          {activeTab === 'contributors' && (
            <Card className="p-4 space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Repository Contributors ({contributors.length})
              </h4>
              {contributors.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No contributor data synced yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {contributors.map((contrib) => (
                    <div key={contrib.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {contrib.avatarUrl ? (
                          <img src={contrib.avatarUrl} alt={contrib.username} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold">
                            {contrib.username.substring(0, 1)}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{contrib.username}</p>
                          <p className="text-[11px] text-slate-500">{contrib.contributions} commits</p>
                        </div>
                      </div>
                      {contrib.profileUrl && (
                        <a href={contrib.profileUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Issues Tab */}
          {activeTab === 'issues' && (
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Issues ({issues.length})
                </h4>
                <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setIssueFilter('all')}
                    className={`px-2.5 py-1 text-[11px] rounded transition-colors ${issueFilter === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setIssueFilter('open')}
                    className={`px-2.5 py-1 text-[11px] rounded transition-colors ${issueFilter === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setIssueFilter('closed')}
                    className={`px-2.5 py-1 text-[11px] rounded transition-colors ${issueFilter === 'closed' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Closed
                  </button>
                </div>
              </div>

              {issues.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No issues found.</p>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {issues.map((issue) => (
                    <div key={issue.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Badge variant={issue.state === 'open' ? 'emerald' : 'purple'} size="sm">
                            #{issue.issueNumber} {issue.state}
                          </Badge>
                          <span className="text-xs font-semibold text-slate-200 truncate">{issue.title}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                          <span>Opened by {issue.authorUsername || 'Anonymous'}</span>
                          {issue.githubCreatedAt && (
                            <span>• {new Date(issue.githubCreatedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      {issue.githubUrl && (
                        <a href={issue.githubUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Pull Requests Tab */}
          {activeTab === 'pulls' && (
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Pull Requests ({pulls.length})
                </h4>
                <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setPrFilter('all')}
                    className={`px-2.5 py-1 text-[11px] rounded transition-colors ${prFilter === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setPrFilter('open')}
                    className={`px-2.5 py-1 text-[11px] rounded transition-colors ${prFilter === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setPrFilter('closed')}
                    className={`px-2.5 py-1 text-[11px] rounded transition-colors ${prFilter === 'closed' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Closed / Merged
                  </button>
                </div>
              </div>

              {pulls.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No pull requests found.</p>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {pulls.map((pr) => (
                    <div key={pr.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={pr.isMerged ? 'purple' : pr.state === 'open' ? 'emerald' : 'slate'}
                            size="sm"
                          >
                            #{pr.prNumber} {pr.isMerged ? 'merged' : pr.state}
                          </Badge>
                          <span className="text-xs font-semibold text-slate-200 truncate">{pr.title}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                          <span>Created by {pr.authorUsername || 'Anonymous'}</span>
                          {pr.githubCreatedAt && (
                            <span>• {new Date(pr.githubCreatedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      {pr.githubUrl && (
                        <a href={pr.githubUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Languages Chart Tab */}
          {activeTab === 'languages' && (
            <Card className="p-5 space-y-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Language Breakdown ({languages.length} detected)
              </h4>

              {languages.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No language metrics synced yet.</p>
              ) : (
                <div className="space-y-4">
                  {/* Visual Bar Stack */}
                  <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-950 border border-slate-800">
                    {languages.map((lang, idx) => {
                      const colors = [
                        'bg-indigo-500',
                        'bg-emerald-500',
                        'bg-amber-500',
                        'bg-sky-500',
                        'bg-purple-500',
                        'bg-rose-500',
                        'bg-teal-500',
                      ];
                      const bg = colors[idx % colors.length];
                      return (
                        <div
                          key={lang.id}
                          style={{ width: `${lang.percentage}%` }}
                          className={`${bg} h-full transition-all`}
                          title={`${lang.name}: ${lang.percentage}%`}
                        />
                      );
                    })}
                  </div>

                  {/* Language Breakdown Legend */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {languages.map((lang, idx) => {
                      const colors = [
                        'bg-indigo-500',
                        'bg-emerald-500',
                        'bg-amber-500',
                        'bg-sky-500',
                        'bg-purple-500',
                        'bg-rose-500',
                        'bg-teal-500',
                      ];
                      const bg = colors[idx % colors.length];
                      return (
                        <div key={lang.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`w-3 h-3 rounded-full ${bg}`} />
                            <span className="text-xs font-medium text-slate-200">{lang.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-slate-100">{lang.percentage}%</span>
                            <span className="block text-[10px] text-slate-500 font-mono">
                              {Number(lang.bytes).toLocaleString()} bytes
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};
