import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, Search, Filter, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MAINTENANCE_TYPES, formatDate, formatDateTime } from '../utils/helpers';
import { PageWrapper, PageHeader, Card, Button } from '../components/Layout';

export default function MaintenanceLogs() {
  const navigate = useNavigate();
  const { maintenanceLogs, analyzers, stations } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const enriched = useMemo(() => {
    return maintenanceLogs.map((l) => ({
      ...l,
      _analyzer: analyzers.find((a) => a.id === l.analyzer_id),
      _station: stations.find((s) => s.id === l.station_id),
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [maintenanceLogs, analyzers, stations]);

  const filtered = useMemo(() => {
    return enriched.filter((l) => {
      if (filterType && l.maintenance_type !== filterType) return false;
      if (filterStation && l.station_id !== filterStation) return false;
      if (filterStatus && l.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l._analyzer?.name?.toLowerCase().includes(q) ||
          l._station?.name?.toLowerCase().includes(q) ||
          l.technician_name?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enriched, search, filterType, filterStation, filterStatus]);

  return (
    <PageWrapper>
      <PageHeader
        title="יומן תחזוקה"
        subtitle={`${maintenanceLogs.length} רשומות סה"כ`}
        actions={
          <Button onClick={() => navigate('/add-maintenance')}>
            <Plus size={16} />הוסף
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="חיפוש..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
            <option value="">כל הסוגים</option>
            {Object.entries(MAINTENANCE_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>

          <select value={filterStation} onChange={(e) => setFilterStation(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
            <option value="">כל התחנות</option>
            {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
            <option value="">כל הסטטוסים</option>
            <option value="completed">הושלם</option>
            <option value="in_progress">בביצוע</option>
            <option value="pending">ממתין</option>
          </select>
        </div>
      </Card>

      <p className="text-xs text-slate-500 mb-3">{filtered.length} תוצאות</p>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Wrench size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">לא נמצאו רשומות</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        log.status === 'completed' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' :
                        log.status === 'in_progress' ? 'text-blue-400 bg-blue-400/10 border-blue-400/30' :
                        'text-amber-400 bg-amber-400/10 border-amber-400/30'
                      }`}>
                        {MAINTENANCE_TYPES[log.maintenance_type] || log.maintenance_type}
                      </span>
                      {log.needs_followup && (
                        <span className="text-xs text-amber-400 flex items-center gap-0.5">
                          <AlertTriangle size={11} />מעקב
                        </span>
                      )}
                    </div>

                    <p className="font-medium text-slate-100 text-sm">
                      {log._analyzer?.name || 'מד לא ידוע'}
                    </p>
                    <p className="text-xs text-slate-400">{log._station?.name}</p>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{log.description}</p>

                    {log.parts_replaced && (
                      <p className="text-xs text-slate-500 mt-1">חלקים: {log.parts_replaced}</p>
                    )}
                    {log.needs_followup && log.followup_notes && (
                      <p className="text-xs text-amber-400/80 mt-1">מעקב: {log.followup_notes}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-500">{log.technician_name}</span>
                      {log.duration_minutes && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={10} />{log.duration_minutes} דק'
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left flex-shrink-0">
                    <p className="text-xs text-slate-400 whitespace-nowrap">{formatDate(log.date)}</p>
                    {log.status === 'completed' && (
                      <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1 justify-end">
                        <CheckCircle size={11} />הושלם
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
