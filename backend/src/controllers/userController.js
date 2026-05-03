const prisma = require('../lib/prisma')
const bcrypt = require('bcryptjs')

// ── Buscar perfil atual ───────────────────────────────────────
const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
  })

  if (!user) {
    return res.status(404).json({ error: true, message: 'Usuário não encontrado' })
  }

  return res.json({ user })
}

// ── Atualizar nome ────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { name } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ error: true, message: 'O nome é obrigatório' })
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { name: name.trim() },
    select: { id: true, name: true, email: true, avatarUrl: true },
  })

  return res.json({ message: 'Perfil atualizado com sucesso', user })
}

// ── Atualizar senha ───────────────────────────────────────────
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: true, message: 'Preencha todos os campos de senha' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: true, message: 'A nova senha deve ter ao menos 6 caracteres' })
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: true, message: 'As senhas não coincidem' })
  }

  // ✅ null check — evita crash se usuário for deletado durante a sessão
  const user = await prisma.user.findUnique({ where: { id: req.userId } })

  if (!user) {
    return res.status(404).json({ error: true, message: 'Usuário não encontrado' })
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: true, message: 'Senha atual incorreta' })
  }

  const hash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: req.userId },
    data:  { passwordHash: hash },
  })

  return res.json({ message: 'Senha atualizada com sucesso' })
}

module.exports = { getMe, updateProfile, updatePassword }
