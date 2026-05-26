import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Phone, ToggleLeft, ToggleRight, Trash2, Pencil, Check, X, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addTechnician, updateTechnician, deleteTechnician, compressImageToBase64 } from '../utils/storage';
import { PageWrapper, PageHeader, Card, Button } from '../components/Layout';

function TechAvatar({ tech }) {
  if (tech.photo_url) {
    return (
      <img
        src={tech.photo_url}
        alt={tech.name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tech.is_active !== false ? 'bg-sky-500/20' : 'bg-slate-800'}`}>
      <span className={`font-bold text-sm ${tech.is_active !== false ? 'text-sky-400' : 'text-slate-500'}`}>
        {tech.name.charAt(0)}
      </span>
    </div>
  );
}

export default function Technicians() {
  const { technicians, refreshTechnicians, currentTechnician, logActivity } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', specialty: '' });
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', specialty: '', photo_url: '' });
  const editFileRef = useRef(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setSaving(true);
    try {
      await addTechnician({
        name: addForm.name.trim(),
        phone: addForm.phone.trim(),
        specialty: addForm.specialty.trim(),
        is_active: true,
      });
      await refreshTechnicians();
      await logActivity({
        technician_name: currentTechnician?.name,
        action_type: 'add_technician',
        description: `הוספת טכנאי: ${addForm.name}`,
      });
      setAddForm({ name: '', phone: '', specialty: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert('שגיאה: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (tech) => {
    setEditingId(tech.id);
    setEditForm({
      name: tech.name,
      phone: tech.phone || '',
      specialty: tech.specialty || '',
      photo_url: tech.photo_url || '',
    });
  };

  const handleEditPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImageToBase64(file);
      setEditForm((f) => ({ ...f, photo_url: compressed }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (tech) => {
    if (!editForm.name.trim()) return;
    setSaving(true);
    try {
      await updateTechnician(tech.id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        specialty: editForm.specialty.trim(),
        photo_url: editForm.photo_url || null,
      });
      await refreshTechnicians();
      await logActivity({
        technician_name: currentTechnician?.name,
        action_type: 'edit_technician',
        description: `עריכת טכנאי: ${editForm.name}`,
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('שגיאה: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (tech) => {
    try {
      await updateTechnician(tech.id, { is_active: !tech.is_active });
      await refreshTechnicians();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`למחוק את הטכנאי "${name}"?`)) return;
    try {
      await deleteTechnician(id);
      await refreshTechnicians();
    } catch (err) {
      console.error(err);
      alert('שגיאה במחיקה: ' + (err.message || err));
    }
  };

  const active = technicians.filter((t) => t.is_active !== false);
  const inactive = technicians.filter((t) => t.is_active === false);

  return (
    <PageWrapper>
      <PageHeader
        title="טכנאים"
        subtitle={`${active.length} פעילים, ${inactive.length} לא פעילים`}
        actions={
          <Button onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); }}>
            <Plus size={16} />{showAddForm ? 'ביטול' : 'הוסף טכנאי'}
          </Button>
        }
      />

      {showAddForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <p className="text-sm font-medium text-slate-300">טכנאי חדש</p>
            <input required placeholder="שם *" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="טלפון" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
              <input placeholder="התמחות" value={addForm.specialty} onChange={(e) => setAddForm({ ...addForm, specialty: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
            </div>
            <button type="submit" disabled={saving} className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium">
              {saving ? 'מוסיף...' : 'הוסף'}
            </button>
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
              {editingId === tech.id ? (
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => editFileRef.current?.click()}
                        className="relative flex-shrink-0"
                      >
                        {editForm.photo_url ? (
                          <img src={editForm.photo_url} className="w-14 h-14 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center">
                            <Camera size={20} className="text-slate-400" />
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                          <Camera size={11} className="text-white" />
                        </div>
                      </button>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="שם *"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="טלפון"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                      <input
                        value={editForm.specialty}
                        onChange={(e) => setEditForm((f) => ({ ...f, specialty: e.target.value }))}
                        placeholder="התמחות"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <input
                      ref={editFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditPhoto}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(tech)}
                        disabled={saving}
                        className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <Check size={15} />{saving ? 'שומר...' : 'שמור'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-2 text-sm flex items-center justify-center gap-1"
                      >
                        <X size={15} />ביטול
                      </button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className={`p-4 ${tech.is_active === false ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <TechAvatar tech={tech} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100">{tech.name}</p>
                      {tech.specialty && <p className="text-xs text-slate-400">{tech.specialty}</p>}
                      {tech.phone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone size={10} />{tech.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        tech.is_active !== false
                          ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                          : 'text-slate-500 bg-slate-800 border-slate-700'
                      }`}>
                        {tech.is_active !== false ? 'פעיל' : 'לא פעיל'}
                      </span>
                      <button onClick={() => startEdit(tech)} className="p-1.5 text-slate-500 hover:text-sky-400 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => toggleActive(tech)} className={`text-xl ${tech.is_active !== false ? 'text-emerald-400' : 'text-slate-600'} hover:opacity-80`}>
                        {tech.is_active !== false ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                      <button onClick={() => handleDelete(tech.id, tech.name)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
