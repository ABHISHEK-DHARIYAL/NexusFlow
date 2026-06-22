# ThreadForge Java Engine

This is the high-performance custom Thread Pool and Blocking Queue subsystem implemented in Java. It operates as a reactive JVM process that can receive task enqueue and configuration instructions over `stdin` and output JSON telemetry logs to `stdout`.

## Target Structure

```
java-engine/
├── src/
│   ├── ThreadPool.java
│   ├── Worker.java
│   ├── BlockingQueue.java
│   ├── Task.java
│   ├── PriorityTask.java
│   ├── ScheduledTask.java
│   ├── RetryTask.java
│   └── Main.java
├── pom.xml
└── README.md
```

## How It Works

- **`BlockingQueue`**: Thread-safe bounded priority queue built from scratch using `ReentrantLock` and dual `Condition` variables (`notFull`, `notEmpty`) to safely block threads on additions or retrievals.
- **`ThreadPool`**: Spawns a configured number of `coreThreads` that block on the `BlockingQueue`. Dynamic scalability up to `maxThreads` for queue overflows with a configurable keeps-alive idle parameter. 
- **`Worker`**: Manages the thread loop, updates statuses, execution timers, and retries.
- **`Main`**: Process launcher reading commands `SUBMIT:`, `CONFIG:`, `CANCEL:`, `GET_STATS`, and writing real-time JSON events and snapshot metrics on `stdout`.

## Compilation

To compile and build using Maven:
```bash
mvn clean package
```
This produces a compiled fat runnable JAR under `target/threadforge-java-engine-1.0.0.jar`.

To build purely with the JDK:
```bash
javac src/*.java -d classes
```

## Run the Engine

To run the subsystem manually:
```bash
java -cp classes Main
```
Or with Maven package JAR:
```bash
java -jar target/threadforge-java-engine-1.0.0.jar
```
