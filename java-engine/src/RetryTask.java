public class RetryTask extends Task {
    private final long workDurationMs;
    private final double failureProbability;

    public RetryTask(int priority, int maxRetries, long workDurationMs, double failureProbability) {
        super(Type.RETRY, priority, 0, maxRetries);
        this.workDurationMs = workDurationMs;
        this.failureProbability = failureProbability;
    }

    @Override
    public void run() {
        try {
            Thread.sleep(workDurationMs);
            if (Math.random() < failureProbability) {
                throw new RuntimeException("Simulated error in task execution");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("RetryTask interrupted");
        }
    }
}
