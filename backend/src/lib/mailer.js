const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from:    process.env.MAIL_FROM,
      to,
      subject,
      html,
    })
    console.log(`✅ Email enviado para ${to}`)
  } catch (error) {
    console.error('Erro ao enviar email de convite:', error.message)
    throw error
  }
}

module.exports = { sendEmail }
