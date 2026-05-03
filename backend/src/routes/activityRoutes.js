const { Router } = require('express')
const {
  listActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} = require('../controllers/activityController')
const authMiddleware = require('../middleware/auth')

const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.get('/', listActivities)
router.post('/', createActivity)
router.put('/:id', updateActivity)
router.delete('/:id', deleteActivity)

module.exports = router
