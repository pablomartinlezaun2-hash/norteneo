import { Seo } from '@/components/Seo'
import { Stub } from '@/components/Stub'

export function Component() {
  return (
    <>
      <Seo title="Work" />
      <div className="pt-[var(--nav-h)]">
        <Stub name="Work" tall />
      </div>
    </>
  )
}
