const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function getFileUrl(filePath) {
  if (!filePath) return null
  if (filePath.startsWith('http')) return filePath
  return `${BASE_URL}${filePath}`
}
