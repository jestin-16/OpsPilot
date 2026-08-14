#!/bin/bash

echo "Starting OpsPilot Microservices..."

# Install parent POM first
echo "Installing parent POM..."
./mvnw clean install -N

# Build shared library
echo "Building shared-lib..."
./mvnw clean install -pl shared-lib

export MAVEN_OPTS="-Xmx128m -Djava.net.preferIPv4Stack=true -Dspring-boot.run.jvmArguments=-Djava.net.preferIPv4Stack=true"

# Start Service Registry (Eureka)
echo "Starting Service Registry on port 8761..."
./mvnw spring-boot:run -pl service-registry &
sleep 5 # Give Eureka a head start

# Start Auth Service
echo "Starting Auth Service on port 8081..."
./mvnw spring-boot:run -pl auth-service &

# Start Core Service
echo "Starting Core Service on port 8082..."
./mvnw spring-boot:run -pl core-service &

# Start Observability Service
echo "Starting Observability Service on port 8083..."
./mvnw spring-boot:run -pl observability-service &

# Start API Gateway
echo "Starting API Gateway on port 8080..."
./mvnw spring-boot:run -pl api-gateway &

echo "All services are starting up! Press Ctrl+C to stop all services."
wait
