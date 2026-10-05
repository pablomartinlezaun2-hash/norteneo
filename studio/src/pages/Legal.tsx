import { Seo } from '@/components/Seo'
import { Stub } from '@/components/Stub'

export function Component() {
  return (
    <>
      <Seo title="Legal" />
      <div className="pt-[var(--nav-h)]">
        <Stub name="Legal" tall />
      </div>
    </>
  )
}
