import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileCheck,
  Github,
  Code2,
  Briefcase,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import {
  CareerChat,
  CareerChatMessage,
  CareerCoachMode,
} from '../../types';

interface CareerChatViewProps {
  chats: CareerChat[];
  activeChat: CareerChat | null;
  onSelectChat: (chatId: string) => void;
  onCreateNewChat: (mode: CareerCoachMode, initialMsg?: string) => void;
  onDeleteChat: (chatId: string) => void;
  onSendMessage: (chatId: string, message: string, mode: CareerCoachMode) => void;
  isLoading: boolean;
}

const MODES: { id: CareerCoachMode; label: string; desc: string }[] = [
  { id: 'GENERAL_CAREER_CHAT', label: 'General Career Chat', desc: 'Ask anything about your software engineering career.' },
  { id: 'CAREER_MENTOR', label: 'Career Mentor', desc: 'Strategic advice on growth, positioning, and leveling up.' },
  { id: 'JOB_COACH', label: 'Job Coach', desc: 'Grounded guidance on target jobs, requirements, and readiness.' },
  { id: 'RESUME_REVIEWER', label: 'Resume Reviewer', desc: 'ATS alignment, bullet points, and impact verification.' },
  { id: 'GITHUB_REVIEWER', label: 'GitHub Reviewer', desc: 'Code quality, architecture, and project presentation.' },
  { id: 'LEARNING_COACH', label: 'Learning Coach', desc: 'Targeted study plans, DSA practice, and technology roadmaps.' },
  { id: 'PLACEMENT_COACH', label: 'Placement Coach', desc: 'Placement drive readiness, company expectations, and strategy.' },
  { id: 'INTERVIEW_COACH', label: 'Interview Coach', desc: 'Technical concepts, STAR behavioral responses, and mock prep.' },
];

const QUICK_PROMPTS = [
  'How strong is my backend profile for Senior Java roles?',
  'Am I ready for a Google / Microsoft software engineering interview?',
  'Why is my job readiness score low for full-stack positions?',
  'Which of my GitHub projects should I highlight on my resume?',
  'Give me top Java concurrency interview questions with answers.',
  'Review my verified DSA performance across LeetCode & Codeforces.',
];

export const CareerChatView: React.FC<CareerChatViewProps> = ({
  chats,
  activeChat,
  onSelectChat,
  onCreateNewChat,
  onDeleteChat,
  onSendMessage,
  isLoading,
}) => {
  const [inputMsg, setInputMsg] = useState('');
  const [selectedMode, setSelectedMode] = useState<CareerCoachMode>('GENERAL_CAREER_CHAT');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isLoading]);

  const handleSend = () => {
    if (!inputMsg.trim()) return;
    if (activeChat) {
      onSendMessage(activeChat.id, inputMsg, selectedMode);
      setInputMsg('');
    } else {
      onCreateNewChat(selectedMode, inputMsg);
      setInputMsg('');
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (activeChat) {
      onSendMessage(activeChat.id, prompt, selectedMode);
    } else {
      onCreateNewChat(selectedMode, prompt);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[550px] rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl">
      {/* Sidebar: Conversations List */}
      <div className="w-80 border-r border-slate-800 bg-slate-950/70 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>Chat Sessions</span>
          </div>
          <button
            onClick={() => onCreateNewChat(selectedMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Mode Selector Dropdown */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/40">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Active Coach Mode
          </label>
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as CareerCoachMode)}
            className="w-full bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
          >
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No previous chats found. Start a new conversation below.
            </div>
          ) : (
            chats.map((c) => {
              const isActive = activeChat?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectChat(c.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs transition-all ${
                    isActive
                      ? 'bg-blue-600/15 border border-blue-500/40 text-blue-300 font-medium'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-6">
                    <Bot className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="truncate">{c.title || 'Career Chat'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-slate-900/50 relative">
        {/* Active Chat Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {activeChat ? activeChat.title : 'AI Career + Interview Coach'}
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
                  {selectedMode.replace(/_/g, ' ')}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Grounded in your verified Resume, GitHub, LeetCode, Codeforces & Job readiness data.
              </p>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!activeChat || !activeChat.messages || activeChat.messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400 shadow-xl">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">Welcome to NexusFlow Career Coach</h4>
                <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1">
                  Ask questions grounded in your verified developer evidence. The AI Career Coach uses your real resume skills, GitHub repositories, and LeetCode stats.
                </p>
              </div>

              {/* Quick Prompts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-left pt-2">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 hover:border-blue-500/40 text-xs text-slate-300 transition-all flex items-start gap-2.5 group"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeChat.messages.map((msg: CareerChatMessage) => {
              const isUser = msg.sender === 'USER';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                      isUser
                        ? 'bg-blue-600'
                        : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`space-y-3 flex-1 ${isUser ? 'text-right' : ''}`}>
                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-800/90 border border-slate-700/60 text-slate-200 rounded-tl-none space-y-3'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Render Evidence & Recommendations for Assistant */}
                      {!isUser && msg.evidence && msg.evidence.length > 0 && (
                        <div className="pt-2 border-t border-slate-700/50 space-y-1.5 text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified Evidence
                          </span>
                          <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                            {msg.evidence.map((ev, idx) => (
                              <li key={idx}>{ev}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="pt-2 border-t border-slate-700/50 space-y-1.5 text-left">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" /> Recommended Actions
                          </span>
                          <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                            {msg.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Source Transparency Badge Bar */}
                    {!isUser && msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 flex-wrap">
                        <span className="font-semibold text-slate-500">Sources Used:</span>
                        {msg.sourcesUsed.map((source) => (
                          <span
                            key={source}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono"
                          >
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                            {source}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/60 text-xs text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span>Analyzing connected profile data & generating grounded response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex gap-2.5 max-w-4xl mx-auto">
            <textarea
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask your career coach (e.g. 'How strong is my backend?', 'Am I ready for Microsoft?')..."
              rows={2}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none resize-none"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputMsg.trim()}
              className="px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center transition-all shadow-lg shadow-blue-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-center text-[10px] text-slate-500">
            NexusFlow Anti-Hallucination Guarantee: Answers strictly cite connected profile evidence without fabrication.
          </div>
        </div>
      </div>
    </div>
  );
};
