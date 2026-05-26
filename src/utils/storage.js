import { supabase } from '../lib/supabase';

// localStorage keys (kept only for non-DB items)
export const KEYS = {
  CURRENT_TECHNICIAN: 'currentTechnician',
  STATIONS_ORDER: 'stationsOrder',
};

// ── localStorage helpers (for currentTechnician & stationsOrder only) ───────
export function getCurrentTechnician() {
  try {
    const raw = localStorage.getItem(KEYS.CURRENT_TECHNICIAN);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentTechnician(tech) {
  localStorage.setItem(KEYS.CURRENT_TECHNICIAN, JSON.stringify(tech));
}

export function getStationsOrder() {
  try {
    const raw = localStorage.getItem(KEYS.STATIONS_ORDER);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStationsOrder(order) {
  localStorage.setItem(KEYS.STATIONS_ORDER, JSON.stringify(order));
}

// ── Supabase helpers ─────────────────────────────────────────────────────────

// IMAGE UTILITY
export function compressImageToBase64(file, maxSize = 160) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// TECHNICIANS
export async function getTechnicians() {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function addTechnician(tech) {
  const { data, error } = await supabase
    .from('technicians')
    .insert(tech)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTechnician(id, updates) {
  const { data, error } = await supabase
    .from('technicians')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTechnician(id) {
  const { error } = await supabase
    .from('technicians')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// STATIONS
export async function getStations() {
  const { data, error } = await supabase
    .from('stations')
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function addStation(station) {
  const { data, error } = await supabase
    .from('stations')
    .insert(station)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStation(id, updates) {
  const { data, error } = await supabase
    .from('stations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStation(id) {
  const { error } = await supabase
    .from('stations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ANALYZERS
export async function getAnalyzers() {
  const { data, error } = await supabase
    .from('analyzers')
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function addAnalyzer(analyzer) {
  const { data, error } = await supabase
    .from('analyzers')
    .insert(analyzer)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAnalyzer(id, updates) {
  const { data, error } = await supabase
    .from('analyzers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAnalyzer(id) {
  const { error } = await supabase
    .from('analyzers')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// MAINTENANCE LOGS
export async function getMaintenanceLogs() {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addMaintenanceLog(log) {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .insert(log)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// CHEMICAL CONSUMPTIONS
export async function getChemicalConsumptions() {
  const { data, error } = await supabase
    .from('chemical_consumptions')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addChemicalConsumption(entry) {
  const { data, error } = await supabase
    .from('chemical_consumptions')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// CHEMICAL INVENTORY
export async function getChemicalInventory() {
  const { data, error } = await supabase
    .from('chemical_inventory')
    .select('*')
    .order('chemical_name');
  if (error) throw error;
  return data || [];
}

export async function addChemicalInventoryItem(item) {
  const { data, error } = await supabase
    .from('chemical_inventory')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateChemicalInventoryItem(id, updates) {
  const { data, error } = await supabase
    .from('chemical_inventory')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChemicalInventoryItem(id) {
  const { error } = await supabase
    .from('chemical_inventory')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function decrementChemicalInventory(chemicalName, unit, quantity) {
  const { data: items } = await supabase
    .from('chemical_inventory')
    .select('*')
    .eq('chemical_name', chemicalName)
    .eq('unit', unit)
    .limit(1);
  if (items && items.length > 0) {
    const item = items[0];
    const newStock = Math.max(0, (parseFloat(item.current_stock) || 0) - parseFloat(quantity));
    await supabase
      .from('chemical_inventory')
      .update({ current_stock: newStock })
      .eq('id', item.id);
  }
}

// ACTIVITY LOG
export async function getActivityLog() {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data || [];
}

export async function addActivityLog(entry) {
  const { error } = await supabase
    .from('activity_log')
    .insert({
      date: new Date().toISOString().split('T')[0],
      ...entry,
    });
  if (error) console.error('Activity log error:', error);
}
