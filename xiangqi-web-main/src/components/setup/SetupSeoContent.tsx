import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

export const SetupSeoContent: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="mt-16 bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[3rem] p-10 md:p-16 space-y-12 shadow-2xl">
      <div className="max-w-4xl">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">
          <Trans i18nKey="setup.seoContent.title"><span className="text-blue-500">🎨</span> Công cụ <span className="text-blue-600">Xếp Cờ Thế Online</span> chuyên nghiệp</Trans>
        </h2>
        <div className="space-y-8 text-[13px] text-slate-600 dark:text-white/40 leading-relaxed font-medium">
          <p>
            <Trans i18nKey="setup.seoContent.intro">
              Chào mừng bạn đến với công cụ <strong>xếp cờ thế</strong> và <strong>xếp cờ tướng</strong> hàng đầu. Tại đây, bạn có thể tự do <strong>bày cờ thế</strong>, tạo ra những bài tập sát cục kinh điển hoặc những hình cờ tàn thực dụng để chia sẻ với cộng đồng.
            </Trans>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-blue-400 font-black text-lg">⚙️ {t('setup.seoContent.feature1.title')}</h3>
              <p>
                <Trans i18nKey="setup.seoContent.feature1.desc">
                  Hệ thống hỗ trợ <strong>tạo thế cờ</strong> bằng thao tác kéo thả mượt mà, nhập chuỗi FEN nhanh chóng và tích hợp sẵn <strong>phần mềm thẩm cờ tướng</strong> (AI Pikafish) để bạn kiểm tra tính chính xác của phương án giải ngay lập tức.
                </Trans>
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-blue-400 font-black text-lg">🌟 {t('setup.seoContent.feature2.title')}</h3>
              <p>
                <Trans i18nKey="setup.seoContent.feature2.desc">
                  Mọi <strong>thế cờ tướng hay</strong> sau khi được tạo sẽ được lưu trữ trong kho dữ liệu cá nhân hoặc công khai để người chơi khác cùng giải đố. Đây là cách tuyệt vời để rèn luyện tư duy và đóng góp cho cộng đồng yêu cờ Việt Nam.
                </Trans>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-4">
        <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-white/30 border border-black/5 dark:border-white/5">#cotuongxyz</span>
        <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-white/30 border border-black/5 dark:border-white/5">#xepco</span>
        <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-white/30 border border-black/5 dark:border-white/5">#tao-the-co</span>
        <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-white/30 border border-black/5 dark:border-white/5">#co-the-tuong-hay</span>
      </div>
    </div>
  );
};
