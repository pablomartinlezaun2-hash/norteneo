export interface Exercise {
  name: string;
  series: number;
  reps: string;
  approachSets: string;
  rest: string;
  technique: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  shortName: string;
  exercises: Exercise[];
}

export const workoutSessions: WorkoutSession[] = [
  {
    id: "push",
    name: "Sesión PUSH",
    shortName: "PUSH",
    exercises: [
      {
        name: "Elevaciones laterales en polea",
        series: 3,
        reps: "12-15",
        approachSets: "0-2",
        rest: "2 minutos",
        technique: "Serie recta"
      },
      {
        name: "Press inclinado en máquina",
        series: 3,
        reps: "2x8-10 / 1x10-12",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Press plano con mancuernas a 30 grados",
        series: 3,
        reps: "1x6-8 / 2x10-12",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Cruces en polea o máquina",
        series: 2,
        reps: "10-15",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Extensión tríceps con barra",
        series: 2,
        reps: "12-15",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Extensión tríceps katana en polea",
        series: 2,
        reps: "10-12",
        approachSets: "0-2",
        rest: "2 minutos",
        technique: "Serie recta"
      }
    ]
  },
  {
    id: "legs1",
    name: "Sesión LEGS",
    shortName: "LEGS",
    exercises: [
      {
        name: "AB crunch / Dragons",
        series: 3,
        reps: "12-15",
        approachSets: "0-2",
        rest: "2 minutos",
        technique: "Serie recta"
      },
      {
        name: "Abductor en máquina",
        series: 3,
        reps: "2x10-12 / 1x8-10",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Isquios en máquina",
        series: 3,
        reps: "2x10-15 / 1x8-10",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Extensión cuádriceps",
        series: 3,
        reps: "2x10-15 / 1x8-10",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Prensa",
        series: 2,
        reps: "1x8-10 / 1x10-12",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Sentadilla búlgara",
        series: 3,
        reps: "2x6-8 / 1x8-10",
        approachSets: "0-2",
        rest: "2 minutos",
        technique: "Serie recta"
      }
    ]
  },
  {
    id: "pull",
    name: "Sesión PULL",
    shortName: "PULL",
    exercises: [
      {
        name: "Elevaciones laterales con mancuernas",
        series: 3,
        reps: "12-15",
        approachSets: "0-2",
        rest: "2 minutos",
        technique: "Serie recta"
      },
      {
        name: "Tracción vertical unilateral",
        series: 3,
        reps: "1x6-8 / 2x8-10",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Remo agarre mag",
        series: 3,
        reps: "1x6-8 / 2x8-10",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Remo unilateral máquina o polea",
        series: 3,
        reps: "1x7-9 / 2x9-12",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Remo low row",
        series: 2,
        reps: "1x8-10 / 1x10-12",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Curl bíceps en máquina",
        series: 3,
        reps: "10-15",
        approachSets: "0-2",
        rest: "2 minutos",
        technique: "Serie recta"
      }
    ]
  },
  {
    id: "legs2",
    name: "Sesión LEGS 2",
    shortName: "LEGS 2",
    exercises: [
      {
        name: "ABS / Dragons",
        series: 3,
        reps: "8-12",
        approachSets: "0-2",
        rest: "2 minutos",
        technique: "Serie recta"
      },
      {
        name: "Abductor en máquina",
        series: 3,
        reps: "3x10-12",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Glúteo medio en polea",
        series: 2,
        reps: "2x8-10",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Peso muerto rumano barra / mancuernas",
        series: 2,
        reps: "1x6-8 / 1x8-10",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Extensión cuádriceps",
        series: 2,
        reps: "10-15",
        approachSets: "0-2",
        rest: "3 minutos",
        technique: "Serie recta"
      },
      {
        name: "Prensa",
        series: 2,
        reps: "1x8-10 / 1x6-8",
        approachSets: "0-2",
        rest: "2 minutos",
        technique: "Serie recta"
      },
      {
        name: "Hip Thrust",
        series: 3,
        reps: "1x6-8 / 1x8-10",
        approachSets: "0-2",
        rest: "2 minutos",
        technique: "Serie recta"
      }
    ]
  }
];

export interface NutritionInfo {
  gymDays: {
    steps: string;
  };
  restDays: {
    kcal: string;
    steps: string;
  };
  explanation: string;
}

export const nutritionInfo: NutritionInfo = {
  gymDays: {
    steps: "8.000"
  },
  restDays: {
    kcal: "2844",
    steps: "10.000"
  },
  explanation: "Para incrementar la masa muscular, es fundamental en la mayoría de casos establecer un superávit calórico, lo que implica consumir más calorías de las que se gastan. Este excedente energético es esencial para proporcionar la energía adicional necesaria que favorezca la síntesis y el desarrollo del tejido muscular."
};

export interface Supplement {
  name: string;
  description: string;
}

export const supplements: Supplement[] = [
  {
    name: "Creatina",
    description: "La creatina, compuesta por tres aminoácidos, se encuentra en los músculos y el cerebro, y se almacena como fosfocreatina. Es crucial para la producción de energía y la regeneración de ATP. Se obtiene naturalmente en alimentos como la carne roja y el pescado. En el ámbito deportivo, es uno de los suplementos más reconocidos por sus beneficios para la construcción de masa muscular y aumento de fuerza."
  },
  {
    name: "Omega 3",
    description: "El Omega 3, compuesto por los ácidos grasos esenciales EPA y DHA, no puede ser producido por el cuerpo y debe obtenerse a través de la alimentación o suplementos. Es fundamental en la dieta diaria y ofrece beneficios como propiedades antiinflamatorias, ayudando a reducir dolores en ligamentos y articulaciones. Mejora la salud cardiovascular al regular colesterol y triglicéridos."
  },
  {
    name: "Vitamina D",
    description: "La vitamina D, obtenida principalmente a través del sol, es esencial para personas con baja exposición. Sus funciones incluyen regular la absorción de calcio, fortaleciendo huesos, dientes y articulaciones; mejorar el sistema inmunitario; reducir la inflamación y el estrés oxidativo; mantener el equilibrio hormonal."
  },
  {
    name: "Proteína",
    description: "Es uno de los tres macronutrientes esenciales, encargado de construir y mantener la masa muscular, además de apoyar la recuperación de los tejidos musculares. Se compone de 20 aminoácidos. La proteína es vital en la alimentación de personas activas y deportistas."
  },
  {
    name: "Cafeína",
    description: "La cafeína, un alcaloide que estimula el sistema nervioso central, ayuda a retrasar la fatiga, aumentar el estado de alerta y mejorar el rendimiento físico, especialmente en deportes de fuerza, resistencia e intensidad, además de favorecer la quema de grasa."
  }
];

export interface Food {
  name: string;
  description: string;
}

export const foods: Food[] = [
  {
    name: "Avena",
    description: "Índice glucémico bajo, lo que permite una liberación gradual de energía. Ofrece una alta sensación de saciedad. Contiene mucha fibra, favoreciendo el tránsito intestinal."
  },
  {
    name: "Crema de arroz",
    description: "Elaborado con copos de arroz pregelatinizados. Aporte de hidratos de carbono de absorción rápida. Fácil digestión y asimilación. Bajo en azúcares y en grasas. Alto contenido en fibra."
  },
  {
    name: "Harina de avena",
    description: "Se utiliza con un mayor enfoque en recetas específicas, por ejemplo tortitas de avena. Rica en carbohidratos complejos de absorción lenta. Índice glucémico bajo con liberación gradual de energía."
  }
];
