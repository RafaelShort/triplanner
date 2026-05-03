const { Router } = require('express')
const {
  createTrip,
  listTrips,
  getTrip,
  updateTrip,
  deleteTrip,
} = require('../controllers/tripController')
const authMiddleware = require('../middleware/auth')
const upload = require('../middleware/upload')

const router = Router()

router.use(authMiddleware)

router.post('/', upload.single('coverImage'), createTrip)
router.get('/', listTrips)
router.get('/:id', getTrip)
router.put('/:id', upload.single('coverImage'), updateTrip)
router.delete('/:id', deleteTrip)

module.exports = router
