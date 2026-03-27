import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

function ModalCategoria({ categoria, onGuardado, onCancelar }) {
  const [nombre,  setNombre]  = useState(categoria?.nombre || '');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    setLoading(true);
    try {
      if (categoria) {
        await api.put(`/categorias/${categoria.id}`, { nombre });
      } else {
        await api.post('/categorias', { nombre });
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
      <div className="modal modal-confirm">
        <h2>{categoria ? 'Editar categoría' : 'Nueva categoría'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <label>Nombre *</label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Humedad / Filtraciones"
            maxLength={100}
            autoFocus
          />
          {error && <p className="error-msg">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancelar}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : categoria ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GestionCategorias() {
  const [categorias,   setCategorias]   = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [modalForm,    setModalForm]    = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [eliminando,   setEliminando]   = useState(false);
  const [errorElim,    setErrorElim]    = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/categorias');
      setCategorias(data);
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
      await api.delete(`/categorias/${eliminandoId}`);
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
          <h2>Categorías de reclamo <span className="badge-total">{categorias.length}</span></h2>
          <button className="btn-primary" onClick={() => { setEditando(null); setModalForm(true); }}>
            + Nueva categoría
          </button>
        </div>

        {cargando ? (
          <p className="cargando">Cargando…</p>
        ) : categorias.length === 0 ? (
          <p className="sin-datos">No hay categorías registradas.</p>
        ) : (
          <div className="tabla-desktop">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(c => (
                  <tr key={c.id} style={{ cursor: 'default' }}>
                    <td>{c.id}</td>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{c.nombre}</td>
                    <td className="acciones-col">
                      <button
                        className="btn-accion"
                        title="Editar"
                        onClick={() => { setEditando(c); setModalForm(true); }}
                      >✏️</button>
                      <button
                        className="btn-accion btn-eliminar"
                        title="Eliminar"
                        onClick={() => { setEliminandoId(c.id); setErrorElim(''); }}
                      >🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalForm && (
        <ModalCategoria
          categoria={editando}
          onGuardado={handleGuardado}
          onCancelar={() => { setModalForm(false); setEditando(null); }}
        />
      )}

      {eliminandoId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEliminandoId(null)}>
          <div className="modal modal-confirm">
            <h2>Eliminar categoría</h2>
            <p>¿Estás seguro? Esta acción no se puede deshacer.<br />No se puede eliminar si hay reclamos con esta categoría.</p>
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
