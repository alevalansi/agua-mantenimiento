import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, Menu, X, LayoutDashboard, MapPin, Wrench, FlaskConical,
  Package, Users, Activity, CalendarClock, LogOut, ChevronLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/helpers';

const navItems = [
  { path: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { path: '/upcoming', label: 'משימות קרובות', icon: CalendarClock },
  { path: '/logs/maintenance', label: 'יומן תחזוקה', icon: Wrench },
  { path: '/logs/chemical', label: 'יומן כימיקלים', icon: FlaskConical },
  { path: '/inventory', label: 'מלאי כימיקלים', icon: Package },
  { path: '/technicians', label: 'טכנאים', icon: Users },
  { path: '/activity', label: 'יומן פעילות', icon: Activity },
];

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentTechnician, setCurrentTechnician } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setCurrentTechnician(null);
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/dashboard" className="flex items-center gap-2 text-sky-400 font-bold">
            <Droplets size={24} className="text-sky-400" />
            <span className="text-sm font-semibold text-slate-100 hidden sm:block">
              תחזוקה תחנות רשות המים
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {currentTechnician && (
              <span className="text-xs text-slate-400 hidden sm:block">
                {currentTechnician.name}
              </span>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu from right */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-72 bg-slate-900 border-l border-slate-800 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Droplets size={20} className="text-sky-400" />
                  <span className="text-sky-400 font-semibold text-sm">רשות המים</span>
                </div>
                <button onClick={() => setMenuOpen(false)} className="p-1 hover:bg-slate-800 rounded">
                  <X size={20} />
                </button>
              </div>

              {currentTechnician && (
                <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800">
                  <p className="text-xs text-slate-400">מחובר כ:</p>
                  <p className="text-sm font-medium text-slate-100">{currentTechnician.name}</p>
                </div>
              )}

              <nav className="flex-1 overflow-y-auto py-2">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      location.pathname === path
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="border-t border-slate-800 p-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  יציאה
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Page content */}
      <main className="pb-20 sm:pb-4">
        {children}
      </main>

      {/* Bottom nav for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur border-t border-slate-800 sm:hidden">
        <div className="flex">
          {navItems.slice(0, 4).map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center py-2 gap-1 text-xs transition-colors ${
                location.pathname === path ? 'text-sky-400' : 'text-slate-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{label.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto px-4 py-6"
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({ title, subtitle, back, actions }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {back && (
          <button onClick={() => navigate(back)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
            <ChevronLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-100">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] || 'text-slate-400 bg-slate-400/10 border-slate-400/30'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm text-slate-400 mb-1">{label}</label>}
      <input
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30"
        {...props}
      />
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm text-slate-400 mb-1">{label}</label>}
      <select
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm text-slate-400 mb-1">{label}</label>}
      <textarea
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 resize-none"
        rows={3}
        {...props}
      />
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50';
  const variants = {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    ghost: 'hover:bg-slate-800 text-slate-400',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
