const { Router } = require('express')
const { getWeather } = require('../controllers/weatherController')
const authMiddleware = require('../middleware/auth')

const router = Router()

router.get('/', authMiddleware, getWeather)

module.exports = router
