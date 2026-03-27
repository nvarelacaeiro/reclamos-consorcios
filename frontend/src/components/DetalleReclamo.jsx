import { useEffect, useState } from 'react';
import api from '../services/api';

const ESTADOS = ['abierto', 'en_proceso', 'resuelto', 'cerrado'];
const ESTADO_LABEL = { abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado' };

function fmtFecha(iso) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });
}

function MetaItem({ label, value }) {
  if (!value) return null;
  return (
    <span className="detalle-meta-item">
      <strong>{label}</strong> {value}
    </span>
  );
}

export default function DetalleReclamo({ reclamoId, onCerrar, onActualizado }) {
  const [reclamo, setReclamo] = useState(null);
  const [estado,  setEstado]  = useState('');
  const [nota,    setNota]    = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/reclamos/${reclamoId}`).then(r => {
      setReclamo(r.data);
      setEstado(r.data.estado);
    });
  }, [reclamoId]);

  async function cambiarEstado() {
    setLoading(true);
    try {
      await api.patch(`/reclamos/${reclamoId}/estado`, { estado, nota });
      onActualizado();
      onCerrar();
    } finally {
      setLoading(false);
    }
  }

  if (!reclamo) return (
    <div className="modal-overlay">
      <div className="modal"><p className="cargando">Cargando…</p></div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="modal modal-detalle">

        <div className="detalle-header">
          <div>
            <span className="detalle-id">Reclamo #{reclamo.id}</span>
            {reclamo.es_repetido === 1 && (
              <span className="badge-rep-grande" style={{ marginLeft: 8 }}>
                ⚠️ Repetido ({reclamo.repeticiones}x)
              </span>
            )}
          </div>
          <button className="btn-cerrar" onClick={onCerrar} title="Cerrar">✕</button>
        </div>

        <p className="detalle-titulo">{reclamo.titulo}</p>
        {reclamo.descripcion && <p className="detalle-desc">{reclamo.descripcion}</p>}

        <div className="detalle-meta">
          <MetaItem label="🏢 Edificio"  value={reclamo.edificio_nombre} />
          <MetaItem label="🚪 Unidad"    value={reclamo.unidad_numero} />
          <MetaItem label="🔧 Tipo"      value={reclamo.tipo_nombre} />
          <MetaItem label="⚡ Prioridad" value={reclamo.prioridad} />
          <MetaItem label="👤 Operador"  value={reclamo.creado_por_nombre} />
          <MetaItem label="📅 Cargado"   value={fmtFecha(reclamo.created_at)} />
          {reclamo.proveedor_nombre && (
            <span className="detalle-meta-item">
              <strong>🛠️ Proveedor</strong>
              {reclamo.proveedor_nombre}
              {reclamo.proveedor_telefono && (
                <a
                  href={`https://wa.me/549${reclamo.proveedor_telefono.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-wa"
                  style={{ marginLeft: 6 }}
                >
                  WhatsApp
                </a>
              )}
            </span>
          )}
        </div>

        <hr />

        <h3 className="historial-title">Cambiar estado</h3>
        <div className="form-row" style={{ marginBottom: 10 }}>
          <select value={estado} onChange={e => setEstado(e.target.value)}>
            {ESTADOS.map(s => (
              <option key={s} value={s}>{ESTADO_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <textarea
          rows={2} value={nota}
          onChange={e => setNota(e.target.value)}
          placeholder="Nota opcional sobre el cambio de estado"
          style={{ marginBottom: 10 }}
        />
        <button
          className="btn-primary"
          onClick={cambiarEstado}
          disabled={loading || estado === reclamo.estado}
        >
          {loading ? 'Guardando…' : 'Actualizar estado'}
        </button>

        {reclamo.historial?.length > 0 && (
          <>
            <hr />
            <h3 className="historial-title">Historial de cambios</h3>
            <ul className="historial">
              {reclamo.historial.map(h => (
                <li key={h.id}>
                  <span className="hist-fecha">{fmtFecha(h.created_at)}</span>
                  <span className="hist-arrow"> · </span>
                  <span className={`estado estado-${h.estado_anterior}`}>
                    {ESTADO_LABEL[h.estado_anterior]}
                  </span>
                  <span className="hist-arrow"> → </span>
                  <span className={`estado estado-${h.estado_nuevo}`}>
                    {ESTADO_LABEL[h.estado_nuevo]}
                  </span>
                  {h.nota && <span className="hist-nota"> — {h.nota}</span>}
                  <span className="hist-user"> ({h.usuario_nombre})</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
