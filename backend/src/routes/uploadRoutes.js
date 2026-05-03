const { Router } = require('express')
const upload = require('../middleware/upload')
const { uploadAvatar, uploadTripCover } = require('../controllers/uploadController')
const authMiddleware = require('../middleware/auth')

const router = Router()

router.use(authMiddleware)

router.post('/avatar', upload.single('avatar'), uploadAvatar)
router.post('/trips/:tripId/cover', upload.single('cover'), uploadTripCover)

module.exports = router
