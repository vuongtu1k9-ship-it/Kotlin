import React from 'react';
import { Save, Trash2 } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';

interface PracticeBoard {
  id: string;
  title: string;
  description: string;
  fen: string;
  moves: string;
}

interface Lesson {
  id: string;
  category: string;
  title: string;
  difficulty: string;
  reward: number;
  description: string;
  content?: string;
  boards?: PracticeBoard[];
  order?: number;
}

interface LessonFormProps {
  editForm: Partial<Lesson>;
  setEditForm: (f: Partial<Lesson>) => void;
  editingId: string | null;
  categories: { name: string }[];
  onCancel: () => void;
  onSave: () => void;
  openVisualEditor: (target: { type: 'primary' | 'board-item', index?: number }) => void;
}

export const LessonForm: React.FC<LessonFormProps> = ({
  editForm, setEditForm, editingId, categories, onCancel, onSave, openVisualEditor
}) => {
  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">ID</label>
          <input
            type="text"
            value={editForm.id || ''}
            onChange={e => setEditForm({ ...editForm, id: e.target.value })}
            placeholder="e.g. basic-1"
            className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={!!editingId}
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">Tiêu đề</label>
          <input
            type="text"
            value={editForm.title || ''}
            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">Danh mục</label>
          <select
            value={editForm.category || ''}
            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
            className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="" disabled>Chọn danh mục...</option>
            {categories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
            {editForm.category && !categories.find(c => c.name === editForm.category) && (
              <option value={editForm.category}>{editForm.category} (Cũ)</option>
            )}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">Độ khó</label>
            <select
              value={editForm.difficulty || 'Dễ'}
              onChange={e => setEditForm({ ...editForm, difficulty: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Dễ">Dễ</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Khó">Khó</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">Vàng (🪙)</label>
            <input
              type="number"
              value={editForm.reward || 20}
              onChange={e => setEditForm({ ...editForm, reward: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">Sắp xếp</label>
            <input
              type="number"
              value={editForm.order ?? ''}
              onChange={e => setEditForm({ ...editForm, order: e.target.value === '' ? undefined : parseInt(e.target.value) })}
              placeholder="VD: 1, 2..."
              className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
        <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest">Bàn cờ mặc định (Main Board)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">FEN Thế cờ</label>
            <input
              type="text"
              value={editForm.boards?.[0]?.fen || ''}
              placeholder="rnbakabnr/..."
              onChange={e => {
                const boards = [...(editForm.boards || [])];
                if (boards.length === 0) boards.push({ id: 'primary', title: 'Bắt đầu', description: '', fen: e.target.value, moves: '' });
                else boards[0] = { ...boards[0], fen: e.target.value };
                setEditForm({ ...editForm, boards });
              }}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Nước đi mẫu/giải (UCI)</label>
            <input
              type="text"
              value={editForm.boards?.[0]?.moves || ''}
              placeholder="e.g. h2e2..."
              onChange={e => {
                const boards = [...(editForm.boards || [])];
                if (boards.length === 0) boards.push({ id: 'primary', title: 'Bắt đầu', description: '', fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w', moves: e.target.value });
                else boards[0] = { ...boards[0], moves: e.target.value };
                setEditForm({ ...editForm, boards });
              }}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
            />
          </div>
        </div>
        <button 
          onClick={() => openVisualEditor({ type: 'primary' })}
          className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase border border-blue-500/20 transition-all flex items-center justify-center gap-2"
        >
           🧩 Mở bộ soạn thảo bàn cờ trực quan
        </button>
      </div>

      <div className="space-y-4">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">Mô tả ngắn</label>
        <textarea
          value={editForm.description || ''}
          onChange={e => setEditForm({ ...editForm, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />
      </div>
      
      <div className="space-y-4">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1 text-xq-gold">Nội dung chi tiết (Rich Text)</label>
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <Editor
            tinymceScriptSrc="/libs/tinymce/tinymce.min.js"
            apiKey="no-api-key"
            licenseKey="gpl"
            value={editForm.content || ''}
            onEditorChange={(content: string) => setEditForm({ ...editForm, content })}
            init={{
              height: 400,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | border | bullist numlist outdent indent | ' +
                'table image media insertboard | removeformat | help',
              content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px; background-color: #0c111d; color: #fff; }',
              skin: 'oxide-dark',
              content_css: 'dark',
              branding: false,
              promotion: false,
              setup: (editor) => {
                editor.ui.registry.addButton('insertboard', {
                  icon: 'table',
                  tooltip: 'Thiết kế bàn cờ trực quan',
                  onAction: () => {
                    const selection = editor.selection.getContent({ format: 'text' });
                    let initialData = { fen: '', moves: '' };
                    const fenMatch = selection.match(/fen=["']([^"']+)["']/i);
                    const movesMatch = selection.match(/moves=["']([^"']*)["']/i);
                    if (fenMatch) {
                      initialData.fen = fenMatch[1];
                      initialData.moves = movesMatch ? movesMatch[1] : '';
                    }

                    if ((window as any).openVisualBoardEditor) {
                      (window as any).openVisualBoardEditor((data: { fen: string, moves: string }) => {
                        const boardTag = `[board fen="${data.fen}" moves="${data.moves}" title="Thế cờ mới" size="md"]`;
                        editor.selection.setContent(boardTag);
                        editor.undoManager.add();
                      }, initialData.fen ? initialData : undefined);
                    }
                  }
                });
              }
            }}
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Các bàn cờ học tập hỗ trợ</label>
          <button
            onClick={() => {
              const newBoard: PracticeBoard = {
                id: `board-${Date.now()}`,
                title: '',
                description: '',
                fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
                moves: ''
              };
              setEditForm({ ...editForm, boards: [...(editForm.boards || []), newBoard] });
            }}
            className="px-3 py-1 bg-xq-gold/10 text-xq-gold rounded-lg text-[10px] font-black uppercase transition-all hover:bg-xq-gold/20"
          >
            + Thêm bàn mới
          </button>
        </div>

        <div className="space-y-4">
          {(editForm.boards || []).map((b, idx) => (
            <div key={b.id} className="p-4 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-800 space-y-3 relative group">
              <button
                onClick={() => {
                  const nextBoards = [...(editForm.boards || [])];
                  nextBoards.splice(idx, 1);
                  setEditForm({ ...editForm, boards: nextBoards });
                }}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Tên bàn cờ</label>
                  <input
                    type="text"
                    value={b.title}
                    onChange={e => {
                      const next = [...(editForm.boards || [])];
                      next[idx] = { ...b, title: e.target.value };
                      setEditForm({ ...editForm, boards: next });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">FEN</label>
                  <input
                    type="text"
                    value={b.fen}
                    onChange={e => {
                      const next = [...(editForm.boards || [])];
                      next[idx] = { ...b, fen: e.target.value };
                      setEditForm({ ...editForm, boards: next });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>
              <button 
                onClick={() => openVisualEditor({ type: 'board-item', index: idx })}
                className="w-full py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 rounded-lg text-[8px] font-black uppercase border border-black/5 dark:border-white/5 transition-all flex items-center justify-center gap-2"
              >
                🧩 Chỉnh sửa bàn này trực quan
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onCancel} className="px-6 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors text-sm font-bold">Hủy</button>
        <button
          onClick={onSave}
          className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-xl shadow-blue-500/10 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> {editingId ? 'Lưu bài học' : 'Tạo bài học'}
        </button>
      </div>
    </div>
  );
};
