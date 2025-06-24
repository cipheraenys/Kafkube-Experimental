# Kafkube Experimental

An event-driven microservices architecture featuring containerized REST APIs,
Apache Kafka asynchronous event streaming, and automated event log persistence
in PostgreSQL, fully orchestrated with Kubernetes and Docker Compose.

---

## Architecture Overview

```
[ Client / Frontend ]
          │
          ▼
   [ REST API Service ]  ──► (Main PostgreSQL: mahasiswa_db)
          │
    (Event Published: MAHASISWA_CREATED)
          │
          ▼
    [ Apache Kafka ]
          │
    (Event Consumed: log_processors_group)
          │
          ▼
 [ Consumer Service ]  ──► (Log PostgreSQL: log_db)
          │
    (Prometheus Metrics: :9400/metrics)
          ▼
 [ Monitoring: Prometheus & Grafana ]
```

---

## Components

| Component | Technology | Role |
|---|---|---|
| **REST API** | Node.js, Express, pg, kafkajs | Ingests student data, stores to main DB, emits Kafka events |
| **Main Database** | PostgreSQL 15 | Master data storage for student entities |
| **Message Broker** | Apache Kafka & Zookeeper | Distributed event log for decoupling services |
| **Consumer Service** | Node.js, kafkajs, prom-client | Consumes events, persists audit logs, exports Prometheus metrics |
| **Log Database** | PostgreSQL 15 | Dedicated storage for audit trails and latency metrics |
| **Web Frontend** | React, Vite, Tailwind CSS, Nginx | Student management UI with interactive form |
| **Dashboard** | Node.js, Express, Prometheus API | Cluster-level health and node metrics viewer |
| **Monitoring** | Prometheus, Grafana, Kube-State-Metrics | Real-time observability and latency dashboard |

---

## Quick Start (Local with Docker Compose)

Make sure Docker and Docker Compose are installed and running.

```bash
# Clone the repository
git clone https://github.com/cipheraenys/Kafkube-Experimental.git
cd Kafkube-Experimental

# Start all services (Kafka, PostgreSQL DBs, API, Consumer, Frontend)
docker compose up --build
```

Access services locally:
- **Web Frontend**: [http://localhost:8080](http://localhost:8080)
- **REST API**: [http://localhost:3000](http://localhost:3000) (`/health`, `/api/mahasiswa`)
- **Consumer Metrics**: [http://localhost:9400/metrics](http://localhost:9400/metrics)
- **Kafka Host Listener**: `localhost:29092`
- **Main PostgreSQL**: `localhost:5432`
- **Log PostgreSQL**: `localhost:5433`

---

## Kubernetes Deployment

All Kubernetes manifests are located in the `kubernetes/` directory, separated by namespace:
- `kubernetes/mahasiswa-app/`: Core services, Kafka broker, PostgreSQL, and Ingress
- `kubernetes/dashboard/`: Cluster status viewer dashboard
- `kubernetes/monitoring/`: Prometheus and Grafana stack

### Automated Deployment

```bash
cd scripts/
./deploy-all.sh
```

### Cleanup

```bash
cd scripts/
./delete-all.sh
```

---

## Testing Scenarios

Testing suites and load generation tools are available in `tests/`:

1. **Unit Tests (Node.js)**:
   ```bash
   # Run unit tests for API service
   cd api-service && npm test

   # Run unit tests for Consumer service
   cd ../consumer-service && npm test
   ```

2. **Horizontal Scaling Test**:
   ```bash
   cd tests/load-test
   ./send-events.sh
   ```

3. **Latency Benchmarking**:
   ```bash
   cd tests
   ./latency-test.sh
   ```

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
and development workflow.

---

## Credits

Special thanks to [riskyprsty](https://github.com/riskyprsty) for contributions,
support, and inspiration throughout the development of this project.

---

## License

This project is licensed under the [MIT License](LICENSE).
