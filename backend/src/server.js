const express = require('express')
const cors = require('cors')
const path = require('path')
const { createServer } = require('http')
require('dotenv').config()
require('express-async-errors')

const authRoutes = require('./routes/authRoutes')
const tripRoutes = require('./routes/tripRoutes')
const dayRoutes = require('./routes/dayRoutes')
const activityRoutes = require('./routes/activityRoutes')
const expenseRoutes = require('./routes/expenseRoutes')
const invitationRoutes = require('./routes/invitationRoutes')
const memberRoutes = require('./routes/memberRoutes')
const userRoutes = require('./routes/userRoutes')
const uploadRoutes = require('./routes/uploadRoutes')
const statsRoutes = require('./routes/statsRoutes')
const checklistRoutes = require('./routes/checklistRoutes')
const commentRoutes = require('./routes/commentRoutes')
const weatherRoutes = require('./routes/weatherRoutes')

const {
  getInvitationByToken,
  acceptInvitation,
  rejectInvitation,
} = require('./controllers/invitationController')
const authMiddleware = require('./middleware/auth')

const app = express()
const httpServer = createServer(app)

// ── Middlewares globais ──────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ── Rotas ────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TriPlanner API is running!',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/trips/:tripId/days', dayRoutes)
app.use('/api/trips/:tripId/activities', activityRoutes)
app.use('/api/trips/:tripId/expenses', expenseRoutes)
app.use('/api/trips/:tripId/invitations', invitationRoutes)
app.use('/api/trips/:tripId/members', memberRoutes)
app.use('/api/trips/:tripId/checklist', checklistRoutes)
app.use('/api/users', userRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/trips/:tripId/activities/:activityId/comments', commentRoutes)
app.use('/api/weather', weatherRoutes)

// ── Rotas públicas de convite (por token) ─────────────────────
app.get('/api/invitations/:token', getInvitationByToken)
app.post('/api/invitations/:token/accept', authMiddleware, acceptInvitation)
app.post('/api/invitations/:token/reject', authMiddleware, rejectInvitation)

// ── Tratamento de erros ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  const statusCode = err.statusCode || 500
  const message = err.message || 'Erro interno do servidor'
  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// ── Iniciando o servidor ─────────────────────────────────────
const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
})

module.exports = { app, httpServer }
