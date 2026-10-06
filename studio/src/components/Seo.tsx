import { Head } from 'vite-react-ssg'
import { useLocation } from 'react-router-dom'
import { useLang, type Lang } from '@/i18n'
import { alternatePath } from '@/i18n/paths'
import { site } from '@/content/site'

type Props = {
  title?: string
  description?: string
  image?: string
  noindex?: boolean
  /** JSON-LD adicional */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

/** <head> por página: título, descripción, canonical, hreflang ES/EN, Open Graph y JSON-LD. */
export function Seo({ title, description, image = '/media/reel/reel-land-poster.jpg', noindex, jsonLd }: Props) {
  const lang = useLang()
  const { pathname } = useLocation()
  const fullTitle = title ? `${title} · ${site.name}` : `${site.name} · ${lang === 'es' ? 'Imagen de lujo con IA' : 'Luxury imagery with AI'}`
  const desc = description ?? site.description[lang]
  const abs = (p: string) => `${site.url.replace(/\/$/, '')}${p}`
  const alt = (l: Lang) => abs(alternatePath(pathname, l))
  const ld = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []
  return (
    <Head>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {!noindex && <link rel="canonical" href={abs(pathname)} />}
      {!noindex && <link rel="alternate" hrefLang="es" href={alt('es')} />}
      {!noindex && <link rel="alternate" hrefLang="en" href={alt('en')} />}
      {!noindex && <link rel="alternate" hrefLang="x-default" href={alt('es')} />}
      {!noindex && <meta property="og:url" content={abs(pathname)} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={abs(image)} />
      <meta property="og:locale" content={lang === 'es' ? 'es_ES' : 'en_GB'} />
      <meta property="og:locale:alternate" content={lang === 'es' ? 'en_GB' : 'es_ES'} />
      <meta name="twitter:card" content="summary_large_image" />
      {noindex && <meta name="robots" content="noindex" />}
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify({ '@context': 'https://schema.org', ...obj })}
        </script>
      ))}
    </Head>
  )
}
