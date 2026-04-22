import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { apiPost, apiGet } from '../api';
import { logger } from '../utils/logger';
import { SEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { getSiteOrigin, getAbsoluteUrl } from '../utils/url';

type GiftItem = {
  id: string;
  name: string;
  price: number;
  icon: string;
  desc?: string;
};

export default function ShopPage() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const [shopGifts, setShopGifts] = useState<Record<string, GiftItem>>({});
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const giftRes = await apiGet<{ ok: boolean; gifts: Record<string, GiftItem> }>('/gifts/list', authState.token);
        if (giftRes?.ok) setShopGifts(giftRes.gifts);
      } catch (e) {
        logger.error('Failed to load shop data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [authState.token]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleBuy = async (itemId: string) => {
    if (authState.status !== 'auth') return;
    setBuying(itemId);
    try {
      const res = await apiPost<{ ok: boolean; error?: string }>('/gifts/buy', { itemId, quantity: 1 }, authState.token);
      if (res?.ok) {
        setMessage({ text: t('shop.messages.success'), type: 'success' });
        // Refresh session to update inventory
        window.location.reload(); 
      } else {
        setMessage({ 
          text: res?.error === 'INSUFFICIENT_FUNDS' ? t('shop.messages.insufficient') : t('shop.messages.error'), 
          type: 'error' 
        });
      }
    } catch (e) {
      logger.error('Buy failed', e);
      setMessage({ text: t('shop.messages.networkError'), type: 'error' });
    } finally {
      setBuying(null);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-600 dark:text-white/50 animate-pulse font-bold tracking-widest uppercase text-sm">{t('shop.meta.loading') || t('common.loading')}</div>;

  return (
    <div className="mx-auto max-w-[1920px] w-full px-4 pt-8 pb-16 space-y-10">
      <SEO 
        title={t('shop.meta.title')} 
        description={t('shop.meta.description')}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": t('shop.meta.listTitle'),
            "description": t('shop.meta.listDesc'),
            "itemListElement": Object.values(shopGifts).map((item, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "item": {
                "@type": "SoftwareApplication",
                "name": item.name,
                "description": item.desc || item.name,
                "applicationCategory": "Game",
                "offers": {
                  "@type": "Offer",
                  "price": item.price,
                  "priceCurrency": "XQG"
                }
              }
            }))
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": t('shop.meta.home'),
                "item": getSiteOrigin()
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": t('shop.meta.shop'),
                "item": getAbsoluteUrl('/shop')
              }
            ]
          }
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent uppercase">{t('shop.title')}</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-white/50 mt-1">{t('shop.subtitle')}</p>
        </div>
        
        {authState.status === 'auth' && authState.user && (
          <div className="flex items-center gap-6 bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-xl">
             <div className="flex flex-col items-center px-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-1">{t('shop.yourCoins')}</span>
                <div className="flex items-center gap-2">
                   <span className="text-2xl">🪙</span>
                   <span className="text-xl font-bold text-amber-400">{authState.user.inventory?.coins || 0}</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {message && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 ${message.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/20 border-rose-500/30 text-rose-300'}`}>
           <div className="flex items-center gap-2 font-bold">
              {message.type === 'success' ? '✅' : '❌'} {message.text}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.values(shopGifts).map(item => (
          <div key={item.id} className="relative group flex flex-col items-center text-center gap-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] p-8 shadow-sm transition-all hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-xl dark:hover:shadow-2xl overflow-hidden">
             {/* Shine Effect */}
             <div className="absolute -top-[100%] left-[-100%] w-[300%] h-[300%] bg-gradient-to-br from-transparent via-white/5 to-transparent rotate-45 transition-all group-hover:top-[-50%] group-hover:left-[-50%] pointer-events-none duration-1000"></div>

             <div className="text-7xl mb-4 transform scale-100 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{item.icon}</div>
             <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">{item.name}</h3>
                <p className="text-xs text-slate-600 dark:text-white/40 leading-relaxed px-4 mb-4 line-clamp-2 italic">"{item.desc || t('shop.buy.defaultDesc')}"</p>
             </div>
             
             <div className="mt-auto w-full">
                <div className="text-amber-400 font-black text-lg mb-4 flex items-center justify-center gap-1.5">
                   <span className="text-2xl">🪙</span> {item.price} {t('common.coins')}
                </div>
                <button
                  onClick={() => handleBuy(item.id)}
                  disabled={buying === item.id || (authState.user?.inventory?.coins || 0) < item.price}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-600/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
                >
                  {buying === item.id ? t('shop.buy.processing') : (authState.user?.inventory?.coins || 0) < item.price ? t('shop.buy.insufficient') : t('shop.buy.now')}
                </button>
             </div>
          </div>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="p-8 rounded-[2rem] bg-white/80 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm space-y-4">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight"><span>🪙</span> {t('shop.tips.title')}</h3>
            <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">
               <Trans i18nKey="shop.tips.desc">
                 Vàng (Coins) là đơn vị tiền tệ chính trong Cờ tướng Online. Bạn không thể mua Vàng bằng tiền thật, mà phải <strong>tích lũy thông qua sự nỗ lực</strong> rèn luyện kỳ nghệ của chính mình:
               </Trans>
            </p>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-white/50">
               <li className="flex items-start gap-2">
                  <span className="text-amber-400">✔</span>
                  <Trans i18nKey="shop.tips.item1">
                    Hoàn thành các bài tập tại <Link to="/practice" className="text-blue-400 hover:underline">Học chơi cờ</Link>. Mỗi bài học mới đều mang lại một lượng Vàng xứng đáng.
                  </Trans>
               </li>
               <li className="flex items-start gap-2">
                  <span className="text-amber-400">✔</span>
                  <Trans i18nKey="shop.tips.item2">
                    Tham gia các <Link to="/tournaments" className="text-blue-400 hover:underline">Giải đấu Online</Link>. Những kỳ thủ đạt thứ hạng cao sẽ nhận được phần thưởng Vàng và vật phẩm giá trị.
                  </Trans>
               </li>
               <li className="flex items-start gap-2">
                  <span className="text-amber-400">✔</span>
                  <span>{t('shop.tips.item3')}</span>
               </li>
            </ul>
         </div>

         <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10 space-y-4">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">🎁 {t('shop.culture.title')}</h3>
            <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">
               <Trans i18nKey="shop.culture.desc1">
                 Trong giới cờ, việc tặng quà không chỉ là trao đi vật chất mà là <strong>thể hiện sự tôn trọng và kết nối</strong> giữa các kỳ hữu.
               </Trans>
            </p>
            <p className="text-xs text-slate-600 dark:text-white/50 leading-relaxed italic">
               <Trans i18nKey="shop.culture.desc2">
                 "Kỳ phùng địch thủ" - Những món quà nhỏ như 🌹 Hoa hồng hay ☕ Ly cà phê là cách tuyệt vời để bắt đầu một tình bạn mới sau một ván đấu căng thẳng. Hãy sử dụng Vàng bạn kiếm được để làm đẹp thêm cộng đồng Cờ tướng của chúng ta.
               </Trans>
            </p>
            <div className="pt-2">
               <Link to="/tournaments" className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-2">
                  {t('shop.tips.viewTournaments')}
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
}
