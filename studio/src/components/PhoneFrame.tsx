import type { ReactNode } from 'react'

/** Marco de móvil para piezas verticales (Reels, TikTok, cine con móvil). */
export function PhoneFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative aspect-[9/19.5] rounded-[2.75rem] border border-line-strong bg-[#0a0a0a] p-[0.6rem] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.04)] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-ink">
        {children}
        <div aria-hidden="true" className="absolute top-2.5 left-1/2 z-10 h-6 w-[30%] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  )
}
