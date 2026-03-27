const db = require('../config/database');

// ------------------------------------------------------------------
// Detección de repetidos: mismo edificio (por texto normalizado)
// y mismo tipo, con estado abierto o en_proceso.
// ------------------------------------------------------------------
async function detectarYMarcarRepetido(conn, edificioTexto, tipoId, nuevoReclamoId) {
  // Busca reclamos activos del mismo edificio (texto normalizado) y tipo
  const [existentes] = await conn.query(
    `SELECT r.id, r.repeticiones, r.grupo_reclamo_id
     FROM reclamos r
     LEFT JOIN edificios e ON e.id = r.edificio_id
     WHERE LOWER(TRIM(COALESCE(r.edificio_texto, e.nombre))) = LOWER(TRIM(?))
       AND r.tipo_id = ?
       AND r.estado IN ('abierto','en_proceso')
       AND r.id != ?
     ORDER BY r.created_at ASC
     LIMIT 1`,
    [edificioTexto, tipoId, nuevoReclamoId]
  );

  if (!existentes.length) return;

  const raiz = existentes[0];
  const grupoId = raiz.grupo_reclamo_id ?? raiz.id;
  const nuevasRepeticiones = raiz.repeticiones + 1;

  const prioridad =
    nuevasRepeticiones >= 3 ? 'urgente' :
    nuevasRepeticiones === 2 ? 'alta' : 'media';

  await conn.query(
    'UPDATE reclamos SET es_repetido = 1, grupo_reclamo_id = ? WHERE id = ?',
    [grupoId, nuevoReclamoId]
  );

  await conn.query(
    'UPDATE reclamos SET repeticiones = ?, prioridad = ? WHERE id = ?',
    [nuevasRepeticiones, prioridad, grupoId]
  );
}

// Columna de display de edificio y unidad usada en todas las queries
const EDIFICIO_COL   = "COALESCE(r.edificio_texto, e.nombre) AS edificio_nombre";
const UNIDAD_COL     = "COALESCE(r.unidad_texto, u.numero)   AS unidad_numero";
const PROVEEDOR_COLS = "p.nombre AS proveedor_nombre, p.telefono AS proveedor_telefono";
const PROVEEDOR_JOIN = "LEFT JOIN proveedores p ON p.id = r.proveedor_id";

// GET /api/reclamos
async function listar(req, res) {
  const {
    edificio_id, edificio_texto, unidad_id, tipo_id,
    estado, prioridad, es_repetido, page = 1, limit = 20,
  } = req.query;

  const condiciones = [];
  const params      = [];

  if (edificio_id) {
    condiciones.push('r.edificio_id = ?');
    params.push(edificio_id);
  }
  if (edificio_texto && edificio_texto.trim()) {
    condiciones.push("LOWER(TRIM(COALESCE(r.edificio_texto, e.nombre))) = LOWER(TRIM(?))");
    params.push(edificio_texto.trim());
  }
  if (unidad_id)  { condiciones.push('r.unidad_id = ?');  params.push(unidad_id); }
  if (tipo_id)    { condiciones.push('r.tipo_id = ?');     params.push(tipo_id); }
  if (estado)     { condiciones.push('r.estado = ?');      params.push(estado); }
  if (prioridad)  { condiciones.push('r.prioridad = ?');   params.push(prioridad); }
  if (es_repetido !== undefined && es_repetido !== '') {
    condiciones.push('r.es_repetido = ?');
    params.push(Number(es_repetido));
  }

  const where  = condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : '';
  const offset = (Number(page) - 1) * Number(limit);

  const sql = `
    SELECT
      r.id, r.titulo, r.descripcion,
      r.estado, r.prioridad, r.repeticiones, r.es_repetido,
      r.grupo_reclamo_id, r.created_at, r.updated_at,
      ${EDIFICIO_COL},
      ${UNIDAD_COL},
      t.nombre  AS tipo_nombre,
      us.nombre AS creado_por_nombre,
      ${PROVEEDOR_COLS}
    FROM reclamos r
    LEFT JOIN edificios    e  ON e.id  = r.edificio_id
    LEFT JOIN unidades     u  ON u.id  = r.unidad_id
    JOIN  tipos_reclamo    t  ON t.id  = r.tipo_id
    JOIN  usuarios         us ON us.id = r.creado_por
    ${PROVEEDOR_JOIN}
    ${where}
    ORDER BY
      FIELD(r.prioridad,'urgente','alta','media','baja'),
      r.repeticiones DESC,
      r.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [reclamos] = await db.query(sql, [...params, Number(limit), offset]);

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM reclamos r
     LEFT JOIN edificios e ON e.id = r.edificio_id
     ${where}`,
    params
  );

  res.json({ data: reclamos, total, page: Number(page), limit: Number(limit) });
}

// GET /api/reclamos/stats
async function stats(req, res) {
  const [[porEstado], [porEdificio], [repetidos]] = await Promise.all([
    db.query(`
      SELECT estado, COUNT(*) AS total
      FROM reclamos
      GROUP BY estado
      ORDER BY FIELD(estado,'abierto','en_proceso','resuelto','cerrado')
    `),
    db.query(`
      SELECT COALESCE(r.edificio_texto, e.nombre) AS nombre, COUNT(*) AS total
      FROM reclamos r
      LEFT JOIN edificios e ON e.id = r.edificio_id
      GROUP BY COALESCE(r.edificio_texto, e.nombre)
      ORDER BY total DESC
    `),
    db.query(`
      SELECT r.id, r.titulo,
             COALESCE(r.edificio_texto, e.nombre) AS edificio_nombre,
             t.nombre AS tipo_nombre,
             r.repeticiones, r.prioridad, r.estado
      FROM reclamos r
      LEFT JOIN edificios    e ON e.id = r.edificio_id
      JOIN  tipos_reclamo    t ON t.id = r.tipo_id
      WHERE r.repeticiones > 1 AND r.es_repetido = 0
      ORDER BY r.repeticiones DESC
      LIMIT 10
    `),
  ]);

  res.json({ por_estado: porEstado, por_edificio: porEdificio, repetidos });
}

// GET /api/reclamos/:id
async function obtener(req, res) {
  const [rows] = await db.query(
    `SELECT r.*,
       ${EDIFICIO_COL},
       ${UNIDAD_COL},
       t.nombre  AS tipo_nombre,
       us.nombre AS creado_por_nombre,
       ${PROVEEDOR_COLS}
     FROM reclamos r
     LEFT JOIN edificios    e  ON e.id  = r.edificio_id
     LEFT JOIN unidades     u  ON u.id  = r.unidad_id
     JOIN  tipos_reclamo    t  ON t.id  = r.tipo_id
     JOIN  usuarios         us ON us.id = r.creado_por
     ${PROVEEDOR_JOIN}
     WHERE r.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Reclamo no encontrado' });

  const [historial] = await db.query(
    `SELECT h.*, u.nombre AS usuario_nombre
     FROM historial_reclamos h
     JOIN usuarios u ON u.id = h.usuario_id
     WHERE h.reclamo_id = ?
     ORDER BY h.created_at ASC`,
    [req.params.id]
  );

  res.json({ ...rows[0], historial });
}

// POST /api/reclamos
async function crear(req, res) {
  const { titulo, descripcion, edificio_texto, unidad_texto, tipo_id, prioridad, proveedor_id } = req.body;

  if (!titulo || !titulo.trim())
    return res.status(400).json({ error: 'El título es requerido' });
  if (!edificio_texto || !edificio_texto.trim())
    return res.status(400).json({ error: 'El edificio es requerido' });
  if (!tipo_id)
    return res.status(400).json({ error: 'El tipo de reclamo es requerido' });

  const edificioNorm = edificio_texto.trim();

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO reclamos
         (titulo, descripcion, edificio_texto, unidad_texto, tipo_id, prioridad, proveedor_id, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo.trim(),
        descripcion || null,
        edificioNorm,
        unidad_texto ? unidad_texto.trim() : null,
        tipo_id,
        prioridad || 'media',
        proveedor_id || null,
        req.usuario.id,
      ]
    );

    const nuevoId = result.insertId;
    await detectarYMarcarRepetido(conn, edificioNorm, tipo_id, nuevoId);

    await conn.commit();

    const [rows] = await conn.query(
      `SELECT r.*,
         ${EDIFICIO_COL},
         ${UNIDAD_COL},
         t.nombre AS tipo_nombre,
         us.nombre AS creado_por_nombre,
         ${PROVEEDOR_COLS}
       FROM reclamos r
       LEFT JOIN edificios e ON e.id = r.edificio_id
       LEFT JOIN unidades  u ON u.id = r.unidad_id
       JOIN  tipos_reclamo t ON t.id = r.tipo_id
       JOIN  usuarios      us ON us.id = r.creado_por
       ${PROVEEDOR_JOIN}
       WHERE r.id = ?`,
      [nuevoId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// PUT /api/reclamos/:id
async function actualizar(req, res) {
  const { titulo, descripcion, edificio_texto, unidad_texto, prioridad, proveedor_id } = req.body;

  const [rows] = await db.query('SELECT id FROM reclamos WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Reclamo no encontrado' });

  if (titulo !== undefined && !titulo.trim())
    return res.status(400).json({ error: 'El título no puede estar vacío' });
  if (edificio_texto !== undefined && !edificio_texto.trim())
    return res.status(400).json({ error: 'El edificio no puede estar vacío' });

  const campos = [];
  const params = [];

  if (titulo !== undefined)         { campos.push('titulo = ?');         params.push(titulo.trim()); }
  if (descripcion !== undefined)    { campos.push('descripcion = ?');    params.push(descripcion || null); }
  if (edificio_texto !== undefined) { campos.push('edificio_texto = ?'); params.push(edificio_texto.trim()); }
  if (unidad_texto !== undefined)   { campos.push('unidad_texto = ?');   params.push(unidad_texto ? unidad_texto.trim() : null); }
  if (prioridad !== undefined)      { campos.push('prioridad = ?');      params.push(prioridad); }
  if (proveedor_id !== undefined)   { campos.push('proveedor_id = ?');   params.push(proveedor_id || null); }

  if (!campos.length) return res.status(400).json({ error: 'No hay campos para actualizar' });

  params.push(req.params.id);
  await db.query(`UPDATE reclamos SET ${campos.join(', ')} WHERE id = ?`, params);

  const [updated] = await db.query(
    `SELECT r.*,
       ${EDIFICIO_COL},
       ${UNIDAD_COL},
       t.nombre AS tipo_nombre,
       us.nombre AS creado_por_nombre,
       ${PROVEEDOR_COLS}
     FROM reclamos r
     LEFT JOIN edificios e ON e.id = r.edificio_id
     LEFT JOIN unidades  u ON u.id = r.unidad_id
     JOIN  tipos_reclamo t ON t.id = r.tipo_id
     JOIN  usuarios      us ON us.id = r.creado_por
     ${PROVEEDOR_JOIN}
     WHERE r.id = ?`,
    [req.params.id]
  );

  res.json(updated[0]);
}

// DELETE /api/reclamos/:id
async function eliminar(req, res) {
  const [rows] = await db.query('SELECT id FROM reclamos WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Reclamo no encontrado' });

  await db.query('DELETE FROM reclamos WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}

// PATCH /api/reclamos/:id/estado
async function cambiarEstado(req, res) {
  const { estado, nota } = req.body;
  const estadosValidos = ['abierto', 'en_proceso', 'resuelto', 'cerrado'];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: 'Estado inválido' });

  const [rows] = await db.query('SELECT * FROM reclamos WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Reclamo no encontrado' });

  const reclamo = rows[0];
  await db.query('UPDATE reclamos SET estado = ? WHERE id = ?', [estado, reclamo.id]);
  await db.query(
    `INSERT INTO historial_reclamos (reclamo_id, estado_anterior, estado_nuevo, nota, usuario_id)
     VALUES (?, ?, ?, ?, ?)`,
    [reclamo.id, reclamo.estado, estado, nota || null, req.usuario.id]
  );

  res.json({ id: reclamo.id, estado });
}

// GET /api/reclamos/tipos
async function listarTipos(req, res) {
  const [tipos] = await db.query('SELECT * FROM tipos_reclamo ORDER BY nombre');
  res.json(tipos);
}

module.exports = { listar, stats, obtener, crear, actualizar, eliminar, cambiarEstado, listarTipos };
