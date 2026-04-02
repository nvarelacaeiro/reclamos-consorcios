import { useEffect, useState } from 'react';
import api from '../services/api';

const ESTADOS   = ['', 'abierto', 'en_proceso', 'resuelto', 'cerrado'];
const PRIORIDADES = ['', 'baja', 'media', 'alta', 'urgente'];

export default function FiltrosReclamos({ filtros, onChange }) {
  const [edificios, setEdificios] = useState([]);
  const [tipos,     setTipos]     = useState([]);

  useEffect(() => {
    api.get('/edificios').then(r => setEdificios(r.data));
    api.get('/reclamos/tipos').then(r => setTipos(r.data));
  }, []);

  function set(field, value) {
    onChange({ ...filtros, [field]: value });
  }

  return (
    <div className="filtros">
      <select value={filtros.edificio_id || ''} onChange={e => set('edificio_id', e.target.value)}>
        <option value="">Todos los edificios</option>
        {edificios.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>

      <select value={filtros.tipo_id || ''} onChange={e => set('tipo_id', e.target.value)}>
        <option value="">Todos los tipos</option>
        {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
      </select>

      <select value={filtros.estado || ''} onChange={e => set('estado', e.target.value)}>
        {ESTADOS.map(s => <option key={s} value={s}>{s || 'Todos los estados'}</option>)}
      </select>

      <select value={filtros.prioridad || ''} onChange={e => set('prioridad', e.target.value)}>
        {PRIORIDADES.map(p => <option key={p} value={p}>{p || 'Toda prioridad'}</option>)}
      </select>

      <label className="filtro-check">
        <input
          type="checkbox"
          checked={filtros.es_repetido === '1'}
          onChange={e => set('es_repetido', e.target.checked ? '1' : '')}
        />
        Solo repetidos
      </label>

      <button className="btn-secondary" onClick={() => onChange({})}>Limpiar</button>
    </div>
  );
}
