const { Router } = require('express')
const {
  getChecklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} = require('../controllers/checklistController')
const authMiddleware = require('../middleware/auth')

// mergeParams: true para acessar :tripId da rota pai
const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.get('/', getChecklist)
router.post('/', addChecklistItem)
router.patch('/:itemId/toggle', toggleChecklistItem)
router.delete('/:itemId', deleteChecklistItem)

module.exports = router
