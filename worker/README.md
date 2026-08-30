# NexusFlow Java Concurrency Worker Engine

## Maven vs Gradle
We selected **Apache Maven** (`pom.xml`) for this core Java concurrency engine for the following reasons:
1. **Declarative Simplicity**: Zero build script complexity, ensuring transparent dependency management (`JUnit 5`, `SLF4J/Logback`).
2. **Deterministic Build Cycle**: Standardized compilation (`mvn compile`), testing (`mvn test`), and packaging (`mvn package`) targeting Java 21 LTS (`<release>21</release>`).
3. **Container Compatibility**: Fast compilation with low memory overhead, avoiding persistent background daemon states.

## Architecture Highlights
- **Custom Blocking Priority Queue**: Implemented using `ReentrantLock` and `Condition` variables (`notEmpty`, `notFull`) with aging mechanics to eliminate starvation.
- **Dynamic Worker Thread Pool**: Manually managed `WorkerThread` objects with dynamic scaling between `minWorkers` (e.g. 2) and `maxWorkers` (e.g. 10).
- **Scheduled Engine**: Low-overhead timer queue using explicit condition waiting instead of standard library wrappers.
- **Exponential Backoff & Jitter**: Configurable retry policies for resilient worker execution.
- **Cooperative Task Cancellation**: Graceful task lifecycle handling with thread interruption safety.

## Verification Commands
```bash
# Execute unit & concurrency tests
mvn test

# Package the executable JAR
mvn package

# Run CLI demonstration
java -jar target/nexusflow-worker-1.0.0-SNAPSHOT.jar
```
