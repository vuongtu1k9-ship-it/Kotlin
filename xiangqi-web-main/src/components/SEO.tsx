import { Helmet } from 'react-helmet-async';
import { getSiteOrigin, getAbsoluteUrl } from '../utils/url';
import { LANGUAGES } from '../constants/languages';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  canonical?: string;
  jsonLd?: object;
  width?: number;
  height?: number;
  keywords?: string;
  video?: string;
}

const DEFAULT_IMAGE = getAbsoluteUrl('/assets/cover.png');




function getCurrentUrl() {
  if (typeof window === 'undefined' || !window.location?.origin) return getSiteOrigin();
  return window.location.origin + window.location.pathname;
}

export function SEO({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  canonical,
  jsonLd,
  width = 630,
  height = 700,
  keywords,
  video
}: SEOProps) {
  const { t } = useTranslation();
  
  const seoTitle = title ? `${title}${t('siteSeo.titleSuffix')}` : t('siteSeo.defaultTitle');
  const seoDesc = description || t('siteSeo.defaultDescription');
  const seoImage = image || DEFAULT_IMAGE;
  const seoUrl = url || (typeof window !== 'undefined' ? window.location.href : getSiteOrigin());
  const seoCanonical = canonical || getCurrentUrl();

  const rawPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const langCodes = LANGUAGES.map(l => l.code.toLowerCase()).join('|');
  const langRegex = new RegExp(`^\\/(${langCodes})(\\/|$)`, 'i');
  const cleanPath = rawPath.replace(langRegex, '/').replace(/\/+$/, '') || '';

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      {title !== undefined && <title>{seoTitle}</title>}
      {title !== undefined && <meta name="title" content={seoTitle} /> }
      {description !== undefined && <meta name="description" content={seoDesc} />}
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={seoUrl} />
      {title !== undefined && <meta property="og:title" content={seoTitle} />}
      {description !== undefined && <meta property="og:description" content={seoDesc} />}
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:width" content={String(width)} />
      <meta property="og:image:height" content={String(height)} />
      <meta property="og:site_name" content={t('siteSeo.siteName')} />
      {video && <meta property="og:video" content={video} />}
      {video && <meta property="og:video:type" content="video/mp4" />}
      {video && <meta property="og:video:width" content="1280" />}
      {video && <meta property="og:video:height" content="720" />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={seoUrl} />
      {title !== undefined && <meta property="twitter:title" content={seoTitle} />}
      {description !== undefined && <meta property="twitter:description" content={seoDesc} />}
      <meta property="twitter:image" content={seoImage} />
      {video && <meta property="twitter:card" content="player" />}
      {video && <meta property="twitter:player" content={video} />}
      {video && <meta property="twitter:player:width" content="1280" />}
      {video && <meta property="twitter:player:height" content="720" />}

      {/* Canonical URL — always use current domain */}
      <link rel="canonical" href={seoCanonical} />
      
      {/* Search Engine Localization Links */}
      <link rel="alternate" hrefLang="x-default" href={`https://cotuong.xyz${cleanPath}`} />
      {LANGUAGES.map((lang) => {
        const subdomain = lang.code === 'vi' ? '' : `${lang.code.toLowerCase()}.`;
        const url = `https://${subdomain}cotuong.xyz${cleanPath}`;
        return (
          <link key={lang.code} rel="alternate" hrefLang={lang.code} href={url} />
        );
      })}
      
      {/* Indexing Policy */}
      <meta name="robots" content="index, follow" />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
