import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addChemicalConsumption, decrementChemicalInventory } from '../utils/storage';
import { UNITS, todayISO } from '../utils/helpers';
import { PageWrapper, PageHeader, Card, Input, Select, Textarea, Button } from '../components/Layout';

export default function AddChemical() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const analyzerId = searchParams.get('analyzerId');
  const stationId = searchParams.get('stationId');

  const { analyzers, stations, chemicalInventory, currentTechnician,
    refreshChemicalConsumptions, refreshChemicalInventory, logActivity } = useApp();
  const analyzer = analyzers.find((a) => a.id === analyzerId);
  const station = stations.find((s) => s.id === stationId);

  const [form, setForm] = useState({
    analyzer_id: analyzerId || '',
    station_id: stationId || '',
    technician_name: currentTechnician?.name || '',
    chemical_name: '',
    quantity: '',
    unit: 'מ"ל',
    date: todayISO(),
    renewal_interval_days: '',
    lot_number: '',
    expiry_date: '',
    notes: '',
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);

  const inventoryNames = useMemo(() =>
    [...new Set(chemicalInventory.map((i) => i.chemical_name))],
    [chemicalInventory]
  );

  const filteredSuggestions = form.chemical_name
    ? inventoryNames.filter((n) => n.includes(form.chemical_name) && n !== form.chemical_name)
    : inventoryNames;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.chemical_name.trim() || !form.quantity || !form.analyzer_id) return;
    setSaving(true);

    try {
      const newEntry = {
        ...form,
        quantity: parseFloat(form.quantity),
        renewal_interval_days: form.renewal_interval_days ? parseInt(form.renewal_interval_days) : null,
        expiry_date: form.expiry_date || null,
      };

      await addChemicalConsumption(newEntry);

      // Decrement inventory if exists
      await decrementChemicalInventory(form.chemical_name, form.unit, form.quantity);
      await refreshChemicalInventory();
      await refreshChemicalConsumptions();

      await logActivity({
        technician_name: currentTechnician?.name,
        action_type: 'add_chemical',
        description: `שימוש בכימיקל ${form.chemical_name} (${form.quantity} ${form.unit}) - ${analyzer?.name}`,
        station_name: station?.name,
        analyzer_name: analyzer?.name,
      });

      if (stationId && analyzerId) {
        navigate(`/station/${stationId}/analyzer/${analyzerId}`);
      } else {
        navigate('/logs/chemical');
      }
    } catch (err) {
      console.error('Failed to save chemical log:', err);
      alert('שגיאה בשמירה: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <PageWrapper>
      <PageHeader
        title="רישום שימוש בכימיקל"
        subtitle={analyzer ? `${analyzer.name} • ${station?.name || ''}` : ''}
        back={stationId && analyzerId ? `/station/${stationId}/analyzer/${analyzerId}` : '/logs/chemical'}
      />

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center w-14 h-14 bg-teal-500/20 rounded-xl mx-auto mb-2">
              <FlaskConical size={28} className="text-teal-400" />
            </div>

            {!analyzerId && (
              <div className="grid grid-cols-2 gap-4">
                <Select label="תחנה" value={form.station_id} onChange={(e) => setForm({ ...form, station_id: e.target.value, analyzer_id: '' })}>
                  <option value="">-- בחר תחנה --</option>
                  {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
                <Select label="מנתח *" required value={form.analyzer_id} onChange={set('analyzer_id')}>
                  <option value="">-- בחר מנתח --</option>
                  {analyzers.filter((a) => !form.station_id || a.station_id === form.station_id)
                    .map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input label="טכנאי *" required value={form.technician_name} onChange={set('technician_name')} />
              <Input label="תאריך *" type="date" required value={form.date} onChange={set('date')} />
            </div>

            {/* Chemical name with autocomplete */}
            <div className="relative">
              <label className="block text-sm text-slate-400 mb-1">שם הכימיקל *</label>
              <input
                required
                placeholder="שם הכימיקל..."
                value={form.chemical_name}
                onChange={(e) => setForm({ ...form, chemical_name: e.target.value })}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => { setForm({ ...form, chemical_name: name }); setShowSuggestions(false); }}
                      className="w-full text-right px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="כמות *" type="number" required min="0.01" step="0.01" placeholder="0.00" value={form.quantity} onChange={set('quantity')} />
              <Select label="יחידה" value={form.unit} onChange={set('unit')}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="מספר לוט" placeholder="LOT-XXX" value={form.lot_number} onChange={set('lot_number')} />
              <Input label="תאריך תפוגה" type="date" value={form.expiry_date} onChange={set('expiry_date')} />
            </div>

            <Input
              label="מרווח חידוש (ימים)"
              type="number"
              min="1"
              placeholder="30"
              value={form.renewal_interval_days}
              onChange={set('renewal_interval_days')}
            />

            <Textarea label="הערות" placeholder="הערות נוספות..." value={form.notes} onChange={set('notes')} rows={2} />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="flex-1 justify-center">
                {saving ? 'שומר...' : 'שמור'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>ביטול</Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </PageWrapper>
  );
}
