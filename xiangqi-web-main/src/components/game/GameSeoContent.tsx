import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

interface GameSeoContentProps {
  playerNames: { red: string | null; black: string | null } | null;
}

export const GameSeoContent: React.FC<GameSeoContentProps> = ({ playerNames }) => {
  const { t } = useTranslation();
   const hashtags = t('game.seo.hashtags', { returnObjects: true }) as string[];

   return (
     <div className="mt-16 bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[3rem] p-10 md:p-16 space-y-12 shadow-2xl">
        <div className="max-w-4xl">
           <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">
              <span className="text-blue-500">📊</span> {t('game.seo.title.prefix')} <span className="text-blue-600">{playerNames?.red || t('game.redPlayerDefault')} vs {playerNames?.black || t('game.blackPlayerDefault')}</span>
           </h2>
           <div className="space-y-8 text-[13px] text-slate-600 dark:text-white/40 leading-relaxed font-medium">
               <p>
                 <Trans 
                   i18nKey="game.seo.intro" 
                   values={{ red: playerNames?.red || t('game.redPlayerDefault'), black: playerNames?.black || t('game.blackPlayerDefault') }}
                 >
                   Ván đấu <strong className="text-slate-600 dark:text-white/60">cờ tướng online</strong> kịch tính giữa <strong className="text-slate-600 dark:text-white/60">red</strong> và <strong className="text-slate-600 dark:text-white/60">black</strong> thể hiện sự biến hóa trong chiến thuật và tư duy của các kỳ thủ. Việc <strong className="text-slate-600 dark:text-white/60">xem lại ván đấu</strong> là cách tốt nhất để bạn nâng cao trình độ thẩm cờ của mình.
                 </Trans>
               </p>
 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-4">
                    <h3 className="text-blue-400 font-black text-lg">{t('game.seo.comments.title')}</h3>
                     <p>
                       <Trans i18nKey="game.seo.comments.desc">
                         Hệ thống hỗ trợ <strong className="text-slate-600 dark:text-white/60">biên bản cờ tướng</strong> thời gian thực, cho phép bạn theo dõi từng nước đi và tham gia bình luận cùng cộng đồng. Những ván đấu đỉnh cao thường chứa đựng các <strong className="text-slate-600 dark:text-white/60">chiến thuật cờ tướng</strong> sâu sắc mà bạn có thể áp dụng vào ván đấu của chính mình.
                       </Trans>
                     </p>
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-blue-400 font-black text-lg">{t('game.seo.ai.title')}</h3>
                     <p>
                        <Trans i18nKey="game.seo.ai.desc">
                          Nếu bạn muốn thử sức với những nước đi tương tự, hãy sử dụng tính năng <strong className="text-slate-600 dark:text-white/60">chơi cờ tướng với máy</strong> AI (Pikafish) để mô phỏng lại các tình huống khó trong ván đấu này. Đây là phương pháp hiệu quả nhất để <strong className="text-slate-600 dark:text-white/60">luyện cờ tướng với ai</strong> siêu giỏi.
                        </Trans>
                     </p>
                 </div>
              </div>
           </div>
        </div>
 
        <div className="pt-8 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-4">
           {Array.isArray(hashtags) && hashtags.map((tag, idx) => (
             <span key={idx} className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-white/30 border border-black/5 dark:border-white/5">
                {tag}
             </span>
           ))}
        </div>
     </div>
   );
 };
