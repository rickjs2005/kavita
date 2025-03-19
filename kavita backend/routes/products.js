const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Rota para buscar produtos com filtros
router.get("/products", async (req, res) => {
  const { category, subcategory, thirdCategory } = req.query;

  if (!category) {
    return res.status(400).json({ message: "Categoria não informada." });
  }

  try {
    // Verifica se a categoria existe
    const [categoryExists] = await pool.execute(
      "SELECT id FROM categories WHERE name = ?",
      [category]
    );

    if (categoryExists.length === 0) {
      return res.status(404).json({ message: "Categoria não encontrada." });
    }

    // Monta a consulta SQL com filtros opcionais
    let query = `
      SELECT p.id, p.name, p.description, p.price, p.image, p.quantity
      FROM products p
      JOIN product_categories pc ON p.id = pc.product_id
      JOIN categories c ON pc.category_id = c.id
      LEFT JOIN product_third_categories ptc ON p.id = ptc.product_id
      LEFT JOIN third_categories tc ON ptc.third_category_id = tc.id
      WHERE c.name = ?`;

    const params = [category];

    if (subcategory) {
      query += ` AND s.name = ?`;
      params.push(subcategory);
    }

    if (thirdCategory) {
      query += ` AND tc.name = ?`;
      params.push(thirdCategory);
    }

    // Executa a consulta
    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Nenhum produto encontrado para os filtros informados." });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

module.exports = router;