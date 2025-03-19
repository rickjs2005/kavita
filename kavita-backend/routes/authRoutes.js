const express = require('express');
const { forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();

// Rota que recebe o e-mail e envia o link de redefinição
router.post('/forgot-password', forgotPassword);

// Rota que recebe o token e a nova senha para atualizar no banco
router.post('/reset-password', resetPassword);

module.exports = router;
