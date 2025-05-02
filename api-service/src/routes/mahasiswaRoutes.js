const express = require('express');
const mahasiswaController = require('../controllers/mahasiswaController');
const router = express.Router();

router.post('/mahasiswa', mahasiswaController.tambahMahasiswa);
router.get('/mahasiswa', mahasiswaController.getMahasiswa);
router.get('/mahasiswa/:id', mahasiswaController.getMahasiswaById);
router.put('/mahasiswa/:id', mahasiswaController.updateMahasiswa);
router.delete('/mahasiswa/:id', mahasiswaController.deleteMahasiswa);

module.exports = router;