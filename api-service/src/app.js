const express = require('express');
const mahasiswaRoutes = require('./routes/mahasiswaRoutes');
const { connectProducer, disconnectProducer } = require('./services/kafkaProducer');
const { initDb, closeDb } = require('./controllers/mahasiswaController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('REST API Mahasiswa sedang berjalan!');
});

// Health check endpoint for container orchestrators (Kubernetes & Docker)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'api-service',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', mahasiswaRoutes);

let server;

const startServer = async () => {
  // Initialize database schema first
  try {
    await initDb();
  } catch (err) {
    console.error('Peringatan: Gagal inisialisasi DB saat start (akan dicoba saat request pertama):', err.message);
  }

  // Connect Kafka producer
  await connectProducer();

  server = app.listen(PORT, () => {
    console.log(`REST API Mahasiswa listening on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer().catch(err => {
    console.error('Gagal menjalankan server:', err);
    process.exit(1);
  });
}

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`${signal} signal diterima: menutup HTTP server, DB pool, dan Kafka producer...`);
  if (server) {
    server.close(() => {
      console.log('HTTP server ditutup.');
    });
  }
  await closeDb();
  await disconnectProducer();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = { app, startServer };
