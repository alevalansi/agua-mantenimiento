import { createContext, useContext, useState, useCallback } from 'react';
import {
  getList, setList, getCurrentTechnician, setCurrentTechnician as storageSetTech,
  KEYS, addActivityLog,
} from '../utils/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [stations, setStationsState] = useState(() => getList(KEYS.STATIONS));
  const [analyzers, setAnalyzersState] = useState(() => getList(KEYS.ANALYZERS));
  const [maintenanceLogs, setMaintenanceLogsState] = useState(() => getList(KEYS.MAINTENANCE_LOGS));
  const [chemicalConsumptions, setChemicalConsumptionsState] = useState(() => getList(KEYS.CHEMICAL_CONSUMPTIONS));
  const [chemicalInventory, setChemicalInventoryState] = useState(() => getList(KEYS.CHEMICAL_INVENTORY));
  const [technicians, setTechniciansState] = useState(() => getList(KEYS.TECHNICIANS));
  const [activityLog, setActivityLogState] = useState(() => getList(KEYS.ACTIVITY_LOG));
  const [currentTechnician, setCurrentTechnicianState] = useState(() => getCurrentTechnician());

  const refresh = useCallback((key) => {
    const data = getList(key);
    switch (key) {
      case KEYS.STATIONS: setStationsState(data); break;
      case KEYS.ANALYZERS: setAnalyzersState(data); break;
      case KEYS.MAINTENANCE_LOGS: setMaintenanceLogsState(data); break;
      case KEYS.CHEMICAL_CONSUMPTIONS: setChemicalConsumptionsState(data); break;
      case KEYS.CHEMICAL_INVENTORY: setChemicalInventoryState(data); break;
      case KEYS.TECHNICIANS: setTechniciansState(data); break;
      case KEYS.ACTIVITY_LOG: setActivityLogState(data); break;
      default: break;
    }
  }, []);

  const refreshAll = useCallback(() => {
    setStationsState(getList(KEYS.STATIONS));
    setAnalyzersState(getList(KEYS.ANALYZERS));
    setMaintenanceLogsState(getList(KEYS.MAINTENANCE_LOGS));
    setChemicalConsumptionsState(getList(KEYS.CHEMICAL_CONSUMPTIONS));
    setChemicalInventoryState(getList(KEYS.CHEMICAL_INVENTORY));
    setTechniciansState(getList(KEYS.TECHNICIANS));
    setActivityLogState(getList(KEYS.ACTIVITY_LOG));
  }, []);

  const setCurrentTechnician = useCallback((tech) => {
    storageSetTech(tech);
    setCurrentTechnicianState(tech);
  }, []);

  const logActivity = useCallback((entry) => {
    addActivityLog(entry);
    setActivityLogState(getList(KEYS.ACTIVITY_LOG));
  }, []);

  return (
    <AppContext.Provider value={{
      stations, analyzers, maintenanceLogs, chemicalConsumptions,
      chemicalInventory, technicians, activityLog, currentTechnician,
      refresh, refreshAll, setCurrentTechnician, logActivity,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
