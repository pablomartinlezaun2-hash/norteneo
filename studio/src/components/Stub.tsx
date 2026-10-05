/** Marcador temporal mientras un agente construye la sección. */
export function Stub({ name, tall = false }: { name: string; tall?: boolean }) {
  return (
    <section className={`container-x grid place-items-center border-t border-line ${tall ? 'min-h-[100svh]' : 'min-h-[60svh]'}`}>
      <p className="type-meta text-dim">[ {name} ]</p>
    </section>
  )
}
