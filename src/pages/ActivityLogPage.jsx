import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, Wrench, FlaskConical, MapPin, Cpu, LogIn, Users, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../utils/helpers';
import { PageWrapper, PageHeader, Card } from '../components/Layout';

const ACTION_ICONS = {
  login: LogIn,
  add_station: MapPin,
  add_analyzer: Cpu,
  add_maintenance: Wrench,
  add_chemical: FlaskConical,
  add_inventory: Package,
  add_technician: Users,
  edit_station: MapPin,
  delete_analyzer: Cpu,
  delete_station: MapPin,
};

const ACTION_LABELS = {
  login: 'התחברות',
  add_station: 'הוספת תחנה',
  add_analyzer: 'הוספת מד',
  add_maintenance: 'תחזוקה',
  add_chemical: 'שימוש בכימיקל',
  add_inventory: 'עדכון מלאי',
  add_technician: 'הוספת טכנאי',
  edit_station: 'עריכת תחנה',
  delete_analyzer: 'מחיקת מד',
  delete_station: 'מחיקת תחנה',
};

const ACTION_COLORS = {
  login: 'text-sky-400 bg-sky-400/10',
  add_station: 'text-emerald-400 bg-emerald-400/10',
  add_analyzer: 'text-violet-400 bg-violet-400/10',
  add_maintenance: 'text-blue-400 bg-blue-400/10',
  add_chemical: 'text-teal-400 bg-teal-400/10',
  add_inventory: 'text-amber-400 bg-amber-400/10',
  add_technician: 'text-pink-400 bg-pink-400/10',
  edit_station: 'text-slate-400 bg-slate-400/10',
  delete_analyzer: 'text-red-400 bg-red-400/10',
  delete_station: 'text-red-400 bg-red-400/10',
};

export default function ActivityLogPage() {
  const { activityLog } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const filtered = useMemo(() => {
    return activityLog.filter((entry) => {
      if (filterType && entry.action_type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          entry.description?.toLowerCase().includes(q) ||
          entry.technician_name?.toLowerCase().includes(q) ||
          entry.station_name?.toLowerCase().includes(q) ||
          entry.analyzer_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activityLog, search, filterType]);

  return (
    <PageWrapper>
      <PageHeader
        title="יומן פעילות"
        subtitle={`${activityLog.length} פעולות`}
      />

      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="חיפוש..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
            <option value="">כל הפעולות</option>
            {Object.entries(ACTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </Card>

      <p className="text-xs text-slate-500 mb-3">{filtered.length} תוצאות</p>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Activity size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">אין פעילות רשומה</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry, i) => {
            const Icon = ACTION_ICONS[entry.action_type] || Activity;
            const colorClass = ACTION_COLORS[entry.action_type] || 'text-slate-400 bg-slate-400/10';
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <Card className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200">{entry.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {entry.technician_name && (
                          <span className="text-xs text-slate-500">{entry.technician_name}</span>
                        )}
                        {entry.station_name && (
                          <span className="text-xs text-slate-500">• {entry.station_name}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">
                      {formatDateTime(entry.date)}
                    </p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
