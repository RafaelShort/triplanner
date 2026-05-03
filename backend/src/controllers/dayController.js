const prisma = require('../lib/prisma')

// ── Helpers ───────────────────────────────────────────────────
// Converte "YYYY-MM-DD" → Date em UTC meio-dia (sem timezone shift)
function parseDate(dateStr) {
  if (!dateStr) return null
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

// Compara strings YYYY-MM-DD diretamente (mais seguro que comparar Dates)
function isDateInRange(dateStr, startDate, endDate) {
  if (!dateStr || !startDate || !endDate) return true
  const d  = dateStr.slice(0, 10)
  const s  = startDate.toISOString().slice(0, 10)
  const e  = endDate.toISOString().slice(0, 10)
  return d >= s && d <= e
}

function formatBR(date) {
  if (!date) return ''
  const [y, m, d] = date.toISOString().slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

// ── Listar dias ───────────────────────────────────────────────
const listDays = async (req, res) => {
  const { tripId } = req.params

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId },
  })
  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem acesso a esta viagem' })
  }

  const days = await prisma.day.findMany({
    where: { tripId },
    include: { activities: true },
    orderBy: { order: 'asc' },
  })

  return res.json({ days })
}

// ── Criar dia ─────────────────────────────────────────────────
const createDay = async (req, res) => {
  const { tripId } = req.params
  const { title, date } = req.body

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })
  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão para editar esta viagem' })
  }

  // Buscar trip para validar range
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { startDate: true, endDate: true },
  })

  if (date && !isDateInRange(date, trip.startDate, trip.endDate)) {
    return res.status(400).json({
      error: true,
      message: `A data deve estar entre ${formatBR(trip.startDate)} e ${formatBR(trip.endDate)}`,
    })
  }

  const lastDay = await prisma.day.findFirst({
    where: { tripId },
    orderBy: { order: 'desc' },
  })
  const order = lastDay ? lastDay.order + 1 : 1

  const day = await prisma.day.create({
    data: {
      tripId,
      title: title || `Dia ${order}`,
      date:  parseDate(date),
      order,
    },
    include: { activities: true },
  })

  return res.status(201).json({ message: 'Dia criado com sucesso', day })
}

// ── Atualizar dia ─────────────────────────────────────────────
const updateDay = async (req, res) => {
  const { tripId, id } = req.params
  const { title, date } = req.body

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })
  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão para editar esta viagem' })
  }

  // Valida data dentro do range da viagem (se fornecida)
  if (date) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { startDate: true, endDate: true },
    })

    if (!isDateInRange(date, trip.startDate, trip.endDate)) {
      return res.status(400).json({
        error: true,
        message: `A data deve estar entre ${formatBR(trip.startDate)} e ${formatBR(trip.endDate)}`,
      })
    }
  }

  const day = await prisma.day.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(date  !== undefined && { date: parseDate(date) }),
    },
    include: { activities: true },
  })

  return res.json({ message: 'Dia atualizado com sucesso', day })
}

// ── Deletar dia ───────────────────────────────────────────────
const deleteDay = async (req, res) => {
  const { tripId, id } = req.params

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })
  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão para editar esta viagem' })
  }

  const existing = await prisma.day.findFirst({ where: { id, tripId } })
  if (!existing) {
    return res.status(404).json({ error: true, message: 'Dia não encontrado' })
  }

  await prisma.day.delete({ where: { id } })
  return res.json({ message: 'Dia removido com sucesso' })
}

module.exports = { listDays, createDay, updateDay, deleteDay }
