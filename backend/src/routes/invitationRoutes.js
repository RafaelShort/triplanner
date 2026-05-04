const { Router } = require('express')
const {
  listInvitations,
  createInvitation,
  cancelInvitation,
} = require('../controllers/invitationController')
const authMiddleware = require('../middleware/auth')

const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.get('/', listInvitations)
router.post('/', createInvitation)
router.delete('/:id', cancelInvitation)

// Rotas registradas diretamente no server.js

module.exports = router
