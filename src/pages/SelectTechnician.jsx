import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, User, Plus, Phone, Pencil, Trash2, Check, X, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addTechnician, updateTechnician, deleteTechnician, compressImageToBase64 } from '../utils/storage';

function TechAvatar({ tech, size = 'w-10 h-10' }) {
  if (tech.photo_url) {
    return (
      <img
        src={tech.photo_url}
        alt={tech.name}
        className={`${size} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${size} bg-sky-500/20 rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-sky-400 font-bold text-sm">{tech.name.charAt(0)}</span>
    </div>
  );
}

export default function SelectTechnician() {
  const navigate = useNavigate();
  const { technicians, loading, dbError, setCurrentTechnician, refreshTechnicians, logActivity } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', specialty: '' });
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', specialty: '', photo_url: '' });
  const editFileRef = useRef(null);

  const activeTechs = technicians.filter((t) => t.is_active !== false);

  const handleSelect = (tech) => {
    if (editingId === tech.id) return;
    setCurrentTechnician(tech);
    logActivity({
      technician_name: tech.name,
      action_type: 'login',
      description: `${tech.name} התחבר למערכת`,
    });
    navigate('/dashboard');
  };

  const startEdit = (tech, e) => {
    e.stopPropagation();
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

  const handleSaveEdit = async (techId) => {
    if (!editForm.name.trim()) return;
    setSaving(true);
    try {
      await updateTechnician(techId, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        specialty: editForm.specialty.trim(),
        photo_url: editForm.photo_url || null,
      });
      await refreshTechnicians();
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('שגיאה: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tech, e) => {
    e.stopPropagation();
    if (!confirm(`למחוק את "${tech.name}"?`)) return;
    try {
      await deleteTechnician(tech.id);
      await refreshTechnicians();
    } catch (err) {
      console.error(err);
      alert('שגיאה: ' + (err.message || err));
    }
  };

  const handleAddTech = async (e) => {
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
      setAddForm({ name: '', phone: '', specialty: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert('שגיאה: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">מתחבר לבסיס הנתונים...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-semibold text-red-400 mb-2">שגיאת חיבור למסד הנתונים</h2>
          <p className="text-slate-400 text-sm mb-3">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

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
                <div key={tech.id}>
                  {editingId === tech.id ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-slate-800 rounded-xl p-3 space-y-2 border border-sky-500/30"
                    >
                      {/* Photo + name row */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => editFileRef.current?.click()}
                          className="relative flex-shrink-0 group"
                        >
                          {editForm.photo_url ? (
                            <img src={editForm.photo_url} className="w-12 h-12 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                              <Camera size={18} className="text-slate-400" />
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                            <Camera size={9} className="text-white" />
                          </div>
                        </button>
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="שם *"
                          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="טלפון"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                      <input
                        value={editForm.specialty}
                        onChange={(e) => setEditForm((f) => ({ ...f, specialty: e.target.value }))}
                        placeholder="התמחות"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                      <input
                        ref={editFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleEditPhoto}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(tech.id)}
                          disabled={saving}
                          className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1"
                        >
                          <Check size={13} />{saving ? 'שומר...' : 'שמור'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg py-1.5 text-xs flex items-center justify-center gap-1"
                        >
                          <X size={13} />ביטול
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2 p-3 bg-slate-800 hover:bg-slate-750 rounded-xl"
                    >
                      <button
                        onClick={() => handleSelect(tech)}
                        className="flex items-center gap-3 flex-1 text-right min-w-0"
                      >
                        <TechAvatar tech={tech} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-100">{tech.name}</p>
                          {tech.specialty && <p className="text-xs text-slate-400 truncate">{tech.specialty}</p>}
                          {tech.phone && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone size={10} />{tech.phone}
                            </p>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => startEdit(tech, e)}
                          className="p-1.5 text-slate-500 hover:text-sky-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(tech, e)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showAddForm ? (
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
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <input
                placeholder="טלפון"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <input
                placeholder="התמחות"
                value={addForm.specialty}
                onChange={(e) => setAddForm({ ...addForm, specialty: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  {saving ? 'מוסיף...' : 'הוסף'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-2 text-sm transition-colors">
                  ביטול
                </button>
              </div>
            </motion.form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
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
