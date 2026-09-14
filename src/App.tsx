import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import HealthCenters from './pages/HealthCenters';
import HealthCenterDetail from './pages/HealthCenterDetail';
import ClimateAlerts from './pages/ClimateAlerts';
import HealthAlertsPage from './pages/HealthAlertsPage';
import EnergyMonitoring from './pages/EnergyMonitoring';
import Simulation from './pages/Simulation';
import Prevention from './pages/Prevention';
import MapView from './pages/MapView';
import RealtimeMonitoring from './pages/RealtimeMonitoring';
import Predictions from './pages/Predictions';
import Journal from './pages/Journal';

/** Redirige vers /login si aucune session n'est ouverte. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="centres" element={<HealthCenters />} />
        <Route path="centres/:id" element={<HealthCenterDetail />} />
        <Route path="alertes-climat" element={<ClimateAlerts />} />
        <Route path="alertes-sante" element={<HealthAlertsPage />} />
        <Route path="energie" element={<EnergyMonitoring />} />
        <Route path="realtime" element={<RealtimeMonitoring />} />
        <Route path="predictions" element={<Predictions />} />
        <Route path="simulation" element={<Simulation />} />
        <Route path="prevention" element={<Prevention />} />
        <Route path="journal" element={<Journal />} />
        <Route path="carte" element={<MapView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
