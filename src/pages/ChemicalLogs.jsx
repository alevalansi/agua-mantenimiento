import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlaskConical, Package, Plus, Search, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addChemicalInventoryItem } from '../utils/storage';
import { formatDate, UNITS } from '../utils/helpers';
import { PageWrapper, PageHeader, Card, Button } from '../components/Layout';

export default function ChemicalLogs() {
  const navigate = useNavigate();
  const { chemicalConsumptions, chemicalInventory, analyzers, stations,
    refreshChemicalInventory, currentTechnician, logActivity } = useApp();
  const [tab, setTab] = useState('consumptions');
  const [search, setSearch] = useState('');
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [invForm, setInvForm] = useState({ chemical_name: '', unit: 'מ"ל', current_stock: '', minimum_threshold: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const enriched = useMemo(() => {
    return chemicalConsumptions
      .map((c) => ({
        ...c,
        _analyzer: analyzers.find((a) => a.id === c.analyzer_id),
        _station: stations.find((s) => s.id === c.station_id),
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [chemicalConsumptions, analyzers, stations]);

  const filteredConsumptions = useMemo(() => {
    if (!search) return enriched;
    const q = search.toLowerCase();
    return enriched.filter((c) =>
      c.chemical_name?.toLowerCase().includes(q) ||
      c._analyzer?.name?.toLowerCase().includes(q) ||
      c._station?.name?.toLowerCase().includes(q) ||
      c.technician_name?.toLowerCase().includes(q)
    );
  }, [enriched, search]);

  const filteredInventory = useMemo(() => {
    if (!search) return chemicalInventory;
    const q = search.toLowerCase();
    return chemicalInventory.filter((i) => i.chemical_name?.toLowerCase().includes(q));
  }, [chemicalInventory, search]);

  const handleAddInventory = async (e) => {
    e.preventDefault();
    if (!invForm.chemical_name.trim()) return;
    setSaving(true);
    try {
      await addChemicalInventoryItem({
        chemical_name: invForm.chemical_name.trim(),
        unit: invForm.unit,
        current_stock: parseFloat(invForm.current_stock) || 0,
        minimum_threshold: parseFloat(invForm.minimum_threshold) || 0,
        notes: invForm.notes.trim(),
      });
      await refreshChemicalInventory();
      await logActivity({
        technician_name: currentTechnician?.name,
        action_type: 'add_inventory',
        description: `הוספת כימיקל למלאי: ${invForm.chemical_name}`,
      });
      setInvForm({ chemical_name: '', unit: 'מ"ל', current_stock: '', minimum_threshold: '', notes: '' });
      setShowAddInventory(false);
    } catch (err) {
      console.error(err);
      alert('שגיאה: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="יומן כימיקלים"
        actions={
          <Button onClick={() => navigate('/add-chemical')}>
            <Plus size={16} />הוסף
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-900 border border-slate-800 rounded-xl p-1">
        <button
          onClick={() => setTab('consumptions')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${tab === 'consumptions' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-300'}`}
        >
          <FlaskConical size={16} />צריכה ({chemicalConsumptions.length})
        </button>
        <button
          onClick={() => setTab('inventory')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${tab === 'inventory' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-300'}`}
        >
          <Package size={16} />מלאי ({chemicalInventory.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          placeholder="חיפוש..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {tab === 'consumptions' && (
          <div className="space-y-3">
            {filteredConsumptions.length === 0 ? (
              <Card className="p-12 text-center">
                <FlaskConical size={40} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">אין רשומות כימיקלים</p>
              </Card>
            ) : filteredConsumptions.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-100 text-sm">{c.chemical_name}</p>
                      <p className="text-xs text-sky-400 font-medium mt-0.5">{c.quantity} {c.unit}</p>
                      <p className="text-xs text-slate-400">{c._analyzer?.name} • {c._station?.name}</p>
                      {c.lot_number && <p className="text-xs text-slate-500 mt-0.5">לוט: {c.lot_number}</p>}
                      {c.expiry_date && <p className="text-xs text-slate-500">תפוגה: {formatDate(c.expiry_date)}</p>}
                      {c.notes && <p className="text-xs text-slate-400 mt-1">{c.notes}</p>}
                      <p className="text-xs text-slate-500 mt-1">{c.technician_name}</p>
                    </div>
                    <p className="text-xs text-slate-400 whitespace-nowrap">{formatDate(c.date)}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'inventory' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button onClick={() => setShowAddInventory(!showAddInventory)} variant="secondary">
                <Plus size={16} />{showAddInventory ? 'ביטול' : 'הוסף כימיקל למלאי'}
              </Button>
            </div>

            {showAddInventory && (
              <Card className="p-4">
                <form onSubmit={handleAddInventory} className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">הוספת כימיקל למלאי</p>
                  <input required placeholder="שם הכימיקל *" value={invForm.chemical_name} onChange={(e) => setInvForm({ ...invForm, chemical_name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
                  <div className="grid grid-cols-3 gap-2">
                    <select value={invForm.unit} onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input type="number" min="0" step="0.01" placeholder="מלאי נוכחי" value={invForm.current_stock} onChange={(e) => setInvForm({ ...invForm, current_stock: e.target.value })}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
                    <input type="number" min="0" step="0.01" placeholder="מינימום" value={invForm.minimum_threshold} onChange={(e) => setInvForm({ ...invForm, minimum_threshold: e.target.value })}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm">
                      {saving ? 'מוסיף...' : 'הוסף'}
                    </button>
                  </div>
                </form>
              </Card>
            )}

            {filteredInventory.length === 0 ? (
              <Card className="p-12 text-center">
                <Package size={40} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">אין פריטים במלאי</p>
              </Card>
            ) : filteredInventory.map((item) => {
              const isLow = item.minimum_threshold > 0 && item.current_stock <= item.minimum_threshold;
              return (
                <Card key={item.id} className={`p-4 ${isLow ? 'border-amber-500/30' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-100 text-sm">{item.chemical_name}</p>
                        {isLow && <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>
                    </div>
                    <div className="text-left">
                      <p className={`text-base font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {item.current_stock} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                      </p>
                      {item.minimum_threshold > 0 && (
                        <p className="text-xs text-slate-500">מינ': {item.minimum_threshold}</p>
                      )}
                    </div>
                  </div>
                  {isLow && (
                    <div className="mt-2 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-2 py-1">
                      מלאי נמוך מהסף המינימלי
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </PageWrapper>
  );
}
