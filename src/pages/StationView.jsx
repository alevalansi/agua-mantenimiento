import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Check, X, Cpu, ChevronLeft, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getList, setList, updateInList, removeFromList, KEYS } from '../utils/storage';
import { STATUS_LABELS, STATUS_COLORS, ANALYZER_TYPES, formatDate, daysUntil } from '../utils/helpers';
import { PageWrapper, PageHeader, Card, Button } from '../components/Layout';

export default function StationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { stations, analyzers, refresh, logActivity, currentTechnician } = useApp();

  const station = stations.find((s) => s.id === id);
  const stationAnalyzers = analyzers.filter((a) => a.station_id === id);

  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');

  if (!station) {
    return (
      <PageWrapper>
        <div className="text-center py-20 text-slate-500">
          <p>תחנה לא נמצאה</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 text-sky-400 text-sm">חזור</button>
        </div>
      </PageWrapper>
    );
  }

  const startEdit = (field, currentValue) => {
    setEditField(field);
    setEditValue(currentValue || '');
  };

  const saveEdit = () => {
    const list = getList(KEYS.STATIONS);
    const idx = list.findIndex((s) => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], [editField]: editValue };
      setList(KEYS.STATIONS, list);
      refresh(KEYS.STATIONS);
      logActivity({
        technician_name: currentTechnician?.name,
        action_type: 'edit_station',
        description: `עדכון שדה ${editField} בתחנה ${station.name}`,
        station_name: station.name,
      });
    }
    setEditField(null);
  };

  const deleteAnalyzer = (analyzerId, analyzerName) => {
    if (!confirm(`למחוק את המנתח "${analyzerName}"?`)) return;
    removeFromList(KEYS.ANALYZERS, analyzerId);
    refresh(KEYS.ANALYZERS);
    logActivity({
      technician_name: currentTechnician?.name,
      action_type: 'delete_analyzer',
      description: `מחיקת מנתח ${analyzerName} מתחנה ${station.name}`,
      station_name: station.name,
      analyzer_name: analyzerName,
    });
  };

  return (
    <PageWrapper>
      <PageHeader
        title={station.name}
        subtitle={station.location}
        back="/dashboard"
        actions={
          <Button onClick={() => navigate(`/add-analyzer?stationId=${id}`)}>
            <Plus size={16} />
            הוסף מנתח
          </Button>
        }
      />

      {/* Station Info Card */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Status */}
          <div>
            <p className="text-xs text-slate-400 mb-1">סטטוס</p>
            <select
              value={station.status}
              onChange={(e) => {
                updateInList(KEYS.STATIONS, id, { status: e.target.value });
                refresh(KEYS.STATIONS);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            >
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {/* Name inline edit */}
          <div>
            <p className="text-xs text-slate-400 mb-1">שם תחנה</p>
            {editField === 'name' ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 bg-slate-800 border border-sky-500 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditField(null); }}
                />
                <button onClick={saveEdit} className="text-emerald-400 hover:text-emerald-300"><Check size={16} /></button>
                <button onClick={() => setEditField(null)} className="text-slate-500 hover:text-slate-400"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group">
                <span className="text-sm text-slate-200">{station.name}</span>
                <button onClick={() => startEdit('name', station.name)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-sky-400 transition-opacity">
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Notes inline edit */}
          <div>
            <p className="text-xs text-slate-400 mb-1">הערות</p>
            {editField === 'notes' ? (
              <div className="flex items-start gap-1">
                <textarea
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 bg-slate-800 border border-sky-500 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none resize-none"
                  rows={2}
                />
                <div className="flex flex-col gap-1">
                  <button onClick={saveEdit} className="text-emerald-400 hover:text-emerald-300"><Check size={16} /></button>
                  <button onClick={() => setEditField(null)} className="text-slate-500 hover:text-slate-400"><X size={16} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-1 group">
                <span className="text-sm text-slate-400 flex-1">{station.notes || '—'}</span>
                <button onClick={() => startEdit('notes', station.notes)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-sky-400 transition-opacity mt-0.5">
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Analyzers Grid */}
      <h2 className="text-base font-semibold text-slate-200 mb-3">
        מנתחים ({stationAnalyzers.length})
      </h2>

      {stationAnalyzers.length === 0 ? (
        <Card className="p-12 text-center">
          <Cpu size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm mb-4">אין מנתחים בתחנה זו</p>
          <Button onClick={() => navigate(`/add-analyzer?stationId=${id}`)}>
            <Plus size={16} />הוסף מנתח ראשון
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stationAnalyzers.map((analyzer, i) => {
            const days = analyzer.next_maintenance_date ? daysUntil(analyzer.next_maintenance_date) : null;
            return (
              <motion.div
                key={analyzer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-4 hover:border-slate-700 transition-colors relative group">
                  <button
                    onClick={() => deleteAnalyzer(analyzer.id, analyzer.name)}
                    className="absolute top-2 left-2 p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>

                  <Link to={`/station/${id}/analyzer/${analyzer.id}`} className="block">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 bg-violet-500/20 rounded-lg flex items-center justify-center">
                        <Cpu size={18} className="text-violet-400" />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[analyzer.status] || 'text-slate-400 bg-slate-400/10 border-slate-600'}`}>
                        {STATUS_LABELS[analyzer.status] || analyzer.status}
                      </span>
                    </div>

                    <p className="font-medium text-slate-100 text-sm mb-1">{analyzer.name}</p>
                    <p className="text-xs text-slate-400 mb-1">{ANALYZER_TYPES[analyzer.type] || analyzer.type}</p>
                    {analyzer.model && <p className="text-xs text-slate-500">דגם: {analyzer.model}</p>}
                    {analyzer.serial_number && <p className="text-xs text-slate-500">ס/נ: {analyzer.serial_number}</p>}

                    {days !== null && (
                      <div className={`mt-2 text-xs px-2 py-1 rounded-lg ${
                        days < 0 ? 'bg-red-400/10 text-red-400' :
                        days < 7 ? 'bg-amber-400/10 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {days < 0 ? `${Math.abs(days)} ימים באיחור` :
                         days === 0 ? 'תחזוקה היום' :
                         `${days} ימים לתחזוקה`}
                      </div>
                    )}
                  </Link>

                  <div className="flex gap-1 mt-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => navigate(`/add-maintenance?analyzerId=${analyzer.id}&stationId=${id}`)}
                      className="flex-1 text-xs text-center py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                    >
                      תחזוקה
                    </button>
                    <button
                      onClick={() => navigate(`/add-chemical?analyzerId=${analyzer.id}&stationId=${id}`)}
                      className="flex-1 text-xs text-center py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                    >
                      כימיקל
                    </button>
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
