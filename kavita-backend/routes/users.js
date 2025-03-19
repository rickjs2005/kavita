const express = require("express");
const router = express.Router();
const pool = require("../config/pool");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Variáveis de ambiente para e-mail
const EMAIL_USER = process.env.EMAIL_USER || "seuemail@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "suasenha";

// Função para validar se todos os campos estão preenchidos
const validarCampos = ({ nome, email, senha, endereco, data_nascimento, telefone, pais, estado, cidade, cep, ponto_referencia }) => {
  return nome && email && senha && endereco && data_nascimento && telefone && pais && estado && cidade && cep && ponto_referencia;
};

// Função para gerar token aleatório
const generateToken = () => crypto.randomBytes(32).toString("hex");

// Rota para cadastro de usuário
router.post("/register", async (req, res) => {
  const { nome, email, senha, endereco, data_nascimento, telefone, pais, estado, cidade, cep, ponto_referencia } = req.body;

  if (!validarCampos(req.body)) {
    return res.status(400).json({ mensagem: "Todos os campos são obrigatórios." });
  }

  try {
    // Verifica se o e-mail já está cadastrado
    const [rows] = await pool.execute("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(400).json({ mensagem: "Esse e-mail já está cadastrado. Tente outro ou faça login." });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere o novo usuário no banco de dados
    const query = `
      INSERT INTO usuarios (nome, email, senha, endereco, data_nascimento, telefone, pais, estado, cidade, cep, ponto_referencia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.execute(query, [
      nome, email, senhaHash, endereco, data_nascimento, telefone, pais, estado, cidade, cep, ponto_referencia,
    ]);

    res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    res.status(500).json({ mensagem: "Erro no servidor. Tente novamente mais tarde." });
  }
});

// Rota para solicitar link de redefinição de senha
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Verifica se o e-mail existe
    const [rows] = await pool.execute("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (!rows || rows.length === 0) {
      return res.status(200).json({
        mensagem: "Se este e-mail estiver cadastrado, enviaremos um link para redefinir a senha."
      });
    }

    // Gera token e define a data de expiração
    const user = rows[0];
    const token = generateToken();
    const expires = new Date(Date.now() + 3600000); // 1 hora a partir de agora

    // Salva token e data de expiração no banco
    await pool.execute(
      "UPDATE usuarios SET resetToken = ?, resetTokenExpires = ? WHERE id = ?",
      [token, expires, user.id]
    );

    // Configura o transporte de e-mail
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    // Gera o link de redefinição
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    // Envia o e-mail
    await transporter.sendMail({
      from: `"Suporte" <${EMAIL_USER}>`,
      to: email,
      subject: "Redefinição de Senha",
      html: `
        <p>Você solicitou a redefinição de senha.</p>
        <p>Clique aqui para redefinir: <a href="${resetLink}">${resetLink}</a></p>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
      `,
    });

    return res.status(200).json({
      mensagem: "Se este e-mail estiver cadastrado, enviaremos um link para redefinir a senha."
    });
  } catch (error) {
    console.error("Erro em forgot-password:", error);
    return res.status(500).json({ mensagem: "Erro no servidor. Tente novamente mais tarde." });
  }
});

// Rota para redefinir a senha com o token
router.post("/reset-password", async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    // Verifica se o token existe e se ainda está válido
    const [rows] = await pool.execute(
      "SELECT id FROM usuarios WHERE resetToken = ? AND resetTokenExpires > NOW()",
      [token]
    );

    if (!rows || rows.length === 0) {
      return res.status(400).json({ mensagem: "Token inválido ou expirado." });
    }

    // Criptografa a nova senha
    const user = rows[0];
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualiza a senha do usuário e remove o token
    await pool.execute(
      "UPDATE usuarios SET senha = ?, resetToken = NULL, resetTokenExpires = NULL WHERE id = ?",
      [novaSenhaHash, user.id]
    );

    return res.status(200).json({ mensagem: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Erro em reset-password:", error);
    return res.status(500).json({ mensagem: "Erro no servidor. Tente novamente mais tarde." });
  }
});

module.exports = router;