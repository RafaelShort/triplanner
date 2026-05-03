const { Router } = require('express')
const { listDays, createDay, updateDay, deleteDay } = require('../controllers/dayController')
const authMiddleware = require('../middleware/auth')

const router = Router({ mergeParams: true }) // mergeParams para acessar tripId

router.use(authMiddleware)

router.get('/', listDays)
router.post('/', createDay)
router.put('/:id', updateDay)
router.delete('/:id', deleteDay)

module.exports = router
