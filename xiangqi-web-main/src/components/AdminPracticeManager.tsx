import React, { useState, useEffect } from 'react';
import { useToast } from './ui/Toast';
import { Loader2, Plus, Edit2, Trash2, Save, BookOpen, BarChart3, GripVertical } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiGet, apiPost, apiDelete } from '../api';
import { Editor } from '@tinymce/tinymce-react';
import { VisualBoardEditor } from './VisualBoardEditor';
import { MultiLocaleInput } from './admin/MultiLocaleInput';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

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
  title: Record<string, string> | string;
  difficulty: Record<string, string> | string;
  reward: number;
  description: Record<string, string> | string;
  content?: Record<string, string> | string;
  boards?: PracticeBoard[];
  order?: number;
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

interface SortableLessonRowProps {
  lesson: Lesson;
  onEdit: (l: Lesson) => void;
  onDelete: (id: string) => void;
}

const SortableLessonRow: React.FC<SortableLessonRowProps> = ({ lesson, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  const getTitleDisplay = () => {
    if (typeof lesson.title === 'string') return lesson.title;
    return lesson.title?.en || lesson.title?.vi || 'Untitled Lesson';
  };

  const getDifficultyDisplay = () => {
    if (typeof lesson.difficulty === 'string') return lesson.difficulty;
    return lesson.difficulty?.en || lesson.difficulty?.vi || 'Unknown';
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group ${isDragging ? 'bg-blue-500/10 opacity-50 border-y-2 border-blue-500' : ''}`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-blue-500 transition-colors"
            {...attributes} 
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div>
            <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{getTitleDisplay()}</div>
            <div className="text-[10px] text-slate-400 font-mono">{lesson.id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs font-bold text-slate-500">
        {lesson.category}
      </td>
      <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-white/80">
        {lesson.order ?? '-'}
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
          (getDifficultyDisplay() === 'Easy' || getDifficultyDisplay() === 'Dễ') ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
          (getDifficultyDisplay() === 'Medium' || getDifficultyDisplay() === 'Trung bình') ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
          'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          {getDifficultyDisplay()}
        </span>
      </td>
      <td className="px-6 py-4 text-center font-black text-amber-500 text-sm">
        🪙 {lesson.reward}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onEdit(lesson)}
            className="p-2 text-slate-400 hover:text-xq-gold hover:bg-xq-gold/10 rounded-xl transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(lesson.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const AdminPracticeManager: React.FC = () => {
  const { state: authState } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lesson>>({});
  const [isAdding, setIsAdding] = useState(false);
  const { success, error } = useToast();
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [visualEditorTarget, setVisualEditorTarget] = useState<{ type: 'primary' | 'tinymce' | 'board-item', index?: number } | null>(null);
  const [visualEditorCallback, setVisualEditorCallback] = useState<((data: any) => void) | null>(null);
  const [visualEditorInitialData, setVisualEditorInitialData] = useState<{ fen?: string, moves?: string } | null>(null);
  const [categories, setCategories] = useState<{name: string}[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  
  const [activeContentLang, setActiveContentLang] = useState('en');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);
      const newLessons = arrayMove(lessons, oldIndex, newIndex);
      const updatedWithOrder = newLessons.map((l, idx) => ({ ...l, order: idx + 1 }));
      setLessons(updatedWithOrder);
      try {
        const res = await apiPost('/admin/practice/reorder', {
          orders: updatedWithOrder.map(l => ({ id: l.id, order: l.order }))
        }, authState.token);
        if (res.ok) success('Order updated');
        else error('Failed to save order');
      } catch (e) {
        error('Server error');
      }
    }
  };

  useEffect(() => {
    (window as any).openVisualBoardEditor = (callback: (data: any) => void, initialData?: { fen: string, moves: string }) => {
      setVisualEditorTarget({ type: 'tinymce' });
      setVisualEditorCallback(() => callback);
      setVisualEditorInitialData(initialData || null);
      setShowVisualEditor(true);
    };
    return () => { delete (window as any).openVisualBoardEditor; };
  }, []);

  const handleVisualEditorSave = (data: { fen: string, moves: string }) => {
    if (!visualEditorTarget) return;
    if (visualEditorTarget.type === 'primary') {
      const boards = [...(editForm.boards || [])];
      if (boards.length === 0) boards.push({ id: 'primary', title: 'Start', description: '', fen: data.fen, moves: data.moves });
      else boards[0] = { ...boards[0], fen: data.fen, moves: data.moves };
      setEditForm(prev => ({ ...prev, boards }));
    } else if (visualEditorTarget.type === 'board-item' && visualEditorTarget.index !== undefined) {
      const boards = [...(editForm.boards || [])];
      boards[visualEditorTarget.index] = { ...boards[visualEditorTarget.index], fen: data.fen, moves: data.moves };
      setEditForm(prev => ({ ...prev, boards }));
    } else if (visualEditorTarget.type === 'tinymce' && visualEditorCallback) {
      visualEditorCallback(data);
    }
    setShowVisualEditor(false);
    setVisualEditorTarget(null);
    setVisualEditorCallback(null);
    setVisualEditorInitialData(null);
  };

  useEffect(() => {
    fetchData();
  }, [authState.token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lessonsData, statsData, categoriesData] = await Promise.all([
        apiGet('/admin/practice/lessons', authState.token),
        apiGet('/admin/practice/stats', authState.token),
        apiGet('/admin/practice/categories', authState.token)
      ]);
      if (lessonsData.ok) setLessons(lessonsData.lessons);
      if (statsData.ok) setStats(statsData.stats);
      if (categoriesData.ok) setCategories(categoriesData.categories);
    } catch (err) {
      error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setEditForm({
      ...lesson,
      title: typeof lesson.title === 'string' ? { en: lesson.title, vi: lesson.title } : lesson.title,
      description: typeof lesson.description === 'string' ? { en: lesson.description, vi: lesson.description } : lesson.description,
      content: typeof lesson.content === 'object' ? lesson.content : { en: (lesson.content as string) || '', vi: (lesson.content as string) || '' },
      difficulty: typeof lesson.difficulty === 'string' ? { en: lesson.difficulty, vi: lesson.difficulty } : lesson.difficulty,
    });
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!editForm.id || !editForm.title) {
      error('ID and Title are required');
      return;
    }
    try {
      const data = await apiPost('/admin/practice/lessons', editForm, authState.token);
      if (data.ok) {
        success(editingId ? 'Lesson updated' : 'Lesson created');
        fetchData();
        handleCancel();
      } else {
        error(data.error || 'Failed to save');
      }
    } catch (err) {
      error('Server connection error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete lesson "${id}"?`)) return;
    try {
      const data = await apiDelete(`/admin/practice/lessons/${id}`, authState.token);
      if (data.ok) {
        success('Lesson deleted');
        fetchData();
      } else {
        error(data.error || 'Failed to delete');
      }
    } catch (err) {
      error('Server connection error');
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const data = await apiPost('/admin/practice/categories', { name: newCategoryName.trim() }, authState.token);
      if (data.ok) {
        success('Đã thêm danh mục');
        setNewCategoryName('');
        fetchData();
      } else {
        error(data.error || 'Lỗi khi thêm danh mục');
      }
    } catch (e) {
      error('Lỗi kết nối');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (name: string) => {
    if (!window.confirm(`Xóa danh mục "${name}"? Các bài học cũ sẽ vẫn giữ tên danh mục này cho đến khi bạn sửa chúng.`)) return;
    try {
      const data = await apiDelete(`/admin/practice/categories/${encodeURIComponent(name)}`, authState.token);
      if (data.ok) {
        success('Đã xóa danh mục');
        fetchData();
      } else {
        error(data.error || 'Lỗi khi xóa');
      }
    } catch (e) {
      error('Lỗi kết nối');
    }
  };

  if (loading && lessons.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-xq-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-black/10 dark:border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Tổng số bài học</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{stats?.totalLessons || 0}</p>
          </div>
        </div>
        <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-black/10 dark:border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Người dùng đã học</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{stats?.usersWithProgress || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-xq-gold" /> Quản lý nội dung
          </h2>
          <div className="flex gap-2">
            {!isAdding && !editingId && (
              <>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                >
                  📁 Quản lý danh mục
                </button>
                <button
                  onClick={() => { setIsAdding(true); setEditForm({ category: categories[0]?.name || 'Cơ bản', difficulty: { en: 'Easy', vi: 'Dễ' }, reward: 20 }); }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Thêm bài học
                </button>
              </>
            )}
          </div>
        </div>

        {(isAdding || editingId) && (
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">ID</label>
                <input
                  type="text"
                  value={editForm.id || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="e.g. basic-1"
                  className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={!!editingId}
                />
              </div>
              <MultiLocaleInput
                label="Tiêu đề (Title)"
                value={editForm.title}
                onChange={val => setEditForm(prev => ({ ...prev, title: val }))}
              />
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">Danh mục (Category)</label>
                <select
                  value={editForm.category || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
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
                <MultiLocaleInput
                  label="Độ khó (Difficulty)"
                  value={editForm.difficulty}
                  onChange={val => setEditForm(prev => ({ ...prev, difficulty: val }))}
                />
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">Vàng (🪙)</label>
                  <input
                    type="number"
                    value={editForm.reward || 20}
                    onChange={e => setEditForm(prev => ({ ...prev, reward: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">Thứ tự (Order)</label>
                  <input
                    type="number"
                    value={editForm.order ?? ''}
                    onChange={e => setEditForm(prev => ({ ...prev, order: e.target.value === '' ? undefined : parseInt(e.target.value) }))}
                    placeholder="1, 2, 3..."
                    className="w-full px-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <MultiLocaleInput
              label="Mô tả ngắn (Short Description)"
              type="textarea"
              value={editForm.description}
              onChange={val => setEditForm(prev => ({ ...prev, description: val }))}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-xq-gold uppercase tracking-widest">Nội dung chi tiết (Detailed Content)</label>
                <div className="flex gap-1">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setActiveContentLang(lang.code)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all flex items-center gap-1 ${
                        activeContentLang === lang.code 
                          ? 'bg-xq-gold text-black shadow-sm' 
                          : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white/60'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="uppercase">{lang.code}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                <Editor
                  tinymceScriptSrc="/libs/tinymce/tinymce.min.js"
                  apiKey="no-api-key"
                  licenseKey="gpl"
                  value={((editForm.content as Record<string, string>) || {})[activeContentLang] || ''}
                  onEditorChange={(content: string) => {
                    const currentContent = typeof editForm.content === 'object' ? { ...editForm.content } : { en: (editForm.content as string) || '', vi: (editForm.content as string) || '' };
                    setEditForm(prev => ({ 
                      ...prev, 
                      content: { ...currentContent, [activeContentLang]: content } 
                    }));
                  }}
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
                <div className="absolute top-2 right-2 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity">
                  <span className="text-[10px] font-black uppercase text-xq-gold/50 bg-xq-gold/5 px-2 py-0.5 rounded">
                    Editing {activeContentLang}
                  </span>
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
                    placeholder="rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w"
                    onChange={e => {
                      const boards = [...(editForm.boards || [])];
                      if (boards.length === 0) boards.push({ id: 'primary', title: 'Start', description: '', fen: e.target.value, moves: '' });
                      else boards[0] = { ...boards[0], fen: e.target.value };
                      setEditForm(prev => ({ ...prev, boards }));
                    }}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Nước đi mẫu (UCI)</label>
                  <input
                    type="text"
                    value={editForm.boards?.[0]?.moves || ''}
                    placeholder="e.g. h2e2 h7e7"
                    onChange={e => {
                      const boards = [...(editForm.boards || [])];
                      if (boards.length === 0) boards.push({ id: 'primary', title: 'Start', description: '', fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w', moves: e.target.value });
                      else boards[0] = { ...boards[0], moves: e.target.value };
                      setEditForm(prev => ({ ...prev, boards }));
                    }}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setVisualEditorTarget({ type: 'primary' });
                  setShowVisualEditor(true);
                }}
                className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase border border-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                 🧩 Mở bộ soạn thảo bàn cờ trực quan
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center px-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Các bàn cờ học tập (Sub Boards)</label>
                <button
                  type="button"
                  onClick={() => {
                    const newBoard: PracticeBoard = {
                      id: `board-${Date.now()}`,
                      title: '',
                      description: '',
                      fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
                      moves: ''
                    };
                    setEditForm(prev => ({ ...prev, boards: [...(prev.boards || []), newBoard] }));
                  }}
                  className="px-3 py-1 bg-xq-gold/10 text-xq-gold rounded-lg text-[10px] font-black uppercase transition-all hover:bg-xq-gold/20"
                >
                  + Thêm bàn mới
                </button>
              </div>

              <div className="space-y-4">
                {(editForm.boards || []).slice(1).map((b, idx) => {
                  const realIdx = idx + 1;
                  return (
                    <div key={b.id} className="p-4 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-800 space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => {
                          const nextBoards = [...(editForm.boards || [])];
                          nextBoards.splice(realIdx, 1);
                          setEditForm(prev => ({ ...prev, boards: nextBoards }));
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
                              next[realIdx] = { ...b, title: e.target.value };
                              setEditForm(prev => ({ ...prev, boards: next }));
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
                              next[realIdx] = { ...b, fen: e.target.value };
                              setEditForm(prev => ({ ...prev, boards: next }));
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Nước đi (UCI)</label>
                        <textarea
                          value={b.moves}
                          onChange={e => {
                            const next = [...(editForm.boards || [])];
                            next[realIdx] = { ...b, moves: e.target.value };
                            setEditForm(prev => ({ ...prev, boards: next }));
                          }}
                          rows={1}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-lg font-mono resize-none"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setVisualEditorTarget({ type: 'board-item', index: realIdx });
                          setShowVisualEditor(true);
                        }}
                        className="w-full py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 rounded-lg text-[8px] font-black uppercase border border-black/5 dark:border-white/5 transition-all flex items-center justify-center gap-2"
                      >
                        🧩 Chỉnh sửa bàn này trực quan
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors text-sm font-bold"
              >
                 Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-xl shadow-blue-500/10 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {editingId ? 'Lưu bài học' : 'Tạo bài học'}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Bài học</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4 text-center">Thứ tự</th>
                  <th className="px-6 py-4 text-center">Độ khó</th>
                  <th className="px-6 py-4 text-center">Thưởng</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <SortableContext
                  items={lessons.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {lessons.map(lesson => (
                    <SortableLessonRow 
                      key={lesson.id} 
                      lesson={lesson} 
                      onEdit={handleEdit} 
                      onDelete={handleDelete} 
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>

      {showVisualEditor && (
        <VisualBoardEditor 
          initialFen={
            visualEditorTarget?.type === 'tinymce' ? visualEditorInitialData?.fen :
            visualEditorTarget?.type === 'primary' ? editForm.boards?.[0]?.fen : 
            visualEditorTarget?.type === 'board-item' && visualEditorTarget.index !== undefined ? editForm.boards?.[visualEditorTarget.index]?.fen : 
            undefined
          }
          initialMoves={
            visualEditorTarget?.type === 'tinymce' ? visualEditorInitialData?.moves :
            visualEditorTarget?.type === 'primary' ? editForm.boards?.[0]?.moves : 
            visualEditorTarget?.type === 'board-item' && visualEditorTarget.index !== undefined ? editForm.boards?.[visualEditorTarget.index]?.moves : 
            undefined
          }
          onSave={handleVisualEditorSave}
          onClose={() => { setShowVisualEditor(false); setVisualEditorTarget(null); setVisualEditorInitialData(null); }}
        />
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-white/5">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Quản lý danh mục</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tên danh mục mới..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveCategory()}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={handleSaveCategory}
                  disabled={savingCategory || !newCategoryName.trim()}
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
                        onClick={() => handleDeleteCategory(c.name)}
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
                onClick={() => setShowCategoryModal(false)}
                className="px-6 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPracticeManager;
