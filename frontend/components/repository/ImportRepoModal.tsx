import React, { useState } from 'react';
import { X, Github, Sparkles, FolderGit2 } from 'lucide-react';

interface ImportRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (fullName: string, description: string, language: string) => void;
}

export const ImportRepoModal: React.FC<ImportRepoModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [fullName, setFullName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('TypeScript');

  if (!isOpen) return null;

  const presets = [
    { fullName: 'facebook/react', language: 'TypeScript', description: 'The library for web and native user interfaces.' },
    { fullName: 'expressjs/express', language: 'JavaScript', description: 'Fast, unopinionated, minimalist web framework for node.' },
    { fullName: 'spring-projects/spring-boot', language: 'Java', description: 'Spring Boot helps you create stand-alone production-grade applications.' },
    { fullName: 'golang/go', language: 'Go', description: 'The Go programming language open source codebase.' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    onImport(fullName, description, language);
    setFullName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Import GitHub Repository</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Repository Full Name (owner/repo)
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. vercel/next.js"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Primary Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="TypeScript">TypeScript / JavaScript</option>
              <option value="Java">Java 21</option>
              <option value="Go">Go</option>
              <option value="Python">Python</option>
              <option value="Rust">Rust</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of repository architecture..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-2">
              Or pick an open-source benchmark preset:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.fullName}
                  type="button"
                  onClick={() => {
                    setFullName(p.fullName);
                    setLanguage(p.language);
                    setDescription(p.description);
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-left text-[11px] hover:border-indigo-500/40 hover:bg-slate-800/40 transition"
                >
                  <div className="font-semibold text-indigo-300">{p.fullName}</div>
                  <div className="text-[10px] text-slate-500">{p.language}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
            >
              <Sparkles className="h-3.5 w-3.5" /> Import & Enqueue Analysis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
