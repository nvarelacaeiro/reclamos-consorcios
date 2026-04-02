import { useEffect, useState } from 'react';
import api from '../services/api';

const ESTADO_LABEL = {
  abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado',
};
const ESTADO_COLOR = {
  abierto: '#1565c0', en_proceso: '#f57f17', resuelto: '#2e7d32', cerrado: '#6b7280',
};
const PRIORIDAD_COLOR = {
  baja: '#388e3c', media: '#1565c0', alta: '#e65100', urgente: '#c62828',
};

function BarChart({ data, labelKey, valueKey, colorFn }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="bar-chart">
      {data.map(d => (
        <div key={d[labelKey]} className="bar-row">
          <div className="bar-label">{ESTADO_LABEL[d[labelKey]] || d[labelKey]}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${(d[valueKey] / max) * 100}%`,
                background: colorFn ? colorFn(d[labelKey]) : '#4361ee',
              }}
            />
          </div>
          <div className="bar-value">{d[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

export default function EstadisticasDashboard() {
  const [stats,    setStats]    = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/reclamos/stats').then(r => {
      setStats(r.data);
      setCargando(false);
    });
  }, []);

  if (cargando) return <p className="cargando">Cargando estadísticas…</p>;

  const totalReclamos = stats.por_estado.reduce((s, d) => s + d.total, 0);

  return (
    <div className="stats-page">
      <h1 className="stats-title">Dashboard</h1>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-valor">{totalReclamos}</div>
          <div className="kpi-label">Total reclamos</div>
        </div>
        {stats.por_estado.map(d => (
          <div key={d.estado} className="kpi-card" style={{ borderTop: `3px solid ${ESTADO_COLOR[d.estado]}` }}>
            <div className="kpi-valor" style={{ color: ESTADO_COLOR[d.estado] }}>{d.total}</div>
            <div className="kpi-label">{ESTADO_LABEL[d.estado]}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="stats-grid">
        <div className="stats-card">
          <h3>Reclamos por estado</h3>
          <BarChart
            data={stats.por_estado}
            labelKey="estado"
            valueKey="total"
            colorFn={k => ESTADO_COLOR[k]}
          />
        </div>

        <div className="stats-card">
          <h3>Reclamos por edificio</h3>
          <BarChart
            data={stats.por_edificio}
            labelKey="nombre"
            valueKey="total"
          />
        </div>
      </div>

      {/* Tabla repetidos */}
      <div className="stats-card stats-card-full">
        <h3>Reclamos con mayor repetición</h3>
        {stats.repetidos.length === 0 ? (
          <p className="sin-datos">No hay reclamos repetidos actualmente.</p>
        ) : (
          <>
            {/* Desktop */}
            <div className="tabla-desktop">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Título</th>
                    <th>Edificio</th>
                    <th>Tipo</th>
                    <th>Repeticiones</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.repetidos.map(r => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.titulo}</td>
                      <td>{r.edificio_nombre}</td>
                      <td>{r.tipo_nombre}</td>
                      <td>
                        <strong style={{ color: r.repeticiones >= 3 ? '#c62828' : '#e65100' }}>
                          {r.repeticiones}x
                        </strong>
                      </td>
                      <td>
                        <span
                          className="badge-prioridad"
                          style={{
                            background: `${PRIORIDAD_COLOR[r.prioridad]}22`,
                            color: PRIORIDAD_COLOR[r.prioridad],
                          }}
                        >
                          {r.prioridad}
                        </span>
                      </td>
                      <td>
                        <span className={`estado estado-${r.estado}`}>
                          {ESTADO_LABEL[r.estado]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="tabla-mobile" style={{ padding: '8px 0 0' }}>
              {stats.repetidos.map(r => (
                <div key={r.id} className="gestion-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <div className="gestion-card-title" style={{ flex: 1 }}>{r.titulo}</div>
                    <strong style={{ color: r.repeticiones >= 3 ? '#c62828' : '#e65100', fontSize: 13, flexShrink: 0 }}>
                      {r.repeticiones}x
                    </strong>
                  </div>
                  <div className="gestion-card-sub">
                    🏢 {r.edificio_nombre} · {r.tipo_nombre}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span
                      className="badge-prioridad"
                      style={{
                        background: `${PRIORIDAD_COLOR[r.prioridad]}22`,
                        color: PRIORIDAD_COLOR[r.prioridad],
                      }}
                    >
                      {r.prioridad}
                    </span>
                    <span className={`estado estado-${r.estado}`}>
                      {ESTADO_LABEL[r.estado]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
