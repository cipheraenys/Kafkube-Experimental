const { Pool } = require('pg');
const { publishEvent } = require('../services/kafkaProducer');

const DB_CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mahasiswa_db';

const pool = new Pool({
  connectionString: DB_CONNECTION_STRING,
});

pool.on('connect', () => {
  console.log('Terkoneksi ke Main PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('Error pada idle client di Main DB:', err);
});

// Inisialisasi tabel jika belum ada
const initDb = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS mahasiswa (
      id SERIAL PRIMARY KEY,
      nim VARCHAR(20) UNIQUE NOT NULL,
      nama VARCHAR(100) NOT NULL,
      jurusan VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log("Inisialisasi tabel 'mahasiswa' berhasil.");
  } catch (err) {
    console.error("Error saat inisialisasi tabel 'mahasiswa':", err);
    throw err;
  }
};

const closeDb = async () => {
  try {
    await pool.end();
    console.log('Koneksi pool database utama ditutup.');
  } catch (err) {
    console.error('Error saat menutup pool database utama:', err);
  }
};

exports.tambahMahasiswa = async (req, res) => {
  const { nim, nama, jurusan } = req.body;

  if (!nim || !nama) {
    return res.status(400).json({ error: 'NRP dan Nama harus diisi' });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO mahasiswa (nim, nama, jurusan) VALUES ($1, $2, $3) RETURNING *',
        [nim, nama, jurusan]
      );
      const mahasiswaBaru = result.rows[0];

      // Publish event ke Kafka
      await publishEvent('MAHASISWA_CREATED', mahasiswaBaru);

      res.status(201).json(mahasiswaBaru);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error menambah mahasiswa:', error);
    if (error.code === '23505') { // PostgreSQL code 23505: unique_violation
      return res.status(409).json({ error: `Mahasiswa dengan NRP ${nim} sudah ada.` });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

exports.getMahasiswa = async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM mahasiswa ORDER BY created_at DESC');
      res.status(200).json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saat mengambil data mahasiswa:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMahasiswaById = async (req, res) => {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'ID mahasiswa tidak valid' });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM mahasiswa WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Mahasiswa dengan ID ${id} tidak ditemukan.` });
      }
      res.status(200).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saat mengambil detail mahasiswa:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateMahasiswa = async (req, res) => {
  const { id } = req.params;
  const { nim, nama, jurusan } = req.body;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'ID mahasiswa tidak valid' });
  }

  if (!nim || !nama) {
    return res.status(400).json({ error: 'NRP dan Nama harus diisi' });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE mahasiswa
         SET nim = $1, nama = $2, jurusan = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [nim, nama, jurusan, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Mahasiswa dengan ID ${id} tidak ditemukan.` });
      }
      const mahasiswaDiupdate = result.rows[0];

      await publishEvent('MAHASISWA_UPDATED', mahasiswaDiupdate);

      res.status(200).json(mahasiswaDiupdate);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saat memperbarui mahasiswa:', error);
    if (error.code === '23505') { // PostgreSQL code 23505: unique_violation
      return res.status(409).json({ error: `Mahasiswa dengan NRP ${nim} sudah ada.` });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

exports.deleteMahasiswa = async (req, res) => {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'ID mahasiswa tidak valid' });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM mahasiswa WHERE id = $1 RETURNING *',
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Mahasiswa dengan ID ${id} tidak ditemukan.` });
      }
      const mahasiswaDihapus = result.rows[0];

      await publishEvent('MAHASISWA_DELETED', mahasiswaDihapus);

      res.status(200).json({
        message: `Mahasiswa ${mahasiswaDihapus.nama} berhasil dihapus.`,
        deleted: mahasiswaDihapus,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saat menghapus mahasiswa:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.initDb = initDb;
exports.closeDb = closeDb;
exports.pool = pool;
