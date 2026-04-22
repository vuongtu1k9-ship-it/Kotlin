import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { LANGUAGES as languages } from '../constants/languages';

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((l) => l.code === i18n.language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectLanguage = (code: string) => {
    if (code === i18n.language) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);

    // If on dev or localhost, just change language and don't redirect to subdomain
    const { hostname, port, pathname, search, hash } = window.location;
    const isDev = hostname.includes('dev.cotuong.xyz') || hostname.includes('localhost') || hostname.includes('127.0.0.1');

    if (isDev) {
      i18n.changeLanguage(code);
      return;
    }

    const hostParts = hostname.split('.');
    
    // Determine base domain (handle cases like en.cotuong.xyz or en.localhost)
    let baseDomain = hostname;
    const firstPart = hostParts[0].toLowerCase();
    const isSubdomain = languages.some(l => l.code === firstPart) && hostParts.length > 1;
    
    if (isSubdomain) {
      baseDomain = hostParts.slice(1).join('.');
    }

    // Construct new hostname
    // Apex domain (cotuong.xyz) is for 'vi'
    let newHostname = baseDomain;
    if (code !== 'vi') {
      newHostname = `${code}.${baseDomain}`;
    }

    const protocol = window.location.protocol;
    const portStr = port ? `:${port}` : '';
    const newUrl = `${protocol}//${newHostname}${portStr}${pathname}${search}${hash}`;
    
    window.location.href = newUrl;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-xs font-bold text-white/80"
      >
        <Languages className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLanguage.flag}</span>
        <span className="uppercase">{currentLanguage.code}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="py-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => selectLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-2 text-xs font-bold transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-xq-gold text-black'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
                {i18n.language === lang.code && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
