import React from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Code2,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';

export const CareerRoadmapView: React.FC = () => {
  const phases = [
    {
      phase: 'Phase 1: Core Technical & DSA Mastery',
      duration: 'Weeks 1–2',
      status: 'IN_PROGRESS',
      topics: [
        'Advanced Concurrency in Java (ReentrantLock, Semaphore, ThreadPoolExecutor)',
        'Graph Algorithms & Dynamic Programming (LeetCode Hard level)',
        'System Architecture & Low-Level Design (LLD) for NexusFlow worker queue',
      ],
    },
    {
      phase: 'Phase 2: Target Role & System Design',
      duration: 'Weeks 3–4',
      status: 'UPCOMING',
      topics: [
        'Distributed Caching & Message Queues (Redis, Kafka)',
        'Database Sharding, Indexing & Query Optimization (PostgreSQL / MySQL)',
        'API Gateway Design & Rate Limiting Algorithms',
      ],
    },
    {
      phase: 'Phase 3: Mock Interview & Behavioral STAR',
      duration: 'Weeks 5–6',
      status: 'UPCOMING',
      topics: [
        'Behavioral STAR stories based on real NexusFlow engineering challenges',
        'System Design Mock Interviews (100k QPS Async Processing System)',
        'Resume Bullet Alignment & Final Company Research',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Personalized Engineering Roadmap</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100">Ordered Preparation Plan</h2>
        <p className="text-xs text-slate-400 max-w-2xl">
          Synthesized automatically from your verified profile gaps and target job requirements.
        </p>
      </div>

      <div className="space-y-4">
        {phases.map((p, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-mono text-xs">
                  0{idx + 1}
                </span>
                {p.phase}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                {p.duration}
              </span>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 pl-8 list-disc">
              {p.topics.map((t, tidx) => (
                <li key={tidx}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
