const db = require('../config/database');

async function listar(req, res) {
  const [rows] = await db.query('SELECT * FROM proveedores ORDER BY nombre');
  res.json(rows);
}

async function obtener(req, res) {
  const [rows] = await db.query('SELECT * FROM proveedores WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Proveedor no encontrado' });
  res.json(rows[0]);
}

async function crear(req, res) {
  const { nombre, rubro, telefono, notas } = req.body;
  if (!nombre || !nombre.trim())
    return res.status(400).json({ error: 'El nombre es requerido' });

  const [result] = await db.query(
    'INSERT INTO proveedores (nombre, rubro, telefono, notas) VALUES (?, ?, ?, ?)',
    [nombre.trim(), rubro?.trim() || null, telefono?.trim() || null, notas?.trim() || null]
  );
  const [rows] = await db.query('SELECT * FROM proveedores WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}

async function actualizar(req, res) {
  const { nombre, rubro, telefono, notas } = req.body;
  const [existing] = await db.query('SELECT id FROM proveedores WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Proveedor no encontrado' });

  if (nombre !== undefined && !nombre.trim())
    return res.status(400).json({ error: 'El nombre no puede estar vacío' });

  const campos = [];
  const params = [];
  if (nombre    !== undefined) { campos.push('nombre = ?');   params.push(nombre.trim()); }
  if (rubro     !== undefined) { campos.push('rubro = ?');    params.push(rubro?.trim() || null); }
  if (telefono  !== undefined) { campos.push('telefono = ?'); params.push(telefono?.trim() || null); }
  if (notas     !== undefined) { campos.push('notas = ?');    params.push(notas?.trim() || null); }

  if (!campos.length) return res.status(400).json({ error: 'No hay campos para actualizar' });

  params.push(req.params.id);
  await db.query(`UPDATE proveedores SET ${campos.join(', ')} WHERE id = ?`, params);

  const [rows] = await db.query('SELECT * FROM proveedores WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
}

async function eliminar(req, res) {
  const [existing] = await db.query('SELECT id FROM proveedores WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Proveedor no encontrado' });

  // Desasociar reclamos antes de eliminar
  await db.query('UPDATE reclamos SET proveedor_id = NULL WHERE proveedor_id = ?', [req.params.id]);
  await db.query('DELETE FROM proveedores WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
