const bcrypt = require('bcrypt');
const db     = require('../config/database');

// GET /api/usuarios
async function listar(req, res) {
  const [rows] = await db.query(
    'SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY created_at DESC'
  );
  res.json(rows);
}

// POST /api/usuarios
async function crear(req, res) {
  const { nombre, email, password, rol = 'operador' } = req.body;

  if (!nombre || !nombre.trim())
    return res.status(400).json({ error: 'El nombre es requerido' });
  if (!email || !email.trim())
    return res.status(400).json({ error: 'El email es requerido' });
  if (!password)
    return res.status(400).json({ error: 'La contraseña es requerida' });
  if (password.length < 8)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'El email no tiene un formato válido' });
  if (!['admin', 'operador'].includes(rol))
    return res.status(400).json({ error: 'Rol inválido' });

  const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email.trim()]);
  if (existing.length)
    return res.status(409).json({ error: 'Ya existe un usuario con ese email' });

  const password_hash = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    [nombre.trim(), email.trim(), password_hash, rol]
  );

  res.status(201).json({ id: result.insertId, nombre: nombre.trim(), email: email.trim(), rol, activo: 1 });
}

// PATCH /api/usuarios/:id/activo
async function toggleActivo(req, res) {
  const [rows] = await db.query('SELECT id, activo FROM usuarios WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

  const nuevoActivo = rows[0].activo ? 0 : 1;
  await db.query('UPDATE usuarios SET activo = ? WHERE id = ?', [nuevoActivo, req.params.id]);
  res.json({ id: Number(req.params.id), activo: nuevoActivo });
}

module.exports = { listar, crear, toggleActivo };
