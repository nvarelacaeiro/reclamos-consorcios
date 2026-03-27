const db = require('../config/database');

async function listar(req, res) {
  const [edificios] = await db.query(`
    SELECT e.*,
      (SELECT COUNT(*) FROM reclamos r
       WHERE r.edificio_id = e.id
          OR LOWER(TRIM(r.edificio_texto)) = LOWER(TRIM(e.nombre))
      ) AS total_reclamos
    FROM edificios e
    ORDER BY e.nombre
  `);
  res.json(edificios);
}

async function obtener(req, res) {
  const [rows] = await db.query('SELECT * FROM edificios WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Edificio no encontrado' });
  res.json(rows[0]);
}

async function crear(req, res) {
  const { nombre, direccion } = req.body;
  if (!nombre || !nombre.trim())
    return res.status(400).json({ error: 'El nombre es requerido' });
  if (!direccion || !direccion.trim())
    return res.status(400).json({ error: 'La dirección es requerida' });

  const [result] = await db.query(
    'INSERT INTO edificios (nombre, direccion) VALUES (?, ?)',
    [nombre.trim(), direccion.trim()]
  );
  const [rows] = await db.query('SELECT * FROM edificios WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}

async function actualizar(req, res) {
  const { nombre, direccion } = req.body;
  const [existing] = await db.query('SELECT id FROM edificios WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Edificio no encontrado' });

  const campos = [];
  const params = [];
  if (nombre    !== undefined) { campos.push('nombre = ?');    params.push(nombre.trim()); }
  if (direccion !== undefined) { campos.push('direccion = ?'); params.push(direccion.trim()); }
  if (!campos.length) return res.status(400).json({ error: 'No hay campos para actualizar' });

  params.push(req.params.id);
  await db.query(`UPDATE edificios SET ${campos.join(', ')} WHERE id = ?`, params);

  const [rows] = await db.query('SELECT * FROM edificios WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
}

async function eliminar(req, res) {
  const [rows] = await db.query('SELECT * FROM edificios WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Edificio no encontrado' });

  try {
    await db.query('DELETE FROM edificios WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(400).json({ error: 'No se puede eliminar: el edificio tiene reclamos asociados' });
    throw err;
  }
}

async function unidadesPorEdificio(req, res) {
  const [unidades] = await db.query(
    'SELECT * FROM unidades WHERE edificio_id = ? ORDER BY piso, numero',
    [req.params.id]
  );
  res.json(unidades);
}

async function reclamosPorEdificio(req, res) {
  const [edificios] = await db.query('SELECT * FROM edificios WHERE id = ?', [req.params.id]);
  if (!edificios.length) return res.status(404).json({ error: 'Edificio no encontrado' });

  const nombre = edificios[0].nombre;

  const [reclamos] = await db.query(
    `SELECT r.id, r.titulo, r.estado, r.prioridad, r.created_at, r.es_repetido,
            COALESCE(r.unidad_texto, u.numero) AS unidad_numero,
            t.nombre  AS tipo_nombre,
            us.nombre AS creado_por_nombre,
            p.nombre  AS proveedor_nombre
     FROM reclamos r
     LEFT JOIN unidades      u  ON u.id  = r.unidad_id
     JOIN  tipos_reclamo     t  ON t.id  = r.tipo_id
     JOIN  usuarios          us ON us.id = r.creado_por
     LEFT JOIN proveedores   p  ON p.id  = r.proveedor_id
     WHERE r.edificio_id = ?
        OR LOWER(TRIM(r.edificio_texto)) = LOWER(TRIM(?))
     ORDER BY r.created_at DESC
     LIMIT 100`,
    [req.params.id, nombre]
  );

  res.json({ edificio: edificios[0], reclamos });
}

module.exports = { listar, obtener, crear, actualizar, eliminar, unidadesPorEdificio, reclamosPorEdificio };
