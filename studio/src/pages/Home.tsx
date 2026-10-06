import { Seo } from '@/components/Seo'
import { Hero } from '@/sections/home/Hero'
import { Spot } from '@/sections/home/Spot'
import { Manifesto } from '@/sections/home/Manifesto'
import { Signature } from '@/sections/home/Signature'
import { WebsRail } from '@/sections/home/WebsRail'
import { Collection } from '@/sections/home/Collection'
import { House } from '@/sections/home/House'
import { Atelier } from '@/sections/home/Atelier'
import { PrivateClient } from '@/sections/home/PrivateClient'
import { Closing } from '@/sections/home/Closing'
import { site } from '@/content/site'

/**
 * Home: el embudo completo.
 * Captación (Hero) → golpe (spots de running y Trono, con sonido) → silencio (Manifiesto) → pico (La Mesa) → prueba real (Webs) → amplitud (Colección)
 * → orientación (La Casa) → calma (Atelier) → venta (Cliente privado) → cierre memorable (Closing).
 */
export function Component() {
  return (
    <>
      <Seo
        jsonLd={{
          '@type': 'Organization',
          name: site.name,
          url: site.url,
          logo: `${site.url}/favicon.svg`,
          ...(site.instagram ? { sameAs: [site.instagram] } : {}),
        }}
      />
      <Hero />
      <Spot slug="running" />
      <Spot slug="trono" mirror />
      <Manifesto />
      <Signature />
      <WebsRail />
      <Collection />
      <House />
      <Atelier />
      <PrivateClient />
      <Closing />
    </>
  )
}
