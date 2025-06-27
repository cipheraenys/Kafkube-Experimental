# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-06-27

### Added
- Asynchronous Kafka event producer for student creation events (`MAHASISWA_CREATED`).
- Consumer service processing Kafka events and recording latency metrics into PostgreSQL.
- Prometheus metrics endpoint (`/metrics`) tracking end-to-end latency histograms.
- Comprehensive Kubernetes manifests for services, Kafka, PostgreSQL, monitoring, and Ingress.
- Docker Compose setup for local development.
- Health check endpoints (`/health`) on both API and consumer services.
- Unit test suites using Node.js built-in test runner (`node:test`).
- Open source community health files, issue/PR templates, and CI workflows.

### Changed
- Standardized project directory structure and test runners.
- Refactored database initialization into controlled lifecycle startup.
- Improved graceful shutdown handlers closing HTTP servers, database pools, and Kafka clients.

### Removed
- Unused committed `kubectl` binary from consumer-service directory.
