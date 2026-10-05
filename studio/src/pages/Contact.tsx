import { Seo } from '@/components/Seo'
import { Stub } from '@/components/Stub'

export function Component() {
  return (
    <>
      <Seo title="Contact" />
      <div className="pt-[var(--nav-h)]">
        <Stub name="Contact" tall />
      </div>
    </>
  )
}
