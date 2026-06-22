import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;

/**
 * Main entrance of the Java Execution Engine.
 * Operates as a background process spawned by Node.js, reading from stdin and writing status updates to stdout as JSON.
 */
public class Main {
    private static ThreadPool threadPool;

    public static void main(String[] args) {
        // Default pool size: core = 4, max = 8, queue capacity = 100, keepAlive = 5000ms
        threadPool = new ThreadPool(4, 8, 100, 5000);

        System.out.println("ENGINE_READY: {\"status\":\"initialized\",\"coreThreads\":4,\"maxThreads\":8}");

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(System.in))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;

                if (line.startsWith("SUBMIT:")) {
                    handleSubmit(line.substring(7).trim());
                } else if (line.startsWith("CONFIG:")) {
                    handleConfig(line.substring(7).trim());
                } else if (line.startsWith("CANCEL:")) {
                    handleCancel(line.substring(7).trim());
                } else if (line.equals("GET_STATS")) {
                    printStats();
                } else if (line.equals("SHUTDOWN")) {
                    threadPool.shutdown();
                    System.out.println("ENGINE_SHUTDOWN: {\"status\":\"graceful\"}");
                    break;
                }
            }
        } catch (Exception e) {
            System.err.println("ENGINE_ERROR: " + e.getMessage());
        }
    }

    private static void handleSubmit(String commandData) {
        try {
            // Format: type,priority,delayMs,workDurationMs,maxRetries,failureProbability
            // Example: SIMPLE,5,0,1000,0,0.0
            String[] parts = commandData.split(",");
            if (parts.length < 6) {
                System.out.println("SUBMIT_ERROR: {\"error\":\"Invalid format. Expected type,priority,delayMs,duration,retries,failProb\"}");
                return;
            }

            Task.Type type = Task.Type.valueOf(parts[0].trim().toUpperCase());
            int priority = Integer.parseInt(parts[1].trim());
            long delayMs = Long.parseLong(parts[2].trim());
            long duration = Long.parseLong(parts[3].trim());
            int retries = Integer.parseInt(parts[4].trim());
            double failureProbability = Double.parseDouble(parts[5].trim());

            Task task;
            switch (type) {
                case SIMPLE:
                    task = new SimpleTask(priority, duration);
                    break;
                case PRIORITY:
                    task = new PriorityTask(priority, duration);
                    break;
                case SCHEDULED:
                    task = new ScheduledTask(priority, delayMs, duration);
                    break;
                case RETRY:
                    task = new RetryTask(priority, retries, duration, failureProbability);
                    break;
                case CANCELLABLE:
                    task = new CancellableTask(priority, duration);
                    break;
                default:
                    System.out.println("SUBMIT_ERROR: {\"error\":\"Unknown task type\"}");
                    return;
            }

            threadPool.execute(task);
            System.out.println("SUBMIT_ACK: " + task.toJSON());
        } catch (Exception e) {
            System.out.println("SUBMIT_ERROR: {\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    private static void handleConfig(String configData) {
        try {
            String[] parts = configData.split(",");
            int core = Integer.parseInt(parts[0].trim());
            int max = Integer.parseInt(parts[1].trim());
            threadPool.setPoolSizes(core, max);
            System.out.println(String.format("CONFIG_ACK: {\"coreThreads\":%d,\"maxThreads\":%d}", core, max));
        } catch (Exception e) {
            System.out.println("CONFIG_ERROR: {\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    private static void handleCancel(String taskId) {
        boolean found = false;
        List<Task> queuedTasks = threadPool.getQueueSnapshot();
        for (Task t : queuedTasks) {
            if (t.getId().equals(taskId)) {
                if (t instanceof CancellableTask) {
                    ((CancellableTask) t).cancel();
                    found = true;
                } else {
                    t.setStatus(Task.Status.CANCELLED);
                    found = true;
                }
                break;
            }
        }
        if (found) {
            System.out.println(String.format("CANCEL_ACK: {\"id\":\"%s\",\"status\":\"CANCELLED\"}", taskId));
        } else {
            System.out.println(String.format("CANCEL_ERROR: {\"id\":\"%s\",\"error\":\"Task not found or already executed\"}", taskId));
        }
    }

    private static void printStats() {
        StringBuilder sb = new StringBuilder();
        sb.append("STATS_SNAPSHOT: {");
        sb.append(String.format("\"activeThreads\":%d,", threadPool.getActiveThreads()));
        sb.append(String.format("\"queueSize\":%d,", threadPool.getQueueSize()));
        sb.append(String.format("\"completedCount\":%d,", threadPool.getCompletedCount()));
        sb.append(String.format("\"failedCount\":%d,", threadPool.getFailedCount()));
        sb.append(String.format("\"poolSize\":%d,", threadPool.getPoolSize()));
        
        // Add worker snapshots
        sb.append("\"workers\":[");
        List<ThreadPool.WorkerStatus> workers = threadPool.getWorkerSnapshot();
        for (int i = 0; i < workers.size(); i++) {
            ThreadPool.WorkerStatus ws = workers.get(i);
            sb.append(String.format(
                "{\"threadId\":%d,\"state\":\"%s\",\"currentTaskId\":\"%s\",\"isCore\":%b,\"runningTimeMs\":%d}",
                ws.threadId, ws.state.name(), ws.currentTaskId, ws.isCore, ws.runningTimeMs
            ));
            if (i < workers.size() - 1) sb.append(",");
        }
        sb.append("]}");
        System.out.println(sb.toString());
    }
}
