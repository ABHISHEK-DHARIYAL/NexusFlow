# syntax=docker/dockerfile:1

# =============================================================================
# NexusFlow Java Concurrency Worker - Production Dockerfile
#
# All values below were read directly from the existing project, not assumed:
#   - Java release:      21          (worker/pom.xml <maven.compiler.release>)
#   - Build tool:         Maven
#   - groupId/artifactId: com.nexusflow / nexusflow-worker  (worker/pom.xml)
#   - Version:             1.0.0-SNAPSHOT                    (worker/pom.xml)
#   - Final JAR:           nexusflow-worker-1.0.0-SNAPSHOT.jar
#                           (produced by maven-jar-plugin + maven-shade-plugin,
#                            both bound to the `package` phase; shade replaces
#                            the plain jar in-place under the same filename)
#   - Main class:          com.nexusflow.Main                (pom.xml manifest
#                                                              config, matches
#                                                              Main.java)
#   - Host binding:        WORKER_HOST env var, default "0.0.0.0"  (Main.java)
#   - HTTP port:           WORKER_PORT env var, default "8081"     (Main.java)
#   - Other env vars read: JAVA_WORKER_SECRET, MIN_WORKERS, MAX_WORKERS,
#                           QUEUE_CAPACITY (Main.java - confirmed via a full
#                           grep of System.getenv usage across the module;
#                           no other environment variables are read anywhere
#                           in worker/src/main/java)
# =============================================================================

# ---- Stage 1: Build -----------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build

# Cache dependency resolution separately from source changes.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src

# Skip tests here - Render's build step should be fast and deterministic.
# Run `mvn test` in CI, not inside the image build.
RUN mvn -B -q clean package -DskipTests

# ---- Stage 2: Runtime -----------------------------------------------------
# Matching the release 21 the project is compiled against - a JRE is
# sufficient at runtime since the shaded jar already contains all
# dependencies (slf4j, logback, jackson).
FROM eclipse-temurin:21-jre-jammy AS runtime

WORKDIR /app

# Run as a non-root user.
RUN groupadd --system nexusflow && useradd --system --gid nexusflow nexusflow

COPY --from=build /build/target/nexusflow-worker-1.0.0-SNAPSHOT.jar ./nexusflow-worker.jar

# Defaults match Main.java's own fallback defaults exactly. WORKER_HOST is
# 0.0.0.0 here (and in the source) so the server is reachable from outside
# the container, as Render requires. WORKER_PORT is also declared via
# ENV so it's visible to `docker inspect`/tooling, but Main.java is what
# actually reads it at startup - this is documentation, not new behavior.
#
# JAVA_WORKER_SECRET is intentionally NOT set here: it must be provided at
# deploy time (e.g. Render's Environment tab), matching the Node backend's
# JAVA_WORKER_SECRET value. No secret is baked into this image.
ENV WORKER_HOST=0.0.0.0
ENV WORKER_PORT=8081
ENV MIN_WORKERS=2
ENV MAX_WORKERS=8
ENV QUEUE_CAPACITY=200

EXPOSE 8081

USER nexusflow

ENTRYPOINT ["java", "-jar", "nexusflow-worker.jar"]
