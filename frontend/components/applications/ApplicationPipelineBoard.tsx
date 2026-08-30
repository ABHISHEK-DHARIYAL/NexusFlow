import React, { useState } from 'react';
import { Application, ApplicationStatus } from '../../types';
import {
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  MoreVertical,
} from 'lucide-react';

interface ApplicationPipelineBoardProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onUpdateStatus: (applicationId: string, newStatus: ApplicationStatus, force?: boolean) => Promise<void>;
  onOpenCreateModal: () => void;
}

const KANBAN_COLUMNS: { id: ApplicationStatus; title: string; color: string; badgeColor: string }[] = [
  { id: 'SAVED', title: 'Saved', color: 'border-slate-700', badgeColor: 'bg-slate-800 text-slate-300' },
  { id: 'APPLYING', title: 'Applying', color: 'border-blue-800', badgeColor: 'bg-blue-900/50 text-blue-300' },
  { id: 'APPLIED', title: 'Applied', color: 'border-indigo-800', badgeColor: 'bg-indigo-900/50 text-indigo-300' },
  { id: 'SCREENING', title: 'Screening', color: 'border-purple-800', badgeColor: 'bg-purple-900/50 text-purple-300' },
  { id: 'ASSESSMENT', title: 'OA / Test', color: 'border-cyan-800', badgeColor: 'bg-cyan-900/50 text-cyan-300' },
  { id: 'INTERVIEW', title: 'Interview', color: 'border-amber-800', badgeColor: 'bg-amber-900/50 text-amber-300' },
  { id: 'FINAL_ROUND', title: 'Final Round', color: 'border-orange-800', badgeColor: 'bg-orange-900/50 text-orange-300' },
  { id: 'OFFER', title: 'Offer', color: 'border-emerald-800', badgeColor: 'bg-emerald-900/50 text-emerald-300' },
  { id: 'ACCEPTED', title: 'Accepted', color: 'border-green-800', badgeColor: 'bg-green-900/50 text-green-300' },
  { id: 'REJECTED', title: 'Rejected', color: 'border-rose-900', badgeColor: 'bg-rose-950/50 text-rose-400' },
];

export const ApplicationPipelineBoard: React.FC<ApplicationPipelineBoardProps> = ({
  applications,
  onSelectApplication,
  onUpdateStatus,
  onOpenCreateModal,
}) => {
  const [movingAppId, setMovingAppId] = useState<string | null>(null);
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus | null>(null);
  const [forceOverride, setForceOverride] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStageChange = async (app: Application, nextStatus: ApplicationStatus) => {
    try {
      setErrorMessage(null);
      await onUpdateStatus(app.id, nextStatus, false);
    } catch (err: any) {
      // If error suggests force override
      setMovingAppId(app.id);
      setTargetStatus(nextStatus);
      setErrorMessage(err.message || 'Invalid status transition');
    }
  };

  const handleConfirmForce = async () => {
    if (!movingAppId || !targetStatus) return;
    try {
      await onUpdateStatus(movingAppId, targetStatus, true);
      setMovingAppId(null);
      setTargetStatus(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to force status update');
    }
  };

  return (
    <div className="space-y-4">
      {/* Force Transition Error Dialog */}
      {movingAppId && targetStatus && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Status Transition Warning</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {errorMessage || `Are you sure you want to transition this application directly to ${targetStatus}?`}
            </p>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
              Normal pipeline flow requires sequential progression. Overriding is meant for correcting past entry mistakes.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setMovingAppId(null);
                  setTargetStatus(null);
                  setErrorMessage(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmForce}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg"
              >
                Force Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Scroll Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[620px] scrollbar-thin scrollbar-thumb-slate-800">
        {KANBAN_COLUMNS.map((col) => {
          const colApps = applications.filter((a) => a.status === col.id);

          return (
            <div
              key={col.id}
              className={`w-72 shrink-0 bg-slate-900/40 border ${col.color} rounded-xl flex flex-col max-h-[750px]`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">{col.title}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                    {colApps.length}
                  </span>
                </div>
              </div>

              {/* Card List */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
                {colApps.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-lg p-6 text-center text-xs text-slate-500 my-2">
                    No applications in {col.title}
                  </div>
                ) : (
                  colApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => onSelectApplication(app)}
                      className={`group bg-slate-900/90 border rounded-xl p-3.5 hover:border-blue-500/60 transition-all duration-200 cursor-pointer shadow-md relative ${
                        app.health === 'STALLED'
                          ? 'border-rose-500/40'
                          : app.health === 'NEEDS_ACTION'
                          ? 'border-amber-500/40'
                          : 'border-slate-800'
                      }`}
                    >
                      {/* Top Meta: Company & Priority */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                            {app.companyName.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-200 text-xs truncate">
                            {app.companyName}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            app.priority === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : app.priority === 'MEDIUM'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {app.priority}
                        </span>
                      </div>

                      {/* Job Title */}
                      <h4 className="font-bold text-slate-100 text-sm line-clamp-1 mb-1 group-hover:text-blue-400 transition-colors">
                        {app.jobTitle}
                      </h4>

                      {/* Location & Date */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
                        {app.location && <span className="truncate max-w-[120px]">{app.location}</span>}
                        <span className="flex items-center gap-1 font-mono text-[10px] ml-auto">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(app.applicationDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Part 17 Match & Part 18 Readiness Scores */}
                      <div className="grid grid-cols-2 gap-1.5 mb-3">
                        <div className="bg-slate-950/60 border border-slate-800 rounded p-1.5 text-center">
                          <div className="text-[10px] text-slate-500">Job Match</div>
                          <div className="text-xs font-bold text-blue-400">
                            {app.jobMatch ? `${app.jobMatch.overallMatchScore}%` : 'N/A'}
                          </div>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800 rounded p-1.5 text-center">
                          <div className="text-[10px] text-slate-500 font-sans">Readiness</div>
                          <div className="text-xs font-bold text-indigo-400">
                            {app.jobReadiness ? `${app.jobReadiness.score}%` : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Health / Stalled Warning */}
                      {app.health === 'STALLED' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded text-[11px] text-rose-300 font-medium mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Stalled ({app.stalledDays}d inactive)</span>
                        </div>
                      )}

                      {/* Action Recommendation */}
                      {app.nextAction && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-300 bg-slate-800/80 rounded px-2 py-1 mb-2 line-clamp-1">
                          <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="truncate">{app.nextAction}</span>
                        </div>
                      )}

                      {/* Move Stage Selector Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <select
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStageChange(app, e.target.value as ApplicationStatus);
                          }}
                          value={app.status}
                          className="bg-slate-950 text-slate-300 border border-slate-800 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                        >
                          {KANBAN_COLUMNS.map((c) => (
                            <option key={c.id} value={c.id}>
                              Move to {c.title}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectApplication(app);
                          }}
                          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                          title="View Application Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
