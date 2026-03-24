import { useEffect, useState } from 'react';
import api from '../services/api';

const PRIORIDADES = ['baja', 'media', 'alta', 'urgente'];

export default function FormularioEditarReclamo({ reclamoId, onGuardado, onCancelar }) {
  const [form, setForm] = useState({
    titulo: '', descripcion: '', edificio_texto: '', unidad_texto: '', prioridad: 'media',
  });
  const [loading,  setLoading]  = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    api.get(`/reclamos/${reclamoId}`).then(r => {
      const rec = r.data;
      setForm({
        titulo:         rec.titulo          || '',
        descripcion:    rec.descripcion     || '',
        edificio_texto: rec.edificio_texto  ?? rec.edificio_nombre ?? '',
        unidad_texto:   rec.unidad_texto    ?? rec.unidad_numero   ?? '',
        prioridad:      rec.prioridad       || 'media',
      });
      setCargando(false);
    });
  }, [reclamoId]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.titulo.trim())         { setError('El título es requerido'); return; }
    if (!form.edificio_texto.trim()) { setError('El edificio es requerido'); return; }

    setLoading(true);
    try {
      const { data } = await api.put(`/reclamos/${reclamoId}`, {
        titulo:         form.titulo.trim(),
        descripcion:    form.descripcion || null,
        edificio_texto: form.edificio_texto.trim(),
        unidad_texto:   form.unidad_texto.trim() || null,
        prioridad:      form.prioridad,
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
            <label>Título *</label>
            <input
              required value={form.titulo}
              onChange={e => set('titulo', e.target.value)}
              placeholder="Descripción breve del problema"
            />

            <div className="form-row">
              <div>
                <label>Edificio *</label>
                <input
                  type="text"
                  value={form.edificio_texto}
                  onChange={e => set('edificio_texto', e.target.value)}
                  placeholder="Ej: Torre Norte"
                  maxLength={150}
                />
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
