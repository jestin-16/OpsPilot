# syntax=docker/dockerfile:1
# One image definition for every backend service:
#   docker build -f backend/Dockerfile --build-arg SERVICE=core-service --build-arg PORT=8082 backend

FROM maven:3.9-eclipse-temurin-17 AS build
ARG SERVICE
WORKDIR /app
COPY . .
# The Maven repository is a BuildKit cache mount, so dependencies download once instead of on every
# source change.
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q package -pl "${SERVICE}" -am -DskipTests \
 && cp "${SERVICE}"/target/"${SERVICE}"-*.jar /app/app.jar

FROM eclipse-temurin:17-jre-jammy
ARG PORT

# Run as an unprivileged user. ~/.kube is where kubeconfig is mounted for the Kubernetes integrations.
RUN groupadd -g 10001 opspilot \
 && useradd -u 10001 -g opspilot -m -s /usr/sbin/nologin opspilot \
 && mkdir -p /home/opspilot/.kube \
 && chown opspilot:opspilot /home/opspilot/.kube

WORKDIR /app
COPY --from=build --chown=opspilot:opspilot /app/app.jar app.jar
USER 10001:10001

ENV SERVER_PORT=${PORT} \
    JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
EXPOSE ${PORT}

# Readiness, not overall health: it turns UP once the application has started, and is not pulled DOWN by
# optional dependencies such as an unconfigured mail server.
HEALTHCHECK --interval=15s --timeout=3s --start-period=120s --retries=5 \
    CMD curl -fsS "http://localhost:${SERVER_PORT}/actuator/health/readiness" > /dev/null || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
