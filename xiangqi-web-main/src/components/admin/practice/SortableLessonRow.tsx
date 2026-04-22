import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';

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

interface SortableLessonRowProps {
  lesson: Lesson;
  onEdit: (l: Lesson) => void;
  onDelete: (id: string) => void;
}

export const SortableLessonRow: React.FC<SortableLessonRowProps> = ({ lesson, onEdit, onDelete }) => {
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
            <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{lesson.title}</div>
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
          lesson.difficulty === 'Dễ' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
          lesson.difficulty === 'Trung bình' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
          'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          {lesson.difficulty}
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
