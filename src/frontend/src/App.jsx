import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import OverviewPage from './pages/OverviewPage';
import RiskDetailPage from './pages/RiskDetailPage';
import FleetPage from './pages/FleetPage';
import FleetVehicleDetailPage from './pages/FleetVehicleDetailPage';
import ColdChainPage from './pages/ColdChainPage';
import TemperatureShipmentDetailPage from './pages/TemperatureShipmentDetailPage';
import AssistantPage from './pages/AssistantPage';
import ShipmentsPage from './pages/ShipmentsPage';
import DisruptionsPage from './pages/DisruptionsPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-container">
        <Routes>
          <Route path="/risk/shipments/:shipmentId" element={<RiskDetailPage />} />
          <Route path="/fleet/vehicles/:vehicleId" element={<FleetVehicleDetailPage />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/cold-chain/shipments/:shipmentId" element={<TemperatureShipmentDetailPage />} />
          <Route path="/cold-chain" element={<ColdChainPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/shipments" element={<ShipmentsPage />} />
          <Route path="/disruptions" element={<DisruptionsPage />} />
          <Route path="*" element={<OverviewPage />} />
        </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
