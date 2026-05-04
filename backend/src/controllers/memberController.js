const prisma = require('../lib/prisma')

// ── Listar membros ────────────────────────────────────────────
const listMembers = async (req, res) => {
  const { tripId } = req.params

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem acesso a esta viagem' })
  }

  const members = await prisma.tripMember.findMany({
    where: { tripId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })

  const myRole = members.find((m) => m.userId === req.userId)?.role

  return res.json({ members, myRole })
}

// ── Atualizar papel do membro ─────────────────────────────────
const updateMemberRole = async (req, res) => {
  const { tripId, id } = req.params
  const { role } = req.body

  if (!['EDITOR', 'VIEWER'].includes(role)) {
    return res.status(400).json({ error: true, message: 'Papel inválido' })
  }

  const requester = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: 'OWNER' },
  })

  if (!requester) {
    return res.status(403).json({ error: true, message: 'Apenas o dono pode alterar permissões' })
  }

  // filtra por tripId
  const target = await prisma.tripMember.findFirst({
    where: { id, tripId },
  })

  if (!target) {
    return res.status(404).json({ error: true, message: 'Membro não encontrado' })
  }

  if (target.role === 'OWNER') {
    return res.status(400).json({ error: true, message: 'Não é possível alterar o papel do dono' })
  }

  const updated = await prisma.tripMember.update({
    where: { id },
    data:  { role },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  })

  return res.json({ message: 'Papel atualizado com sucesso', member: updated })
}

// ── Remover membro ────────────────────────────────────────────
const removeMember = async (req, res) => {
  const { tripId, id } = req.params

  const requester = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: 'OWNER' },
  })

  if (!requester) {
    return res.status(403).json({ error: true, message: 'Apenas o dono pode remover membros' })
  }

  // filtra por tripId
  const target = await prisma.tripMember.findFirst({
    where: { id, tripId },
  })

  if (!target) {
    return res.status(404).json({ error: true, message: 'Membro não encontrado' })
  }

  if (target.role === 'OWNER') {
    return res.status(400).json({ error: true, message: 'Não é possível remover o dono da viagem' })
  }

  await prisma.tripMember.delete({ where: { id } })

  return res.json({ message: 'Membro removido com sucesso' })
}

module.exports = { listMembers, updateMemberRole, removeMember }
