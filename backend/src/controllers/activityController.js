const prisma = require('../lib/prisma')

// ── Listar atividades ─────────────────────────────────────────
const listActivities = async (req, res) => {
  const { tripId } = req.params
  const { dayId } = req.query

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem acesso a esta viagem' })
  }

  const where = {}
  if (dayId) {
    where.dayId = dayId
  } else {
    const days = await prisma.day.findMany({
      where: { tripId },
      select: { id: true },
    })
    where.dayId = { in: days.map((d) => d.id) }
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  })

  return res.json({ activities })
}

// ── Criar atividade ───────────────────────────────────────────
const createActivity = async (req, res) => {
  const { tripId } = req.params
  const {
    dayId,
    title,
    description,
    startTime,
    locationName,
    latitude,
    longitude,
    type,
  } = req.body

  if (!title) {
    return res.status(400).json({ error: true, message: 'O título é obrigatório' })
  }

  if (!dayId) {
    return res.status(400).json({ error: true, message: 'O dia é obrigatório' })
  }

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão para editar esta viagem' })
  }

  const day = await prisma.day.findFirst({
    where: { id: dayId, tripId },
  })

  if (!day) {
    return res.status(404).json({ error: true, message: 'Dia não encontrado nesta viagem' })
  }

  const activity = await prisma.activity.create({
    data: {
      tripId,
      dayId,
      title,
      description:  description  || null,
      startTime:    startTime    || null,
      locationName: locationName || null,
      latitude:     latitude     ? parseFloat(latitude)  : null,
      longitude:    longitude    ? parseFloat(longitude) : null,
      type:         type         || 'ACTIVITY',
      createdBy:    req.userId,
    },
  })

  return res.status(201).json({ message: 'Atividade criada com sucesso', activity })
}

// ── Atualizar atividade ───────────────────────────────────────
const updateActivity = async (req, res) => {
  const { tripId, id } = req.params
  const {
    title,
    description,
    startTime,
    locationName,
    latitude,
    longitude,
    type,
  } = req.body

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão para editar esta viagem' })
  }

  const existing = await prisma.activity.findFirst({
    where: { id, tripId },
  })

  if (!existing) {
    return res.status(404).json({ error: true, message: 'Atividade não encontrada' })
  }

  const activity = await prisma.activity.update({
    where: { id },
    data: {
      // ✅ spread condicional — só atualiza campos enviados no body
      ...(title        !== undefined && { title }),
      ...(description  !== undefined && { description:  description  || null }),
      ...(startTime    !== undefined && { startTime:    startTime    || null }),
      ...(locationName !== undefined && { locationName: locationName || null }),
      ...(latitude     !== undefined && { latitude:  latitude  ? parseFloat(latitude)  : null }),
      ...(longitude    !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
      ...(type         !== undefined && { type: type || 'ACTIVITY' }),
    },
  })

  return res.json({ message: 'Atividade atualizada com sucesso', activity })
}

// ── Deletar atividade ─────────────────────────────────────────
const deleteActivity = async (req, res) => {
  const { tripId, id } = req.params

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão para editar esta viagem' })
  }

  const existing = await prisma.activity.findFirst({
    where: { id, tripId },
  })

  if (!existing) {
    return res.status(404).json({ error: true, message: 'Atividade não encontrada' })
  }

  await prisma.activity.delete({ where: { id } })

  return res.json({ message: 'Atividade removida com sucesso' })
}

module.exports = { listActivities, createActivity, updateActivity, deleteActivity }
