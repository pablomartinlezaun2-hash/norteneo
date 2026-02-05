import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Download, Upload, FileJson, Lock, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DataExportSectionProps {
  isPro: boolean;
}

export const DataExportSection = ({ isPro }: DataExportSectionProps) => {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const exportOptions = [
    { id: 'training', label: 'Planes de entrenamiento', icon: FileJson },
    { id: 'nutrition', label: 'Dietas y nutrición', icon: FileJson },
  ];

  const handleExport = async (type: string) => {
    if (!isPro) {
      toast.error('Esta función requiere suscripción PRO');
      return;
    }

    setExporting(type);
    
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create dummy export data
    const data = {
      exported_at: new Date().toISOString(),
      type,
      version: '1.0.0',
      data: {},
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neo-${type}-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setExporting(null);
    toast.success('Datos exportados correctamente');
  };

  const handleImport = async () => {
    if (!isPro) {
      toast.error('Esta función requiere suscripción PRO');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setImporting(true);
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Simulate import process
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success('Datos importados correctamente');
      } catch (error) {
        toast.error('Error al importar: archivo no válido');
      } finally {
        setImporting(false);
      }
    };
    
    input.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">{t('profile.data')}</h3>
        {!isPro && (
          <span className="ml-auto px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium flex items-center gap-1">
            <Lock className="w-3 h-3" />
            PRO
          </span>
        )}
      </div>

      {/* Export Buttons */}
      <div className="space-y-2">
        {exportOptions.map((option) => (
          <Button
            key={option.id}
            variant="outline"
            className={cn(
              "w-full h-12 justify-start",
              !isPro && "opacity-50"
            )}
            onClick={() => handleExport(option.id)}
            disabled={exporting === option.id || !isPro}
          >
            {exporting === option.id ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <option.icon className="w-5 h-5 mr-3 text-primary" />
            )}
            <span className="flex-1 text-left">{option.label}</span>
            <Download className="w-4 h-4 text-muted-foreground" />
          </Button>
        ))}
      </div>

      {/* Import Button */}
      <Button
        variant="outline"
        className={cn(
          "w-full h-12 justify-start",
          !isPro && "opacity-50"
        )}
        onClick={handleImport}
        disabled={importing || !isPro}
      >
        {importing ? (
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
        ) : (
          <Upload className="w-5 h-5 mr-3 text-primary" />
        )}
        <span className="flex-1 text-left">{t('profile.importData')}</span>
      </Button>

      {!isPro && (
        <p className="text-xs text-muted-foreground text-center">
          Suscríbete a PRO para exportar e importar tus datos
        </p>
      )}
    </div>
  );
};
