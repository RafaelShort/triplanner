const prisma = require('../lib/prisma')
const crypto = require('crypto')
const { sendInviteEmail } = require('../services/mailService')

// ── Listar convites da viagem ─────────────────────────────────
const listInvitations = async (req, res) => {
  const { tripId } = req.params

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão' })
  }

  const invitations = await prisma.invitation.findMany({
    where: {
      tripId,
      status: { not: 'CANCELLED' },
    },
    include: {
      inviter: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.json({ invitations })
}

// ── Criar convite ─────────────────────────────────────────────
const createInvitation = async (req, res) => {
  const { tripId } = req.params
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: true, message: 'Email é obrigatório' })
  }

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
    include: { trip: true },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão' })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    const alreadyMember = await prisma.tripMember.findFirst({
      where: { tripId, userId: existingUser.id },
    })
    if (alreadyMember) {
      return res.status(409).json({
        error: true,
        message: 'Este usuário já é membro da viagem',
      })
    }
  }

  const existingInvite = await prisma.invitation.findFirst({
    where: { tripId, email, status: 'PENDING' },
  })
  if (existingInvite) {
    return res.status(409).json({
      error: true,
      message: 'Já existe um convite pendente para este email',
    })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const invitation = await prisma.invitation.create({
    data: {
      tripId,
      email,
      token,
      invitedBy: req.userId,
      expiresAt,
    },
    include: {
      trip:    { select: { id: true, name: true, destination: true } },
      inviter: { select: { id: true, name: true } },
    },
  })

  try {
    await sendInviteEmail({
      to:          email,
      inviterName: invitation.inviter.name,
      tripName:    invitation.trip.name,
      inviteToken: token,
    })
  } catch (emailError) {
    console.warn('⚠️ Email de convite não enviado:', emailError.message)
  }

  return res.status(201).json({ message: 'Convite criado com sucesso', invitation })
}

// ── Cancelar convite (soft delete) ───────────────────────────
const cancelInvitation = async (req, res) => {
  const { tripId, id } = req.params

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão' })
  }

  const invite = await prisma.invitation.findFirst({
    where: { id, tripId },
  })

  if (!invite) {
    return res.status(404).json({ error: true, message: 'Convite não encontrado' })
  }

  await prisma.invitation.update({
    where: { id },
    data:  { status: 'CANCELLED' },
  })

  return res.json({ message: 'Convite cancelado' })
}

// ── Buscar convite pelo token (público) ───────────────────────
const getInvitationByToken = async (req, res) => {
  const { token } = req.params

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      trip:    { select: { id: true, name: true, destination: true, startDate: true, endDate: true, description: true } },
      inviter: { select: { id: true, name: true } },
    },
  })

  if (!invitation) {
    return res.status(404).json({ error: true, message: 'Convite não encontrado' })
  }

  if (invitation.status !== 'PENDING') {
    return res.status(410).json({
      error:   true,
      message: 'Este convite não está mais disponível',
      status:  invitation.status,
    })
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.invitation.update({ where: { token }, data: { status: 'EXPIRED' } })
    return res.status(410).json({
      error:   true,
      message: 'Este convite expirou',
      status:  'EXPIRED',
    })
  }

  return res.json({ invitation })
}

// ── Aceitar convite ───────────────────────────────────────────
const acceptInvitation = async (req, res) => {
  const { token } = req.params

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { trip: true },
  })

  if (!invitation) {
    return res.status(404).json({ error: true, message: 'Convite não encontrado' })
  }

  if (invitation.status !== 'PENDING') {
    return res.status(410).json({
      error:   true,
      message: 'Convite inválido',
      status:  invitation.status,
    })
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.invitation.update({ where: { token }, data: { status: 'EXPIRED' } })
    return res.status(410).json({ error: true, message: 'Convite expirado' })
  }

  const alreadyMember = await prisma.tripMember.findFirst({
    where: { tripId: invitation.tripId, userId: req.userId },
  })

  if (alreadyMember) {
    return res.status(409).json({
      error: true,
      message: 'Você já é membro desta viagem',
    })
  }

  await prisma.$transaction([
    prisma.tripMember.create({
      data: { tripId: invitation.tripId, userId: req.userId, role: 'VIEWER' },
    }),
    prisma.invitation.update({
      where: { token },
      data:  { status: 'ACCEPTED' },
    }),
  ])

  return res.json({
    message:  'Convite aceito com sucesso!',
    tripId:   invitation.tripId,    
    tripName: invitation.trip.name,
  })
}

// ── Recusar convite ───────────────────────────────────────────
const rejectInvitation = async (req, res) => {
  const { token } = req.params

  const invitation = await prisma.invitation.findUnique({ where: { token } })

  if (!invitation) {
    return res.status(404).json({ error: true, message: 'Convite não encontrado' })
  }

  await prisma.invitation.update({
    where: { token },
    data:  { status: 'REJECTED' },
  })

  return res.json({ message: 'Convite recusado' })
}

module.exports = {
  listInvitations,
  createInvitation,
  cancelInvitation,
  getInvitationByToken,
  acceptInvitation,
  rejectInvitation,
}
