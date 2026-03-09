import { motion } from 'framer-motion';
import { useNeoProfile } from '@/contexts/NeoProfileContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Row = ({ label, value }: { label: string; value: string | undefined }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="gradient-card rounded-2xl border border-border overflow-hidden">
    <div className="px-4 pt-4 pb-1">
      <p className="text-[11px] tracking-[0.12em] uppercase font-medium text-muted-foreground">{title}</p>
    </div>
    <div className="px-4 pb-3 divide-y divide-border">
      {children}
    </div>
  </div>
);

export const NeoProfileSummary = () => {
  const { profile } = useNeoProfile();

  if (!profile.model || !profile.completedAt) return null;

  const a = profile.answers;
  const isVB2 = profile.model === 'vb2';
  const completedDate = format(new Date(profile.completedAt), "d 'de' MMMM, yyyy", { locale: es });

  // Derive fiber tendency from VB2 answers
  const getFiberTendency = () => {
    if (!isVB2) return undefined;
    const effort = a.tipo_esfuerzo;
    if (effort === 'Resistencia larga') return 'Predominancia tipo I';
    if (effort === 'Explosividad / potencia') return 'Predominancia tipo II';
    return 'Mixto';
  };

  // Derive recovery from answers
  const getRecovery = () => {
    if (isVB2 && a.recuperacion) return a.recuperacion;
    return undefined;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="gradient-card rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[0.12em] uppercase font-medium text-muted-foreground">Mi perfil NEO</p>
          <span className="text-[11px] tracking-wide uppercase font-semibold text-primary px-2 py-0.5 rounded-md bg-primary/10">
            Completado
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Modelo activo</span>
          <span className="text-[13px] font-semibold text-foreground">{isVB2 ? 'VB2' : 'VB1'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Última actualización</span>
          <span className="text-[12px] text-muted-foreground">{completedDate}</span>
        </div>
      </div>

      {/* Section 1 — Base */}
      <SectionCard title="Base">
        {isVB2 && <Row label="Edad" value={a.edad ? `${a.edad} años` : undefined} />}
        <Row label="Peso" value={a.peso ? `${a.peso} kg` : undefined} />
        {isVB2 && <Row label="Altura" value={a.altura ? `${a.altura} cm` : undefined} />}
        <Row label="Disciplinas" value={a.disciplinas} />
        <Row label="Años entrenando" value={isVB2 ? a.anos_entrenando : a.experiencia} />
      </SectionCard>

      {/* Section 2 — Contexto */}
      <SectionCard title="Contexto">
        <Row label="Sueño" value={isVB2 ? a.sueno_horas : a.sueno} />
        {isVB2 && <Row label="Calidad del sueño" value={a.sueno_calidad} />}
        <Row label="Estrés" value={a.estres} />
        {isVB2 && <Row label="Adherencia nutricional" value={a.adherencia_nutricional} />}
        <Row label="Frecuencia semanal" value={a.frecuencia} />
      </SectionCard>

      {/* Section 3 — Perfil deportivo */}
      <SectionCard title="Perfil deportivo">
        {!isVB2 && <Row label="Objetivo principal" value={a.objetivo} />}
        {isVB2 && <Row label="Nivel técnico (RIR)" value={a.rir} />}
        {isVB2 && <Row label="Planificación previa" value={a.planificacion} />}
        {isVB2 && <Row label="Tendencia de fibras" value={getFiberTendency()} />}
        {isVB2 ? (
          <Row label="Recuperación" value={getRecovery()} />
        ) : (
          <Row label="Lesiones" value={a.lesiones} />
        )}
      </SectionCard>

      {/* Section 4 — Modo NEO */}
      {!isVB2 ? (
        <div className="gradient-card rounded-2xl border border-border p-4">
          <p className="text-[13px] font-medium text-muted-foreground">VB1 · Configuración simple</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <p className="text-[14px] font-semibold text-foreground">VB2 · Asesoría 1:1 con Pablo</p>
          <p className="text-[12px] font-light leading-[1.7] text-muted-foreground">
            VB2 funciona como una asesoría 1:1 con Pablo. NEO se utiliza como sistema de medición, control y ajuste para trabajar con mucha más precisión que un seguimiento 1:1 tradicional.
          </p>
        </div>
      )}
    </motion.div>
  );
};
