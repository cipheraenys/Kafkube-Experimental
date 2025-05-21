import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { UserPlus, User, BookOpen, Hash, Send, Pencil, X } from 'lucide-react'
import { mahasiswaService } from '../services/mahasiswaService'
import toast from 'react-hot-toast'

const MahasiswaForm = ({ onMahasiswaAdded, editingMahasiswa, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    nim: '',
    nama: '',
    jurusan: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const formRef = useRef(null)
  const titleRef = useRef(null)
  const inputRefs = useRef([])

  useEffect(() => {
    const tl = gsap.timeline()

    tl.fromTo(formRef.current,
      { opacity: 0, x: -50, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power3.out" }
    )
    .fromTo(titleRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    )

    inputRefs.current.forEach((input, index) => {
      if (input) {
        tl.fromTo(input,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out"
          },
          `-=${0.6 - (index * 0.1)}`
        )
      }
    })
  }, [])

  // Prefill form saat mode edit aktif, reset saat mode edit dibatalkan
  useEffect(() => {
    if (editingMahasiswa) {
      setFormData({
        nim: editingMahasiswa.nim || '',
        nama: editingMahasiswa.nama || '',
        jurusan: editingMahasiswa.jurusan || ''
      })
      setErrors({})
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setFormData({ nim: '', nama: '', jurusan: '' })
      setErrors({})
    }
  }, [editingMahasiswa])

  const addToInputRefs = (el) => {
    if (el && !inputRefs.current.includes(el)) {
      inputRefs.current.push(el)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nim.trim()) {
      newErrors.nim = 'NIM harus diisi'
    } else if (formData.nim.trim().length < 5) {
      newErrors.nim = 'NIM minimal 5 karakter'
    }

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama harus diisi'
    } else if (formData.nama.trim().length < 2) {
      newErrors.nama = 'Nama minimal 2 karakter'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      gsap.to(formRef.current, {
        x: [-10, 10, -10, 10, 0],
        duration: 0.5,
        ease: "power2.inOut"
      })
      return
    }

    setLoading(true)
    const isEditing = Boolean(editingMahasiswa)

    try {
      if (isEditing) {
        await mahasiswaService.updateMahasiswa(editingMahasiswa.id, formData)
        toast.success('Data mahasiswa berhasil diperbarui!')
      } else {
        await mahasiswaService.addMahasiswa(formData)
        toast.success('Mahasiswa berhasil ditambahkan!')
      }

      // animasi sukses
      gsap.to(formRef.current, {
        scale: 1.05,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      })

      setFormData({
        nim: '',
        nama: '',
        jurusan: ''
      })

      onMahasiswaAdded()
    } catch (error) {
      console.error('Error submitting mahasiswa:', error)
      toast.error(error.message || 'Gagal menyimpan data mahasiswa')

      gsap.to(formRef.current, {
        x: [-10, 10, -10, 10, 0],
        duration: 0.5,
        ease: "power2.inOut"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    onCancelEdit?.()
  }

  return (
    <div ref={formRef} className="dark-glass p-8 rounded-2xl shadow-2xl">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            {editingMahasiswa ? <Pencil className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
          </div>
          <h2 ref={titleRef} className="text-2xl font-bold text-white">
            {editingMahasiswa ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru'}
          </h2>
        </div>

        {editingMahasiswa && (
          <button
            onClick={handleCancelEdit}
            className="p-2 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-lg transition-all duration-300"
            title="Batalkan edit"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {editingMahasiswa && (
        <div className="mb-6 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg text-sm text-blue-200">
          Mengedit data ID <strong>{editingMahasiswa.id}</strong> ({editingMahasiswa.nama}). Perubahan akan memicu event MAHASISWA_UPDATED.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* NIM  */}
        <div ref={addToInputRefs} className="group">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Hash className="inline w-4 h-4 mr-1" />
            NIM (Nomor Induk Mahasiswa)
          </label>
          <input
            type="text"
            name="nim"
            value={formData.nim}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-white/10 border ${
              errors.nim ? 'border-red-400' : 'border-white/20'
            } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/15`}
            placeholder="Masukkan NIM mahasiswa"
          />
          {errors.nim && (
            <p className="mt-1 text-sm text-red-400">{errors.nim}</p>
          )}
        </div>

        {/* Nama  */}
        <div ref={addToInputRefs} className="group">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <User className="inline w-4 h-4 mr-1" />
            Nama Lengkap
          </label>
          <input
            type="text"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-white/10 border ${
              errors.nama ? 'border-red-400' : 'border-white/20'
            } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/15`}
            placeholder="Masukkan nama lengkap"
          />
          {errors.nama && (
            <p className="mt-1 text-sm text-red-400">{errors.nama}</p>
          )}
        </div>

        {/* Jurusan  */}
        <div ref={addToInputRefs} className="group">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <BookOpen className="inline w-4 h-4 mr-1" />
            Jurusan
          </label>
          <input
            type="text"
            name="jurusan"
            value={formData.jurusan}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
            placeholder="Masukkan jurusan (opsional)"
          />
        </div>

        {/* Submit  */}
        <div ref={addToInputRefs}>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                {editingMahasiswa ? <Pencil className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                <span>{editingMahasiswa ? 'Simpan Perubahan' : 'Tambah Mahasiswa'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default MahasiswaForm
