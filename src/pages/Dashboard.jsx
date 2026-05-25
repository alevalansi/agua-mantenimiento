import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  MapPin, Cpu, Wrench, AlertTriangle, Plus, GripVertical,
  ChevronLeft, Clock, CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { updateStation, getStationsOrder, setStationsOrder } from '../utils/storage';
import { formatDate, STATUS_LABELS, STATUS_COLORS, ANALYZER_TYPES } from '../utils/helpers';
import { PageWrapper, Card } from '../components/Layout';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentTechnician, stations, analyzers, maintenanceLogs, refreshStations } = useApp();

  const [stationList, setStationList] = useState([]);

  // Apply saved order from localStorage whenever stations change
  useEffect(() => {
    if (stations.length === 0) return;
    const savedOrder = getStationsOrder();
    if (savedOrder.length > 0) {
      const orderMap = {};
      savedOrder.forEach((id, i) => { orderMap[id] = i; });
      const sorted = [...stations].sort((a, b) => {
        const oa = orderMap[a.id] ?? 999;
        const ob = orderMap[b.id] ?? 999;
        return oa - ob;
      });
      setStationList(sorted);
    } else {
      setStationList(stations);
    }
  }, [stations]);

  const thisMonth = new Date();
  const monthLogs = maintenanceLogs.filter((l) => {
    const d = new Date(l.date);
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
  });

  const alerts = analyzers.filter((a) => a.status === 'faulty' || a.status === 'needs_maintenance');

  const recentLogs = [...maintenanceLogs]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const stats = [
    { label: 'תחנות', value: stations.length, icon: MapPin, color: 'text-sky-400', bg: 'bg-sky-400/10' },
    { label: 'מדים', value: analyzers.length, icon: Cpu, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'תחזוקות החודש', value: monthLogs.length, icon: Wrench, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'התראות פעילות', value: alerts.length, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(stationList);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setStationList(items);
    // Save order to localStorage (not Supabase - order is local preference)
    setStationsOrder(items.map((s) => s.id));
  };

  return (
    <PageWrapper>
      {/* Greeting */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">
          שלום, {currentTechnician?.name || 'טכנאי'} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="p-4">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                <s.icon size={18} className={s.color} />
              </div>
              <p className="text-2xl font-bold text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stations drag & drop */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-200">תחנות</h2>
            <button
              onClick={() => navigate('/add-station')}
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 text-sm"
            >
              <Plus size={16} />הוסף
            </button>
          </div>

          {stationList.length === 0 ? (
            <Card className="p-8 text-center">
              <MapPin size={36} className="mx-auto text-slate-600 mb-2" />
              <p className="text-slate-500 text-sm">אין תחנות עדיין</p>
              <button onClick={() => navigate('/add-station')} className="mt-3 text-sky-400 text-sm hover:underline">
                הוסף תחנה ראשונה
              </button>
            </Card>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="stations">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {stationList.map((station, index) => {
                      const stationAnalyzers = analyzers.filter((a) => a.station_id === station.id);
                      return (
                        <Draggable key={station.id} draggableId={station.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3 px-3 py-3 transition-colors ${
                                snapshot.isDragging ? 'border-sky-500/50 bg-slate-800' : ''
                              }`}
                            >
                              <div {...provided.dragHandleProps} className="text-slate-600 hover:text-slate-400 cursor-grab">
                                <GripVertical size={18} />
                              </div>
                              <Link
                                to={`/station/${station.id}`}
                                className="flex-1 min-w-0"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-slate-100 truncate">{station.name}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full border mr-2 flex-shrink-0 ${STATUS_COLORS[station.status] || 'text-slate-400 bg-slate-400/10 border-slate-600'}`}>
                                    {STATUS_LABELS[station.status] || station.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">{station.location} • {stationAnalyzers.length} מדים</p>
                              </Link>
                              <ChevronLeft size={16} className="text-slate-600 flex-shrink-0" />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Recent maintenance logs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-200">תחזוקות אחרונות</h2>
            <Link to="/logs/maintenance" className="text-sky-400 text-sm hover:text-sky-300">
              הכל
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <Card className="p-8 text-center">
              <Wrench size={36} className="mx-auto text-slate-600 mb-2" />
              <p className="text-slate-500 text-sm">אין רשומות תחזוקה</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => {
                const analyzer = analyzers.find((a) => a.id === log.analyzer_id);
                const station = stations.find((s) => s.id === log.station_id);
                return (
                  <Card key={log.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate">
                          {analyzer?.name || 'מד לא ידוע'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{station?.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{log.maintenance_type} • {log.technician_name}</p>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={11} />
                          {formatDate(log.date)}
                        </div>
                        {log.status === 'completed' && (
                          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1 justify-end">
                            <CheckCircle size={11} />הושלם
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
