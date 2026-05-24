import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getList, setList, KEYS } from '../utils/storage';
import { STATUS_LABELS } from '../utils/helpers';
import { PageWrapper, PageHeader, Card, Input, Select, Textarea, Button } from '../components/Layout';

export default function AddStation() {
  const navigate = useNavigate();
  const { refresh, logActivity, currentTechnician } = useApp();
  const [form, setForm] = useState({
    name: '', location: '', status: 'operational', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const list = getList(KEYS.STATIONS);
    const newStation = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      location: form.location.trim(),
      status: form.status,
      notes: form.notes.trim(),
      order: list.length,
    };
    list.push(newStation);
    setList(KEYS.STATIONS, list);
    refresh(KEYS.STATIONS);

    logActivity({
      technician_name: currentTechnician?.name,
      action_type: 'add_station',
      description: `הוספת תחנה חדשה: ${newStation.name}`,
      station_name: newStation.name,
    });

    navigate('/dashboard');
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <PageWrapper>
      <PageHeader title="הוספת תחנה חדשה" back="/dashboard" />

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center w-14 h-14 bg-sky-500/20 rounded-xl mx-auto mb-2">
              <MapPin size={28} className="text-sky-400" />
            </div>

            <Input label="שם התחנה *" required placeholder="לדוגמה: תחנת ירקון צפון" value={form.name} onChange={set('name')} />
            <Input label="מיקום" placeholder="כתובת או תיאור מיקום" value={form.location} onChange={set('location')} />

            <Select label="סטטוס" value={form.status} onChange={set('status')}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>

            <Textarea label="הערות" placeholder="הערות נוספות על התחנה..." value={form.notes} onChange={set('notes')} />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving || !form.name.trim()} className="flex-1 justify-center">
                {saving ? 'שומר...' : 'הוסף תחנה'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
                ביטול
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </PageWrapper>
  );
}
