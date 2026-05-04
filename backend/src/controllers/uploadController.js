const prisma = require('../lib/prisma')
const path = require('path')
const fs = require('fs')

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

// ── Avatar do usuário ─────────────────────────────────────────
const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: true, message: 'Nenhum arquivo enviado' })
  }

  const avatarUrl = `${BACKEND_URL}/uploads/${req.file.filename}`

  const user = await prisma.user.findUnique({ where: { id: req.userId } })

  // null check antes de acessar user.avatarUrl
  if (!user) {
    return res.status(404).json({ error: true, message: 'Usuário não encontrado' })
  }

  // Remove o arquivo antigo se existir
  if (user.avatarUrl && user.avatarUrl.includes('/uploads/')) {
    const oldPath = path.join(__dirname, '../../uploads', path.basename(user.avatarUrl))
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  }

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data:  { avatarUrl },
    select: { id: true, name: true, email: true, avatarUrl: true },
  })

  return res.json({ message: 'Avatar atualizado com sucesso', user: updated, avatarUrl })
}

// ── Capa da viagem ────────────────────────────────────────────
const uploadTripCover = async (req, res) => {
  const { tripId } = req.params

  if (!req.file) {
    return res.status(400).json({ error: true, message: 'Nenhum arquivo enviado' })
  }

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão' })
  }

  const coverImage = `${BACKEND_URL}/uploads/${req.file.filename}`

  const trip = await prisma.trip.findUnique({ where: { id: tripId } })

  // null check antes de acessar trip.coverImage
  if (!trip) {
    return res.status(404).json({ error: true, message: 'Viagem não encontrada' })
  }

  // Remove a capa antiga se existir
  if (trip.coverImage && trip.coverImage.includes('/uploads/')) {
    const oldPath = path.join(__dirname, '../../uploads', path.basename(trip.coverImage))
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  }

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data:  { coverImage },
    select: { id: true, name: true, coverImage: true },
  })

  return res.json({ message: 'Capa atualizada com sucesso', trip: updated, coverImage })
}

module.exports = { uploadAvatar, uploadTripCover }
