import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';

import SelectTechnician from './pages/SelectTechnician';
import Dashboard from './pages/Dashboard';
import StationView from './pages/StationView';
import AnalyzerView from './pages/AnalyzerView';
import AddStation from './pages/AddStation';
import AddAnalyzer from './pages/AddAnalyzer';
import AddMaintenance from './pages/AddMaintenance';
import AddChemical from './pages/AddChemical';
import MaintenanceLogs from './pages/MaintenanceLogs';
import ChemicalLogs from './pages/ChemicalLogs';
import ChemicalInventoryPage from './pages/ChemicalInventoryPage';
import Technicians from './pages/Technicians';
import ActivityLogPage from './pages/ActivityLogPage';
import UpcomingTasks from './pages/UpcomingTasks';

function ProtectedRoute({ children }) {
  const { currentTechnician } = useApp();
  if (!currentTechnician) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SelectTechnician />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/station/:id" element={<ProtectedRoute><StationView /></ProtectedRoute>} />
      <Route path="/station/:id/analyzer/:analyzerId" element={<ProtectedRoute><AnalyzerView /></ProtectedRoute>} />
      <Route path="/add-station" element={<ProtectedRoute><AddStation /></ProtectedRoute>} />
      <Route path="/add-analyzer" element={<ProtectedRoute><AddAnalyzer /></ProtectedRoute>} />
      <Route path="/add-maintenance" element={<ProtectedRoute><AddMaintenance /></ProtectedRoute>} />
      <Route path="/add-chemical" element={<ProtectedRoute><AddChemical /></ProtectedRoute>} />
      <Route path="/logs/maintenance" element={<ProtectedRoute><MaintenanceLogs /></ProtectedRoute>} />
      <Route path="/logs/chemical" element={<ProtectedRoute><ChemicalLogs /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><ChemicalInventoryPage /></ProtectedRoute>} />
      <Route path="/technicians" element={<ProtectedRoute><Technicians /></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><ActivityLogPage /></ProtectedRoute>} />
      <Route path="/upcoming" element={<ProtectedRoute><UpcomingTasks /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
