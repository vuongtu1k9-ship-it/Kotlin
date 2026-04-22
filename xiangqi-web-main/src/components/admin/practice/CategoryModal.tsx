import React from 'react';
import { Trash2 } from 'lucide-react';

interface Category {
  name: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  onSave: () => void;
  onDelete: (name: string) => void;
  saving: boolean;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ 
  isOpen, onClose, categories, newCategoryName, setNewCategoryName, onSave, onDelete, saving 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-white/5">
          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Quản lý danh mục</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">✕</button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tên danh mục mới..."
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSave()}
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={onSave}
              disabled={saving || !newCategoryName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50 transition-all hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            >
              Thêm
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {categories.length === 0 ? (
              <p className="text-center py-4 text-slate-500 text-sm">Chưa có danh mục nào.</p>
            ) : (
              categories.map(c => (
                <div key={c.name} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 group">
                  <span className="font-bold text-slate-700 dark:text-white/80">{c.name}</span>
                  <button
                    onClick={() => onDelete(c.name)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
