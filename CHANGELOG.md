# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Full CRUD REST endpoints: `GET /api/mahasiswa/:id`, `PUT /api/mahasiswa/:id`
  (memicu event `MAHASISWA_UPDATED`), dan `DELETE /api/mahasiswa/:id` (memicu
  event `MAHASISWA_DELETED`).
- Kolom `updated_at` kini terisi otomatis saat operasi update.
- Histogram Prometheus baru `consumer_processing_seconds` yang mengukur murni
  waktu pemrosesan log oleh consumer, terpisah dari latensi end-to-end.
- Aksi edit dan hapus pada kartu mahasiswa di web frontend, lengkap dengan mode
  edit pada form (prefill data dan tombol batal).
- Konfigurasi `PROMETHEUS_URL` pada dashboard agar alamat Prometheus tidak
  lagi di-hardcode.

### Changed
- Judul halaman web frontend diselaraskan dengan nama aplikasi.
- Unit tests diperluas mencakup validasi ID dan payload untuk endpoint baru.

### Removed
- Dead code `MahasiswaContext.jsx` yang mengimpor service yang tidak ada, dan
  import `Strikethrough` yang tidak terpakai di Header.

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
