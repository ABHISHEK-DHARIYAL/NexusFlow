import React, { useState } from 'react';
import { Application, ApplicationStatus, FollowUpDraft } from '../../types';
import {
  X,
  Building2,
  Calendar,
  ExternalLink,
  Sparkles,
  Clock,
  Briefcase,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Send,
  Trash2,
  Bell,
  Mail,
  Copy,
  Check,
} from 'lucide-react';

interface ApplicationDetailModalProps {
  application: Application | null;
  onClose: () => void;
  onUpdateStatus: (applicationId: string, status: ApplicationStatus, force?: boolean) => Promise<void>;
  onAddEvent: (applicationId: string, title: string, type: string, description?: string) => Promise<void>;
  onAddFollowUp: (applicationId: string, title: string, followUpDate: string, note?: string) => Promise<void>;
  onToggleFollowUp: (applicationId: string, followUpId: string, completed: boolean) => Promise<void>;
  onDraftFollowUp: (applicationId: string) => Promise<FollowUpDraft>;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
  onUpdateStatus,
  onAddEvent,
  onAddFollowUp,
  onToggleFollowUp,
  onDraftFollowUp,
}) => {
  if (!application) return null;

  const [activeTab, setActiveTab] = useState<
    'overview' | 'timeline' | 'match' | 'readiness' | 'company' | 'interviews' | 'followup'
  >('overview');

  // New Event Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('NOTE');
  const [eventDesc, setEventDesc] = useState('');

  // New Follow-Up Form state
  const [fuTitle, setFuTitle] = useState('');
  const [fuDate, setFuDate] = useState('');
  const [fuNote, setFuNote] = useState('');

  // AI Draft Email state
  const [draft, setDraft] = useState<FollowUpDraft | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    await onAddEvent(application.id, eventTitle.trim(), eventType, eventDesc.trim() || undefined);
    setEventTitle('');
    setEventDesc('');
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuTitle.trim() || !fuDate) return;
    await onAddFollowUp(application.id, fuTitle.trim(), fuDate, fuNote.trim() || undefined);
    setFuTitle('');
    setFuDate('');
    setFuNote('');
  };

  const handleGenerateDraft = async () => {
    try {
      setDrafting(true);
      const res = await onDraftFollowUp(application.id);
      setDraft(res);
    } catch (err: any) {
      alert(err.message || 'Failed to generate draft email');
    } finally {
      setDrafting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full my-8 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between shrink-0 bg-slate-900/90 rounded-t-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg shrink-0">
              {application.companyName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-white tracking-tight">{application.jobTitle}</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {application.status}
                </span>
                {application.health === 'STALLED' && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Stalled ({application.stalledDays}d)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="font-medium text-slate-200">{application.companyName}</span>
                {application.location && <span>• {application.location}</span>}
                <span className="font-mono">
                  Applied {new Date(application.applicationDate).toLocaleDateString()}
                </span>
                {application.jobUrl && (
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    View Posting <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intelligence Quick Stats Bar */}
        <div className="grid grid-cols-4 divide-x divide-slate-800 bg-slate-950/60 border-b border-slate-800 text-center py-3 text-xs shrink-0">
          <div>
            <div className="text-[11px] text-slate-500">Job Match (Part 17)</div>
            <div className="font-mono font-bold text-blue-400 text-base">
              {application.jobMatch ? `${application.jobMatch.overallMatchScore}%` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Readiness Score (Part 18)</div>
            <div className="font-mono font-bold text-indigo-400 text-base">
              {application.jobReadiness ? `${application.jobReadiness.score}%` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Prep Coverage (Part 19)</div>
            <div className="font-mono font-bold text-emerald-400 text-base">
              {application.companyPreparation ? `${application.companyPreparation.preparationCoverageScore}%` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Mock Sessions (Part 20)</div>
            <div className="font-mono font-bold text-amber-400 text-base">
              {application.interviewHistory ? application.interviewHistory.sessionCount : 0}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 gap-6 bg-slate-900/40 text-xs font-medium overflow-x-auto shrink-0">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'timeline', label: `Timeline (${application.events?.length || 0})` },
            { id: 'match', label: 'Job Match' },
            { id: 'readiness', label: 'Readiness' },
            { id: 'company', label: 'Company Prep' },
            { id: 'interviews', label: 'Interview History' },
            { id: 'followup', label: `Follow-ups (${application.followUps?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Next Recommended Action Banner */}
              {application.nextAction && (
                <div className="p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-blue-300 font-bold uppercase tracking-wider">
                        Recommended Next Action
                      </div>
                      <div className="text-sm font-semibold text-white mt-0.5">
                        {application.nextAction}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Update Quick Selector */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-slate-200 mb-2">Stage Progression</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'SAVED',
                    'APPLYING',
                    'APPLIED',
                    'SCREENING',
                    'ASSESSMENT',
                    'INTERVIEW',
                    'FINAL_ROUND',
                    'OFFER',
                    'ACCEPTED',
                    'REJECTED',
                  ].map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateStatus(application.id, st as ApplicationStatus)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        application.status === st
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-slate-200 mb-2">Application Notes</h4>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {application.notes || 'No notes added for this application.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {/* Add Event Form */}
              <form onSubmit={handleCreateEvent} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-200">Record Timeline Event</h4>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Event title (e.g., HR Screen completed)"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="STAGE_CHANGE">Stage Change</option>
                    <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                    <option value="ASSESSMENT_COMPLETED">Assessment Completed</option>
                    <option value="NOTE">General Note</option>
                    <option value="FOLLOW_UP_SENT">Follow-up Sent</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  placeholder="Optional event details..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Event
                </button>
              </form>

              {/* Events List */}
              <div className="space-y-3 relative border-l-2 border-slate-800 ml-4 pl-6">
                {(application.events || []).map((ev) => (
                  <div key={ev.id} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{ev.title}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {new Date(ev.eventDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono uppercase">{ev.type}</div>
                      {ev.description && (
                        <p className="text-slate-300 text-xs mt-1">{ev.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: JOB MATCH */}
          {activeTab === 'match' && (
            <div className="space-y-4">
              {application.jobMatch ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">Part 17 Job Description Match</h4>
                      <p className="text-slate-400 text-xs">Evaluated against candidate portfolio & repos</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-400 font-mono">
                      {application.jobMatch.overallMatchScore}%
                    </div>
                  </div>

                  {application.jobMatch.keyMatchHighlights && (
                    <div>
                      <div className="font-semibold text-slate-300 mb-1">Match Highlights</div>
                      <ul className="list-disc list-inside text-slate-300 space-y-1">
                        {application.jobMatch.keyMatchHighlights.map((h, idx) => (
                          <li key={idx}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {application.jobMatch.missingSkills && (
                    <div>
                      <div className="font-semibold text-rose-400 mb-1">Missing / Gap Skills</div>
                      <div className="flex flex-wrap gap-1.5">
                        {application.jobMatch.missingSkills.map((sk, idx) => (
                          <span
                            key={idx}
                            className="bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded text-[11px]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-400">
                  No linked Job Description match analysis found.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: READINESS */}
          {activeTab === 'readiness' && (
            <div className="space-y-4">
              {application.jobReadiness ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">Part 18 Job Readiness Intelligence</h4>
                      <p className="text-slate-400 text-xs">Composite score based on technical depth, DSA, & projects</p>
                    </div>
                    <div className="text-2xl font-bold text-indigo-400 font-mono">
                      {application.jobReadiness.score}%
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-indigo-300 mb-1">Top Skill Gaps</div>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {application.jobReadiness.topSkillGaps.map((gap, idx) => (
                        <li key={idx}>{gap}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="font-semibold text-emerald-400 mb-1">Key Strengths</div>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {application.jobReadiness.keyStrengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-400">
                  No readiness assessment found for this position.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COMPANY PREP */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              {application.companyPreparation ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">Part 19 Company Intelligence</h4>
                      <p className="text-slate-400 text-xs">Coverage score for company tech stack & culture</p>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400 font-mono">
                      {application.companyPreparation.preparationCoverageScore}%
                    </div>
                  </div>

                  {application.companyPreparation.primaryTechStack && (
                    <div>
                      <div className="font-semibold text-slate-300 mb-1">Primary Tech Stack</div>
                      <div className="flex flex-wrap gap-1.5">
                        {application.companyPreparation.primaryTechStack.map((tech, idx) => (
                          <span key={idx} className="bg-slate-800 text-blue-300 px-2.5 py-1 rounded text-xs">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {application.companyPreparation.interviewFocusAreas && (
                    <div>
                      <div className="font-semibold text-amber-300 mb-1">Interview Focus Areas</div>
                      <ul className="list-disc list-inside text-slate-300 space-y-1">
                        {application.companyPreparation.interviewFocusAreas.map((fa, idx) => (
                          <li key={idx}>{fa}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-400">
                  No company prep intelligence linked.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: INTERVIEW HISTORY */}
          {activeTab === 'interviews' && (
            <div className="space-y-4">
              {application.interviewHistory ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h4 className="font-bold text-slate-100 text-sm">Part 20 Career Coach Interview Mock Sessions</h4>
                  <p className="text-slate-400 text-xs">
                    Mock sessions conducted for this application role
                  </p>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {application.interviewHistory.sessionCount} Mock Sessions Completed
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Last Session:{' '}
                        {application.interviewHistory.lastSessionDate
                          ? new Date(application.interviewHistory.lastSessionDate).toLocaleDateString()
                          : 'None'}
                      </div>
                    </div>
                    <a
                      href="/career"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs"
                    >
                      Open Interview Coach
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-400">
                  No interview sessions recorded yet. Launch the Career Coach to practice mock interviews!
                </div>
              )}
            </div>
          )}

          {/* TAB 7: FOLLOW-UPS & GEMINI DRAFT GENERATOR */}
          {activeTab === 'followup' && (
            <div className="space-y-6">
              {/* AI Follow-Up Email Generator Card */}
              <div className="p-5 bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/50 border border-blue-500/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Sparkles className="w-5 h-5" />
                    <h4 className="font-bold text-white text-sm">AI Follow-Up Email Generator</h4>
                  </div>
                  <button
                    onClick={handleGenerateDraft}
                    disabled={drafting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                    {drafting ? 'Generating Draft...' : 'Draft Follow-Up Email'}
                  </button>
                </div>

                {draft && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-slate-200">Generated Email Draft</span>
                      <button
                        onClick={() =>
                          copyToClipboard(`Subject: ${draft.subject}\n\n${draft.body}`)
                        }
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Draft'}
                      </button>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">SUBJECT</div>
                      <div className="font-semibold text-slate-100">{draft.subject}</div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">BODY</div>
                      <div className="text-slate-300 whitespace-pre-wrap font-sans text-xs bg-slate-900 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                        {draft.body}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Follow-up Form */}
              <form onSubmit={handleCreateFollowUp} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-200">Set Follow-Up Reminder</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Reminder title (e.g. Follow up on interview status)"
                    value={fuTitle}
                    onChange={(e) => setFuTitle(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="date"
                    required
                    value={fuDate}
                    onChange={(e) => setFuDate(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" /> Set Reminder
                </button>
              </form>

              {/* Follow-Up Reminders List */}
              <div className="space-y-3">
                {(application.followUps || []).map((fu) => (
                  <div
                    key={fu.id}
                    className={`p-4 border rounded-xl flex items-center justify-between ${
                      fu.completed
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={fu.completed}
                        onChange={(e) => onToggleFollowUp(application.id, fu.id, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div
                          className={`font-semibold text-slate-200 ${
                            fu.completed ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          {fu.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Due: {new Date(fu.followUpDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        fu.reminderStatus === 'OVERDUE'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : fu.reminderStatus === 'DUE_TODAY'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {fu.reminderStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
