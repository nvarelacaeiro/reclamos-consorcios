import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import GestionReclamos from './components/GestionReclamos';
import EstadisticasDashboard from './components/EstadisticasDashboard';
import GestionUsuarios from './components/GestionUsuarios';

function PrivateRoute({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="pantalla-carga">Cargando…</div>;
  return usuario ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="pantalla-carga">Cargando…</div>;
  return usuario ? <Navigate to="/reclamos" replace /> : children;
}

function AdminRoute({ children }) {
  const { usuario } = useAuth();
  return usuario?.rol === 'admin' ? children : <Navigate to="/reclamos" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route
            path="/"
            element={<PrivateRoute><Dashboard /></PrivateRoute>}
          >
            <Route index element={<Navigate to="/reclamos" replace />} />
            <Route path="reclamos"     element={<GestionReclamos />} />
            <Route path="estadisticas" element={<EstadisticasDashboard />} />
            <Route path="usuarios"     element={<AdminRoute><GestionUsuarios /></AdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/reclamos" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
