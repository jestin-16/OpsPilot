# Event-Driven Architecture in OpsPilot

This document outlines the Event-Driven Architecture (EDA) introduced in OpsPilot to handle system integrations, webhooks, and normalized infrastructure events.

## Overview

OpsPilot employs an internal Event Publisher abstraction (`EventPublisher`) to decouple event producers (such as `WebhookController` or infrastructure polling adapters) from consumers (e.g., database persistency logic, real-time socket emitters).

Currently, this architecture is implemented using an in-process mechanism (`InProcessEventPublisher`), which is suitable for the current single-instance deployment model of OpsPilot. This provides loose coupling without the overhead of maintaining external message brokers.

## Core Abstractions

### EventPublisher
The primary interface for publishing events to the rest of the application. It receives an `EventEnvelope`.

### EventSubscriber
The interface for subscribing to specific event streams. Implementations listen for `EventEnvelope` objects and react accordingly. Currently supported natively via Spring's internal event bus (`@EventListener`).

### EventEnvelope
The standard wrapper for all system events. It provides essential routing and tracing metadata regardless of the payload:
- `eventId`: Unique identifier for the event
- `eventType`: The categorized event type (e.g., `DEPLOYMENT_STARTED`, `POD_CRASHED`)
- `timestamp`: When the event originally occurred
- `projectId` / `integrationId`: Routing keys mapping the event to an OpsPilot context
- `source`: The origin of the event (e.g., `github-webhook`, `kubernetes-adapter`)
- `payload`: The actual event content (e.g., `InfrastructureEvent`)
- `correlationId`: For distributed tracing and associating multiple downstream events

## Future Evolution: Kafka / RabbitMQ

The interfaces have been specifically designed to ensure that if scale necessitates moving to a distributed microservice model requiring Kafka or RabbitMQ, **producers and consumers will not need to be refactored**. 

To introduce a broker:
1. Implement a `KafkaEventPublisher` or `RabbitMQEventPublisher` extending `EventPublisher`.
2. Implement a broker-specific listener adapter that deserializes messages and invokes local `EventSubscriber` instances.
3. Switch the active Spring bean via profiles.

## Idempotency and Error Handling

Subscribers are responsible for ensuring idempotency, as distributed systems (and polling mechanisms) may deliver duplicate events. 

- **Idempotency**: Handled using explicit checks against the database (`InfrastructureEventRepository.existsById`) before persisting. Event IDs are derived deterministically from their origin (e.g., Kubernetes `metadata.uid` or GitHub `commitSha` + `eventType`) to guarantee duplicates are squashed.
- **Error Handling**: Currently caught in-process and logged at the subscriber level to prevent poison-pill scenarios in the Spring Application Event Bus. For external brokers, dead-letter queues (DLQ) would be introduced based on subscriber exceptions.
