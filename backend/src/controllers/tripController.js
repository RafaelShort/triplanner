const prisma = require('../lib/prisma')

// ── Helpers ───────────────────────────────────────────────────
// Converte "YYYY-MM-DD" → Date em UTC meio-dia (sem timezone shift)
function parseDate(dateStr) {
  if (!dateStr) return null
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

function toDateOnly(date) {
  if (!date) return null
  return date.toISOString().slice(0, 10)
}

// ── Criar viagem ─────────────────────────────────────────────
const createTrip = async (req, res) => {
  const { name, description, destination, startDate, endDate } = req.body

  if (!name) {
    return res.status(400).json({
      error: true,
      message: 'O nome da viagem é obrigatório',
    })
  }

  // ✅ valida endDate >= startDate
  if (startDate && endDate && endDate < startDate) {
    return res.status(400).json({
      error: true,
      message: 'A data de fim não pode ser anterior à data de início',
    })
  }

  const coverImage = req.file
    ? `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`
    : null

  const trip = await prisma.trip.create({
    data: {
      name,
      description,
      destination,
      startDate: parseDate(startDate),
      endDate:   parseDate(endDate),
      coverImage,
      createdBy: req.userId,
      members: {
        create: { userId: req.userId, role: 'OWNER' },
      },
    },
    include: {
      owner:   { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
    },
  })

  return res.status(201).json({ message: 'Viagem criada com sucesso', trip })
}

// ── Listar viagens do usuário ─────────────────────────────────
const listTrips = async (req, res) => {
  const trips = await prisma.trip.findMany({
    where: { members: { some: { userId: req.userId } } },
    include: {
      owner:   { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      _count:  { select: { activities: true, expenses: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.json({ trips })
}

// ── Buscar viagem por ID ──────────────────────────────────────
const getTrip = async (req, res) => {
  const { id } = req.params

  const trip = await prisma.trip.findFirst({
    where: { id, members: { some: { userId: req.userId } } },
    include: {
      owner:   { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      days:    { include: { activities: true }, orderBy: { order: 'asc' } },
      _count:  { select: { activities: true, expenses: true } },
    },
  })

  if (!trip) {
    return res.status(404).json({ error: true, message: 'Viagem não encontrada' })
  }

  return res.json({ trip })
}

// ── Atualizar viagem ──────────────────────────────────────────
const updateTrip = async (req, res) => {
  const { id } = req.params
  const { name, description, destination, startDate, endDate } = req.body

  const member = await prisma.tripMember.findFirst({
    where: { tripId: id, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão para editar esta viagem' })
  }

  // ✅ buscar viagem atual para validar consistência das datas
  const current = await prisma.trip.findUnique({ where: { id } })
  if (!current) {
    return res.status(404).json({ error: true, message: 'Viagem não encontrada' })
  }

  // Determina o range final (novo se enviado, senão mantém o atual)
  const finalStart = startDate !== undefined ? startDate : toDateOnly(current.startDate)
  const finalEnd   = endDate   !== undefined ? endDate   : toDateOnly(current.endDate)

  if (finalStart && finalEnd && finalEnd < finalStart) {
    return res.status(400).json({
      error: true,
      message: 'A data de fim não pode ser anterior à data de início',
    })
  }

  // ✅ verifica se há dias da viagem fora do novo range
  if (finalStart && finalEnd) {
    const daysOutOfRange = await prisma.day.findMany({
      where: {
        tripId: id,
        date:   { not: null },
        OR: [
          { date: { lt: parseDate(finalStart) } },
          { date: { gt: parseDate(finalEnd)   } },
        ],
      },
      select: { date: true, title: true },
    })

    if (daysOutOfRange.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Existem ${daysOutOfRange.length} dia(s) da viagem fora do novo range. Ajuste-os ou remova-os antes de alterar as datas.`,
      })
    }
  }

  const coverImage = req.file
    ? `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`
    : undefined

  const trip = await prisma.trip.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(destination !== undefined && { destination }),
      ...(startDate   !== undefined && { startDate: parseDate(startDate) }),
      ...(endDate     !== undefined && { endDate:   parseDate(endDate)   }),
      ...(coverImage  !== undefined && { coverImage }),
    },
    include: {
      owner:   { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
    },
  })

  return res.json({ message: 'Viagem atualizada com sucesso', trip })
}

// ── Deletar viagem ────────────────────────────────────────────
const deleteTrip = async (req, res) => {
  const { id } = req.params

  const member = await prisma.tripMember.findFirst({
    where: { tripId: id, userId: req.userId, role: 'OWNER' },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Apenas o dono pode deletar a viagem' })
  }

  await prisma.trip.delete({ where: { id } })
  return res.json({ message: 'Viagem deletada com sucesso' })
}

module.exports = { createTrip, listTrips, getTrip, updateTrip, deleteTrip }
