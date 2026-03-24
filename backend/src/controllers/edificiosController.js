const db = require('../config/database');

async function listar(req, res) {
  const [edificios] = await db.query('SELECT * FROM edificios ORDER BY nombre');
  res.json(edificios);
}

async function unidadesPorEdificio(req, res) {
  const { id } = req.params;
  const [unidades] = await db.query(
    'SELECT * FROM unidades WHERE edificio_id = ? ORDER BY piso, numero',
    [id]
  );
  res.json(unidades);
}

module.exports = { listar, unidadesPorEdificio };
