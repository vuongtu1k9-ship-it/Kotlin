import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LANGUAGES } from '../constants/languages';
import { SOCIAL_LINKS } from '../constants/social';


export function Footer() {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#020617] text-white/60 overflow-hidden border-t border-white/[0.02]">
      {/* Subtle Background Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-xq-gold/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="mx-auto max-w-[1400px] px-6 py-24 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 xl:gap-24">
          
          {/* Brand Column */}
          <div className="xl:col-span-4 space-y-10 text-center xl:text-left">
            <Link to="/" className="inline-block group">
              <div className="flex items-center gap-4 justify-center xl:justify-start">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-xq-gold to-yellow-600 shadow-2xl shadow-xq-gold/20 flex items-center justify-center text-slate-900 font-black text-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  🀄
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="font-heading text-3xl font-black tracking-tighter uppercase text-white">
                    {t('navbar.brand')} <span className="text-blue-500">{t('navbar.online')}</span>
                  </span>
                  <span className="text-[9px] text-white/40 font-black uppercase tracking-[0.4em] mt-2 group-hover:text-xq-gold transition-colors">
                    {t('footer.missionShort')}
                  </span>
                </div>
              </div>
            </Link>

            <p className="text-[13px] text-white/40 leading-relaxed max-w-sm font-medium tracking-wide mx-auto xl:mx-0">
              {t('footer.mission')}
            </p>

            <div className="flex items-center gap-4 justify-center xl:justify-start">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020617] bg-white/5 flex items-center justify-center text-[10px] font-bold">
                    👤
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap">
                {t('footer.joinPlayers')}
              </span>
            </div>
          </div>

          {/* Navigation Grid */}
          <div className="xl:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
            {[
              {
                title: t('footer.experience'),
                links: [
                  { label: t('footer.onlineArena'), to: '/game', color: 'hover:text-blue-400' },
                  { label: t('footer.puzzles'), to: '/puzzles', color: 'hover:text-amber-400' },
                  { label: t('footer.playWithAi'), to: '/ai', color: 'hover:text-purple-400' },
                  { label: t('footer.leaderboard'), to: '/players', color: 'hover:text-emerald-400' }
                ]
              },
              {
                title: t('footer.knowledge'),
                links: [
                  { label: t('footer.howToPlay'), to: '/how-to-play', color: 'hover:text-blue-400' },
                  { label: t('footer.basicTactics'), to: '/practice', color: 'hover:text-blue-400' },
                  { label: t('footer.practicalEndgame'), to: '/practice', color: 'hover:text-blue-400' },
                  { label: t('footer.news'), to: '/tournaments', color: 'hover:text-blue-400' }
                ]
              },
              {
                title: t('footer.services'),
                links: [
                  { label: t('footer.shop'), to: '/shop', color: 'hover:text-xq-gold' },
                  { label: t('footer.profile'), to: '/profile', color: 'hover:text-blue-400' },
                  { label: t('footer.vipUpgrade'), to: '/shop', color: 'hover:text-amber-400' },
                  { label: t('footer.support'), href: 'mailto:choicotuongtoday@gmail.com', color: 'hover:text-blue-400' }
                ]
              },
              {
                title: t('footer.contactLegal'),
                links: [
                  { label: t('footer.privacy'), to: '/privacy', color: 'hover:text-blue-400' },
                  { label: t('footer.terms'), to: '/terms', color: 'hover:text-blue-400' },
                  { label: 'Facebook Page', href: SOCIAL_LINKS.facebook.page, color: 'hover:text-blue-400' },
                  { label: 'Facebook Group', href: SOCIAL_LINKS.facebook.group, color: 'hover:text-blue-400' },
                  { label: 'YouTube Channel', href: SOCIAL_LINKS.youtube.channel, color: 'hover:text-red-500' }
                ]
              }
            ].map((section, idx) => (
              <div key={idx} className="space-y-6">
                <h3 className="text-white font-black uppercase tracking-[0.2em] text-[11px] pb-4 border-b border-white/5">
                  {section.title}
                </h3>
                <nav className="flex flex-col gap-4">
                  {section.links.map((link, lIdx) => (
                    link.to ? (
                      <Link 
                        key={lIdx} 
                        to={link.to} 
                        className={`text-[10px] font-bold uppercase tracking-widest transition-all ${link.color} hover:translate-x-1`}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a 
                        key={lIdx} 
                        href={link.href} 
                        target="_blank" 
                        rel="noreferrer" 
                        className={`text-[10px] font-bold uppercase tracking-widest transition-all ${link.color} hover:translate-x-1`}
                      >
                        {link.label}
                      </a>
                    )
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* --- Language Directory Hub --- */}
        <div className="mt-24 pt-16 border-t border-white/5 space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-8 py-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl">
            <div className="flex items-center gap-4 text-xq-gold">
              <div className="w-1.5 h-1.5 rounded-full bg-xq-gold animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('footer.globalPresence')}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              {LANGUAGES.map((lang) => {
                const subdomain = lang.code === 'vi' ? '' : `${lang.code.toLowerCase()}.`;
                const url = lang.code === 'vi' ? 'https://cotuong.xyz' : `https://${subdomain}cotuong.xyz`;
                const isActive = i18n.language === lang.code;
                return (
                  <a 
                    key={lang.code} 
                    href={url}
                    className={`group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      isActive ? 'text-xq-gold' : 'text-white/30 hover:text-white'
                    }`}
                  >
                    <span className={`text-sm transition-transform duration-300 group-hover:scale-125 ${isActive ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`}>
                      {lang.flag}
                    </span>
                    <span className="hidden sm:inline">{lang.name}</span>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col xl:flex-row items-center justify-between gap-12 text-center xl:text-left pt-6">
            <div className="space-y-4 max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 leading-relaxed italic">
                <Trans i18nKey="footer.copyright" values={{ year: currentYear }}>
                  Xiangqi Online - Design copyright by <span className="text-white/80">cotuong.xyz</span>. 
                  Developed by engineers of chess. &copy; {{year: currentYear}}
                </Trans>
              </p>
              <div className="flex flex-wrap justify-center xl:justify-start gap-4 text-[9px] font-black uppercase tracking-widest text-white/10">
                <span>{t('footer.infrastructure')}: {t('footer.staticHub')}</span>
                <span className="opacity-50">•</span>
                <span>{t('footer.security')}: {t('footer.sslVerified')}</span>
                <span className="opacity-50">•</span>
                <span>{t('footer.versionControl')}: {t('footer.build')} {__BUILD_NAME__}</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/5 border border-emerald-500/10 whitespace-nowrap">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">{t('footer.allSystemsOperational')}</span>
              </div>
              
              <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-white/5 border border-white/5">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[8px] text-white/20 font-black tracking-widest uppercase">{t('footer.release')}</span>
                  <span className="text-[10px] text-xq-gold font-black tracking-tighter uppercase">{__BUILD_NAME__}</span>
                </div>
                <div className="w-px h-6 bg-white/10"></div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[8px] text-white/20 font-black tracking-widest uppercase">{t('footer.deployTime')}</span>
                  <span className="text-[10px] text-white/60 font-medium">{__BUILD_TIME__.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
