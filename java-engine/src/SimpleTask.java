public class SimpleTask extends Task {
    private final long workDurationMs;

    public SimpleTask(int priority, long workDurationMs) {
        super(Type.SIMPLE, priority, 0, 0);
        this.workDurationMs = workDurationMs;
    }

    @Override
    public void run() {
        try {
            Thread.sleep(workDurationMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("SimpleTask interrupted");
        }
    }
}
