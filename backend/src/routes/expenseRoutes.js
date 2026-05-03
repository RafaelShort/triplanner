const { Router } = require('express')
const {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  toggleSplitPaid,
} = require('../controllers/expenseController')
const authMiddleware = require('../middleware/auth')

const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.get('/', listExpenses)
router.post('/', createExpense)
router.put('/:id', updateExpense)
router.delete('/:id', deleteExpense)
router.patch('/splits/:id/toggle', toggleSplitPaid)

module.exports = router
