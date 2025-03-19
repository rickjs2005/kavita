const nodemailer = require('nodemailer');

async function sendResetPasswordEmail(toEmail, token) {
  // Substitua pelo seu domínio real
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: 'Gmail', // ou outro serviço SMTP
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: '"Suporte" <suporte@kavita.com>',
    to: toEmail,
    subject: 'Redefinição de Senha',
    html: `
      <p>Você solicitou a redefinição de senha.</p>
      <p>Clique no link para criar uma nova senha: 
         <a href="${resetLink}">${resetLink}</a>
      </p>
      <p>Se você não solicitou isso, ignore este e-mail.</p>
    `
  });
}

module.exports = { sendResetPasswordEmail };
