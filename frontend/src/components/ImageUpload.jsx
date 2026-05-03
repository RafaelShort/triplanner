import { useRef, useState } from 'react'

export default function ImageUpload({
  currentImage,
  onUpload,
  shape = 'square', // 'square' | 'circle'
  label = 'Alterar imagem',
}) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB')
      return
    }

    setError('')
    setPreview(URL.createObjectURL(file))
    handleUpload(file)
  }

  async function handleUpload(file) {
    setUploading(true)
    try {
      const formData = new FormData()
      const fieldName = onUpload.fieldName || 'file'
      formData.append(fieldName, file)
      await onUpload(formData)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar imagem')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const displayImage = preview || currentImage

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Preview */}
      <div
        className={`overflow-hidden bg-gray-100 flex items-center justify-center ${
          shape === 'circle'
            ? 'w-24 h-24 rounded-full'
            : 'w-full h-40 rounded-xl'
        }`}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl text-gray-300">🖼️</span>
        )}
      </div>

      {/* Botão */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
      >
        {uploading ? 'Enviando...' : label}
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
