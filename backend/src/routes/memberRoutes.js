const { Router } = require('express')
const { listMembers, updateMemberRole, removeMember } = require('../controllers/memberController')
const authMiddleware = require('../middleware/auth')

const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.get('/', listMembers)
router.put('/:id', updateMemberRole)
router.delete('/:id', removeMember)

module.exports = router
