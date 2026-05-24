import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClock, AlertTriangle, Clock, CheckCircle, ChevronLeft, Wrench, FlaskConical } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { daysUntil, daysSince, addDays, formatDate, ANALYZER_TYPES } from '../utils/helpers';
import { PageWrapper, PageHeader, Card } from '../components/Layout';

export default function UpcomingTasks() {
  const { analyzers, stations, chemicalConsumptions, maintenanceLogs } = useApp();

  const tasks = useMemo(() => {
    const result = [];

    analyzers.forEach((analyzer) => {
      const station = stations.find((s) => s.id === analyzer.station_id);

      // Maintenance task
      if (analyzer.maintenance_interval_days) {
        let nextDate = analyzer.next_maintenance_date;
        if (!nextDate && analyzer.last_maintenance_date) {
          nextDate = addDays(analyzer.last_maintenance_date, analyzer.maintenance_interval_days);
        }
        if (nextDate) {
          const days = daysUntil(nextDate);
          result.push({
            id: `maint-${analyzer.id}`,
            type: 'maintenance',
            analyzer,
            station,
            days,
            date: nextDate,
            label: 'תחזוקה',
          });
        } else if (analyzer.last_maintenance_date === null) {
          // Never maintained
          result.push({
            id: `maint-never-${analyzer.id}`,
            type: 'maintenance',
            analyzer,
            station,
            days: -999,
            date: null,
            label: 'תחזוקה - מעולם לא בוצעה',
          });
        }
      }

      // Chemical renewal task
      if (analyzer.chemical_renewal_interval_days) {
        const lastChem = chemicalConsumptions
          .filter((c) => c.analyzer_id === analyzer.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (lastChem) {
          const nextDate = addDays(lastChem.date, lastChem.renewal_interval_days || analyzer.chemical_renewal_interval_days);
          const days = daysUntil(nextDate);
          result.push({
            id: `chem-${analyzer.id}`,
            type: 'chemical',
            analyzer,
            station,
            days,
            date: nextDate,
            label: `חידוש כימיקל: ${lastChem.chemical_name}`,
          });
        }
      }
    });

    // Sort: overdue first (most overdue first), then upcoming (soonest first)
    return result.sort((a, b) => {
      if (a.days < 0 && b.days >= 0) return -1;
      if (a.days >= 0 && b.days < 0) return 1;
      if (a.days < 0 && b.days < 0) return a.days - b.days; // most overdue first
      return a.days - b.days; // soonest upcoming first
    });
  }, [analyzers, stations, chemicalConsumptions]);

  const overdue = tasks.filter((t) => t.days < 0);
  const upcoming7 = tasks.filter((t) => t.days >= 0 && t.days <= 7);
  const upcoming30 = tasks.filter((t) => t.days > 7 && t.days <= 30);
  const future = tasks.filter((t) => t.days > 30);

  const TaskCard = ({ task }) => {
    const isOverdue = task.days < 0;
    const isUrgent = task.days >= 0 && task.days <= 7;
    const isNever = task.days === -999;

    return (
      <Link to={`/station/${task.station?.id}/analyzer/${task.analyzer.id}`}>
        <Card className={`p-4 hover:border-slate-700 transition-colors ${
          isOverdue ? 'border-red-500/30' : isUrgent ? 'border-amber-500/30' : ''
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isOverdue ? 'bg-red-400/10' : isUrgent ? 'bg-amber-400/10' : 'bg-slate-800'
              }`}>
                {task.type === 'maintenance'
                  ? <Wrench size={16} className={isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-400'} />
                  : <FlaskConical size={16} className={isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-400'} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{task.analyzer.name}</p>
                <p className="text-xs text-slate-400">{task.station?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{ANALYZER_TYPES[task.analyzer.type] || task.analyzer.type}</p>
                <p className="text-xs text-slate-400 mt-1">{task.label}</p>
              </div>
            </div>
            <div className="text-left flex-shrink-0">
              <div className={`text-sm font-bold ${
                isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {isNever ? 'מעולם' :
                 task.days < 0 ? `${Math.abs(task.days)}י' איחור` :
                 task.days === 0 ? 'היום' :
                 `${task.days} ימים`}
              </div>
              {task.date && !isNever && (
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(task.date)}</p>
              )}
              <ChevronLeft size={14} className="text-slate-600 mt-1 mr-auto" />
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  const Section = ({ title, tasks: sectionTasks, icon: Icon, color }) => {
    if (sectionTasks.length === 0) return null;
    return (
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 ${color}`}>
          <Icon size={18} />
          <h2 className="text-sm font-semibold">{title} ({sectionTasks.length})</h2>
        </div>
        <div className="space-y-2">
          {sectionTasks.map((task, i) => (
            <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <TaskCard task={task} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <PageWrapper>
      <PageHeader
        title="משימות קרובות"
        subtitle={`${tasks.length} משימות פעילות`}
      />

      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarClock size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">אין משימות מתוזמנות</p>
          <p className="text-slate-600 text-xs mt-1">הגדר מרווחי תחזוקה במנתחים</p>
        </Card>
      ) : (
        <>
          <Section title="באיחור" tasks={overdue} icon={AlertTriangle} color="text-red-400" />
          <Section title="השבוע הקרוב" tasks={upcoming7} icon={Clock} color="text-amber-400" />
          <Section title="30 הימים הקרובים" tasks={upcoming30} icon={CalendarClock} color="text-sky-400" />
          <Section title="עתידי" tasks={future} icon={CheckCircle} color="text-slate-400" />
        </>
      )}
    </PageWrapper>
  );
}
