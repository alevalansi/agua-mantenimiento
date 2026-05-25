import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addAnalyzer } from '../utils/storage';
import { ANALYZER_TYPES, STATUS_LABELS } from '../utils/helpers';
import { PageWrapper, PageHeader, Card, Input, Select, Textarea, Button } from '../components/Layout';

export default function AddAnalyzer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stationId = searchParams.get('stationId');
  const { stations, refreshAnalyzers, logActivity, currentTechnician } = useApp();
  const station = stations.find((s) => s.id === stationId);

  const [form, setForm] = useState({
    name: '',
    station_id: stationId || '',
    type: 'ph',
    model: '',
    serial_number: '',
    status: 'operational',
    maintenance_interval_days: '',
    chemical_renewal_interval_days: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.station_id) return;
    setSaving(true);

    try {
      const newAnalyzer = {
        name: form.name.trim(),
        station_id: form.station_id,
        type: form.type,
        model: form.model.trim(),
        serial_number: form.serial_number.trim(),
        status: form.status,
        maintenance_interval_days: form.maintenance_interval_days ? parseInt(form.maintenance_interval_days) : null,
        chemical_renewal_interval_days: form.chemical_renewal_interval_days ? parseInt(form.chemical_renewal_interval_days) : null,
        notes: form.notes.trim(),
        last_maintenance_date: null,
        next_maintenance_date: null,
      };

      const created = await addAnalyzer(newAnalyzer);
      await refreshAnalyzers();

      await logActivity({
        technician_name: currentTechnician?.name,
        action_type: 'add_analyzer',
        description: `הוספת מד ${created.name} לתחנה ${station?.name || ''}`,
        station_name: station?.name,
        analyzer_name: created.name,
      });

      if (stationId) {
        navigate(`/station/${stationId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to add analyzer:', err);
      alert('שגיאה בהוספה: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <PageWrapper>
      <PageHeader
        title="הוספת מד חדש"
        subtitle={station ? `לתחנה: ${station.name}` : ''}
        back={stationId ? `/station/${stationId}` : '/dashboard'}
      />

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center w-14 h-14 bg-violet-500/20 rounded-xl mx-auto mb-2">
              <Cpu size={28} className="text-violet-400" />
            </div>

            <Input label="שם המד *" required placeholder="לדוגמה: מד pH ראשי" value={form.name} onChange={set('name')} />

            {!stationId && (
              <Select label="תחנה *" required value={form.station_id} onChange={set('station_id')}>
                <option value="">-- בחר תחנה --</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Select label="סוג מד" value={form.type} onChange={set('type')}>
                {Object.entries(ANALYZER_TYPES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>

              <Select label="סטטוס" value={form.status} onChange={set('status')}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="דגם" placeholder="מספר דגם" value={form.model} onChange={set('model')} />
              <Input label="מספר סידורי" placeholder="S/N" value={form.serial_number} onChange={set('serial_number')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="מרווח תחזוקה (ימים)"
                type="number"
                min="1"
                placeholder="90"
                value={form.maintenance_interval_days}
                onChange={set('maintenance_interval_days')}
              />
              <Input
                label="מרווח חידוש כימיקלים (ימים)"
                type="number"
                min="1"
                placeholder="30"
                value={form.chemical_renewal_interval_days}
                onChange={set('chemical_renewal_interval_days')}
              />
            </div>

            <Textarea label="הערות" placeholder="הערות נוספות..." value={form.notes} onChange={set('notes')} />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving || !form.name.trim() || (!form.station_id)} className="flex-1 justify-center">
                {saving ? 'מוסיף...' : 'הוסף מד'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(stationId ? `/station/${stationId}` : '/dashboard')}>
                ביטול
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </PageWrapper>
  );
}
