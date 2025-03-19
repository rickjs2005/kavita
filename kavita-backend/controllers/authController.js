const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/pool'); // Assumindo que você está usando um pool de conexões com o banco de dados

const AuthController = {
  // Função para login
  async login(req, res) {
    const { email, senha } = req.body;

    try {
      // Verifica se o usuário existe no banco de dados
      const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

      if (users.length === 0) {
        return res.status(400).json({ message: 'Usuário não encontrado.' });
      }

      const user = users[0];

      // Verifica se a senha está correta
      const isPasswordValid = await bcrypt.compare(senha, user.senha);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Credenciais inválidas.' });
      }

      // Gera um token JWT
      const token = jwt.sign({ id: user.id }, 'sua_chave_secreta', { expiresIn: '1h' });

      // Retorna o token e os dados do usuário
      res.status(200).json({
        message: 'Login bem-sucedido!',
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
    }
  },

  // Função para registro
  async register(req, res) {
    const { nome, email, senha } = req.body;

    try {
      // Verifica se o email já está cadastrado
      const [users] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);

      if (users.length > 0) {
        return res.status(400).json({ message: 'Este email já está cadastrado.' });
      }

      // Criptografa a senha
      const hashedPassword = await bcrypt.hash(senha, 10);

      // Insere o novo usuário no banco de dados
      const [result] = await pool.query(
        'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
        [nome, email, hashedPassword]
      );

      res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
    }
  },

  // Função para logout (opcional, pois o logout geralmente é tratado no frontend)
  async logout(req, res) {
    // Aqui você pode invalidar o token, se necessário
    res.status(200).json({ message: 'Logout bem-sucedido!' });
  },
};

module.exports = AuthController;