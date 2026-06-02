import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  getTechnicians, getStations, getAnalyzers, getMaintenanceLogs,
  getChemicalConsumptions, getChemicalInventory, getActivityLog,
  addActivityLog as storageAddActivityLog, updateAnalyzer,
  getCurrentTechnician, setCurrentTechnician as storageSetTech,
} from '../utils/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [stations, setStationsState] = useState([]);
  const [analyzers, setAnalyzersState] = useState([]);
  const [maintenanceLogs, setMaintenanceLogsState] = useState([]);
  const [chemicalConsumptions, setChemicalConsumptionsState] = useState([]);
  const [chemicalInventory, setChemicalInventoryState] = useState([]);
  const [technicians, setTechniciansState] = useState([]);
  const [activityLog, setActivityLogState] = useState([]);
  const [currentTechnician, setCurrentTechnicianState] = useState(() => getCurrentTechnician());
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [s, a, ml, cc, ci, t, al] = await Promise.all([
        getStations(),
        getAnalyzers(),
        getMaintenanceLogs(),
        getChemicalConsumptions(),
        getChemicalInventory(),
        getTechnicians(),
        getActivityLog(),
      ]);

      // Auto-update analyzers with overdue maintenance to 'needs_maintenance'
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueAnalyzers = a.filter((analyzer) => {
        if (!analyzer.next_maintenance_date) return false;
        if (analyzer.status === 'needs_maintenance' || analyzer.status === 'faulty') return false;
        const next = new Date(analyzer.next_maintenance_date);
        next.setHours(0, 0, 0, 0);
        return next < today;
      });
      if (overdueAnalyzers.length > 0) {
        await Promise.all(overdueAnalyzers.map((az) =>
          updateAnalyzer(az.id, { status: 'needs_maintenance' })
        ));
        // Reload analyzers after updates
        const updatedAnalyzers = await getAnalyzers();
        setAnalyzersState(updatedAnalyzers);
      } else {
        setAnalyzersState(a);
      }

      setStationsState(s);
      setMaintenanceLogsState(ml);
      setChemicalConsumptionsState(cc);
      setChemicalInventoryState(ci);
      setTechniciansState(t);
      setActivityLogState(al);
      setDbError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setDbError(err?.message || 'Failed to connect to database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Selective refresh functions
  const refreshStations = useCallback(async () => {
    try { setStationsState(await getStations()); } catch (e) { console.error(e); }
  }, []);

  const refreshAnalyzers = useCallback(async () => {
    try { setAnalyzersState(await getAnalyzers()); } catch (e) { console.error(e); }
  }, []);

  const refreshMaintenanceLogs = useCallback(async () => {
    try { setMaintenanceLogsState(await getMaintenanceLogs()); } catch (e) { console.error(e); }
  }, []);

  const refreshChemicalConsumptions = useCallback(async () => {
    try { setChemicalConsumptionsState(await getChemicalConsumptions()); } catch (e) { console.error(e); }
  }, []);

  const refreshChemicalInventory = useCallback(async () => {
    try { setChemicalInventoryState(await getChemicalInventory()); } catch (e) { console.error(e); }
  }, []);

  const refreshTechnicians = useCallback(async () => {
    try { setTechniciansState(await getTechnicians()); } catch (e) { console.error(e); }
  }, []);

  const refreshActivityLog = useCallback(async () => {
    try { setActivityLogState(await getActivityLog()); } catch (e) { console.error(e); }
  }, []);

  const refreshAll = useCallback(() => loadAll(), [loadAll]);

  const setCurrentTechnician = useCallback((tech) => {
    storageSetTech(tech);
    setCurrentTechnicianState(tech);
  }, []);

  const logActivity = useCallback(async (entry) => {
    await storageAddActivityLog(entry);
    refreshActivityLog();
  }, [refreshActivityLog]);

  return (
    <AppContext.Provider value={{
      stations, analyzers, maintenanceLogs, chemicalConsumptions,
      chemicalInventory, technicians, activityLog, currentTechnician,
      loading, dbError,
      refreshStations, refreshAnalyzers, refreshMaintenanceLogs,
      refreshChemicalConsumptions, refreshChemicalInventory,
      refreshTechnicians, refreshActivityLog,
      refreshAll,
      setCurrentTechnician, logActivity,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
