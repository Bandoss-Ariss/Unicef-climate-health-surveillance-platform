import { Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="centres" element={<HealthCenters />} />
        <Route path="centres/:id" element={<HealthCenterDetail />} />
        <Route path="alertes-climat" element={<ClimateAlerts />} />
        <Route path="alertes-sante" element={<HealthAlertsPage />} />
        <Route path="energie" element={<EnergyMonitoring />} />
        <Route path="realtime" element={<RealtimeMonitoring />} />
        <Route path="simulation" element={<Simulation />} />
        <Route path="prevention" element={<Prevention />} />
        <Route path="carte" element={<MapView />} />
      </Route>
    </Routes>
  );
}

export default App;
