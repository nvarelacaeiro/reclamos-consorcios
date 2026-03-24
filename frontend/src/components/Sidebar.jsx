import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/reclamos',     label: 'Gestión de reclamos', icon: '📋' },
  { to: '/estadisticas', label: 'Dashboard',            icon: '📊' },
];

const adminLinks = [
  { to: '/usuarios', label: 'Usuarios', icon: '👤' },
];

export default function Sidebar({ isOpen }) {
  const { usuario } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{l.icon}</span>
            <span className="sidebar-label">{l.label}</span>
          </NavLink>
        ))}

        {usuario?.rol === 'admin' && (
          <>
            <hr className="sidebar-divider" />
            {adminLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{l.icon}</span>
                <span className="sidebar-label">{l.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
