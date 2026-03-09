export interface MockAthlete {
  id: string;
  name: string;
  email: string;
  model: 'VB1' | 'VB2';
  fatigue: 'Baja' | 'Media' | 'Alta';
  adherence: number;
  lastUpdate: string;
  age: number;
  weight: number;
  height: number;
  objective: string;
  trainingDays: number;
  sleepHours: string;
  stress: string;
  disciplines: string;
  experience: string;
  recovery: string;
  nutritionAdherence: string;
}

export const mockAthletes: MockAthlete[] = [
  {
    id: '1',
    name: 'Álvaro Ruiz',
    email: 'alvaro@example.com',
    model: 'VB2',
    fatigue: 'Alta',
    adherence: 92,
    lastUpdate: '2026-03-08',
    age: 28,
    weight: 82,
    height: 178,
    objective: 'Ganar masa muscular',
    trainingDays: 5,
    sleepHours: '7–8',
    stress: 'Medio',
    disciplines: 'Gimnasio + running',
    experience: '3–5 años',
    recovery: 'Buena',
    nutritionAdherence: 'Buena',
  },
  {
    id: '2',
    name: 'Lucía Fernández',
    email: 'lucia@example.com',
    model: 'VB1',
    fatigue: 'Baja',
    adherence: 78,
    lastUpdate: '2026-03-07',
    age: 24,
    weight: 58,
    height: 164,
    objective: 'Perder grasa',
    trainingDays: 4,
    sleepHours: '6–7',
    stress: 'Alto',
    disciplines: 'Gimnasio',
    experience: 'Menos de 1 año',
    recovery: 'Regular',
    nutritionAdherence: 'Media',
  },
  {
    id: '3',
    name: 'Carlos Méndez',
    email: 'carlos@example.com',
    model: 'VB2',
    fatigue: 'Media',
    adherence: 85,
    lastUpdate: '2026-03-09',
    age: 31,
    weight: 90,
    height: 183,
    objective: 'Mejorar rendimiento',
    trainingDays: 6,
    sleepHours: '7–8',
    stress: 'Bajo',
    disciplines: 'Gimnasio + running + natación',
    experience: 'Más de 5 años',
    recovery: 'Muy buena',
    nutritionAdherence: 'Muy buena',
  },
  {
    id: '4',
    name: 'Marina López',
    email: 'marina@example.com',
    model: 'VB1',
    fatigue: 'Baja',
    adherence: 65,
    lastUpdate: '2026-03-06',
    age: 22,
    weight: 55,
    height: 160,
    objective: 'Organizar entrenamiento',
    trainingDays: 3,
    sleepHours: '8+',
    stress: 'Bajo',
    disciplines: 'Gimnasio',
    experience: 'Estoy empezando',
    recovery: 'Buena',
    nutritionAdherence: 'Media',
  },
  {
    id: '5',
    name: 'Javier Torres',
    email: 'javier@example.com',
    model: 'VB2',
    fatigue: 'Alta',
    adherence: 88,
    lastUpdate: '2026-03-09',
    age: 34,
    weight: 95,
    height: 186,
    objective: 'Ganar masa muscular',
    trainingDays: 5,
    sleepHours: '6–7',
    stress: 'Alto',
    disciplines: 'Gimnasio + natación',
    experience: '3–5 años',
    recovery: 'Regular',
    nutritionAdherence: 'Buena',
  },
  {
    id: '6',
    name: 'Sofía Navarro',
    email: 'sofia@example.com',
    model: 'VB1',
    fatigue: 'Media',
    adherence: 71,
    lastUpdate: '2026-03-05',
    age: 27,
    weight: 62,
    height: 168,
    objective: 'Mejorar forma física',
    trainingDays: 4,
    sleepHours: '7–8',
    stress: 'Medio',
    disciplines: 'Running',
    experience: '1–3 años',
    recovery: 'Buena',
    nutritionAdherence: 'Media',
  },
];
