const { Router } = require('express')
const {
  listComments,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController')
const authMiddleware = require('../middleware/auth')

const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.get('/',    listComments)
router.post('/',   createComment)
router.put('/:commentId',    updateComment)
router.delete('/:commentId', deleteComment)

module.exports = router
