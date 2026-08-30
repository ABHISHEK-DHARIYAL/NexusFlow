import React from 'react';
import { BookOpenCheck, Database, Server, Cpu, ShieldCheck, Sparkles, Layers, ArrowRight } from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-indigo-400" />
          System Architecture & Concurrency Specs
        </h2>
        <p className="text-xs text-slate-400">
          Full-stack portfolio architecture specification for NexusFlow Developer Intelligence Platform
        </p>
      </div>

      {/* Layer Diagram Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Layer 1: Express REST API */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Server className="h-4 w-4" /> Node.js & Express API Gateway
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Handles user authentication, repository imports, JWT session management, and REST endpoints for dashboard UI state.
          </p>
          <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
            <li>Express v4 with Vite dev server middleware</li>
            <li>TypeScript API handlers</li>
            <li>JSON body parsing & security CORS headers</li>
          </ul>
        </div>

        {/* Layer 2: Java 21 Concurrency Engine */}
        <div className="rounded-2xl border border-indigo-500/40 bg-indigo-950/20 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Cpu className="h-4 w-4" /> Java 21 Concurrency Engine
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            High-throughput background thread pool executor for processing enqueued code analysis tasks without blocking web requests.
          </p>
          <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
            <li>Custom Array Priority Blocking Queue</li>
            <li>ReentrantLock with Condition variables</li>
            <li>Real-time heartbeat & thread pool scaling</li>
          </ul>
        </div>

        {/* Layer 3: Gemini 3.6 Flash AI & MySQL */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Sparkles className="h-4 w-4" /> Gemini 3.6 Flash & Persistence
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generates structured JSON intelligence reports using `@google/genai` server-side SDK, persisted in relational schema.
          </p>
          <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
            <li>Server-side Gemini SDK integration</li>
            <li>MySQL relational database schema</li>
            <li>Structured security & architecture findings</li>
          </ul>
        </div>
      </div>

      {/* Database ER Diagram Specification */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="h-4 w-4 text-indigo-400" /> Relational Database Schema (Prisma ORM / MySQL)
        </h3>
        <p className="text-xs text-slate-400">
          Normalized relational tables defined in <code className="font-mono text-indigo-300">/prisma/schema.prisma</code>:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1">Users</div>
            <div className="text-[10px] text-slate-400">id, username, email, githubId, role</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <div className="font-bold text-emerald-300 border-b border-slate-800 pb-1">Repositories</div>
            <div className="text-[10px] text-slate-400">id, fullName, healthScore, starsCount</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <div className="font-bold text-amber-300 border-b border-slate-800 pb-1">Tasks</div>
            <div className="text-[10px] text-slate-400">id, taskType, priority, status, progress</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1">AIReports & Findings</div>
            <div className="text-[10px] text-slate-400">overallScore, securityScore, findings</div>
          </div>
        </div>
      </div>
    </div>
  );
};
