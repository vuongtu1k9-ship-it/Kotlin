import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

export const AiSeoContent: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="mt-16 bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[3rem] p-10 md:p-16 space-y-12 shadow-2xl" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}>
      <div className="max-w-4xl">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">
          <Trans i18nKey="ai.seoContent.title">Chơi Cờ Tướng với Máy – Luyện tập cùng AI <span className="text-blue-500">Pikafish</span></Trans>
        </h2>
        <div className="space-y-8 text-[13px] text-slate-600 dark:text-white/40 leading-relaxed font-medium">
          <p>
            <Trans i18nKey="ai.seoContent.intro">
              Chào mừng bạn đến với chuyên trang <strong>chơi cờ tướng với máy</strong> tại cotuong.xyz. Tại đây, chúng tôi cung cấp trải nghiệm luyện tập cờ tướng chuyên nghiệp với trí tuệ nhân tạo Pikafish – một trong những engine cờ tướng mạnh nhất thế giới hiện nay. Dù bạn là người mới bắt đầu hay một cao thủ, hệ thống AI của chúng tôi luôn có mức độ khó phù hợp để bạn thử thách bản thân.
            </Trans>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-blue-400 font-black text-lg">🚀 {t('ai.seoContent.feature1.title')}</h3>
              <p>
                <Trans i18nKey="ai.seoContent.feature1.desc">
                  Sử dụng Engine Pikafish (phiên bản tối ưu của Stockfish cho Cờ tướng) với khả năng tính toán hàng triệu nước đi mỗi giây.
                </Trans>
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-blue-400 font-black text-lg">📊 {t('ai.seoContent.feature2.title')}</h3>
              <p>
                <Trans i18nKey="ai.seoContent.feature2.desc">
                  Từ cấp độ 1 (Tập sự) đến cấp độ 10 (Đại sư), giúp bạn tiến bộ từng bước trong hành trình chinh phục kỳ nghệ.
                </Trans>
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-black/5 dark:border-white/5">
            <h3 className="text-slate-900 dark:text-white font-black text-lg mb-4">{t('ai.seoContent.whyTitle')}</h3>
            <p className="mb-6">{t('ai.seoContent.whyDesc')}</p>
            <p>
               Việc <strong>đấu cờ tướng với máy</strong> thường xuyên sẽ giúp bạn hình thành phản xạ nhạy bén và cải thiện đáng kể khả năng trung cuộc và tàn cuộc.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-4">
        {Object.values(t('ai.seoContent.tags', { returnObjects: true }) as Record<string, string>).map(tag => (
          <span key={tag} className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-white/30 border border-black/5 dark:border-white/5">#{tag}</span>
        ))}
      </div>
    </div>
  );
};
