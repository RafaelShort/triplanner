const { Router } = require('express')
const { getMe, updateProfile, updatePassword } = require('../controllers/userController')
const authMiddleware = require('../middleware/auth')

const router = Router()

router.use(authMiddleware)

router.get('/me', getMe)
router.put('/me', updateProfile)
router.put('/me/password', updatePassword)

module.exports = router
