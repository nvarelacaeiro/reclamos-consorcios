import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import FiltrosReclamos from './FiltrosReclamos';
import FormularioEditarReclamo from './FormularioEditarReclamo';

const PRIORIDAD_CLASE = { baja: 'p-baja', media: 'p-media', alta: 'p-alta', urgente: 'p-urgente' };
const ESTADO_LABEL    = { abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado' };

function fmtFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function TablaReclamos({ onSeleccionar, onNuevo, reclamoActualizado }) {
  const [filtros,      setFiltros]      = useState({});
  const [reclamos,     setReclamos]     = useState([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [cargando,     setCargando]     = useState(false);
  const [editandoId,   setEditandoId]   = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [eliminando,   setEliminando]   = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = { ...filtros, page, limit: 20 };
      Object.keys(params).forEach(k => (params[k] === '' || params[k] === undefined) && delete params[k]);
      const { data } = await api.get('/reclamos', { params });
      setReclamos(data.data);
      setTotal(data.total);
    } finally {
      setCargando(false);
    }
  }, [filtros, page]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { if (reclamoActualizado) cargar(); }, [reclamoActualizado, cargar]);

  function handleFiltros(f) { setFiltros(f); setPage(1); }

  async function confirmarEliminar() {
    setEliminando(true);
    try {
      await api.delete(`/reclamos/${eliminandoId}`);
      setEliminandoId(null);
      cargar();
    } finally {
      setEliminando(false);
    }
  }

  const totalPaginas = Math.ceil(total / 20);

  return (
    <div className="tabla-container">
      <div className="tabla-header">
        <h2>Reclamos <span className="badge-total">{total}</span></h2>
        <button className="btn-primary" onClick={onNuevo}>+ Nuevo reclamo</button>
      </div>

      <FiltrosReclamos filtros={filtros} onChange={handleFiltros} />

      {cargando ? (
        <p className="cargando">Cargando…</p>
      ) : reclamos.length === 0 ? (
        <p className="sin-datos">Sin resultados para los filtros seleccionados.</p>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="tabla-desktop">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Prioridad</th>
                  <th>Categoría</th>
                  <th>Edificio</th>
                  <th>Unidad</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Reps.</th>
                  <th>Proveedor</th>
                  <th>Operador</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reclamos.map(r => (
                  <tr
                    key={r.id}
                    className={r.es_repetido ? 'fila-repetido' : ''}
                    onClick={() => onSeleccionar(r)}
                  >
                    <td>{r.id}</td>
                    <td>
                      <span className={`badge-prioridad ${PRIORIDAD_CLASE[r.prioridad]}`}>
                        {r.prioridad}
                      </span>
                    </td>
                    <td>
                      {r.titulo}
                      {r.es_repetido === 1 && <span className="badge-rep" title="Repetido">!</span>}
                    </td>
                    <td>{r.edificio_nombre}</td>
                    <td>{r.unidad_numero || '—'}</td>
                    <td>{r.tipo_nombre}</td>
                    <td>
                      <span className={`estado estado-${r.estado}`}>{ESTADO_LABEL[r.estado]}</span>
                    </td>
                    <td>
                      {r.repeticiones > 1 ? <strong>{r.repeticiones}</strong> : r.repeticiones}
                    </td>
                    <td className="td-operador">
                      {r.proveedor_nombre || <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td className="td-operador">{r.creado_por_nombre}</td>
                    <td className="td-fecha">{fmtFecha(r.created_at)}</td>
                    <td className="acciones-col" onClick={e => e.stopPropagation()}>
                      <button
                        className="btn-accion"
                        title="Editar"
                        onClick={() => setEditandoId(r.id)}
                      >✏️</button>
                      <button
                        className="btn-accion btn-eliminar"
                        title="Eliminar"
                        onClick={() => setEliminandoId(r.id)}
                      >🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="tabla-mobile">
            {reclamos.map(r => (
              <div
                key={r.id}
                className={`reclamo-card ${r.es_repetido ? 'repetido' : ''}`}
                onClick={() => onSeleccionar(r)}
              >
                <div className="card-row-top">
                  <span className="card-titulo">
                    {r.titulo}
                    {r.es_repetido === 1 && <span className="badge-rep" title="Repetido">!</span>}
                  </span>
                  <div className="card-badges">
                    <span className={`badge-prioridad ${PRIORIDAD_CLASE[r.prioridad]}`}>
                      {r.prioridad}
                    </span>
                    <span className={`estado estado-${r.estado}`}>{ESTADO_LABEL[r.estado]}</span>
                  </div>
                </div>

                <div className="card-meta">
                  <span className="card-meta-item">
                    <span className="card-meta-label">🏢</span> {r.edificio_nombre}
                  </span>
                  {r.unidad_numero && (
                    <span className="card-meta-item">
                      <span className="card-meta-label">🚪</span> {r.unidad_numero}
                    </span>
                  )}
                  <span className="card-meta-item">
                    <span className="card-meta-label">🔧</span> {r.tipo_nombre}
                  </span>
                  {r.repeticiones > 1 && (
                    <span className="card-meta-item" style={{ color: '#b91c1c' }}>
                      ⚠️ {r.repeticiones} reportes
                    </span>
                  )}
                </div>

                <div className="card-meta" style={{ marginTop: 0 }}>
                  <span className="card-meta-item">
                    <span className="card-meta-label">👤</span> {r.creado_por_nombre}
                  </span>
                  <span className="card-meta-item">
                    <span className="card-meta-label">📅</span> {fmtFecha(r.created_at)}
                  </span>
                </div>

                <div className="card-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '5px 12px' }}
                    onClick={() => setEditandoId(r.id)}
                  >✏️ Editar</button>
                  <button
                    className="btn-danger"
                    style={{ fontSize: '12px', padding: '5px 12px' }}
                    onClick={() => setEliminandoId(r.id)}
                  >🗑️ Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="paginacion">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
              <span>{page} / {totalPaginas}</span>
              <button disabled={page === totalPaginas} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
            </div>
          )}
        </>
      )}

      {/* Modal editar */}
      {editandoId && (
        <FormularioEditarReclamo
          reclamoId={editandoId}
          onGuardado={() => { setEditandoId(null); cargar(); }}
          onCancelar={() => setEditandoId(null)}
        />
      )}

      {/* Confirmación eliminar */}
      {eliminandoId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEliminandoId(null)}>
          <div className="modal modal-confirm">
            <h2>Eliminar reclamo</h2>
            <p>¿Estás seguro que querés eliminar el reclamo #{eliminandoId}? Esta acción no se puede deshacer.</p>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setEliminandoId(null)}>Cancelar</button>
              <button className="btn-danger" onClick={confirmarEliminar} disabled={eliminando}>
                {eliminando ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
