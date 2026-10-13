# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -pl log-watcher-service -am -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Create non-root user for security
RUN groupadd -g 10001 opspilot && \
    useradd -u 10001 -g opspilot -m -s /bin/bash opspilot && \
    mkdir -p /home/opspilot/.kube && \
    chown -R opspilot:opspilot /app /home/opspilot

COPY --from=build --chown=opspilot:opspilot /app/log-watcher-service/target/*.jar app.jar

USER 10001:10001

EXPOSE 8084

ENV JAVA_OPTS="-Xms64m -Xmx192m -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
