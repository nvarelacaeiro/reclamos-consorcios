import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

function waLink(telefono) {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, '');
  if (digits.length < 6) return null;
  return `https://wa.me/549${digits}`;
}

function ModalProveedor({ proveedor, onGuardado, onCancelar }) {
  const [form, setForm] = useState({
    nombre:   proveedor?.nombre   || '',
    rubro:    proveedor?.rubro    || '',
    telefono: proveedor?.telefono || '',
    notas:    proveedor?.notas    || '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return; }
    setLoading(true);
    try {
      if (proveedor) {
        await api.put(`/proveedores/${proveedor.id}`, form);
      } else {
        await api.post('/proveedores', form);
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
        <h2>{proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <label>Nombre *</label>
          <input
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
            placeholder="Ej: Ascensores López"
            maxLength={150}
          />

          <div className="form-row">
            <div>
              <label>Rubro</label>
              <input
                value={form.rubro}
                onChange={e => set('rubro', e.target.value)}
                placeholder="Ej: Ascensores, Plomería"
                maxLength={100}
              />
            </div>
            <div>
              <label>Teléfono</label>
              <input
                value={form.telefono}
                onChange={e => set('telefono', e.target.value)}
                placeholder="Ej: 11 4555-6789"
                maxLength={30}
              />
            </div>
          </div>

          <label>Notas</label>
          <textarea
            rows={3}
            value={form.notas}
            onChange={e => set('notas', e.target.value)}
            placeholder="Horarios, contacto alternativo, etc. (opcional)"
          />

          {error && <p className="error-msg">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancelar}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : proveedor ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GestionProveedores() {
  const [proveedores,  setProveedores]  = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [modalForm,    setModalForm]    = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [eliminando,   setEliminando]   = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/proveedores');
      setProveedores(data);
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
    try {
      await api.delete(`/proveedores/${eliminandoId}`);
      setEliminandoId(null);
      cargar();
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="seccion-content">
      <div className="tabla-container">
        <div className="tabla-header">
          <h2>Proveedores <span className="badge-total">{proveedores.length}</span></h2>
          <button className="btn-primary" onClick={() => { setEditando(null); setModalForm(true); }}>
            + Nuevo proveedor
          </button>
        </div>

        {cargando ? (
          <p className="cargando">Cargando…</p>
        ) : proveedores.length === 0 ? (
          <p className="sin-datos">No hay proveedores registrados.</p>
        ) : (
          <div className="tabla-desktop">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Rubro</th>
                  <th>Teléfono</th>
                  <th>Notas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map(p => {
                  const wa = waLink(p.telefono);
                  return (
                    <tr key={p.id} style={{ cursor: 'default' }}>
                      <td>{p.id}</td>
                      <td style={{ color: 'var(--text)', fontWeight: 500 }}>{p.nombre}</td>
                      <td>{p.rubro || '—'}</td>
                      <td>
                        {p.telefono ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {p.telefono}
                            {wa && (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-wa"
                                title="Abrir WhatsApp"
                              >
                                WhatsApp
                              </a>
                            )}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.notas || '—'}
                      </td>
                      <td className="acciones-col">
                        <button
                          className="btn-accion"
                          title="Editar"
                          onClick={() => { setEditando(p); setModalForm(true); }}
                        >✏️</button>
                        <button
                          className="btn-accion btn-eliminar"
                          title="Eliminar"
                          onClick={() => setEliminandoId(p.id)}
                        >🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalForm && (
        <ModalProveedor
          proveedor={editando}
          onGuardado={handleGuardado}
          onCancelar={() => { setModalForm(false); setEditando(null); }}
        />
      )}

      {eliminandoId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEliminandoId(null)}>
          <div className="modal modal-confirm">
            <h2>Eliminar proveedor</h2>
            <p>¿Estás seguro? Los reclamos que tengan este proveedor asignado quedarán sin proveedor.</p>
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
