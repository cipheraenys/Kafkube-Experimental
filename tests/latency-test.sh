#!/usr/bin/env bash

set -e

# k8s
NAMESPACE="mahasiswa-app"
SERVICE_API="rest-api-service"
SERVICE_DB_LOG="postgres-db-log-service"

# Port forwading
LOCAL_API_PORT=3000
CLUSTER_API_PORT=3000

LOCAL_DB_PORT=5432
CLUSTER_DB_PORT=5432

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/latency-test && pwd)"

# =============================================================================
# cleanup func
# =============================================================================
cleanup() {
  echo ""
  echo "⚙  Stopping port-forward..."
  kill "$PF_API_PID" "$PF_DB_PID" 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "📦 Check dependensi Node.js..."

if [ ! -d "${BASE_DIR}/node_modules" ]; then
  echo "⚙  node_modules tidak ditemukan. Menjalankan 'npm install'..."
  cd "${BASE_DIR}"
  npm install
  echo "✅ npm install selesai."
else
  echo "✅ node_modules sudah ada, melewati 'npm install'."
fi

#export API_URL="http://localhost:${LOCAL_API_PORT}/api/mahasiswa"
export LOG_DATABASE_URL="postgresql://log_user:log_password@localhost:${LOCAL_DB_PORT}/log_db"

# =============================================================================
# Port-forward Service
# =============================================================================
echo "🔄 Menjalankan port-forward untuk REST API..."
kubectl port-forward -n "$NAMESPACE" "svc/$SERVICE_API" "${LOCAL_API_PORT}:${CLUSTER_API_PORT}" \
  > /tmp/portforward-api.log 2>&1 &
PF_API_PID=$!

echo "🔄 Menjalankan port-forward untuk PostgreSQL Log..."
kubectl port-forward -n "$NAMESPACE" "svc/$SERVICE_DB_LOG" "${LOCAL_DB_PORT}:${CLUSTER_DB_PORT}" \
  > /tmp/portforward-db.log 2>&1 &
PF_DB_PID=$!

sleep 2

echo "✅ Port-forward API PID=${PF_API_PID}, DB PID=${PF_DB_PID}"
echo "🔗 API dapat diakses di http://localhost:${LOCAL_API_PORT}"
echo "🔗 DB Log dapat diakses di postgresql://log_user:log_password@localhost:${LOCAL_DB_PORT}/log_db"

# =============================================================================
# latencyTest.js
# =============================================================================
echo "▶  Menjalankan latencyTest.js ..."
cd "${BASE_DIR}"
npm test

# =============================================================================
# after done, stop port forward
# =============================================================================
echo "✅ latencyTest.js selesai, menghentikan port-forward..."
kill "$PF_API_PID" "$PF_DB_PID" 2>/dev/null || true

echo "🎉 Selesai."
