import { Seo } from '@/components/Seo'
import { Stub } from '@/components/Stub'

export function Component() {
  return (
    <>
      <Seo title="Case" />
      <div className="pt-[var(--nav-h)]">
        <Stub name="Case" tall />
      </div>
    </>
  )
}
