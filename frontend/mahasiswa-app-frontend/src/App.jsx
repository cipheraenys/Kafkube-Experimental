import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import MahasiswaForm from './components/MahasiswaForm'
import MahasiswaList from './components/MahasiswaList'
import Header from './components/Header'
import { mahasiswaService } from './services/mahasiswaService'
import toast from 'react-hot-toast'

function App() {
  const [mahasiswa, setMahasiswa] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editingMahasiswa, setEditingMahasiswa] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const appRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(appRef.current, 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    )
  }, [])

  useEffect(() => {
    fetchMahasiswa()
  }, [refreshTrigger])

  const fetchMahasiswa = async () => {
    try {
      setLoading(true)
      const data = await mahasiswaService.getMahasiswa()
      setMahasiswa(data)
    } catch (error) {
      console.error('Error fetching mahasiswa:', error)
      toast.error('Gagal mengambil data mahasiswa')
    } finally {
      setLoading(false)
    }
  }

  const handleMahasiswaAdded = () => {
    setEditingMahasiswa(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEdit = (mhs) => {
    setEditingMahasiswa(mhs)
  }

  const handleCancelEdit = () => {
    setEditingMahasiswa(null)
  }

  const handleDelete = async (mhs) => {
    if (!window.confirm(`Hapus mahasiswa "${mhs.nama}" (NIM: ${mhs.nim})? Tindakan ini akan memicu event MAHASISWA_DELETED.`)) {
      return
    }

    setDeletingId(mhs.id)
    try {
      await mahasiswaService.deleteMahasiswa(mhs.id)
      toast.success(`Mahasiswa ${mhs.nama} berhasil dihapus!`)
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting mahasiswa:', error)
      toast.error(error.message || 'Gagal menghapus mahasiswa')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div ref={appRef} className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* backgrond */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-40 -left-32 w-64 h-64 bg-blue-500 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-indigo-500 rounded-full opacity-20 animate-pulse-slow"></div>
      </div>

      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form  */}
            <div className="order-2 lg:order-1">
              <MahasiswaForm
                onMahasiswaAdded={handleMahasiswaAdded}
                editingMahasiswa={editingMahasiswa}
                onCancelEdit={handleCancelEdit}
              />
            </div>

            {/* List  */}
            <div className="order-1 lg:order-2">
              <MahasiswaList
                mahasiswa={mahasiswa}
                loading={loading}
                onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App