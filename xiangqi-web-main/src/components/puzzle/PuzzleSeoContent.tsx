import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

interface PuzzleSeoContentProps {
  setupName?: string;
}

export const PuzzleSeoContent: React.FC<PuzzleSeoContentProps> = ({ setupName }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-16 bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[3rem] p-10 md:p-16 space-y-12 shadow-2xl">
      <div className="max-w-4xl">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">
          {t('puzzles.view.seoContent.title')} <span className="text-blue-600">{setupName || t('puzzles.view.seoContent.defaultName')}</span>
        </h2>
        <div className="space-y-8 text-[13px] text-slate-600 dark:text-white/40 leading-relaxed font-medium">
          <p>
            <Trans i18nKey="puzzles.view.seoContent.intro" values={{ name: setupName || t('puzzles.view.seoContent.defaultName') }}>
              Thế cờ <strong className="text-slate-600 dark:text-white/60">{'{{name}}'}</strong> là một bài tập <strong className="text-slate-600 dark:text-white/60">giải cờ thế online</strong> tiêu hình, tập trung vào khả năng phối hợp quân cờ để dứt điểm đối phương. Đây là cơ hội tuyệt vời để bạn rèn luyện <strong className="text-slate-600 dark:text-white/60">cách giải thế cờ tướng</strong> trong các tình huống thực tế.
            </Trans>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-blue-400 font-black text-lg">{t('puzzles.view.seoContent.tips.title')}</h3>
              <p>
                <Trans i18nKey="puzzles.view.seoContent.tips.desc">
                  Hãy chú ý đến các quân cờ chủ lực đang nằm ở vị trí tấn công. Một nước <strong className="text-slate-600 dark:text-white/60">chiếu tướng</strong> bất ngờ có thể là chìa khóa để mở ra chiến thắng. Đừng quên kiểm tra các nước phản đòn của đối phương.
                </Trans>
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-blue-400 font-black text-lg">{t('puzzles.view.seoContent.advanced.title')}</h3>
              <p>
                <Trans i18nKey="puzzles.view.seoContent.advanced.desc">
                  Sau khi tự giải, hãy sử dụng công cụ <strong className="text-slate-600 dark:text-white/60">phần mềm giải cờ thế</strong> tích hợp để xem các biến hóa khác. Điều này giúp bạn hiểu sâu hơn về cấu trúc của thế cờ và ghi nhớ các hình cờ sát cục.
                </Trans>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-4">
        <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-white/30 border border-black/5 dark:border-white/5">#cotuongxyz</span>
        <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-white/30 border border-black/5 dark:border-white/5">#giaitheco</span>
        <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-white/30 border border-black/5 dark:border-white/5">#satchieutancuoc</span>
      </div>
    </div>
  );
};
