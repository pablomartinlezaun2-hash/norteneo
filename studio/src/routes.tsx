import type { RouteRecord } from 'vite-react-ssg'
import { Layout } from '@/components/Layout'
import { services } from '@/content/services'
import { cases } from '@/content/cases'
import { LEGAL, SEG } from '@/i18n/paths'
import type { Lang } from '@/i18n'

const legalIds = Object.keys(LEGAL) as (keyof typeof LEGAL)[]

/** Árbol de páginas de un idioma (ES en la raíz, EN bajo /en). */
function pages(lang: Lang): RouteRecord[] {
  // getStaticPaths es relativo a la ruta padre ('/' o 'en')
  const p = ''
  return [
    { index: true, lazy: () => import('@/pages/Home'), entry: 'src/pages/Home.tsx' },
    { path: SEG.services[lang], lazy: () => import('@/pages/ServicesHub'), entry: 'src/pages/ServicesHub.tsx' },
    {
      path: `${SEG.services[lang]}/:slug`,
      lazy: () => import('@/pages/Service'),
      entry: 'src/pages/Service.tsx',
      getStaticPaths: () => services.map((s) => `${p}${SEG.services[lang]}/${s.slug[lang]}`),
    },
    { path: SEG.work[lang], lazy: () => import('@/pages/Work'), entry: 'src/pages/Work.tsx' },
    {
      path: `${SEG.work[lang]}/:slug`,
      lazy: () => import('@/pages/Case'),
      entry: 'src/pages/Case.tsx',
      getStaticPaths: () => cases.map((c) => `${p}${SEG.work[lang]}/${c.slug}`),
    },
    { path: SEG.studio[lang], lazy: () => import('@/pages/Studio'), entry: 'src/pages/Studio.tsx' },
    { path: SEG.contact[lang], lazy: () => import('@/pages/Contact'), entry: 'src/pages/Contact.tsx' },
    { path: `${SEG.contact[lang]}/${SEG.thanks[lang]}`, lazy: () => import('@/pages/Thanks'), entry: 'src/pages/Thanks.tsx' },
    {
      path: `${SEG.legal[lang]}/:doc`,
      lazy: () => import('@/pages/Legal'),
      entry: 'src/pages/Legal.tsx',
      getStaticPaths: () => legalIds.map((id) => `${p}${SEG.legal[lang]}/${LEGAL[id][lang]}`),
    },
  ]
}

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    entry: 'src/components/Layout.tsx',
    children: [
      ...pages('es'),
      { path: 'en', children: pages('en') },
      // 404 prerenderizada (scripts/postbuild.mjs la mueve a dist/404.html)
      { path: '404', lazy: () => import('@/pages/NotFound'), entry: 'src/pages/NotFound.tsx' },
      { path: '*', lazy: () => import('@/pages/NotFound'), entry: 'src/pages/NotFound.tsx' },
    ],
  },
]
