import { useEffect, useState } from 'react';
import api from '../services/api';

const PRIORIDADES = ['baja', 'media', 'alta', 'urgente'];

export default function FormularioReclamo({ onGuardado, onCancelar }) {
  const [categorias,  setCategorias]  = useState([]);
  const [edificios,   setEdificios]   = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [form, setForm] = useState({
    tipo_id: '', titulo: '',
    edificio_id: '', edificio_texto: '',
    unidad_texto: '', prioridad: 'media',
    descripcion: '', proveedor_id: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [alerta,  setAlerta]  = useState(null);

  useEffect(() => {
    api.get('/categorias').then(r => setCategorias(r.data));
    api.get('/edificios').then(r => setEdificios(r.data));
    api.get('/proveedores').then(r => setProveedores(r.data));
  }, []);

  // Alerta de repetidos
  useEffect(() => {
    const edificio = form.edificio_texto.trim();
    if (edificio.length < 2 || !form.tipo_id) { setAlerta(null); return; }
    api.get('/reclamos', {
      params: { edificio_texto: edificio, tipo_id: form.tipo_id, estado: 'abierto', limit: 1 },
    }).then(r => {
      setAlerta(
        r.data.total > 0
          ? `Ya hay ${r.data.total} reclamo(s) abierto(s) de este tipo en "${edificio}". Se marcará como repetido.`
          : null
      );
    }).catch(() => setAlerta(null));
  }, [form.edificio_texto, form.tipo_id]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleCategoria(e) {
    const id = e.target.value;
    const cat = categorias.find(c => String(c.id) === id);
    setForm(f => ({ ...f, tipo_id: id, titulo: cat?.nombre || '' }));
  }

  function handleEdificio(e) {
    const id = e.target.value;
    const ed = edificios.find(ed => String(ed.id) === id);
    setForm(f => ({ ...f, edificio_id: id, edificio_texto: ed?.nombre || '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.tipo_id)                { setError('La categoría es requerida'); return; }
    if (!form.edificio_texto.trim())  { setError('El edificio es requerido'); return; }

    setLoading(true);
    try {
      const { data } = await api.post('/reclamos', {
        titulo:         form.titulo,
        descripcion:    form.descripcion || null,
        edificio_texto: form.edificio_texto.trim(),
        unidad_texto:   form.unidad_texto.trim() || null,
        tipo_id:        form.tipo_id,
        prioridad:      form.prioridad,
        proveedor_id:   form.proveedor_id || null,
      });
      onGuardado(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancelar()}>
      <div className="modal">
        <h2>Nuevo reclamo</h2>

        {alerta && <div className="alerta-repetido">⚠️ {alerta}</div>}

        <form onSubmit={handleSubmit} noValidate>

          <label>Categoría *</label>
          <select required value={form.tipo_id} onChange={handleCategoria}>
            <option value="">Seleccioná una categoría</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          <div className="form-row">
            <div>
              <label>Edificio *</label>
              <select required value={form.edificio_id} onChange={handleEdificio}>
                <option value="">Seleccioná un edificio</option>
                {edificios.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Unidad</label>
              <input
                type="text"
                value={form.unidad_texto}
                onChange={e => set('unidad_texto', e.target.value)}
                placeholder="Ej: 1° A, PH, Local 3"
                maxLength={30}
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Prioridad inicial</label>
              <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)}>
                {PRIORIDADES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Proveedor asignado</label>
              <select value={form.proveedor_id} onChange={e => set('proveedor_id', e.target.value)}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}{p.rubro ? ` — ${p.rubro}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label>Descripción</label>
          <textarea
            rows={4} value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            placeholder="Detalle adicional del problema (opcional)"
          />

          {error && <p className="error-msg">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancelar}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Crear reclamo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
