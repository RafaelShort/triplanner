const prisma = require('../lib/prisma')

// ── Listar despesas da viagem ─────────────────────────────────
const listExpenses = async (req, res) => {
  const { tripId } = req.params

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem acesso a esta viagem' })
  }

  const expenses = await prisma.expense.findMany({
    where: { tripId },
    include: {
      payer: { select: { id: true, name: true, avatarUrl: true } },
      splits: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { date: 'desc' },
  })

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  return res.json({ expenses, total })
}

// ── Criar despesa ─────────────────────────────────────────────
const createExpense = async (req, res) => {
  const { tripId } = req.params
  const { title, amount, category, date, splitWith } = req.body

  if (!title) {
    return res.status(400).json({ error: true, message: 'O título é obrigatório' })
  }

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: true, message: 'Valor inválido' })
  }

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão para editar esta viagem' })
  }

  const splitUsers = splitWith && splitWith.length > 0 ? splitWith : []
  const splitAmount = splitUsers.length > 0
    ? Number(amount) / splitUsers.length
    : 0

  const expense = await prisma.expense.create({
    data: {
      tripId,
      title,
      amount:   Number(amount),
      paidBy:   req.userId,
      category: category || null,
      date:     date ? new Date(date) : new Date(),
      splits: splitUsers.length > 0
        ? {
            create: splitUsers.map((userId) => ({
              userId,
              amount: splitAmount,
              paid:   userId === req.userId,
            })),
          }
        : undefined,
    },
    include: {
      payer: { select: { id: true, name: true, avatarUrl: true } },
      splits: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  })

  return res.status(201).json({ message: 'Despesa criada com sucesso', expense })
}

// ── Atualizar despesa ─────────────────────────────────────────
const updateExpense = async (req, res) => {
  const { tripId, id } = req.params
  const { title, amount, category, date } = req.body

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão para editar esta viagem' })
  }

  // valida antes de converter para evitar NaN no banco
  if (amount !== undefined && (isNaN(amount) || Number(amount) <= 0)) {
    return res.status(400).json({ error: true, message: 'Valor inválido' })
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      // só atualiza campos enviados
      ...(title    !== undefined && { title }),
      ...(amount   !== undefined && { amount: Number(amount) }),
      ...(category !== undefined && { category: category || null }),
      ...(date     !== undefined && { date: date ? new Date(date) : undefined }),
    },
    include: {
      payer: { select: { id: true, name: true, avatarUrl: true } },
      splits: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  })

  return res.json({ message: 'Despesa atualizada com sucesso', expense })
}

// ── Deletar despesa ───────────────────────────────────────────
const deleteExpense = async (req, res) => {
  const { tripId, id } = req.params

  const member = await prisma.tripMember.findFirst({
    where: { tripId, userId: req.userId, role: { in: ['OWNER', 'EDITOR'] } },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem permissão para editar esta viagem' })
  }

  await prisma.expense.delete({ where: { id } })

  return res.json({ message: 'Despesa removida com sucesso' })
}

// ── Marcar split como pago ────────────────────────────────────
const toggleSplitPaid = async (req, res) => {
  const { id } = req.params

  // inclui tripId via expense para verificar autorização
  const split = await prisma.expenseSplit.findUnique({
    where: { id },
    include: { expense: { select: { tripId: true } } },
  })

  if (!split) {
    return res.status(404).json({ error: true, message: 'Divisão não encontrada' })
  }

  // verifica que o usuário é membro da viagem
  const member = await prisma.tripMember.findFirst({
    where: { tripId: split.expense.tripId, userId: req.userId },
  })

  if (!member) {
    return res.status(403).json({ error: true, message: 'Sem acesso a esta viagem' })
  }

  const updated = await prisma.expenseSplit.update({
    where: { id },
    data:  { paid: !split.paid },
  })

  return res.json({ message: 'Status atualizado', split: updated })
}

module.exports = {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  toggleSplitPaid,
}
