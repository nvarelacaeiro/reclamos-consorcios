import { useEffect, useState } from 'react';
import api from '../services/api';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form,     setForm]     = useState({ nombre: '', email: '', password: '', rol: 'operador' });
  const [error,    setError]    = useState('');
  const [exito,    setExito]    = useState('');
  const [loading,  setLoading]  = useState(false);

  function cargar() {
    setCargando(true);
    api.get('/usuarios').then(r => {
      setUsuarios(r.data);
      setCargando(false);
    });
  }

  useEffect(() => { cargar(); }, []);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito('');

    if (!form.nombre.trim())  { setError('El nombre es requerido'); return; }
    if (!form.email.trim())   { setError('El email es requerido'); return; }
    if (!form.password)       { setError('La contraseña es requerida'); return; }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('El email no tiene un formato válido'); return;
    }

    setLoading(true);
    try {
      await api.post('/usuarios', form);
      setExito(`Usuario ${form.email} creado correctamente.`);
      setForm({ nombre: '', email: '', password: '', rol: 'operador' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActivo(usuario) {
    await api.patch(`/usuarios/${usuario.id}/activo`);
    cargar();
  }

  return (
    <div className="seccion-content">
      <div className="usuarios-layout">

        {/* Formulario crear */}
        <div className="usuarios-form-card">
          <h2>Crear nuevo usuario</h2>
          <form onSubmit={handleSubmit} noValidate>
            <label>Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              placeholder="Nombre completo"
            />

            <label>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="usuario@ejemplo.com"
            />

            <label>Contraseña * <small>(mín. 8 caracteres)</small></label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Contraseña segura"
              autoComplete="new-password"
            />

            <label>Rol</label>
            <select value={form.rol} onChange={e => set('rol', e.target.value)}>
              <option value="operador">Operador</option>
              <option value="admin">Administrador</option>
            </select>

            {error && <p className="error-msg">{error}</p>}
            {exito && <p className="exito-msg">{exito}</p>}

            <div className="form-actions" style={{ marginTop: '16px' }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista usuarios */}
        <div className="usuarios-lista-card">
          <h2>Usuarios del sistema</h2>
          {cargando ? (
            <p className="cargando">Cargando…</p>
          ) : (
            <>
              {/* Desktop */}
              <div className="tabla-desktop">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Creado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(u => (
                      <tr key={u.id} className={!u.activo ? 'usuario-inactivo' : ''}>
                        <td>{u.nombre}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge-rol badge-rol-${u.rol}`}>{u.rol}</span>
                        </td>
                        <td>
                          <span className={u.activo ? 'estado estado-resuelto' : 'estado estado-cerrado'}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                        <td>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: '12px', padding: '4px 10px' }}
                            onClick={() => toggleActivo(u)}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="tabla-mobile">
                {usuarios.map(u => (
                  <div key={u.id} className={`gestion-card ${!u.activo ? 'usuario-card-inactivo' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div className="gestion-card-title" style={{ marginBottom: 2 }}>{u.nombre}</div>
                        <div className="gestion-card-sub" style={{ marginBottom: 6 }}>{u.email}</div>
                      </div>
                      <span className={u.activo ? 'estado estado-resuelto' : 'estado estado-cerrado'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className={`badge-rol badge-rol-${u.rol}`}>{u.rol}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {new Date(u.created_at).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 12px' }}
                        onClick={() => toggleActivo(u)}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
