const db = require('../config/database');

async function listar(req, res) {
  const [rows] = await db.query('SELECT * FROM tipos_reclamo ORDER BY nombre');
  res.json(rows);
}

async function crear(req, res) {
  const { nombre } = req.body;
  if (!nombre || !nombre.trim())
    return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const [result] = await db.query(
      'INSERT INTO tipos_reclamo (nombre) VALUES (?)',
      [nombre.trim()]
    );
    const [rows] = await db.query('SELECT * FROM tipos_reclamo WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    throw err;
  }
}

async function actualizar(req, res) {
  const { nombre } = req.body;
  const [existing] = await db.query('SELECT id FROM tipos_reclamo WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Categoría no encontrada' });
  if (!nombre || !nombre.trim())
    return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    await db.query('UPDATE tipos_reclamo SET nombre = ? WHERE id = ?', [nombre.trim(), req.params.id]);
    const [rows] = await db.query('SELECT * FROM tipos_reclamo WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    throw err;
  }
}

async function eliminar(req, res) {
  const [existing] = await db.query('SELECT id FROM tipos_reclamo WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Categoría no encontrada' });

  const [[{ total }]] = await db.query(
    'SELECT COUNT(*) AS total FROM reclamos WHERE tipo_id = ?',
    [req.params.id]
  );
  if (total > 0)
    return res.status(400).json({ error: `No se puede eliminar: hay ${total} reclamo(s) con esta categoría` });

  await db.query('DELETE FROM tipos_reclamo WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}

module.exports = { listar, crear, actualizar, eliminar };
