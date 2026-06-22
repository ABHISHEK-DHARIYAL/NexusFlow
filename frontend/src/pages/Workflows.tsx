import React, { useState, useEffect } from "react";
import { 
  Notebook as FlowIcon, 
  Play, 
  Plus, 
  Trash2, 
  ChevronRight, 
  HelpCircle,
  Clock, 
  Layers, 
  Radio, 
  ListOrdered,
  RefreshCw,
  Cpu,
  Info,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../services/api.ts";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.tsx";
import { TaskType } from "../types.ts";

interface WorkflowStep {
  taskType: TaskType;
  dependsOnStep: number | null; // 1-indexed
  priority: number;
  delayMs: number;
  retryCount: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  templateType: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  channelId: string;
  steps: {
    id: string;
    stepOrder: number;
    taskType: TaskType;
    dependsOnStep: number | null;
    priority: number;
    status: string;
    schedulerTaskId?: string;
  }[];
}

const PRESET_TEMPLATES = [
  {
    id: "YOUTUBE_LONG",
    name: "YouTube Video Standard Pipe",
    description: "Multi-stage sequential pipeline: title & SEO keywords, detailed full script, description metadata, and description tags.",
    steps: [
      { taskType: TaskType.AI_GENERATE_TITLE, dependsOnStep: null, priority: 8, delayMs: 0, retryCount: 1 },
      { taskType: TaskType.AI_GENERATE_SCRIPT, dependsOnStep: 1, priority: 7, delayMs: 0, retryCount: 0 },
      { taskType: TaskType.AI_GENERATE_DESCRIPTION, dependsOnStep: 2, priority: 5, delayMs: 0, retryCount: 0 },
      { taskType: TaskType.AI_GENERATE_TAGS, dependsOnStep: 3, priority: 4, delayMs: 0, retryCount: 0 }
    ]
  },
  {
    id: "YOUTUBE_SHORTS",
    name: "Short-Form High Retention Pipe",
    description: "Highly targeted loop generation: hooks, visual caption, tag indexes, plus thumbnail design prompts.",
    steps: [
      { taskType: TaskType.AI_GENERATE_HOOK, dependsOnStep: null, priority: 9, delayMs: 0, retryCount: 2 },
      { taskType: TaskType.AI_GENERATE_CAPTION, dependsOnStep: 1, priority: 6, delayMs: 0, retryCount: 0 },
      { taskType: TaskType.AI_GENERATE_THUMBNAIL_PROMPT, dependsOnStep: 1, priority: 5, delayMs: 0, retryCount: 0 }
    ]
  },
  {
    id: "DEV_REPORT",
    name: "Dev Sync morning compilation",
    description: "Sync public stats from social or code indexes, run analysis, and render final summary dynamically.",
    steps: [
      { taskType: TaskType.FETCH_GITHUB_STATS, dependsOnStep: null, priority: 8, delayMs: 0, retryCount: 1 },
      { taskType: TaskType.GENERATE_REPORT, dependsOnStep: 1, priority: 9, delayMs: 100, retryCount: 0 }
    ]
  }
];

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states - Create Workflow
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("YOUTUBE_LONG");
  const [topic, setTopic] = useState("Advanced Thread Pool Architectures");
  const [customSteps, setCustomSteps] = useState<WorkflowStep[]>([]);
  
  // App logs & notifications
  const [message, setMessage] = useState("");
  const [executingMap, setExecutingMap] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    try {
      const [wfRes, chanRes] = await Promise.all([
        api.get("/workflows"),
        api.get("/channels")
      ]);
      setWorkflows(wfRes.data);
      setChannels(chanRes.data);
      if (chanRes.data.length > 0 && !selectedChannel) {
        setSelectedChannel(chanRes.data[0].id);
      }
    } catch (e) {
      console.error("Failed to sync workflow metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000); // refresh and capture async completed steps
    return () => clearInterval(interval);
  }, []);

  const handleApplyTemplate = (templateId: string) => {
    const preset = PRESET_TEMPLATES.find(p => p.id === templateId);
    if (preset) {
      setName(preset.name);
      setDescription(preset.description);
      setSelectedTemplate(templateId);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedChannel) {
      setMessage("Name and channel are mandatory workflow variables.");
      return;
    }

    const preset = PRESET_TEMPLATES.find(p => p.id === selectedTemplate);
    const stepsToSend = preset ? preset.steps : customSteps;

    if (stepsToSend.length === 0) {
      setMessage("Workflow must contain at least one task step definition.");
      return;
    }

    try {
      await api.post("/workflows", {
        name,
        description,
        channelId: selectedChannel,
        templateType: selectedTemplate,
        steps: stepsToSend
      });
      setMessage("Multi-step workflow successfully saved to DB!");
      setName("");
      setDescription("");
      loadData();
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Failed to create workflow pipeline.");
    }
  };

  const handleRunWorkflow = async (id: string) => {
    setExecutingMap(prev => ({ ...prev, [id]: true }));
    try {
      await api.post(`/workflows/${id}/execute`, { topic });
      setMessage("Workflow launched! Task nodes submitted to Thread Pool.");
      loadData();
    } catch (err: any) {
      console.error(err);
      alert("Execution request failed.");
    } finally {
      setExecutingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white flex flex-col font-mono selection:bg-theme-accent selection:text-black pb-12">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 pt-6 space-y-6">
        
        {/* Banner Block */}
        <div className="border border-theme-line bg-[#141518] p-5 rounded relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-xs text-theme-accent font-bold">
              <FlowIcon className="w-4 h-4 text-theme-accent" />
              <span>LOGICAL GRAPH PIPELINES</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[#E4E4E4] uppercase">
              Asynchronous Workflows Orchestrator <span className="text-zinc-500">// FLOWS</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Arrange sequential and parallel tasks. A worker thread on task completion automatically detects and schedules depending children steps in the dependency graph asynchronously on the custom Java/TS ThreadPoolEngine.
            </p>
          </div>
        </div>

        {/* Builder Form + Live Pipelines Splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Workflow Designer Panel */}
          <div className="border border-theme-line bg-[#141518] p-5 rounded relative space-y-4">
            <h3 className="text-sm font-bold tracking-wider uppercase text-[#E4E4E4] border-b border-theme-line pb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-theme-accent" />
              Orchestrate Workflow Graph
            </h3>

            {message && (
              <div className="border border-theme-accent/30 bg-theme-accent-dim/15 p-2.5 rounded text-xs text-theme-accent">
                {message}
              </div>
            )}

            <form onSubmit={handleCreateWorkflow} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <ListOrdered className="w-3.5 h-3.5 text-theme-accent" />
                  SELECT PRESET PIPELINE TEMPLATE
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRESET_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl.id)}
                      className={`py-2 px-1 text-[9.5px] border rounded transition-all text-center uppercase tracking-wider font-extrabold ${
                        selectedTemplate === tpl.id 
                          ? "border-theme-accent bg-theme-accent-dim/10 text-theme-accent" 
                          : "border-theme-line bg-[#0A0B0D] text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {tpl.id.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  WORKFLOW_GRAPH_NAME
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. YouTube Long Script Generator"
                  className="w-full bg-[#0A0B0D] border border-theme-line rounded px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-theme-accent transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  TARGET_CHANNEL_BIND
                </label>
                {channels.length === 0 ? (
                  <div className="text-zinc-500 text-[11px] py-1">
                    No active channels found.{" "}
                    <Link to="/channels" className="text-theme-accent hover:underline font-extrabold">
                      PROVISION_MORE &rarr;
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-theme-line rounded px-3 py-2 text-white focus:outline-none focus:border-theme-accent transition-all font-mono uppercase"
                  >
                    {channels.map((chan) => (
                      <option key={chan.id} value={chan.id}>
                        {chan.platform}: {chan.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  PIPELINE_PURPOSE_STRATEGY
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the core parameters and execution goals..."
                  rows={2}
                  className="w-full bg-[#0A0B0D] border border-theme-line rounded px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-theme-accent transition-all font-mono resize-none text-[10.5px]"
                />
              </div>

              {/* Steps display */}
              <div className="border border-theme-line rounded bg-[#0A0B0D] p-3 space-y-2.5">
                <span className="text-[9.5px] text-zinc-400 font-bold uppercase tracking-widest block border-b border-theme-line/60 pb-1.5">
                  Pipeline Steps Order & Dependency
                </span>
                
                {selectedTemplate && PRESET_TEMPLATES.find(p => p.id === selectedTemplate) ? (
                  <div className="space-y-1.5">
                    {PRESET_TEMPLATES.find(p => p.id === selectedTemplate)?.steps.map((st, idx) => (
                      <div key={idx} className="flex items-center justify-between text-zinc-400 text-[10.5px] border-b border-theme-line/45 pb-1">
                        <div className="flex items-center gap-1.5 font-bold text-[#E4E4E4]">
                          <span className="text-theme-accent">Step #{idx + 1}:</span>
                          <span>{st.taskType}</span>
                        </div>
                        <span className="text-[9px] text-[#71717A] tracking-wider uppercase font-semibold">
                          {st.dependsOnStep ? `Depends: S#${st.dependsOnStep}` : "START_NODE"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-600 italic">Select templates to bind graph nodes.</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-theme-accent hover:bg-[#00D980] text-black font-mono font-bold py-2 px-4 rounded tracking-widest uppercase cursor-pointer text-[11px] shadow-[0_0_10px_rgba(0,255,156,0.15)] hover:shadow-[0_0_18px_rgba(0,255,156,0.25)] flex items-center justify-center gap-1 transition-all"
              >
                SAVE_PIPELINE_CONFIG &rarr;
              </button>
            </form>
          </div>

          {/* Active / Registered Workflows list */}
          <div className="lg:col-span-2 border border-theme-line bg-[#141518] rounded p-5 relative space-y-4">
            <h3 className="text-sm font-bold tracking-wider uppercase text-[#E4E4E4] border-b border-theme-line pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-theme-accent" />
                Active Workflow Pipelines In Execution
              </span>
              <div className="flex gap-2">
                <span className="text-[10px] text-zinc-500 font-normal uppercase">
                  Count: {workflows.length}
                </span>
              </div>
            </h3>

            {/* Run Topic Controller */}
            <div className="p-3.5 bg-[#0A0B0D] border border-theme-line rounded grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[8.5px] text-zinc-500 uppercase tracking-widest font-extrabold mb-1">
                  ORCHESTRATE_INPUT_TOPIC
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Advanced Concurrency Queues"
                  className="w-full bg-[#141518] text-xs font-mono text-white border border-theme-line focus:border-theme-accent focus:outline-none rounded px-3 py-1.5 transition-all font-semibold"
                />
              </div>
              <p className="text-[9.5px] text-zinc-500 leading-relaxed">
                Provide a core topic keyword above. This string acts as the root keyword parameter passed directly to the Gemini AI text-generation context.
              </p>
            </div>

            {loading ? (
              <div className="py-24 text-center text-xs text-zinc-500">
                Awaiting workflow matrices...
              </div>
            ) : workflows.length === 0 ? (
              <div className="py-24 text-center text-zinc-500 text-xs border border-dashed border-theme-line rounded">
                No pipeline workflows found. Orchestrate one using the designer.
              </div>
            ) : (
              <div className="space-y-4.5">
                {workflows.map((wf) => (
                  <div 
                    key={wf.id}
                    className="border border-theme-line bg-[#0A0B0D] p-4.5 rounded relative space-y-4 hover:border-[#383A40] transition-colors"
                  >
                    {/* Header bar of workflow card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-line/65 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#E4E4E4] uppercase">
                            {wf.name}
                          </h4>
                          <span className="text-[9px] bg-theme-accent-dim/20 border border-theme-accent/20 px-1 py-0.5 rounded text-theme-accent uppercase font-mono tracking-widest font-bold">
                            {wf.templateType}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
                          PIPELINE_ID: {wf.id.slice(0, 12)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[9.5px] border px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                          wf.status === "RUNNING"
                            ? "border-[#00FF9C]/40 text-[#00FF9C] bg-[#00FF9C]/5 animate-pulse"
                            : wf.status === "COMPLETED"
                            ? "border-emerald-600 text-emerald-400 bg-emerald-950/20"
                            : "border-zinc-700 text-zinc-500 bg-zinc-900"
                        }`}>
                          {wf.status}
                        </span>

                        <button
                          onClick={() => handleRunWorkflow(wf.id)}
                          disabled={executingMap[wf.id] || wf.status === "RUNNING"}
                          className="px-3.5 py-1.5 bg-theme-accent hover:bg-[#00D980] disabled:bg-zinc-800 text-black text-[10px] font-bold uppercase tracking-widest rounded transition-all shadow-[0_0_8px_rgba(0,255,156,0.1)] flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {executingMap[wf.id] ? "FIRING..." : "FIRE_PIPELINE"}
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    </div>

                    {wf.description && (
                      <p className="text-[10.5px] text-zinc-400 leading-normal select-none italic pr-4">
                        &rdquo;{wf.description}&rdquo;
                      </p>
                    )}

                    {/* Step Visual Progress Chain */}
                    <div className="space-y-2">
                      <span className="text-[8.5px] font-bold uppercase text-zinc-500 tracking-widest font-mono">
                        Workflow graph execution graph
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                        {wf.steps?.map((step) => {
                          const isDone = step.status === "COMPLETED";
                          const isRunning = step.status === "RUNNING";
                          return (
                            <div 
                              key={step.id}
                              className={`border p-2.5 rounded text-[10.5px] space-y-1 relative overflow-hidden ${
                                isDone 
                                  ? "border-emerald-700 bg-emerald-950/5" 
                                  : isRunning 
                                  ? "border-theme-accent/40 bg-theme-accent-dim/5 animate-pulse" 
                                  : "border-theme-line bg-[#141518]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#E4E4E4] uppercase truncate max-w-[100px]">
                                  {step.taskType.replace("AI_GENERATE_", "")}
                                </span>
                                <span className="text-[8px] text-zinc-500 font-bold uppercase">
                                  Step_{step.stepOrder}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[9px]">
                                <span className="text-zinc-500">
                                  {step.dependsOnStep ? `Depends: S#${step.dependsOnStep}` : "Entry Node"}
                                </span>
                                <span className={`font-bold ${isDone ? "text-emerald-400" : isRunning ? "text-theme-accent animate-pulse" : "text-zinc-600"}`}>
                                  {step.status}
                                </span>
                              </div>
                              {isRunning && (
                                <div className="absolute bottom-0 left-0 h-0.5 bg-theme-accent w-full animate-pulse" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

            <div className="bg-[#0A0B0D] p-3.5 border border-theme-line rounded text-[11px] text-zinc-400 space-y-1.5 transition-all">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#00FF9C]" />
                <span className="font-bold text-zinc-300">How do async dependencies work?</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                When you click <strong>FIRE_PIPELINE</strong>, the engine extracts all nodes having no parents (<code>dependsOnStep = null</code>) and submits them to the active thread queue immediately. Once completed, the thread listener intercepts the task completed hook, identifies children nodes whose parents just finished, and queues them dynamically, forming progressive asynchronous pipelines.
              </p>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
