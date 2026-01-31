import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useProgramImport } from '@/hooks/useProgramImport';
import { ALL_PROGRAMS, ProgramTemplate } from '@/data/programTemplates';
import { Loader2, Download, CheckCircle, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgramSelectorProps {
  onProgramImported: () => void;
}

export const ProgramSelector = ({ onProgramImported }: ProgramSelectorProps) => {
  const { importProgram, importing, error } = useProgramImport();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleImport = async () => {
    if (!selectedProgram) return;
    
    const template = ALL_PROGRAMS[selectedProgram];
    if (!template) return;

    const result = await importProgram(template);
    if (!result.error) {
      setImportSuccess(true);
      setTimeout(() => {
        onProgramImported();
      }, 1500);
    }
  };

  const programs = Object.entries(ALL_PROGRAMS).map(([key, program]) => ({
    key,
    ...program,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary glow-primary mb-4">
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Selecciona tu programa
          </h1>
          <p className="text-sm text-muted-foreground">
            Elige un programa de entrenamiento para comenzar
          </p>
        </div>

        <div className="space-y-3">
          {programs.map((program) => (
            <button
              key={program.key}
              onClick={() => setSelectedProgram(program.key)}
              className={cn(
                "w-full p-4 rounded-xl border text-left transition-all duration-200",
                selectedProgram === program.key
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <h3 className="font-semibold text-foreground">{program.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {program.description}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {program.sessions.length} sesiones · {program.sessions.reduce((acc, s) => acc + s.exercises.length, 0)} ejercicios
              </p>
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {importSuccess && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-sm text-success font-medium">
              ¡Programa importado correctamente!
            </p>
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={!selectedProgram || importing || importSuccess}
          className="w-full gradient-primary text-primary-foreground font-semibold"
          size="lg"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Importando...
            </>
          ) : importSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              ¡Listo!
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Importar programa
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
