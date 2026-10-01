import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  Sparkles,
  TrendingUp,
  Compass,
  Play,
  RefreshCw,
} from 'lucide-react';
import { CareerChatView } from '../components/career/CareerChatView';
import { MockInterviewView } from '../components/career/MockInterviewView';
import { CareerMetricsView } from '../components/career/CareerMetricsView';
import { CareerRoadmapView } from '../components/career/CareerRoadmapView';
import {
  CareerChat,
  CareerCoachMode,
  InterviewSession,
  InterviewType,
  InterviewDifficulty,
  CareerDashboardMetrics,
} from '../types';

export const CareerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'mock' | 'metrics' | 'roadmap'>('chat');

  const [chats, setChats] = useState<CareerChat[]>([]);
  const [activeChat, setActiveChat] = useState<CareerChat | null>(null);

  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [activeInterview, setActiveInterview] = useState<InterviewSession | null>(null);

  const [metrics, setMetrics] = useState<CareerDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [chatsRes, interviewsRes, metricsRes] = await Promise.all([
        fetch('/api/career/chats', { headers: { Authorization: 'Bearer nexusflow_jwt_access_token_mock_12345' } }),
        fetch('/api/career/interviews', { headers: { Authorization: 'Bearer nexusflow_jwt_access_token_mock_12345' } }),
        fetch('/api/career/metrics', { headers: { Authorization: 'Bearer nexusflow_jwt_access_token_mock_12345' } }),
      ]);

      if (chatsRes.ok) {
        const chatData = await chatsRes.json();
        setChats(chatData);
        if (chatData.length > 0 && !activeChat) {
          // fetch full active chat
          fetchChatDetails(chatData[0].id);
        }
      }

      if (interviewsRes.ok) {
        const interviewData = await interviewsRes.json();
        setInterviews(interviewData);
        if (interviewData.length > 0) {
          const inProgress = interviewData.find((i: any) => i.status === 'IN_PROGRESS');
          setActiveInterview(inProgress || interviewData[0]);
        }
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
    } catch (err) {
      console.error('Failed to load career data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchChatDetails = async (chatId: string) => {
    try {
      const res = await fetch(`/api/career/chats/${chatId}`, {
        headers: { Authorization: 'Bearer nexusflow_jwt_access_token_mock_12345' },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveChat(data);
      }
    } catch (err) {
      console.error('Error fetching chat details:', err);
    }
  };

  const handleCreateNewChat = async (mode: CareerCoachMode, initialMsg?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/career/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer nexusflow_jwt_access_token_mock_12345',
        },
        body: JSON.stringify({
          mode,
          initialMessage: initialMsg,
        }),
      });

      if (res.ok) {
        const newChat = await res.json();
        setChats((prev) => [newChat, ...prev]);
        setActiveChat(newChat);
      }
    } catch (err) {
      console.error('Error creating chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (chatId: string, message: string, mode: CareerCoachMode) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/career/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer nexusflow_jwt_access_token_mock_12345',
        },
        body: JSON.stringify({ message, mode }),
      });

      if (res.ok) {
        await fetchChatDetails(chatId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/career/chats/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer nexusflow_jwt_access_token_mock_12345' },
      });

      if (res.ok) {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (activeChat?.id === chatId) {
          setActiveChat(null);
        }
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const handleStartInterview = async (type: InterviewType, difficulty: InterviewDifficulty, jobId?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/career/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer nexusflow_jwt_access_token_mock_12345',
        },
        body: JSON.stringify({ interviewType: type, difficulty, jobId }),
      });

      if (res.ok) {
        const newSession = await res.json();
        setInterviews((prev) => [newSession, ...prev]);
        setActiveInterview(newSession);
      }
    } catch (err) {
      console.error('Error starting interview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async (sessionId: string, questionId: string, userResponse: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/career/interviews/${sessionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer nexusflow_jwt_access_token_mock_12345',
        },
        body: JSON.stringify({ questionId, userResponse }),
      });

      if (res.ok) {
        // reload interview details
        const updatedRes = await fetch(`/api/career/interviews/${sessionId}`, {
          headers: { Authorization: 'Bearer nexusflow_jwt_access_token_mock_12345' },
        });
        if (updatedRes.ok) {
          const updatedSession = await updatedRes.json();
          setActiveInterview(updatedSession);
        }
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishInterview = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/career/interviews/${sessionId}/finish`, {
        method: 'POST',
        headers: { Authorization: 'Bearer nexusflow_jwt_access_token_mock_12345' },
      });

      if (res.ok) {
        const completedSession = await res.json();
        setActiveInterview(completedSession);
      }
    } catch (err) {
      console.error('Error finishing interview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Career + Interview Coach</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Conversational Intelligence Hub</h1>
          <p className="text-xs text-slate-400 mt-1">
            Grounded in your verified Resume, GitHub, LeetCode, Codeforces, and Job Readiness intelligence.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh Intelligence</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'chat'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Career Coach Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('mock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'mock'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Mock Interview Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'metrics'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Career Metrics & Readiness</span>
        </button>

        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'roadmap'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Custom Roadmap</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'chat' && (
        <CareerChatView
          chats={chats}
          activeChat={activeChat}
          onSelectChat={fetchChatDetails}
          onCreateNewChat={handleCreateNewChat}
          onDeleteChat={handleDeleteChat}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'mock' && (
        <MockInterviewView
          sessions={interviews}
          activeSession={activeInterview}
          onStartInterview={handleStartInterview}
          onSubmitAnswer={handleSubmitAnswer}
          onFinishInterview={handleFinishInterview}
          onSelectSession={(id) => {
            const found = interviews.find((i) => i.id === id);
            if (found) setActiveInterview(found);
          }}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'metrics' && <CareerMetricsView metrics={metrics} isLoading={isLoading} />}

      {activeTab === 'roadmap' && <CareerRoadmapView />}
    </div>
  );
};
