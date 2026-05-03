const { Router } = require('express')
const { getMyStats } = require('../controllers/statsController')
const authMiddleware = require('../middleware/auth')

const router = Router()

router.use(authMiddleware)

router.get('/me', getMyStats)

module.exports = router
