const prisma = require('../lib/prisma')

// ── Listar comentários de uma atividade ───────────────────────
const listComments = async (req, res) => {
  const { tripId, activityId } = req.params

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem acesso a esta viagem' })
  }

  const comments = await prisma.comment.findMany({
    where: { activityId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  return res.json({ comments })
}

// ── Criar comentário ──────────────────────────────────────────
const createComment = async (req, res) => {
  const { tripId, activityId } = req.params
  const { content } = req.body

  if (!content?.trim()) {
    return res.status(400).json({ error: true, message: 'O comentário não pode estar vazio' })
  }

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem acesso a esta viagem' })
  }

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, tripId },
  })

  if (!activity) {
    return res.status(404).json({ error: true, message: 'Atividade não encontrada' })
  }

  const comment = await prisma.comment.create({
    data: {
      content:    content.trim(),
      activityId,
      userId:     req.userId,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  return res.status(201).json({ message: 'Comentário adicionado', comment })
}

// ── Atualizar comentário ──────────────────────────────────────
const updateComment = async (req, res) => {
  const { tripId, commentId } = req.params
  const { content } = req.body

  if (!content?.trim()) {
    return res.status(400).json({ error: true, message: 'O comentário não pode estar vazio' })
  }

  // verifica que o usuário ainda é membro da viagem
  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem acesso a esta viagem' })
  }

  const existing = await prisma.comment.findFirst({
    where: { id: commentId },
  })

  if (!existing) {
    return res.status(404).json({ error: true, message: 'Comentário não encontrado' })
  }

  if (existing.userId !== req.userId) {
    return res.status(403).json({ error: true, message: 'Você só pode editar seus próprios comentários' })
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data:  { content: content.trim() },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  return res.json({ message: 'Comentário atualizado', comment })
}

// ── Deletar comentário ────────────────────────────────────────
const deleteComment = async (req, res) => {
  const { tripId, commentId } = req.params

  const existing = await prisma.comment.findFirst({
    where: { id: commentId },
  })

  if (!existing) {
    return res.status(404).json({ error: true, message: 'Comentário não encontrado' })
  }

  // Dono do comentário OU owner da viagem pode deletar
  const isOwner = existing.userId === req.userId
  const isTripOwner = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: 'OWNER' },
  })

  if (!isOwner && !isTripOwner) {
    return res.status(403).json({ error: true, message: 'Sem permissão para remover este comentário' })
  }

  await prisma.comment.delete({ where: { id: commentId } })

  return res.json({ message: 'Comentário removido' })
}

module.exports = { listComments, createComment, updateComment, deleteComment }
