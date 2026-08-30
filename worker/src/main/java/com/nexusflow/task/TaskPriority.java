package com.nexusflow.task;

public enum TaskPriority {
    CRITICAL(4),
    HIGH(3),
    MEDIUM(2),
    LOW(1);

    private final int rank;

    TaskPriority(int rank) {
        this.rank = rank;
    }

    public int getRank() {
        return rank;
    }
}
