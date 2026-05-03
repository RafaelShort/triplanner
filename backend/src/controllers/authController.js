const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')
const { sendWelcomeEmail } = require('../services/mailService')

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// ── Registro ─────────────────────────────────────────────────
const register = async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({
      error: true,
      message: 'Nome, email e senha são obrigatórios',
    })
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: true,
      message: 'A senha deve ter no mínimo 6 caracteres',
    })
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return res.status(409).json({
      error: true,
      message: 'Email já cadastrado',
    })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  })

  // ── Email de boas-vindas (falha silenciosa) ───────────────
  try {
    await sendWelcomeEmail({ to: email, name })
  } catch (mailErr) {
    console.warn('⚠️ Email de boas-vindas não enviado:', mailErr.message)
  }

  const token = generateToken(user.id)

  return res.status(201).json({
    message: 'Usuário criado com sucesso',
    token,
    user: {
      id:        user.id,
      name:      user.name,
      email:     user.email,
      avatarUrl: user.avatarUrl,
    },
  })
}

// ── Login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: 'Email e senha são obrigatórios',
    })
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return res.status(401).json({
      error: true,
      message: 'Email ou senha inválidos',
    })
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)

  if (!passwordMatch) {
    return res.status(401).json({
      error: true,
      message: 'Email ou senha inválidos',
    })
  }

  const token = generateToken(user.id)

  return res.json({
    message: 'Login realizado com sucesso',
    token,
    user: {
      id:        user.id,
      name:      user.name,
      email:     user.email,
      avatarUrl: user.avatarUrl,
    },
  })
}

// ── Perfil do usuário logado ──────────────────────────────────
const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id:        true,
      name:      true,
      email:     true,
      avatarUrl: true,
      createdAt: true,
    },
  })

  if (!user) {
    return res.status(404).json({
      error: true,
      message: 'Usuário não encontrado',
    })
  }

  return res.json({ user })
}

module.exports = { register, login, me }
