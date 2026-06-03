import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Wrench, FlaskConical, Clock, CalendarDays, AlertTriangle, Pencil, Check, X, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { updateAnalyzer } from '../utils/storage';
import { ANALYZER_TYPES, MAINTENANCE_TYPES, STATUS_LABELS, STATUS_COLORS, formatDate, daysUntil } from '../utils/helpers';
import { PageWrapper, PageHeader, Card, Button } from '../components/Layout';

export default function AnalyzerView() {
  const { id, analyzerId } = useParams();
  const navigate = useNavigate();
  const { analyzers, stations, maintenanceLogs, chemicalConsumptions, refreshAnalyzers, currentTechnician, logActivity } = useApp();
  const [tab, setTab] = useState('maintenance');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setEditForm({
      name: analyzer.name || '',
      type: analyzer.type || '',
      model: analyzer.model || '',
      serial_number: analyzer.serial_number || '',
      status: analyzer.status || 'operational',
      maintenance_interval_days: analyzer.maintenance_interval_days || '',
      chemical_renewal_interval_days: analyzer.chemical_renewal_interval_days || '',
      notes: analyzer.notes || '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) return;
    setSaving(true);
    try {
      await updateAnalyzer(analyzerId, {
        ...editForm,
        maintenance_interval_days: editForm.maintenance_interval_days ? Number(editForm.maintenance_interval_days) : null,
        chemical_renewal_interval_days: editForm.chemical_renewal_interval_days ? Number(editForm.chemical_renewal_interval_days) : null,
      });
      await refreshAnalyzers();
      await logActivity({
        technician_name: currentTechnician?.name,
        action_type: 'edit_analyzer',
        description: `עריכת מד ${editForm.name}`,
        station_name: stations.find(s => s.id === id)?.name,
        analyzer_name: editForm.name,
      });
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert('שגיאה: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const analyzer = analyzers.find((a) => a.id === analyzerId);
  const station = stations.find((s) => s.id === id);
  const logs = maintenanceLogs.filter((l) => l.analyzer_id === analyzerId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const chemicals = chemicalConsumptions.filter((c) => c.analyzer_id === analyzerId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!analyzer) {
    return (
      <PageWrapper>
        <div className="text-center py-20 text-slate-500">
          <p>מד לא נמצא</p>
          <button onClick={() => navigate(`/station/${id}`)} className="mt-4 text-sky-400 text-sm">חזור</button>
        </div>
      </PageWrapper>
    );
  }

  const daysToMaint = analyzer.next_maintenance_date ? daysUntil(analyzer.next_maintenance_date) : null;

  return (
    <PageWrapper>
      <PageHeader
        title={analyzer.name}
        subtitle={`${station?.name || ''} • ${ANALYZER_TYPES[analyzer.type] || analyzer.type}`}
        back={`/station/${id}`}
        actions={
          <div className="flex flex-col gap-1">
            <button onClick={() => navigate(`/add-maintenance?analyzerId=${analyzerId}&stationId=${id}`)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-medium transition-colors">
              <Plus size={13} />תחזוקה
            </button>
            <button onClick={() => navigate(`/add-chemical?analyzerId=${analyzerId}&stationId=${id}`)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs transition-colors">
              <Plus size={13} />כימיקל
            </button>
            <button onClick={startEdit}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 rounded-lg text-xs transition-colors">
              <Pencil size={13} />עריכה
            </button>
          </div>
        }
      />

      {/* Edit form */}
      {editing && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 mb-6 border-sky-500/30">
            <p className="text-sm font-medium text-slate-200 mb-3">עריכת מד</p>
            <div className="space-y-2">
              <input value={editForm.name} onChange={e => setEditForm(f=>({...f,name:e.target.value}))} placeholder="שם *"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
              <div className="grid grid-cols-2 gap-2">
                <select value={editForm.type} onChange={e => setEditForm(f=>({...f,type:e.target.value}))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
                  {Object.entries(ANALYZER_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={editForm.status} onChange={e => setEditForm(f=>({...f,status:e.target.value}))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
                  {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={editForm.model} onChange={e => setEditForm(f=>({...f,model:e.target.value}))} placeholder="דגם"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
                <input value={editForm.serial_number} onChange={e => setEditForm(f=>({...f,serial_number:e.target.value}))} placeholder="מספר סידורי"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={editForm.maintenance_interval_days} onChange={e => setEditForm(f=>({...f,maintenance_interval_days:e.target.value}))} placeholder="מרווח תחזוקה (ימים)"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
                <input type="number" value={editForm.chemical_renewal_interval_days} onChange={e => setEditForm(f=>({...f,chemical_renewal_interval_days:e.target.value}))} placeholder="מרווח כימיקלים (ימים)"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
              </div>
              <textarea value={editForm.notes} onChange={e => setEditForm(f=>({...f,notes:e.target.value}))} placeholder="הערות" rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none" />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1">
                <Check size={15}/>{saving ? 'שומר...' : 'שמור'}
              </button>
              <button onClick={() => setEditing(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-2 text-sm flex items-center justify-center gap-1">
                <X size={15}/>ביטול
              </button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Analyzer Details */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">סטטוס</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[analyzer.status] || ''}`}>
              {STATUS_LABELS[analyzer.status] || analyzer.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">דגם</p>
            <p className="text-sm text-slate-200">{analyzer.model || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">מספר סידורי</p>
            <p className="text-sm text-slate-200">{analyzer.serial_number || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">מרווח תחזוקה</p>
            <p className="text-sm text-slate-200">{analyzer.maintenance_interval_days ? `${analyzer.maintenance_interval_days} ימים` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">תחזוקה אחרונה</p>
            <p className="text-sm text-slate-200">{formatDate(analyzer.last_maintenance_date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">תחזוקה הבאה</p>
            <p className="text-sm text-slate-200">{formatDate(analyzer.next_maintenance_date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">מרווח כימיקלים</p>
            <p className="text-sm text-slate-200">{analyzer.chemical_renewal_interval_days ? `${analyzer.chemical_renewal_interval_days} ימים` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">הערות</p>
            <p className="text-sm text-slate-400 truncate">{analyzer.notes || '—'}</p>
          </div>
        </div>

        {/* Days until maintenance indicator */}
        {daysToMaint !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mt-4 flex items-center gap-3 p-3 rounded-lg border ${
              daysToMaint < 0 ? 'bg-red-400/10 border-red-400/30 text-red-400' :
              daysToMaint < 7 ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' :
              daysToMaint < 30 ? 'bg-sky-400/10 border-sky-400/30 text-sky-400' :
              'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
            }`}
          >
            {daysToMaint < 0 ? <AlertTriangle size={20} /> : daysToMaint < 7 ? <Clock size={20} /> : <CalendarDays size={20} />}
            <div>
              <p className="text-sm font-semibold">
                {daysToMaint < 0 ? `תחזוקה באיחור של ${Math.abs(daysToMaint)} ימים` :
                 daysToMaint === 0 ? 'תחזוקה נדרשת היום' :
                 `${daysToMaint} ימים עד לתחזוקה הבאה`}
              </p>
              <p className="text-xs opacity-70">{formatDate(analyzer.next_maintenance_date)}</p>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-900 border border-slate-800 rounded-xl p-1">
        <button
          onClick={() => setTab('maintenance')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
            tab === 'maintenance' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Wrench size={16} />
          תחזוקות ({logs.length})
        </button>
        <button
          onClick={() => setTab('chemical')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
            tab === 'chemical' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <FlaskConical size={16} />
          כימיקלים ({chemicals.length})
        </button>
      </div>

      {/* Tab Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {tab === 'maintenance' && (
          <div className="space-y-3">
            {logs.length === 0 ? (
              <Card className="p-10 text-center">
                <Wrench size={36} className="mx-auto text-slate-600 mb-2" />
                <p className="text-slate-500 text-sm">אין רשומות תחזוקה</p>
              </Card>
            ) : logs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        log.status === 'completed' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' :
                        'text-amber-400 bg-amber-400/10 border-amber-400/30'
                      }`}>{MAINTENANCE_TYPES[log.maintenance_type] || log.maintenance_type}</span>
                      {log.status === 'completed' && <CheckCircle size={14} className="text-emerald-400" />}
                    </div>
                    <p className="text-sm text-slate-200">{log.description}</p>
                    {log.parts_replaced && (
                      <p className="text-xs text-slate-400 mt-1">חלקים: {log.parts_replaced}</p>
                    )}
                    {log.needs_followup && log.followup_notes && (
                      <p className="text-xs text-amber-400 mt-1">מעקב: {log.followup_notes}</p>
                    )}
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="text-xs text-slate-400">{formatDate(log.date)}</p>
                    <p className="text-xs text-slate-500">{log.technician_name}</p>
                    {log.duration_minutes && (
                      <p className="text-xs text-slate-500">{log.duration_minutes} דק'</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'chemical' && (
          <div className="space-y-3">
            {chemicals.length === 0 ? (
              <Card className="p-10 text-center">
                <FlaskConical size={36} className="mx-auto text-slate-600 mb-2" />
                <p className="text-slate-500 text-sm">אין רשומות כימיקלים</p>
              </Card>
            ) : chemicals.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-100">{c.chemical_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.quantity} {c.unit}</p>
                    {c.lot_number && <p className="text-xs text-slate-500">לוט: {c.lot_number}</p>}
                    {c.expiry_date && <p className="text-xs text-slate-500">תפוגה: {formatDate(c.expiry_date)}</p>}
                    {c.notes && <p className="text-xs text-slate-400 mt-1">{c.notes}</p>}
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="text-xs text-slate-400">{formatDate(c.date)}</p>
                    <p className="text-xs text-slate-500">{c.technician_name}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </PageWrapper>
  );
}
