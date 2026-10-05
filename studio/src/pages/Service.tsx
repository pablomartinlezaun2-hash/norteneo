import { Seo } from '@/components/Seo'
import { Stub } from '@/components/Stub'

export function Component() {
  return (
    <>
      <Seo title="Service" />
      <div className="pt-[var(--nav-h)]">
        <Stub name="Service" tall />
      </div>
    </>
  )
}
