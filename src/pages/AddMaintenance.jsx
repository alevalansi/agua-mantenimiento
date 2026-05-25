import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addMaintenanceLog, updateAnalyzer } from '../utils/storage';
import { MAINTENANCE_TYPES, addDays, todayISO } from '../utils/helpers';
import { PageWrapper, PageHeader, Card, Input, Select, Textarea, Button } from '../components/Layout';

export default function AddMaintenance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const analyzerId = searchParams.get('analyzerId');
  const stationId = searchParams.get('stationId');

  const { analyzers, stations, currentTechnician, refreshMaintenanceLogs, refreshAnalyzers, logActivity } = useApp();
  const analyzer = analyzers.find((a) => a.id === analyzerId);
  const station = stations.find((s) => s.id === stationId);

  const [form, setForm] = useState({
    analyzer_id: analyzerId || '',
    station_id: stationId || '',
    technician_name: currentTechnician?.name || '',
    maintenance_type: 'preventive',
    description: '',
    parts_replaced: '',
    date: todayISO(),
    duration_minutes: '',
    status: 'completed',
    is_recurring: false,
    renewal_interval_days: analyzer?.maintenance_interval_days || '',
    needs_followup: false,
    followup_notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.analyzer_id || !form.technician_name.trim()) return;
    setSaving(true);

    try {
      const newLog = {
        ...form,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        renewal_interval_days: form.renewal_interval_days ? parseInt(form.renewal_interval_days) : null,
      };

      await addMaintenanceLog(newLog);

      // Update analyzer dates
      if (form.status === 'completed') {
        const updates = { last_maintenance_date: form.date };
        if (form.is_recurring && form.renewal_interval_days) {
          updates.next_maintenance_date = addDays(form.date, parseInt(form.renewal_interval_days));
        } else if (analyzer?.maintenance_interval_days) {
          updates.next_maintenance_date = addDays(form.date, analyzer.maintenance_interval_days);
        }
        await updateAnalyzer(form.analyzer_id, updates);
        await refreshAnalyzers();
      }

      await refreshMaintenanceLogs();

      await logActivity({
        technician_name: currentTechnician?.name,
        action_type: 'add_maintenance',
        description: `תחזוקה ${MAINTENANCE_TYPES[form.maintenance_type]} - ${analyzer?.name}`,
        station_name: station?.name,
        analyzer_name: analyzer?.name,
      });

      if (stationId && analyzerId) {
        navigate(`/station/${stationId}/analyzer/${analyzerId}`);
      } else {
        navigate('/logs/maintenance');
      }
    } catch (err) {
      console.error('Failed to save maintenance log:', err);
      alert('שגיאה בשמירה: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setCheck = (field) => (e) => setForm({ ...form, [field]: e.target.checked });

  return (
    <PageWrapper>
      <PageHeader
        title="רישום תחזוקה"
        subtitle={analyzer ? `${analyzer.name} • ${station?.name || ''}` : ''}
        back={stationId && analyzerId ? `/station/${stationId}/analyzer/${analyzerId}` : '/logs/maintenance'}
      />

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center w-14 h-14 bg-emerald-500/20 rounded-xl mx-auto mb-2">
              <Wrench size={28} className="text-emerald-400" />
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
              <Input label="טכנאי *" required placeholder="שם הטכנאי" value={form.technician_name} onChange={set('technician_name')} />
              <Input label="תאריך *" type="date" required value={form.date} onChange={set('date')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="סוג תחזוקה" value={form.maintenance_type} onChange={set('maintenance_type')}>
                {Object.entries(MAINTENANCE_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
              <Select label="סטטוס" value={form.status} onChange={set('status')}>
                <option value="completed">הושלם</option>
                <option value="in_progress">בביצוע</option>
                <option value="pending">ממתין</option>
              </Select>
            </div>

            <Textarea label="תיאור הפעולה *" required placeholder="תאר את פעולת התחזוקה..." value={form.description} onChange={set('description')} rows={3} />

            <div className="grid grid-cols-2 gap-4">
              <Input label="חלקים שהוחלפו" placeholder="רשימת חלקים..." value={form.parts_replaced} onChange={set('parts_replaced')} />
              <Input label="משך זמן (דקות)" type="number" min="1" placeholder="60" value={form.duration_minutes} onChange={set('duration_minutes')} />
            </div>

            {/* Recurring */}
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_recurring} onChange={setCheck('is_recurring')} className="w-4 h-4 accent-sky-500" />
                <span className="text-sm text-slate-300">תחזוקה חוזרת</span>
              </label>
              {form.is_recurring && (
                <Input
                  label="מרווח חזרה (ימים)"
                  type="number"
                  min="1"
                  placeholder="90"
                  value={form.renewal_interval_days}
                  onChange={set('renewal_interval_days')}
                />
              )}
            </div>

            {/* Follow-up */}
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.needs_followup} onChange={setCheck('needs_followup')} className="w-4 h-4 accent-amber-500" />
                <span className="text-sm text-slate-300">דרוש מעקב</span>
              </label>
              {form.needs_followup && (
                <Textarea label="הערות מעקב" placeholder="פרטי המעקב הנדרש..." value={form.followup_notes} onChange={set('followup_notes')} rows={2} />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="flex-1 justify-center">
                {saving ? 'שומר...' : 'שמור תחזוקה'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>ביטול</Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </PageWrapper>
  );
}
