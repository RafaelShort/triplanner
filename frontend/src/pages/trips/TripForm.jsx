import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'

export default function TripForm() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const isEditing   = Boolean(id)

  const [form, setForm] = useState({
    name:        '',
    description: '',
    destination: '',
    startDate:   '',
    endDate:     '',
  })
  const [imageFile, setImageFile]       = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    if (isEditing) fetchTrip()
  }, [id])

  async function fetchTrip() {
    try {
      const response = await api.get(`/trips/${id}`)
      const trip = response.data.trip || response.data
      setForm({
        name:        trip.name        || '',
        description: trip.description || '',
        destination: trip.destination || '',
        startDate:   trip.startDate ? trip.startDate.slice(0, 10) : '',
        endDate:     trip.endDate   ? trip.endDate.slice(0, 10)   : '',
      })
      if (trip.coverImage) setImagePreview(trip.coverImage)
    } catch {
      setError('Erro ao carregar viagem')
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // validação de datas no frontend
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError('A data de fim não pode ser anterior à data de início')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name',        form.name)
      formData.append('description', form.description)
      formData.append('destination', form.destination)
      formData.append('startDate',   form.startDate)
      formData.append('endDate',     form.endDate)
      if (imageFile) formData.append('coverImage', imageFile)

      if (isEditing) {
        await api.put(`/trips/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/trips', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      navigate('/trips')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar viagem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Editar Viagem' : 'Nova Viagem'}
      </h1>

      {error && (
        <p className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome da viagem *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: Férias em Paris"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Destino</label>
          <input
            type="text"
            name="destination"
            value={form.destination}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: Paris, França"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Detalhes da viagem..."
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Data de início</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              max={form.endDate || undefined}   
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Data de fim</label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>


        <div>
          <label className="block text-sm font-medium mb-1">Foto de capa</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF ou WebP — máx. 5MB</p>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-3 w-full h-48 object-cover rounded-lg border"
            />
          )}
        </div>

        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar viagem'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/trips')}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
