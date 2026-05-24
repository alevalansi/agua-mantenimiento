// localStorage keys
export const KEYS = {
  STATIONS: 'stations',
  ANALYZERS: 'analyzers',
  MAINTENANCE_LOGS: 'maintenanceLogs',
  CHEMICAL_CONSUMPTIONS: 'chemicalConsumptions',
  CHEMICAL_INVENTORY: 'chemicalInventory',
  TECHNICIANS: 'technicians',
  ACTIVITY_LOG: 'activityLog',
  CURRENT_TECHNICIAN: 'currentTechnician',
};

export function getItem(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getList(key) {
  return getItem(key) || [];
}

export function setList(key, list) {
  setItem(key, list);
}

export function addToList(key, item) {
  const list = getList(key);
  list.push(item);
  setList(key, list);
  return list;
}

export function updateInList(key, id, updates) {
  const list = getList(key);
  const idx = list.findIndex((i) => i.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
  }
  setList(key, list);
  return list;
}

export function removeFromList(key, id) {
  const list = getList(key).filter((i) => i.id !== id);
  setList(key, list);
  return list;
}

export function getCurrentTechnician() {
  return getItem(KEYS.CURRENT_TECHNICIAN);
}

export function setCurrentTechnician(tech) {
  setItem(KEYS.CURRENT_TECHNICIAN, tech);
}

export function addActivityLog(entry) {
  const logs = getList(KEYS.ACTIVITY_LOG);
  logs.unshift({ id: crypto.randomUUID(), date: new Date().toISOString(), ...entry });
  if (logs.length > 500) logs.splice(500);
  setList(KEYS.ACTIVITY_LOG, logs);
}
