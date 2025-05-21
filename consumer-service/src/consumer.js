const express = require("express");
const client = require("prom-client");
const { Kafka } = require("kafkajs");
const { saveLog, initLogDb, closeLogDb } = require("./services/logService");

client.collectDefaultMetrics();

const latencyHistogram = new client.Histogram({
  name: "end_to_end_latency_seconds",
  help: "Latency end-to-end dari API kirim sampai log disimpan (detik)",
  labelNames: ["event_type"],
  buckets: [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1],
});

const app = express();
const portMetrics = process.env.METRICS_PORT || 9400;

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Health check endpoint for container orchestrators (Kubernetes & Docker)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "consumer-service",
    timestamp: new Date().toISOString()
  });
});

const KAFKA_BROKERS = process.env.KAFKA_BROKERS
  ? process.env.KAFKA_BROKERS.split(",")
  : ["localhost:9092"];
const KAFKA_TOPIC = process.env.KAFKA_TOPIC || "mahasiswa_events";
const KAFKA_CONSUMER_GROUP =
  process.env.KAFKA_CONSUMER_GROUP || "log_processors_group";
const KAFKA_CLIENT_ID =
  process.env.KAFKA_CLIENT_ID ||
  `consumer-service-${Math.random().toString(36).substring(7)}`;

const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS,
});

const consumer = kafka.consumer({ groupId: KAFKA_CONSUMER_GROUP });
let server;

const run = async () => {
  try {
    await initLogDb(); // Init log database schema
  } catch (err) {
    console.error("Peringatan: Gagal inisialisasi Log DB saat start:", err.message);
  }

  try {
    await consumer.connect();
    console.log("Kafka Consumer connected.");

    await consumer.subscribe({
      topic: KAFKA_TOPIC,
      fromBeginning: process.env.KAFKA_CONSUME_FROM_BEGINNING === "true",
    });
    console.log(
      `Subscribed to topic: ${KAFKA_TOPIC} with group ID: ${KAFKA_CONSUMER_GROUP}`
    );

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(
          `Received message from ${topic} [${partition}] offset ${message.offset}:`
        );
        try {
          const event = JSON.parse(message.value.toString());

          const tApiSent = event.timestamp_api_sent
            ? new Date(event.timestamp_api_sent).getTime()
            : Date.now();
          const tNow = Date.now();
          const latencySec = (tNow - tApiSent) / 1000.0;
          latencyHistogram.labels(event.eventType || "unknown").observe(latencySec);

          await saveLog(event, partition, message.offset);
        } catch (parseError) {
          console.error(
            "Error mem-parsing pesan atau menyimpan log:",
            parseError
          );
        }
      },
    });
  } catch (error) {
    console.error("Error in Kafka consumer:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  run().catch((e) =>
    console.error("[consumer-service] Gagal menjalankan consumer", e)
  );

  server = app.listen(portMetrics, () => {
    console.log(`Metrics endpoint berjalan di port ${portMetrics}`);
  });
}

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`${signal} signal diterima: menutup consumer, DB pool, dan metrics server...`);
  if (server) {
    server.close(() => {
      console.log("Metrics server ditutup.");
    });
  }
  try {
    await consumer.disconnect();
    console.log("Kafka consumer terputus.");
  } catch (err) {
    console.error("Error memutuskan service Kafka consumer:", err);
  }
  await closeLogDb();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

module.exports = { app, latencyHistogram };
