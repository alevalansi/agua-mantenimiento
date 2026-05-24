import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Phone, Star, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getList, setList, updateInList, removeFromList, KEYS } from '../utils/storage';
import { PageWrapper, PageHeader, Card, Button } from '../components/Layout';

export default function Technicians() {
  const { technicians, refresh, currentTechnician, logActivity } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', specialty: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const list = getList(KEYS.TECHNICIANS);
    list.push({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      specialty: form.specialty.trim(),
      is_active: true,
    });
    setList(KEYS.TECHNICIANS, list);
    refresh(KEYS.TECHNICIANS);
    logActivity({
      technician_name: currentTechnician?.name,
      action_type: 'add_technician',
      description: `הוספת טכנאי: ${form.name}`,
    });
    setForm({ name: '', phone: '', specialty: '' });
    setShowForm(false);
  };

  const toggleActive = (tech) => {
    updateInList(KEYS.TECHNICIANS, tech.id, { is_active: !tech.is_active });
    refresh(KEYS.TECHNICIANS);
  };

  const handleDelete = (id, name) => {
    if (!confirm(`למחוק את הטכנאי "${name}"?`)) return;
    removeFromList(KEYS.TECHNICIANS, id);
    refresh(KEYS.TECHNICIANS);
  };

  const active = technicians.filter((t) => t.is_active !== false);
  const inactive = technicians.filter((t) => t.is_active === false);

  return (
    <PageWrapper>
      <PageHeader
        title="טכנאים"
        subtitle={`${active.length} פעילים, ${inactive.length} לא פעילים`}
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} />{showForm ? 'ביטול' : 'הוסף טכנאי'}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <p className="text-sm font-medium text-slate-300">טכנאי חדש</p>
            <input required placeholder="שם *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="טלפון" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
              <input placeholder="התמחות" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
            </div>
            <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-lg py-2 text-sm font-medium">הוסף</button>
          </form>
        </Card>
      )}

      {technicians.length === 0 ? (
        <Card className="p-12 text-center">
          <Users size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">אין טכנאים עדיין</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {technicians.map((tech, i) => (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className={`p-4 ${tech.is_active === false ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tech.is_active !== false ? 'bg-sky-500/20' : 'bg-slate-800'}`}>
                    <span className={`font-bold text-sm ${tech.is_active !== false ? 'text-sky-400' : 'text-slate-500'}`}>
                      {tech.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100">{tech.name}</p>
                    {tech.specialty && <p className="text-xs text-slate-400">{tech.specialty}</p>}
                    {tech.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone size={10} />{tech.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      tech.is_active !== false
                        ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                        : 'text-slate-500 bg-slate-800 border-slate-700'
                    }`}>
                      {tech.is_active !== false ? 'פעיל' : 'לא פעיל'}
                    </span>
                    <button
                      onClick={() => toggleActive(tech)}
                      className={`text-xl ${tech.is_active !== false ? 'text-emerald-400' : 'text-slate-600'} hover:opacity-80 transition-opacity`}
                    >
                      {tech.is_active !== false ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                    <button onClick={() => handleDelete(tech.id, tech.name)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
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
