# syntax=docker/dockerfile:1
# Ultra-fast runtime image definition for OpsPilot backend services
FROM eclipse-temurin:17-jre-jammy
ARG SERVICE
ARG PORT

# Run as an unprivileged user. ~/.kube is where kubeconfig is mounted for Kubernetes integrations.
RUN groupadd -g 10001 opspilot \
 && useradd -u 10001 -g opspilot -m -s /usr/sbin/nologin opspilot \
 && mkdir -p /home/opspilot/.kube \
 && chown opspilot:opspilot /home/opspilot/.kube

WORKDIR /app
COPY --chown=opspilot:opspilot ${SERVICE}/target/${SERVICE}-*.jar app.jar
USER 10001:10001

ENV SERVER_PORT=${PORT} \
    JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
EXPOSE ${PORT}

HEALTHCHECK --interval=15s --timeout=3s --start-period=60s --retries=5 \
    CMD curl -fsS "http://localhost:${SERVER_PORT}/actuator/health/readiness" > /dev/null || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
