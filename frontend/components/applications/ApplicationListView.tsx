import React, { useState, useMemo } from 'react';
import { Application, ApplicationStatus, ApplicationPriority } from '../../types';
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Calendar,
  Building2,
  Trash2,
} from 'lucide-react';

interface ApplicationListViewProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onDeleteApplication: (applicationId: string) => Promise<void>;
}

export const ApplicationListView: React.FC<ApplicationListViewProps> = ({
  applications,
  onSelectApplication,
  onDeleteApplication,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'match' | 'readiness' | 'company'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        const matchesSearch =
          app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (app.location && app.location.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || app.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'date') {
          comp = new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime();
        } else if (sortBy === 'match') {
          comp = (a.jobMatch?.overallMatchScore || 0) - (b.jobMatch?.overallMatchScore || 0);
        } else if (sortBy === 'readiness') {
          comp = (a.jobReadiness?.score || 0) - (b.jobReadiness?.score || 0);
        } else if (sortBy === 'company') {
          comp = a.companyName.localeCompare(b.companyName);
        }
        return sortOrder === 'desc' ? -comp : comp;
      });
  }, [applications, searchQuery, statusFilter, priorityFilter, sortBy, sortOrder]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search company, job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Stages</option>
            <option value="SAVED">Saved</option>
            <option value="APPLYING">Applying</option>
            <option value="APPLIED">Applied</option>
            <option value="SCREENING">Screening</option>
            <option value="ASSESSMENT">Assessment</option>
            <option value="INTERVIEW">Interview</option>
            <option value="FINAL_ROUND">Final Round</option>
            <option value="OFFER">Offer</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          {/* Sort Selector */}
          <button
            onClick={() => {
              if (sortBy === 'date') setSortBy('match');
              else if (sortBy === 'match') setSortBy('readiness');
              else if (sortBy === 'readiness') setSortBy('company');
              else setSortBy('date');
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort: {sortBy.toUpperCase()}</span>
          </button>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 font-mono uppercase"
          >
            {sortOrder}
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Role & Company</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Job Match</th>
              <th className="py-3 px-4">Readiness</th>
              <th className="py-3 px-4">Prep Coverage</th>
              <th className="py-3 px-4">Next Intelligence Action</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredApps.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No applications match current filters.
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => onSelectApplication(app)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  {/* Role & Company */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                        {app.companyName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {app.jobTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{app.companyName}</span>
                          {app.location && <span>• {app.location}</span>}
                          <span className="font-mono text-slate-500">
                            • {new Date(app.applicationDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Stage & Health */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-slate-200">{app.status}</span>
                      {app.health === 'STALLED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          Stalled ({app.stalledDays}d)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        app.priority === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : app.priority === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {app.priority}
                    </span>
                  </td>

                  {/* Part 17 Job Match */}
                  <td className="py-3.5 px-4">
                    {app.jobMatch ? (
                      <span className="font-mono font-bold text-blue-400">
                        {app.jobMatch.overallMatchScore}%
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono">N/A</span>
                    )}
                  </td>

                  {/* Part 18 Job Readiness */}
                  <td className="py-3.5 px-4">
                    {app.jobReadiness ? (
                      <span className="font-mono font-bold text-indigo-400">
                        {app.jobReadiness.score}%
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono">N/A</span>
                    )}
                  </td>

                  {/* Part 19 Company Prep Coverage */}
                  <td className="py-3.5 px-4">
                    {app.companyPreparation ? (
                      <span className="font-mono font-bold text-emerald-400">
                        {app.companyPreparation.preparationCoverageScore}%
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono">N/A</span>
                    )}
                  </td>

                  {/* Next Intelligence Action */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-300 max-w-xs truncate">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{app.nextAction || 'Track follow-up date'}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectApplication(app);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        title="View details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete application for ${app.companyName}?`)) {
                            onDeleteApplication(app.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                        title="Delete application"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
