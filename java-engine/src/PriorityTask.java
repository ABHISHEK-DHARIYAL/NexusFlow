public class PriorityTask extends Task {
    private final long workDurationMs;

    public PriorityTask(int priority, long workDurationMs) {
        super(Type.PRIORITY, priority, 0, 0);
        this.workDurationMs = workDurationMs;
    }

    @Override
    public void run() {
        try {
            Thread.sleep(workDurationMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("PriorityTask interrupted");
        }
    }
}
