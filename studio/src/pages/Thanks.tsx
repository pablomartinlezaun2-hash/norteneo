import { Seo } from '@/components/Seo'
import { Stub } from '@/components/Stub'

export function Component() {
  return (
    <>
      <Seo title="Thanks" />
      <div className="pt-[var(--nav-h)]">
        <Stub name="Thanks" tall />
      </div>
    </>
  )
}
