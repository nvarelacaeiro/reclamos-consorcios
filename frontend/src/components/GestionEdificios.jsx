import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const ESTADO_LABEL = { abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado' };
const PRIORIDAD_CLASE = { baja: 'p-baja', media: 'p-media', alta: 'p-alta', urgente: 'p-urgente' };

function fmtFecha(iso) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function ModalEdificio({ edificio, onGuardado, onCancelar }) {
  const [form, setForm] = useState({
    nombre:    edificio?.nombre    || '',
    direccion: edificio?.direccion || '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim())    { setError('El nombre es requerido'); return; }
    if (!form.direccion.trim()) { setError('La dirección es requerida'); return; }
    setLoading(true);
    try {
      if (edificio) {
        await api.put(`/edificios/${edificio.id}`, form);
      } else {
        await api.post('/edificios', form);
      }
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancelar()}>
      <div className="modal">
        <h2>{edificio ? `Editar edificio` : 'Nuevo edificio'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <label>Nombre *</label>
          <input
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
            placeholder="Ej: Torre Norte"
            maxLength={150}
          />
          <label>Dirección *</label>
          <input
            value={form.direccion}
            onChange={e => set('direccion', e.target.value)}
            placeholder="Ej: Av. Corrientes 1234, CABA"
            maxLength={255}
          />
          {error && <p className="error-msg">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancelar}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : edificio ? 'Guardar cambios' : 'Crear edificio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalReclamos({ edificio, onCerrar }) {
  const [reclamos, setReclamos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get(`/edificios/${edificio.id}/reclamos`).then(r => {
      setReclamos(r.data.reclamos);
      setCargando(false);
    });
  }, [edificio.id]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="modal modal-detalle" style={{ maxWidth: 780 }}>
        <div className="detalle-header">
          <div>
            <p className="detalle-titulo" style={{ marginBottom: 2 }}>{edificio.nombre}</p>
            <span className="detalle-id">{edificio.direccion}</span>
          </div>
          <button className="btn-cerrar" onClick={onCerrar}>✕</button>
        </div>

        <h3 className="historial-title" style={{ marginBottom: 12 }}>
          Reclamos del edificio
        </h3>

        {cargando ? (
          <p className="cargando">Cargando…</p>
        ) : reclamos.length === 0 ? (
          <p className="sin-datos">No hay reclamos para este edificio.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Unidad</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {reclamos.map(r => (
                  <tr key={r.id} style={{ cursor: 'default' }}>
                    <td>{r.id}</td>
                    <td style={{ color: 'var(--text)' }}>{r.titulo}</td>
                    <td>{r.tipo_nombre}</td>
                    <td>
                      <span className={`estado estado-${r.estado}`}>{ESTADO_LABEL[r.estado]}</span>
                    </td>
                    <td>
                      <span className={`badge-prioridad ${PRIORIDAD_CLASE[r.prioridad]}`}>
                        {r.prioridad}
                      </span>
                    </td>
                    <td>{r.unidad_numero || '—'}</td>
                    <td className="td-fecha">{fmtFecha(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GestionEdificios() {
  const [edificios,    setEdificios]    = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [modalForm,    setModalForm]    = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [verReclamos,  setVerReclamos]  = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [eliminando,   setEliminando]   = useState(false);
  const [errorElim,    setErrorElim]    = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/edificios');
      setEdificios(data);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function handleGuardado() {
    setModalForm(false);
    setEditando(null);
    cargar();
  }

  async function confirmarEliminar() {
    setEliminando(true);
    setErrorElim('');
    try {
      await api.delete(`/edificios/${eliminandoId}`);
      setEliminandoId(null);
      cargar();
    } catch (err) {
      setErrorElim(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="seccion-content">
      <div className="tabla-container">
        <div className="tabla-header">
          <h2>Edificios <span className="badge-total">{edificios.length}</span></h2>
          <button className="btn-primary" onClick={() => { setEditando(null); setModalForm(true); }}>
            + Nuevo edificio
          </button>
        </div>

        {cargando ? (
          <p className="cargando">Cargando…</p>
        ) : edificios.length === 0 ? (
          <p className="sin-datos">No hay edificios registrados.</p>
        ) : (
          <><div className="tabla-desktop">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Reclamos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {edificios.map(e => (
                  <tr key={e.id} style={{ cursor: 'default' }}>
                    <td>{e.id}</td>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{e.nombre}</td>
                    <td>{e.direccion}</td>
                    <td>
                      {e.total_reclamos > 0 ? (
                        <button
                          className="btn-secondary"
                          style={{ fontSize: 12, padding: '4px 10px' }}
                          onClick={() => setVerReclamos(e)}
                        >
                          Ver {e.total_reclamos} reclamo{e.total_reclamos !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Sin reclamos</span>
                      )}
                    </td>
                    <td className="acciones-col">
                      <button
                        className="btn-accion"
                        title="Editar"
                        onClick={() => { setEditando(e); setModalForm(true); }}
                      >✏️</button>
                      <button
                        className="btn-accion btn-eliminar"
                        title="Eliminar"
                        onClick={() => { setEliminandoId(e.id); setErrorElim(''); }}
                      >🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tabla-mobile">
            {edificios.map(e => (
              <div key={e.id} className="gestion-card">
                <div className="gestion-card-title">{e.nombre}</div>
                <div className="gestion-card-sub">📍 {e.direccion}</div>
                {e.total_reclamos > 0 ? (
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: '5px 12px' }}
                    onClick={() => setVerReclamos(e)}
                  >
                    Ver {e.total_reclamos} reclamo{e.total_reclamos !== 1 ? 's' : ''}
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Sin reclamos</span>
                )}
                <div className="gestion-card-actions">
                  <button className="btn-secondary" onClick={() => { setEditando(e); setModalForm(true); }}>
                    ✏️ Editar
                  </button>
                  <button className="btn-danger" style={{ padding: '7px 12px' }} onClick={() => { setEliminandoId(e.id); setErrorElim(''); }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Modal crear/editar */}
      {modalForm && (
        <ModalEdificio
          edificio={editando}
          onGuardado={handleGuardado}
          onCancelar={() => { setModalForm(false); setEditando(null); }}
        />
      )}

      {/* Modal ver reclamos */}
      {verReclamos && (
        <ModalReclamos
          edificio={verReclamos}
          onCerrar={() => setVerReclamos(null)}
        />
      )}

      {/* Confirmación eliminar */}
      {eliminandoId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEliminandoId(null)}>
          <div className="modal modal-confirm">
            <h2>Eliminar edificio</h2>
            <p>¿Estás seguro que querés eliminar este edificio? Esta acción no se puede deshacer.</p>
            {errorElim && <p className="error-msg" style={{ marginTop: 10 }}>{errorElim}</p>}
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
