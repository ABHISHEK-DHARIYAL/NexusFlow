package com.nexusflow.task;

@FunctionalInterface
public interface TaskAction<T> {
    T execute(NexusTask<T> task) throws Exception;
}
