import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, User, Plus, Phone, Star, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getList, setList, KEYS } from '../utils/storage';

export default function SelectTechnician() {
  const navigate = useNavigate();
  const { technicians, setCurrentTechnician, refresh, logActivity } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', specialty: '' });

  const activeTechs = technicians.filter((t) => t.is_active !== false);

  const handleSelect = (tech) => {
    setCurrentTechnician(tech);
    logActivity({
      technician_name: tech.name,
      action_type: 'login',
      description: `${tech.name} התחבר למערכת`,
    });
    navigate('/dashboard');
  };

  const handleAddTech = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const list = getList(KEYS.TECHNICIANS);
    const newTech = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      specialty: form.specialty.trim(),
      is_active: true,
    };
    list.push(newTech);
    setList(KEYS.TECHNICIANS, list);
    refresh(KEYS.TECHNICIANS);
    setForm({ name: '', phone: '', specialty: '' });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-sky-500/20 rounded-2xl mb-4"
          >
            <Droplets size={32} className="text-sky-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-100">רשות המים</h1>
          <p className="text-slate-400 text-sm mt-1">מערכת ניהול תחזוקת תחנות</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">בחר טכנאי</h2>

          {activeTechs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <User size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">אין טכנאים פעילים עדיין</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {activeTechs.map((tech, i) => (
                <motion.button
                  key={tech.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSelect(tech)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-right"
                >
                  <div className="w-10 h-10 bg-sky-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sky-400 font-bold text-sm">{tech.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100">{tech.name}</p>
                    {tech.specialty && <p className="text-xs text-slate-400 truncate">{tech.specialty}</p>}
                    {tech.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone size={10} />{tech.phone}
                      </p>
                    )}
                  </div>
                  <ChevronLeft size={16} className="text-slate-500" />
                </motion.button>
              ))}
            </div>
          )}

          {showForm ? (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleAddTech}
              className="border-t border-slate-800 pt-4 space-y-3"
            >
              <p className="text-sm font-medium text-slate-300">הוסף טכנאי חדש</p>
              <input
                required
                placeholder="שם *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <input
                placeholder="טלפון"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <input
                placeholder="התמחות"
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  הוסף
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-2 text-sm transition-colors">
                  ביטול
                </button>
              </div>
            </motion.form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-sky-400 hover:border-sky-500/50 transition-colors text-sm"
            >
              <Plus size={16} />
              הוסף טכנאי חדש
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
