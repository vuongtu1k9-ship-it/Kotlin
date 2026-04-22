import React, { useState } from 'react';
import { MultiLocaleInput } from './admin/MultiLocaleInput';

interface ShopItem {
  id: string;
  name: Record<string, string> | string;
  price: number;
  icon: string;
  desc?: Record<string, string> | string;
  updatedAt?: number;
}

interface AdminShopManagerProps {
  gifts: ShopItem[];
  onUpsert: (gift: ShopItem) => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
}

export const AdminShopManager: React.FC<AdminShopManagerProps> = ({ gifts, onUpsert, onDelete }) => {
  const [isEditing, setIsEditing] = useState<ShopItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<ShopItem>({
    id: '',
    name: { en: '', vi: '' },
    price: 10,
    icon: '🎁',
    desc: { en: '', vi: '' }
  });

  const handleEdit = (item: ShopItem) => {
    setIsEditing(item);
    setForm({
      ...item,
      name: typeof item.name === 'string' ? { en: item.name, vi: item.name } : item.name,
      desc: typeof item.desc === 'string' ? { en: item.desc, vi: item.desc } : (item.desc || { en: '', vi: '' })
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpsert(form);
    setShowForm(false);
    setIsEditing(null);
    setForm({ id: '', name: { en: '', vi: '' }, price: 10, icon: '🎁', desc: { en: '', vi: '' } });
  };

  const getNameDisplay = (item: ShopItem) => {
    if (typeof item.name === 'string') return item.name;
    return item.name?.en || item.name?.vi || 'Unnamed';
  };

  const getDescDisplay = (item: ShopItem) => {
    if (typeof item.desc === 'string') return item.desc;
    return item.desc?.en || item.desc?.vi || 'No description.';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-100 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Shop Management</h2>
          <p className="text-slate-600 dark:text-white/40 text-xs mt-1">Manage localized gift items</p>
        </div>
        <button
          onClick={() => { 
            setShowForm(true); 
            setIsEditing(null); 
            setForm({ id: '', name: { en: '', vi: '' }, price: 10, icon: '🎁', desc: { en: '', vi: '' } }); 
          }}
          className="px-4 py-2 bg-xq-gold text-black font-bold rounded-xl text-sm transition-transform active:scale-95 shadow-lg shadow-xq-gold/20"
        >
          ➕ Add Item
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-2xl border border-black/10 dark:border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-white/40 uppercase tracking-widest px-1">ID (Unique)</label>
                <input
                  type="text"
                  required
                  disabled={!!isEditing}
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  placeholder="e.g. diamond_ring"
                  className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-white/40 uppercase tracking-widest px-1">Price (Gold)</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-white/40 uppercase tracking-widest px-1">Icon (Emoji)</label>
                  <input
                    type="text"
                    required
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            <MultiLocaleInput
              label="Item Name"
              value={form.name}
              onChange={(val) => setForm({ ...form, name: val })}
              placeholder="e.g. Diamond Ring"
            />

            <MultiLocaleInput
              label="Description"
              type="textarea"
              value={form.desc}
              onChange={(val) => setForm({ ...form, desc: val })}
              placeholder="Symbol of eternity..."
            />

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20">
                {isEditing ? 'Save Changes' : 'Confirm Add'}
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setIsEditing(null); }}
                className="flex-1 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gifts.map((item) => (
          <div key={item.id} className="bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center group relative transition-all hover:bg-white/[0.08]">
            <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">{item.icon}</div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight text-center">{getNameDisplay(item)}</h3>
            <div className="text-amber-400 font-bold flex items-center gap-1.5 mt-1 mb-3">
              <span>🪙</span> {item.price} Gold
            </div>
            <p className="text-[10px] text-slate-400 dark:text-white/30 text-center line-clamp-2 px-4 mb-6 italic h-8">
              {getDescDisplay(item)}
            </p>
            
            <div className="flex gap-2 w-full mt-auto">
              <button
                onClick={() => handleEdit(item)}
                className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-black/20 dark:bg-white/20 text-slate-900 dark:text-white text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(item.id, getNameDisplay(item))}
                className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                Delete
              </button>
            </div>
            <div className="absolute top-4 left-4 text-[8px] font-mono text-slate-400 dark:text-white/20 uppercase">
              ID: {item.id}
            </div>
          </div>
        ))}

        {gifts.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 dark:text-white/20 italic bg-slate-100 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
            No items found. Add your first gift to get started!
          </div>
        )}
      </div>
    </div>
  );
};
