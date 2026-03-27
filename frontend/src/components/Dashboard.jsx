import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Cerrar sidebar al navegar (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Menú"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <img src="/logo-catsa.png" alt="CATSA" className="topbar-logo" />
        </div>
        <div className="topbar-user">
          <span className="topbar-user-name">{usuario?.nombre}</span>
          <button className="btn-logout" onClick={logout}>Salir</button>
        </div>
      </header>

      <div className="shell-body">
        {/* Overlay para cerrar sidebar en mobile */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
        <Sidebar isOpen={sidebarOpen} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
