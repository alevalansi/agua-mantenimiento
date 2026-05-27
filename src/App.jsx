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
import ReportPage from './pages/ReportPage';

function ProtectedRoute({ children }) {
  const { currentTechnician, loading, dbError } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-red-400 mb-2">שגיאת חיבור למסד הנתונים</h2>
          <p className="text-slate-400 text-sm mb-4">{dbError}</p>
          <p className="text-slate-500 text-xs">
            יש להריץ את קובץ ה-SQL ליצירת הטבלאות ב-Supabase Dashboard.
            ראה את הקובץ <code className="text-sky-400">supabase/migrations/</code> בפרויקט.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

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
      <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
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
