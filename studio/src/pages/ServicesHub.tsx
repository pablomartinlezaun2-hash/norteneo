import { Seo } from '@/components/Seo'
import { Stub } from '@/components/Stub'

export function Component() {
  return (
    <>
      <Seo title="ServicesHub" />
      <div className="pt-[var(--nav-h)]">
        <Stub name="ServicesHub" tall />
      </div>
    </>
  )
}
