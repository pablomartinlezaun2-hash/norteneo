import { Seo } from '@/components/Seo'
import { Stub } from '@/components/Stub'

export function Component() {
  return (
    <>
      <Seo title="NotFound" />
      <div className="pt-[var(--nav-h)]">
        <Stub name="NotFound" tall />
      </div>
    </>
  )
}
