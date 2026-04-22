import React from 'react';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number | ((prev: number) => number)) => void;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  page,
  totalPages,
  setPage
}) => {
  if (totalPages <= 1) return null;

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
            page === i
              ? 'bg-xq-gold text-black shadow-lg shadow-xq-gold/20'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-white/10'
          }`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        disabled={page === 1}
        onClick={() => setPage(p => Math.max(1, p - 1))}
        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white/40 hover:text-slate-900 dark:text-white disabled:opacity-30 disabled:hover:text-slate-600 dark:text-white/40 transition-all font-bold text-sm"
      >
        Trước
      </button>
      <div className="flex items-center gap-1">{renderPageButtons()}</div>
      <button
        disabled={page === totalPages}
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-white/40 hover:text-slate-900 dark:text-white disabled:opacity-30 disabled:hover:text-slate-600 dark:text-white/40 transition-all font-bold text-sm"
      >
        Sau
      </button>
    </div>
  );
};
