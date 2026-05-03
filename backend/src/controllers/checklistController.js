const prisma = require('../lib/prisma')

async function verifyMember(tripId, userId, roles = null) {
  const where = { tripId, userId }
  if (roles) where.role = { in: roles }
  return prisma.tripMember.findFirst({ where })
}

const getChecklist = async (req, res) => {
  const { tripId } = req.params

  const member = await verifyMember(tripId, req.userId)
  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão' })
  }

  const items = await prisma.checklistItem.findMany({
    where: { tripId },
    orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    include: { user: { select: { id: true, name: true } } },
  })

  return res.json({ items })
}

const addChecklistItem = async (req, res) => {
  const { tripId } = req.params
  const { text, category } = req.body

  if (!text?.trim()) {
    return res.status(400).json({ error: true, message: 'O texto é obrigatório' })
  }

  const member = await verifyMember(tripId, req.userId)
  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão' })
  }

  const item = await prisma.checklistItem.create({
    data: {
      tripId,
      createdBy: req.userId,
      text: text.trim(),
      category: category || 'GENERAL',
    },
    include: { user: { select: { id: true, name: true } } },
  })

  return res.status(201).json({ item })
}

const toggleChecklistItem = async (req, res) => {
  const { tripId, itemId } = req.params

  const member = await verifyMember(tripId, req.userId)
  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão' })
  }

  const existing = await prisma.checklistItem.findFirst({
    where: { id: itemId, tripId },
  })

  if (!existing) {
    return res.status(404).json({ error: true, message: 'Item não encontrado' })
  }

  const item = await prisma.checklistItem.update({
    where: { id: itemId },
    data: { checked: !existing.checked },
    include: { user: { select: { id: true, name: true } } },
  })

  return res.json({ item })
}

const deleteChecklistItem = async (req, res) => {
  const { tripId, itemId } = req.params

  const member = await verifyMember(tripId, req.userId, ['OWNER', 'EDITOR'])
  if (!member) {
    return res
      .status(403)
      .json({ error: true, message: 'Apenas donos e editores podem remover itens' })
  }

  const existing = await prisma.checklistItem.findFirst({
    where: { id: itemId, tripId },
  })

  if (!existing) {
    return res.status(404).json({ error: true, message: 'Item não encontrado' })
  }

  await prisma.checklistItem.delete({ where: { id: itemId } })

  return res.json({ message: 'Item removido com sucesso' })
}

module.exports = {
  getChecklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
}
