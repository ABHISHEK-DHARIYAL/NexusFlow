public class CancellableTask extends Task {
    private final long workDurationMs;
    private volatile boolean isCancelled = false;

    public CancellableTask(int priority, long workDurationMs) {
        super(Type.CANCELLABLE, priority, 0, 0);
        this.workDurationMs = workDurationMs;
    }

    public void cancel() {
        this.isCancelled = true;
        setStatus(Status.CANCELLED);
    }

    @Override
    public void run() {
        if (isCancelled || getStatus() == Status.CANCELLED) {
            return;
        }
        try {
            long spent = 0;
            while (spent < workDurationMs) {
                if (isCancelled || getStatus() == Status.CANCELLED) {
                    return;
                }
                Thread.sleep(50);
                spent += 50;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("CancellableTask interrupted");
        }
    }
}
