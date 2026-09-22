'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Save, X, Pencil } from 'lucide-react';

export function WeightEditor({
  meals,
  onUpdate,
}: {
  meals: any[];
  onUpdate: (id: string, newWeight: number) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState('');

  function startEdit(id: string, currentWeight: number) {
    setEditing(id);
    setValue(String(currentWeight));
  }

  function save(id: string) {
    const num = parseFloat(value);
    if (!num || num <= 0) return;
    onUpdate(id, num);
    setEditing(null);
  }

  return null; // Компонент не рендерить самостійно — тільки надає функціонал
}

export function WeightBadge({
  item,
  onUpdate,
}: {
  item: any;
  onUpdate: (newWeight: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(item.calories));

  function save() {
    const num = parseFloat(value);
    if (!num || num <= 0) return;
    onUpdate(num);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))}
          className="w-16 rounded-lg px-2 py-1 text-sm text-center"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <button onClick={save} className="p-1 text-emerald-400">
          <Save className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setEditing(false)} className="p-1 opacity-50">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-right group"
      title="Редагувати калорії"
    >
      <div className="flex items-center gap-1 justify-end">
        <p className="font-bold">{item.calories}</p>
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition" />
      </div>
      <p className="text-xs opacity-50">ккал</p>
    </button>
  );
}