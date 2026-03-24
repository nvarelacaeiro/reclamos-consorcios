import { useEffect, useState } from 'react';
import api from '../services/api';

const PRIORIDADES = ['baja', 'media', 'alta', 'urgente'];

export default function FormularioReclamo({ onGuardado, onCancelar }) {
  const [tipos,   setTipos]   = useState([]);
  const [form,    setForm]    = useState({
    titulo: '', descripcion: '',
    edificio_texto: '', unidad_texto: '',
    tipo_id: '', prioridad: 'media',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [alerta,  setAlerta]  = useState(null);

  useEffect(() => {
    api.get('/reclamos/tipos').then(r => setTipos(r.data));
  }, []);

  // Alerta de repetidos: busca por edificio_texto + tipo
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.titulo.trim())          { setError('El título es requerido'); return; }
    if (!form.edificio_texto.trim())  { setError('El edificio es requerido'); return; }
    if (!form.tipo_id)                { setError('El tipo de reclamo es requerido'); return; }

    setLoading(true);
    try {
      const { data } = await api.post('/reclamos', {
        titulo:         form.titulo.trim(),
        descripcion:    form.descripcion || null,
        edificio_texto: form.edificio_texto.trim(),
        unidad_texto:   form.unidad_texto.trim() || null,
        tipo_id:        form.tipo_id,
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
        <h2>Nuevo reclamo</h2>

        {alerta && <div className="alerta-repetido">⚠️ {alerta}</div>}

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
                placeholder="Ej: Torre Norte, Av. Corrientes 1234"
                maxLength={150}
              />
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
              <label>Tipo de reclamo *</label>
              <select required value={form.tipo_id} onChange={e => set('tipo_id', e.target.value)}>
                <option value="">Seleccioná</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label>Prioridad inicial</label>
              <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)}>
                {PRIORIDADES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
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
              {loading ? 'Guardando…' : 'Crear reclamo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
