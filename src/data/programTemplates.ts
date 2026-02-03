// Workout program templates extracted from PDF documents
// These can be used to seed the database for new users

export interface ExerciseTemplate {
  name: string;
  series: number;
  reps: string;
  approach_sets: string;
  rest: string;
  technique: string;
  execution: string | null;
  video_url: string | null;
}

export interface SessionTemplate {
  name: string;
  short_name: string;
  exercises: ExerciseTemplate[];
}

export interface ProgramTemplate {
  name: string;
  description: string;
  sessions: SessionTemplate[];
}

// Program extracted from Copia_de_Lau-2.pdf (Push/Pull/Legs)
export const LAU_PROGRAM: ProgramTemplate = {
  name: "Push-Legs-Pull-Legs 2",
  description: "Rutina Push/Pull/Legs con 4 sesiones semanales",
  sessions: [
    {
      name: "Sesión PUSH",
      short_name: "PUSH",
      exercises: [
        { name: "Elevaciones laterales en polea", series: 3, reps: "12-15", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Press inclinado en máquina", series: 3, reps: "2x8-10 / 1x10-12", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Antebrazo alineado en todo momento con la caja torácica, utilizar el leg drive, contrae tu abdomen y glúteo.", video_url: null },
        { name: "Press plano con mancuernas a 30 grados", series: 3, reps: "1x6-8 / 2x10-12", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Antebrazo alineado con la línea de fuerza de la mancuerna, realiza la retracción escapular en primer lugar, utilizar leg drive.", video_url: null },
        { name: "Cruces en polea o máquina", series: 2, reps: "10-15", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Piensa en pegar tu bíceps el pectoral, mantén la caja torácica en extensión, realiza un segundo de pausa en cada extremo.", video_url: null },
        { name: "Extensión tríceps con barra", series: 2, reps: "12-15", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Extensión tríceps katana en polea", series: 2, reps: "10-12", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: null, video_url: null }
      ]
    },
    {
      name: "Sesión LEGS",
      short_name: "LEGS",
      exercises: [
        { name: "AB crunch / Dragons", series: 3, reps: "12-15", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Abductor en máquina", series: 3, reps: "2x10-12 / 1x8-10", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Mantén tu cadera en posición de anteversión, realiza pausas de 1s en los cambios de dirección.", video_url: "https://www.youtube.com/embed/h0ghOj0XBUc" },
        { name: "Isquios en máquina", series: 3, reps: "2x10-15 / 1x8-10", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Buscamos un buen control en el estiramiento, no eleves el glúteo ni compenses con la espalda.", video_url: null },
        { name: "Extensión cuádriceps", series: 3, reps: "2x10-15 / 1x8-10", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Realiza pausas de 1s en los cambios de dirección. Mantén una correcta alineación de tu cadera-rodilla-tobillo.", video_url: null },
        { name: "Prensa", series: 2, reps: "1x8-10 / 1x10-12", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Sentadilla búlgara", series: 3, reps: "2x6-8 / 1x8-10", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: null, video_url: null }
      ]
    },
    {
      name: "Sesión PULL",
      short_name: "PULL",
      exercises: [
        { name: "Elevaciones laterales con mancuernas", series: 3, reps: "12-15", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: "Realiza un recorrido completo que tu antebrazo y tu bíceps se toquen y se separen completamente, realiza un segundo de pausa en ambos extremos.", video_url: null },
        { name: "Tracción vertical unilateral", series: 3, reps: "1x6-8 / 2x8-10", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Busca mantener el antebrazo alineado con la polea en todo momento y lleva el codo hacia la cadera.", video_url: null },
        { name: "Remo agarre mag", series: 3, reps: "1x6-8 / 2x8-10", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Busca protraer y retraer las escapulas todo posible, controla la fase excéntrica, no flexiones la espalda.", video_url: null },
        { name: "Remo unilateral máquina o polea", series: 3, reps: "1x7-9 / 2x9-12", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Busca llevar tu brazo lo más pegado al torso como si quisieras aplastar tu tríceps contra tu dorsal, utiliza un agarre semi supino o neutro.", video_url: null },
        { name: "Remo low row", series: 2, reps: "1x8-10 / 1x10-12", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Curl bíceps en máquina", series: 3, reps: "10-15", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: "Mantén el hombro estático en todo momento, busca la mayor flexión de codo posible y realiza pausa en ambos extremos del recorrido.", video_url: null }
      ]
    },
    {
      name: "Sesión LEGS 2",
      short_name: "LEGS 2",
      exercises: [
        { name: "ABS / Dragons", series: 3, reps: "8-12", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Abductor en máquina", series: 3, reps: "3x10-12", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: null, video_url: "https://www.youtube.com/embed/h0ghOj0XBUc" },
        { name: "Glúteo medio en polea", series: 2, reps: "2x8-10", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Peso muerto rumano barra / mancuernas", series: 2, reps: "1x6-8 / 1x8-10", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: null, video_url: "https://www.youtube.com/embed/XM_yjLUzBKg" },
        { name: "Extensión cuádriceps", series: 2, reps: "10-15", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Prensa", series: 2, reps: "1x8-10 / 1x6-8", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Hip Thrust", series: 3, reps: "1x6-8 / 1x8-10", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: null, video_url: null }
      ]
    }
  ]
};

// Program extracted from Nico.pdf
export const NICO_PROGRAM: ProgramTemplate = {
  name: "Rutina Torso-Pierna",
  description: "Rutina Push/Pull/Legs/Upper/Arms",
  sessions: [
    {
      name: "Sesión Push",
      short_name: "PUSH",
      exercises: [
        { name: "Crunch abdominal", series: 2, reps: "10-12", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: "Control total de ambas fases dejando un segundo de pausa en la fase concéntrica", video_url: null },
        { name: "Elevaciones laterales en Y en el suelo", series: 2, reps: "12-15", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Press inclinado en máquina", series: 2, reps: "Top set 6-8 Back 10-12", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Antebrazo alineado en todo momento con la caja torácica, utilizar el leg drive, contrae tu abdomen y glúteo.", video_url: null },
        { name: "Press plano con mancuernas a 30 grados", series: 2, reps: "Top set 6-8 Back 9-12", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Antebrazo alineado con la línea de fuerza de la mancuerna, realiza la retracción escapular en primer lugar, utilizar leg drive.", video_url: null },
        { name: "Press plano en máquina", series: 2, reps: "Top set 8-10 back 10-12", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Evita una rotación interna en el hombro durante la fase excéntrica", video_url: null },
        { name: "Cruces en polea con banco", series: 2, reps: "12-15", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Piensa en pegar tu bíceps el pectoral, mantén la caja torácica en extensión, realiza un segundo de pausa en cada extremo.", video_url: null },
        { name: "Elevaciones laterales con mancuernas", series: 2, reps: "10-12", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Extensión tríceps unilateral en polea", series: 2, reps: "Top set 12-15 Back off 10-12", approach_sets: "0-2", rest: "1 minuto", technique: "Serie recta", execution: null, video_url: null },
        { name: "Extensión tríceps katana en polea", series: 2, reps: "10-14", approach_sets: "0-2", rest: "1 minuto", technique: "Serie recta", execution: null, video_url: null }
      ]
    },
    {
      name: "Sesión Pull",
      short_name: "PULL",
      exercises: [
        { name: "Curl de bíceps bayesian unilateral", series: 2, reps: "Top set 12-15 Back 10-12", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: "Mantén el hombro estático en todo momento, busca la mayor flexión de codo posible y realiza pausa en ambos extremos del recorrido.", video_url: null },
        { name: "Curl de bíceps scoot en máquina", series: 2, reps: "10-12", approach_sets: "0-2", rest: "1 minuto", technique: "Serie recta", execution: "Busca mantener el brazo al banco pegado durante todo el movimiento, no eleves el hombro para trampear.", video_url: null },
        { name: "Tracción vertical unilateral", series: 2, reps: "Top set 8-10 Back off 10-12", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: "Busca mantener el antebrazo alineado con la polea en todo momento y lleva el codo hacia la cadera.", video_url: null },
        { name: "Remo en T", series: 2, reps: "Top set 7-9 Back off 10-12", approach_sets: "0-2", rest: "3-4 minutos", technique: "Serie recta", execution: "Busca protraer y retraer las escapulas todo posible, controla la fase excéntrica, no flexiones la espalda.", video_url: null },
        { name: "Remo unilateral en máquina", series: 2, reps: "Top set 8-10 Back off 10-12", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: "Busca llevar tu brazo lo más pegado al torso como si quisieras aplastar tu tríceps contra tu dorsal.", video_url: null },
        { name: "Remo en polea espalda alta", series: 2, reps: "Top set 8-10 Back off 10-12", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Mantén la espalda recta, busca la mayor retracción y protracción escapular posible.", video_url: null },
        { name: "Hombro posterior en polea", series: 3, reps: "12-15", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: "Mantén tu cuerpo en una posición estática, mantén los brazos estirados y busca alejar tus brazos 180°.", video_url: null }
      ]
    },
    {
      name: "Sesión Legs",
      short_name: "LEGS",
      exercises: [
        { name: "Crunch abdominal en máquina", series: 2, reps: "12-15", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: "Control total de ambas fases dejando un segundo de pausa en la fase concéntrica", video_url: null },
        { name: "Gemelo con rodilla extendida", series: 2, reps: "12-15", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: "Control de la fase excéntrica, realiza 1 segundo de pausa en cada extremo del recorrido", video_url: null },
        { name: "Abductor en máquina", series: 2, reps: "12-15", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: null, video_url: "https://www.youtube.com/embed/h0ghOj0XBUc" },
        { name: "Isquios en máquina sentado", series: 2, reps: "Top set 10-12 Back off 12-15", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Buscamos un buen control en el estiramiento, no eleves el glúteo ni compenses con la espalda.", video_url: null },
        { name: "Extensión cuádriceps", series: 2, reps: "12-15", approach_sets: "0-2", rest: "2 minutos", technique: "Serie recta", execution: "Realiza pausas de 1s en los cambios de dirección.", video_url: null },
        { name: "Sentadilla en máquina", series: 2, reps: "Top set 6-8 Back 8-10", approach_sets: "0-2", rest: "3-4 minutos", technique: "Serie recta", execution: "Busca generar la mayor flexión de rodilla posible.", video_url: null }
      ]
    },
    {
      name: "Sesión Upper",
      short_name: "UPPER",
      exercises: [
        { name: "Y lateral raises", series: 2, reps: "12-15", approach_sets: "0-2", rest: "2-3 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Press inclinado en máquina", series: 2, reps: "Top set 8-10 Back off 10-12", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Extensión de la caja torácica, utilizar el leg drive, contrae tu abdomen y glúteo.", video_url: null },
        { name: "Press plano en máquina", series: 2, reps: "Top set 6-8 Back of 10-12", approach_sets: "0-2", rest: "3-4 minutos", technique: "Serie recta", execution: null, video_url: null },
        { name: "Cruces de polea en banco", series: 2, reps: "12-15", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Piensa en pegar tu bíceps el pectoral, mantén la caja torácica en extensión.", video_url: null },
        { name: "Jalón bilateral en polea énfasis dorsal", series: 2, reps: "Top set 8-10 Back off 10-12", approach_sets: "0-2", rest: "2-3 minutos", technique: "Serie recta", execution: "Tracciona llevando los codos hacia tu cadera, no muevas los hombros durante la ejecución.", video_url: null },
        { name: "Remo en T espalda alta", series: 2, reps: "Top set 6-8 Back of 10-12", approach_sets: "0-2", rest: "3-4 minutos", technique: "Serie recta", execution: "Busca protraer y retraer lo máximo posible tus escapulas, mantén la columna recta.", video_url: null }
      ]
    },
    {
      name: "Sesión Arms / Delts",
      short_name: "ARMS",
      exercises: [
        { name: "Hombro posterior en polea alta unilateral", series: 3, reps: "12-15", approach_sets: "0-2", rest: "3 minutos", technique: "Serie recta", execution: "Busca alejar tus brazos 180 grados, ten un control total de ambas fases.", video_url: null },
        { name: "Curl de bíceps en máquina o banco scoot", series: 2, reps: "Top set 8-10 Back off 12-15", approach_sets: "0-2", rest: "1 minuto", technique: "Serie recta", execution: "Mantén el brazo pegado al banco en todo momento, no eleves el hombro.", video_url: null },
        { name: "Curl de bíceps en banco inclinado", series: 2, reps: "Top set 10-12 Back off 12-15", approach_sets: "0-2", rest: "2-3 minutos", technique: "Serie recta", execution: "Busca mantener el brazo en una posición estática, con los brazos por detrás del torso.", video_url: null },
        { name: "Curl de bíceps martillo", series: 1, reps: "8-12", approach_sets: "0-2", rest: "2-3 minutos", technique: "Serie recta", execution: "Utiliza un recorrido completo, controla la fase excéntrica.", video_url: null },
        { name: "Extensión tríceps desde polea alta", series: 1, reps: "12-15", approach_sets: "0-2", rest: "1 minuto", technique: "Serie recta", execution: "Mantén tu torso recto, no te inclines, realiza el recorrido completo.", video_url: null },
        { name: "Press francés con mancuernas en banco", series: 2, reps: "Top set 8-10 Back off 10-12", approach_sets: "0-2", rest: "2-3 minutos", technique: "Serie recta", execution: "Busca la mayor flexión de codo posible, mantén tus hombros perpendiculares al suelo.", video_url: null },
        { name: "Extensión tríceps overhead con cuerda o barra", series: 2, reps: "10-12", approach_sets: "0-2", rest: "2-3 minutos", technique: "Serie recta", execution: "Mantén tus hombros estáticos, haz pausas en los cambios de dirección.", video_url: null },
        { name: "Elevaciones laterales en polea altura cadera", series: 2, reps: "Top set 10-12 Back off 12-15", approach_sets: "0-2", rest: "1 minuto", technique: "Serie recta", execution: "Busca que la polea vaya por delante de ti, realiza el movimiento en el plano escapular.", video_url: null }
      ]
    }
  ]
};

export const ALL_PROGRAMS: { [key: string]: ProgramTemplate } = {
  lau: LAU_PROGRAM,
  nico: NICO_PROGRAM,
};
