import { useEffect, useState } from 'react';
import api from '../services/api';

const PRIORIDADES = ['baja', 'media', 'alta', 'urgente'];

export default function FormularioEditarReclamo({ reclamoId, onGuardado, onCancelar }) {
  const [form, setForm] = useState({
    descripcion: '', edificio_id: '', edificio_texto: '',
    unidad_texto: '', prioridad: 'media', proveedor_id: '',
  });
  const [categoriaLabel, setCategoriaLabel] = useState('');
  const [edificios,   setEdificios]   = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/edificios'),
      api.get('/proveedores'),
      api.get(`/reclamos/${reclamoId}`),
    ]).then(([edRes, provRes, recRes]) => {
      const eds  = edRes.data;
      const provs = provRes.data;
      const rec  = recRes.data;

      setEdificios(eds);
      setProveedores(provs);
      setCategoriaLabel(rec.tipo_nombre || '');

      // Intentar encontrar el edificio por nombre
      const edificioActual = (rec.edificio_texto ?? rec.edificio_nombre ?? '').trim();
      const match = eds.find(e =>
        e.nombre.toLowerCase().trim() === edificioActual.toLowerCase()
      );

      setForm({
        descripcion:    rec.descripcion     || '',
        edificio_id:    match ? String(match.id) : '',
        edificio_texto: match ? match.nombre : edificioActual,
        unidad_texto:   rec.unidad_texto    ?? rec.unidad_numero ?? '',
        prioridad:      rec.prioridad       || 'media',
        proveedor_id:   rec.proveedor_id    ? String(rec.proveedor_id) : '',
      });
      setCargando(false);
    });
  }, [reclamoId]);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function handleEdificio(e) {
    const id = e.target.value;
    const ed = edificios.find(ed => String(ed.id) === id);
    setForm(f => ({ ...f, edificio_id: id, edificio_texto: ed?.nombre || '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.edificio_texto.trim()) { setError('El edificio es requerido'); return; }

    setLoading(true);
    try {
      const { data } = await api.put(`/reclamos/${reclamoId}`, {
        descripcion:    form.descripcion || null,
        edificio_texto: form.edificio_texto.trim(),
        unidad_texto:   form.unidad_texto.trim() || null,
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
        <h2>Editar reclamo #{reclamoId}</h2>

        {cargando ? (
          <p className="cargando">Cargando…</p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>

            <label>Categoría</label>
            <div className="campo-readonly">{categoriaLabel}</div>

            <div className="form-row">
              <div>
                <label>Edificio *</label>
                <select value={form.edificio_id} onChange={handleEdificio}>
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
                  placeholder="Ej: 1° A, PH"
                  maxLength={30}
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Prioridad</label>
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
                    <option key={p.id} value={String(p.id)}>
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
              placeholder="Detalle adicional (opcional)"
            />

            {error && <p className="error-msg">{error}</p>}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onCancelar}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
