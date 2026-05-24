import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, AlertTriangle, Edit2, Trash2, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getList, setList, updateInList, removeFromList, KEYS } from '../utils/storage';
import { UNITS } from '../utils/helpers';
import { PageWrapper, PageHeader, Card, Button } from '../components/Layout';

export default function ChemicalInventoryPage() {
  const { chemicalInventory, refresh, currentTechnician, logActivity } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [form, setForm] = useState({ chemical_name: '', unit: 'מ"ל', current_stock: '', minimum_threshold: '', notes: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.chemical_name.trim()) return;
    const list = getList(KEYS.CHEMICAL_INVENTORY);
    list.push({
      id: crypto.randomUUID(),
      chemical_name: form.chemical_name.trim(),
      unit: form.unit,
      current_stock: parseFloat(form.current_stock) || 0,
      minimum_threshold: parseFloat(form.minimum_threshold) || 0,
      notes: form.notes.trim(),
    });
    setList(KEYS.CHEMICAL_INVENTORY, list);
    refresh(KEYS.CHEMICAL_INVENTORY);
    logActivity({
      technician_name: currentTechnician?.name,
      action_type: 'add_inventory',
      description: `הוספת כימיקל למלאי: ${form.chemical_name}`,
    });
    setForm({ chemical_name: '', unit: 'מ"ל', current_stock: '', minimum_threshold: '', notes: '' });
    setShowForm(false);
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setEditValues({ ...item });
  };

  const saveEdit = () => {
    updateInList(KEYS.CHEMICAL_INVENTORY, editId, {
      chemical_name: editValues.chemical_name,
      unit: editValues.unit,
      current_stock: parseFloat(editValues.current_stock) || 0,
      minimum_threshold: parseFloat(editValues.minimum_threshold) || 0,
      notes: editValues.notes || '',
    });
    refresh(KEYS.CHEMICAL_INVENTORY);
    setEditId(null);
  };

  const handleDelete = (id, name) => {
    if (!confirm(`למחוק את "${name}"?`)) return;
    removeFromList(KEYS.CHEMICAL_INVENTORY, id);
    refresh(KEYS.CHEMICAL_INVENTORY);
  };

  const lowStock = chemicalInventory.filter((i) => i.current_stock <= i.minimum_threshold && i.minimum_threshold > 0);

  return (
    <PageWrapper>
      <PageHeader
        title="מלאי כימיקלים"
        subtitle={`${chemicalInventory.length} פריטים`}
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} />{showForm ? 'ביטול' : 'הוסף'}
          </Button>
        }
      />

      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-4 p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">{lowStock.length} פריטים במלאי נמוך</p>
            <p className="text-xs text-amber-400/70 mt-0.5">{lowStock.map((i) => i.chemical_name).join(', ')}</p>
          </div>
        </motion.div>
      )}

      {showForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <p className="text-sm font-medium text-slate-300">הוסף כימיקל חדש</p>
            <input required placeholder="שם הכימיקל *" value={form.chemical_name}
              onChange={(e) => setForm({ ...form, chemical_name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
            <div className="grid grid-cols-3 gap-2">
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-100 focus:outline-none">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <input type="number" min="0" step="0.01" placeholder="מלאי נוכחי" value={form.current_stock}
                onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none" />
              <input type="number" min="0" step="0.01" placeholder="סף מינ'" value={form.minimum_threshold}
                onChange={(e) => setForm({ ...form, minimum_threshold: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none" />
            </div>
            <input placeholder="הערות" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none" />
            <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-lg py-2 text-sm font-medium">הוסף</button>
          </form>
        </Card>
      )}

      {chemicalInventory.length === 0 ? (
        <Card className="p-12 text-center">
          <Package size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">אין פריטים במלאי</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {chemicalInventory.map((item) => {
            const isLow = item.minimum_threshold > 0 && item.current_stock <= item.minimum_threshold;
            const isEditing = editId === item.id;

            return (
              <Card key={item.id} className={`p-4 ${isLow ? 'border-amber-500/30' : ''}`}>
                {isEditing ? (
                  <div className="space-y-2">
                    <input value={editValues.chemical_name || ''}
                      onChange={(e) => setEditValues({ ...editValues, chemical_name: e.target.value })}
                      className="w-full bg-slate-800 border border-sky-500 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none" />
                    <div className="grid grid-cols-3 gap-2">
                      <select value={editValues.unit} onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-100">
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <input type="number" min="0" step="0.01" placeholder="מלאי" value={editValues.current_stock || ''}
                        onChange={(e) => setEditValues({ ...editValues, current_stock: e.target.value })}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100" />
                      <input type="number" min="0" step="0.01" placeholder="מינ'" value={editValues.minimum_threshold || ''}
                        onChange={(e) => setEditValues({ ...editValues, minimum_threshold: e.target.value })}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex-1 bg-emerald-500/20 text-emerald-400 rounded-lg py-1.5 text-sm flex items-center justify-center gap-1">
                        <Check size={14} />שמור
                      </button>
                      <button onClick={() => setEditId(null)} className="flex-1 bg-slate-800 text-slate-400 rounded-lg py-1.5 text-sm flex items-center justify-center gap-1">
                        <X size={14} />ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-100 text-sm">{item.chemical_name}</p>
                        {isLow && <AlertTriangle size={13} className="text-amber-400" />}
                      </div>
                      {item.notes && <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>}
                      {item.minimum_threshold > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5">סף מינ': {item.minimum_threshold} {item.unit}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <p className={`text-lg font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {item.current_stock}
                        </p>
                        <p className="text-xs text-slate-500">{item.unit}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(item)} className="p-1.5 text-slate-500 hover:text-sky-400 rounded"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(item.id, item.chemical_name)} className="p-1.5 text-slate-500 hover:text-red-400 rounded"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
