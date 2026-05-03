const prisma = require('../lib/prisma')

const getMyStats = async (req, res) => {
  const userId = req.userId

  const [
    totalTrips,
    totalActivities,
    totalExpenses,
    upcomingTrips,
    totalDays,
  ] = await Promise.all([
    // Viagens que o usuário participa
    prisma.tripMember.count({
      where: { userId },
    }),

    // Atividades criadas pelo usuário
    prisma.activity.count({
      where: { createdBy: userId },
    }),

    // Despesas pagas pelo usuário
    prisma.expense.count({
      where: { paidBy: userId },
    }),

    // Próximas viagens (startDate no futuro)
    prisma.tripMember.count({
      where: {
        userId,
        trip: {
          startDate: { gte: new Date() },
        },
      },
    }),

    // Total de dias planejados nas viagens do usuário
    prisma.day.count({
      where: {
        trip: {
          members: { some: { userId } },
        },
      },
    }),
  ])

  // ✅ totalMembers — usuários únicos com quem já viajou (sem duplicatas por viagem)
  const coMemberRows = await prisma.tripMember.findMany({
    where: {
      trip: { members: { some: { userId } } },
      userId: { not: userId },
    },
    select: { userId: true },
  })
  const totalMembers = new Set(coMemberRows.map((r) => r.userId)).size

  // Total gasto (soma dos valores)
  const expenseAggregate = await prisma.expense.aggregate({
    _sum:  { amount: true },
    where: { paidBy: userId },
  })

  const totalSpent = expenseAggregate._sum.amount || 0

  return res.json({
    totalTrips,
    totalActivities,
    totalExpenses,
    totalSpent: Number(Number(totalSpent).toFixed(2)),
    upcomingTrips,
    totalDays,
    totalMembers,
  })
}

module.exports = { getMyStats }
