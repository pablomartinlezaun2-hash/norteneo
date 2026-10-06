import type { ReactNode } from 'react'

/** Marco de móvil para piezas verticales (Reels, TikTok, cine con móvil). */
export function PhoneFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-[2.5rem] border border-line-strong bg-[#0a0a0a] p-[0.55rem] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.04)] ${className}`}>
      {/* La pantalla es 9:16 exacta: la pieza vertical se ve completa, sin recortes */}
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[2rem] bg-ink">
        {children}
        <div aria-hidden="true" className="absolute top-2 left-1/2 z-10 h-[1.1rem] w-[22%] -translate-x-1/2 rounded-full bg-black/90" />
      </div>
    </div>
  )
}
