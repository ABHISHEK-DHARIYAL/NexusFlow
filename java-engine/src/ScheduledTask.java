public class ScheduledTask extends Task {
    private final long workDurationMs;

    public ScheduledTask(int priority, long delayMs, long workDurationMs) {
        super(Type.SCHEDULED, priority, delayMs, 0);
        this.workDurationMs = workDurationMs;
    }

    @Override
    public void run() {
        try {
            long timeSinceSubmission = System.currentTimeMillis() - getSubmittedAt();
            long remainingDelay = getDelayMs() - timeSinceSubmission;
            if (remainingDelay > 0) {
                Thread.sleep(remainingDelay);
            }
            Thread.sleep(workDurationMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("ScheduledTask interrupted");
        }
    }
}
