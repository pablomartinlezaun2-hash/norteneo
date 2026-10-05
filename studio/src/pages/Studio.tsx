import { Seo } from '@/components/Seo'
import { Stub } from '@/components/Stub'

export function Component() {
  return (
    <>
      <Seo title="Studio" />
      <div className="pt-[var(--nav-h)]">
        <Stub name="Studio" tall />
      </div>
    </>
  )
}
