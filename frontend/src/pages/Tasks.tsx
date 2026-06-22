import React, { useState, useEffect } from "react";
import { 
  Binary, 
  Plus, 
  Search, 
  CornerDownRight, 
  X, 
  Eye, 
  Clock, 
  Layers, 
  Trash2,
  ListFilter,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../services/api.ts";
import Navbar from "../components/Navbar.tsx";
import { TaskType, TaskStatus } from "../types.ts";

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create task state
  const [taskType, setTaskType] = useState<TaskType>(TaskType.SIMPLE);
  const [priority, setPriority] = useState(5);
  const [delayMs, setDelayMs] = useState(0);
  const [workDurationMs, setWorkDurationMs] = useState(1200);
  const [maxRetries, setMaxRetries] = useState(0);
  const [failProb, setFailProb] = useState(0.0);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const itemsPerPage = 8;

  // Modal inspection
  const [inspectedTask, setInspectedTask] = useState<any | null>(null);

  const loadData = async () => {
    try {
      const [tasksRes, chanRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/channels")
      ]);
      setTasks(tasksRes.data);
      setChannels(chanRes.data);
    } catch (e) {
      console.error("Failed to sync task heap telemetry:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await api.post("/tasks/submit", {
        type: taskType,
        priority,
        delayMs,
        duration: workDurationMs,
        retries: maxRetries,
        failureProbability: failProb,
        channelId: selectedChannel || undefined,
        topic: topic || undefined
      });
      setMessage("Task submitted to ThreadPoolExecutor task queue!");
      setTopic("");
      loadData();
    } catch (err: any) {
      console.error(err);
      setMessage("Failed to queue custom task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Filtering matrices
  const filteredTasks = tasks.filter(t => {
    const matchType = filterType === "ALL" || t.type === filterType;
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    return matchType && matchStatus;
  });

  // Paginated chunk
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage);

  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // local mini pseudo markdown parser to make AI result look fantastic
  const renderInspectedText = (text: string) => {
    if (!text) return <p className="text-zinc-500 italic">No output text associated with this task type.</p>;
    
    // Split into lines
    const lines = text.split("\n");
    return (
      <div className="space-y-2.5 font-mono text-zinc-300 select-text leading-relaxed text-[11px] md:text-xs">
        {lines.map((line, idx) => {
          if (line.startsWith("###")) {
            return <h4 key={idx} className="text-theme-accent font-bold mt-4 uppercase border-b border-theme-accent-dim/30 pb-1 text-sm">{line.replace("###", "").trim()}</h4>;
          }
          if (line.startsWith("####")) {
            return <h5 key={idx} className="text-zinc-100 font-bold mt-3 uppercase tracking-wider">{line.replace("####", "").trim()}</h5>;
          }
          if (line.startsWith("- ")) {
            return <li key={idx} className="list-disc ml-4 font-sans font-medium text-zinc-300">{line.replace("- ", "").trim()}</li>;
          }
          if (line.startsWith("*")) {
            return <p key={idx} className="italic text-zinc-400 font-sans">{line.replace(/\*/g, "").trim()}</p>;
          }
          return <p key={idx} className="font-sans font-medium">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white flex flex-col font-mono selection:bg-theme-accent selection:text-black pb-12">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 pt-6 space-y-6">
        
        {/* Banner */}
        <div className="border border-theme-line bg-[#141518] p-5 rounded relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-xs text-theme-accent font-bold">
              <Binary className="w-4 h-4 text-theme-accent animate-pulse" />
              <span>DUMP_SCHEDULER_HEAPS</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[#E4E4E4] uppercase">
              Thread Executor Heaps <span className="text-zinc-500">// TASKS</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Submit single custom simulation threads or track active workflow tasks as they route through the custom Blocking Queue. Click completed tasks to open and inspect Gemini scripts.
            </p>
          </div>
        </div>

        {/* Form + Queue Lists split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Direct Task submission Form */}
          <div className="border border-theme-line bg-[#141518] p-5 rounded relative space-y-4 h-fit">
            <h3 className="text-sm font-bold tracking-wider uppercase text-[#E4E4E4] border-b border-theme-line pb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-theme-accent" />
              Enqueue Direct Task
            </h3>

            {message && (
              <div className="border border-theme-accent/30 bg-theme-accent-dim/10 p-2.5 rounded text-xs text-theme-accent">
                {message}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <CornerDownRight className="w-3 h-3 text-theme-accent" />
                  TASK_TYPE
                </label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as any)}
                  className="w-full bg-[#0A0B0D] border border-theme-line rounded px-3 py-2 text-white focus:outline-none focus:border-theme-accent font-mono uppercase"
                >
                  <optgroup label="Simulated Concurrency Benchmarks">
                    <option value={TaskType.SIMPLE}>SIMPLE</option>
                    <option value={TaskType.PRIORITY}>PRIORITY_SORTED</option>
                    <option value={TaskType.SCHEDULED}>SCHEDULED_DELAY</option>
                    <option value={TaskType.RETRY}>AUTO_RETRY</option>
                    <option value={TaskType.CANCELLABLE}>CANCELLABLE</option>
                  </optgroup>
                  <optgroup label="Gemini Content Automations">
                    <option value={TaskType.AI_GENERATE_SCRIPT}>AI_GENERATE_SCRIPT</option>
                    <option value={TaskType.AI_GENERATE_TITLE}>AI_GENERATE_TITLE</option>
                    <option value={TaskType.AI_GENERATE_DESCRIPTION}>AI_GENERATE_DESCRIPTION</option>
                    <option value={TaskType.AI_GENERATE_TAGS}>AI_GENERATE_TAGS</option>
                    <option value={TaskType.AI_GENERATE_THUMBNAIL_PROMPT}>AI_GENERATE_THUMBNAIL_PROMPT</option>
                    <option value={TaskType.AI_GENERATE_HOOK}>AI_GENERATE_HOOK</option>
                    <option value={TaskType.AI_GENERATE_CAPTION}>AI_GENERATE_CAPTION</option>
                  </optgroup>
                </select>
              </div>

              {/* Direct inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    PRIORITY (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full bg-[#0A0B0D] border border-theme-line rounded px-3 py-1.5 focus:outline-none focus:border-theme-accent font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    WORK_TIME (ms)
                  </label>
                  <input
                    type="number"
                    min={200}
                    max={10000}
                    value={workDurationMs}
                    onChange={(e) => setWorkDurationMs(Number(e.target.value))}
                    className="w-full bg-[#0A0B0D] border border-theme-line rounded px-3 py-1.5 focus:outline-none focus:border-theme-accent font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    DELAY (scheduled)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={delayMs}
                    onChange={(e) => setDelayMs(Number(e.target.value))}
                    placeholder="0 ms"
                    className="w-full bg-[#0A0B0D] border border-theme-line rounded px-3 py-1.5 focus:outline-none focus:border-theme-accent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    MAX_RETRIES
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(Number(e.target.value))}
                    className="w-full bg-[#0A0B0D] border border-theme-line rounded px-3 py-1.5 focus:outline-none focus:border-theme-accent font-mono"
                  />
                </div>
              </div>

              {taskType === TaskType.RETRY && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    FAILURE_PROBABILITY (0.0 to 1.0)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={1}
                    value={failProb}
                    onChange={(e) => setFailProb(parseFloat(e.target.value))}
                    className="w-full bg-[#0A0B0D] border border-theme-line rounded px-3 py-1.5 focus:outline-none focus:border-theme-accent font-mono font-bold"
                  />
                </div>
              )}

              {/* Conditionally reveal topic inputs if AI type selected */}
              {taskType.startsWith("AI_GENERATE") && (
                <div className="space-y-3 pt-2.5 border-t border-theme-line/50">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                      TOPIC_CONTEXT
                    </label>
                    <input
                      type="text"
                      required
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Ancient Gladiator Battles"
                      className="w-full bg-[#0A0B0D] border border-theme-line rounded px-3 py-2 focus:outline-none focus:border-theme-accent font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                      CHANNEL_CONTEXT_GLUE
                    </label>
                    <select
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      className="w-full bg-[#0A0B0D] border border-theme-line rounded px-3 py-2 focus:outline-none focus:border-theme-accent font-mono uppercase"
                    >
                      <option value="">None (Generic Preset)</option>
                      {channels.map(c => (
                        <option key={c.id} value={c.id}>{c.platform}: {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-theme-accent hover:bg-[#00D980] text-black font-mono font-bold py-2.5 px-4 rounded tracking-widest uppercase cursor-pointer disabled:opacity-50 text-[11px] shadow-[0_0_10px_rgba(0,255,156,0.15)] hover:shadow-[0_0_18px_rgba(0,255,156,0.25)] flex items-center justify-center gap-1 transition-all"
              >
                {submitting ? "ENQUEUING..." : "SUBMIT_TASK_NODE &rarr;"}
              </button>
            </form>
          </div>

          {/* Paginated Tasks list */}
          <div className="lg:col-span-2 border border-theme-line bg-[#141518] rounded p-5 relative space-y-4">
            <h3 className="text-sm font-bold tracking-wider uppercase text-[#E4E4E4] border-b border-theme-line pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Binary className="w-4.5 h-4.5 text-theme-accent" />
                Active & Historical task heap trace
              </span>
              
              {/* Table search filters */}
              <div className="flex gap-2 text-[10px] font-mono">
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                  className="bg-[#0A0B0D] border border-theme-line rounded text-zinc-400 focus:outline-none p-1 block uppercase"
                >
                  <option value="ALL">All Types</option>
                  <option value={TaskType.SIMPLE}>Simple</option>
                  <option value={TaskType.PRIORITY}>Priority</option>
                  <option value={TaskType.SCHEDULED}>Scheduled</option>
                  <option value={TaskType.RETRY}>Retry</option>
                  <option value={TaskType.CANCELLABLE}>Cancellable</option>
                  <option value={TaskType.AI_GENERATE_SCRIPT}>Script</option>
                  <option value={TaskType.AI_GENERATE_TITLE}>Title</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="bg-[#0A0B0D] border border-theme-line rounded text-zinc-400 focus:outline-none p-1 block uppercase"
                >
                  <option value="ALL">All Status</option>
                  <option value="QUEUED">Queued</option>
                  <option value="RUNNING">Running</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="RETRYING">Retrying</option>
                </select>
              </div>
            </h3>

            {loading ? (
              <div className="py-24 text-center text-xs text-zinc-500">
                Awaiting task metrics...
              </div>
            ) : paginatedTasks.length === 0 ? (
              <div className="py-24 text-center text-zinc-500 text-xs border border-dashed border-theme-line rounded">
                No matching scheduler tasks found. Push a task above.
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="border border-theme-line bg-[#0A0B0D] p-3.5 rounded flex items-center justify-between gap-3 hover:border-[#383A40] transition-all"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#E4E4E4] uppercase truncate max-w-[150px]">
                          {task.type}
                        </span>
                        <span className="text-[10px] text-zinc-500">// {task.id}</span>
                        {task.priority > 7 && (
                          <span className="text-[8.5px] bg-red-950/20 text-red-500 border border-red-900/10 px-1 rounded uppercase tracking-wider font-extrabold animate-pulse">
                            PRIORITY_{task.priority}
                          </span>
                        )}
                      </div>
                      
                      {task.topic && (
                        <p className="text-[10.5px] text-zinc-300 truncate tracking-wide font-medium">
                          Topic: <span className="text-theme-accent uppercase font-bold">{task.topic}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9.5px] text-[#71717A]">
                        <span>Prio: {task.priority}</span>
                        <span>Wait: {Math.round(task.waitTimeMs || 0)}ms</span>
                        <span>ExecTime: {task.execTimeMs ? `${Math.round(task.execTimeMs)}ms` : "Simulation Pending"}</span>
                        {task.threadId && (
                          <span>Thread: <strong className="text-theme-accent">#{task.threadId}</strong></span>
                        )}
                        {task.retryCount > 0 && (
                          <span className="text-amber-500">Retries: {task.retryCount}/{task.maxRetries}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9.5px] border px-1.5 py-0.5 rounded uppercase font-mono tracking-widest font-extrabold ${
                        task.status === "COMPLETED"
                          ? "border-emerald-600 bg-emerald-950/25 text-[#00FF9C]"
                          : task.status === "FAILED"
                          ? "border-red-600 bg-red-950/25 text-red-400"
                          : task.status === "RUNNING"
                          ? "border-theme-accent bg-theme-accent-dim/30 text-theme-accent animate-pulse"
                          : task.status === "CANCELLED"
                          ? "border-zinc-700 bg-zinc-900 text-zinc-500"
                          : "border-zinc-700 text-zinc-400"
                      }`}>
                        {task.status}
                      </span>

                      {task.status === "COMPLETED" && (task.resultText) && (
                        <button
                          onClick={() => setInspectedTask(task)}
                          className="px-2 py-1 bg-[#141518] hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-theme-line text-[10.5px] uppercase font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          VIEW
                        </button>
                      )}

                      {(task.status === "QUEUED" || task.status === "RUNNING") && (
                        <button
                          onClick={() => handleCancelTask(task.id)}
                          className="px-2 py-1 bg-red-950/10 hover:bg-red-950/30 text-red-400 hover:text-red-300 rounded border border-red-950/20 text-[10.5px] uppercase tracking-wider font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-theme-line pt-4 text-xs select-none">
              <span className="text-zinc-500 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="p-1 px-2.5 bg-[#0A0B0D] border border-theme-line rounded hover:border-[#383A40] text-zinc-400 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="p-1 px-2.5 bg-[#0A0B0D] border border-theme-line rounded hover:border-[#383A40] text-zinc-400 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Terminal Inspection Overlay Modal */}
      <AnimatePresence>
        {inspectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="border border-theme-line bg-[#141518] rounded max-w-2xl w-full max-h-[85vh] flex flex-col relative overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="border-b border-theme-line bg-[#0E0F12] px-4.5 py-3 flex items-center justify-between text-zinc-400 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-theme-accent animate-pulse" />
                  <span className="font-bold uppercase text-[#E4E4E4]">Terminal Inspect // Task Output Log</span>
                </div>
                <button
                  onClick={() => setInspectedTask(null)}
                  className="p-1 border border-transparent hover:border-theme-line hover:text-white rounded cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Task metrics row */}
              <div className="bg-[#0A0B0D] border-b border-theme-line/60 px-4.5 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] text-zinc-500">
                <div>
                  <span className="block font-bold">TASK_ID</span>
                  <span className="text-zinc-300 font-bold uppercase">{inspectedTask.id}</span>
                </div>
                <div>
                  <span className="block font-bold">TYPE</span>
                  <span className="text-zinc-300 font-bold uppercase">{inspectedTask.type}</span>
                </div>
                <div>
                  <span className="block font-bold">EXECUTOR_THREAD</span>
                  <span className="text-zinc-300 font-bold">WorkerThread_#{inspectedTask.threadId || "NONE"}</span>
                </div>
                <div>
                  <span className="block font-bold">EXECUTION_DURATION</span>
                  <span className="text-zinc-300 font-bold font-mono text-[#00FF9C]">{Math.round(inspectedTask.execTimeMs)} ms</span>
                </div>
              </div>

              {/* Content body layout */}
              <div className="flex-1 p-5 overflow-y-auto selection:bg-[#00FF90] selection:text-black">
                {renderInspectedText(inspectedTask.resultText)}
              </div>

              {/* Footer */}
              <div className="border-t border-theme-line/75 bg-[#0E0F12] px-4.5 py-3.5 flex items-center justify-between text-[9px] text-zinc-600 font-mono">
                <span>COMPILED GENERATIVE TELEMETRY // FLASH_3.5_ENGINE</span>
                <span className="text-zinc-500 font-bold select-none cursor-pointer hover:text-[#00FF9C]" onClick={() => setInspectedTask(null)}>CLOSE_TERMINAL [ESC]</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
