const nodemailer = require('nodemailer')

// ── Transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // ← adicione esta linha
  },
})

// ── Template base ─────────────────────────────────────────────
function baseTemplate({ title, body }) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:26px;letter-spacing:-0.5px;">
                    ✈️ TriPlanner
                  </h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                    Planeje. Explore. Viaje.
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  ${body}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">
                    TriPlanner · Você recebeu este email pois foi convidado para uma viagem.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

// ── Email de convite ──────────────────────────────────────────
async function sendInviteEmail({ to, inviterName, tripName, inviteToken }) {
  const acceptUrl = `${process.env.FRONTEND_URL}/invites/accept/${inviteToken}`

  const body = `
    <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;">Você foi convidado! 🎉</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">
      <strong style="color:#374151;">${inviterName}</strong> convidou você para participar da viagem:
    </p>

    <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:10px;padding:20px;margin-bottom:28px;text-align:center;">
      <p style="margin:0 0 4px;color:#6366f1;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
        Viagem
      </p>
      <p style="margin:0;color:#1f2937;font-size:24px;font-weight:700;">
        ✈️ ${tripName}
      </p>
    </div>

    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      Clique no botão abaixo para aceitar o convite e começar a planejar junto!
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${acceptUrl}"
        style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#ffffff;
               text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;
               font-weight:600;letter-spacing:0.3px;">
        ✅ Aceitar convite
      </a>
    </div>

    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
      O link expira em <strong>7 dias</strong>. Se não reconhece este convite, ignore este email.
    </p>
  `

  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to,
    subject: `✈️ Você foi convidado para "${tripName}" no TriPlanner`,
    html:    baseTemplate({ title: 'Convite de viagem', body }),
  })
}

// ── Email de boas-vindas ──────────────────────────────────────
async function sendWelcomeEmail({ to, name }) {
  const body = `
    <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;">Bem-vindo, ${name}! 👋</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">
      Sua conta no <strong>TriPlanner</strong> foi criada com sucesso.
      Agora você pode criar viagens, adicionar atividades e convidar amigos!
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:28px;">
      <p style="margin:0 0 12px;color:#166534;font-weight:600;font-size:15px;">
        🚀 Por onde começar:
      </p>
      <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
        <li>Crie sua primeira viagem</li>
        <li>Adicione dias e atividades</li>
        <li>Convide amigos para planejar junto</li>
        <li>Acompanhe despesas e checklist</li>
      </ul>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}"
        style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#ffffff;
               text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">
        🌍 Acessar TriPlanner
      </a>
    </div>
  `

  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to,
    subject: `✈️ Bem-vindo ao TriPlanner, ${name}!`,
    html:    baseTemplate({ title: 'Bem-vindo!', body }),
  })
}

module.exports = { sendInviteEmail, sendWelcomeEmail }
