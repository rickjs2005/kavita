const express = require("express");
const cors = require("cors");
const pool = require("./config/pool"); // Assumindo que pool.js está configurado corretamente
const bcrypt = require("bcrypt");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");

const app = express();

// Configuração do CORS
app.use(cors({
  origin: "http://localhost:3000", // Permite requisições apenas do frontend
  credentials: true, // Permite o envio de cookies e cabeçalhos de autenticação
}));

app.use(express.json());

// Função de login
const loginUser = async (email, password) => {
  try {
    // Verifica se o usuário existe
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);

    if (rows.length === 0) {
      throw new Error("Usuário não encontrado.");
    }

    const user = rows[0];

    // Verifica a senha
    const isPasswordValid = await bcrypt.compare(password, user.senha);

    if (!isPasswordValid) {
      throw new Error("Credenciais inválidas.");
    }

    // Retorna os dados do usuário, incluindo o nome
    return {
      message: "Login bem-sucedido!",
      user: {
        id: user.id,
        nome: user.nome, // Certifique-se de que o campo "nome" existe no banco de dados
        email: user.email,
      },
    };
  } catch (error) {
    throw new Error(error.message || "Erro no servidor. Tente novamente mais tarde.");
  }
};

// Rota para login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await loginUser(email, password);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(401).json({ message: error.message }); // 401 para credenciais inválidas
  }
});

// Outras rotas do seu servidor
app.use("/api", productRoutes);
app.use("/api/users", userRoutes);

// Configuração do servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});