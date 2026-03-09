import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface NeoProfileData {
  model: 'vb1' | 'vb2' | null;
  completedAt: string | null;
  answers: Record<string, string>;
}

interface NeoProfileContextType {
  profile: NeoProfileData;
  saveProfile: (model: 'vb1' | 'vb2', answers: Record<number, string>) => void;
  clearProfile: () => void;
}

const STORAGE_KEY = 'neo-profile-data';

const defaultProfile: NeoProfileData = {
  model: null,
  completedAt: null,
  answers: {},
};

const NeoProfileContext = createContext<NeoProfileContextType>({
  profile: defaultProfile,
  saveProfile: () => {},
  clearProfile: () => {},
});

export const useNeoProfile = () => useContext(NeoProfileContext);

// Maps numeric answer indices to semantic keys for VB1
const VB1_KEYS = [
  'objetivo',
  'experiencia',
  'disciplinas',
  'frecuencia',
  'sueno',
  'estres',
  'lesiones',
  'peso',
];

// Maps numeric answer indices to semantic keys for VB2
const VB2_KEYS = [
  'disciplinas',
  'edad',
  'peso',
  'altura',
  'anos_entrenando',
  'frecuencia',
  'rir',
  'planificacion',
  'tipo_esfuerzo',
  'fallo_primero',
  'historial_deporte',
  'levantamiento_pesado',
  'sueno_horas',
  'sueno_calidad',
  'estres',
  'ansiedad',
  'desgaste_fisico',
  'adherencia_nutricional',
  'comidas_dia',
  'comer_entrenamiento',
  'suplementacion',
  'hidratacion',
  'lesiones',
  'sobrecarga',
  'recuperacion',
  'compromiso',
  'revision_manual',
];

export const NeoProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<NeoProfileData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const saveProfile = (model: 'vb1' | 'vb2', rawAnswers: Record<number, string>) => {
    const keys = model === 'vb1' ? VB1_KEYS : VB2_KEYS;
    const answers: Record<string, string> = {};
    Object.entries(rawAnswers).forEach(([idx, val]) => {
      const key = keys[Number(idx)];
      if (key) answers[key] = val;
    });
    setProfile({
      model,
      completedAt: new Date().toISOString(),
      answers,
    });
  };

  const clearProfile = () => setProfile(defaultProfile);

  return (
    <NeoProfileContext.Provider value={{ profile, saveProfile, clearProfile }}>
      {children}
    </NeoProfileContext.Provider>
  );
};
