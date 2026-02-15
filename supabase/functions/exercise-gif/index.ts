import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXERCISEDB_BASE = 'https://exercisedb.dev/api/v1/exercises';

// Name mapping: Spanish exercise names to English search terms
const nameMapping: Record<string, string> = {
  'press banca': 'barbell bench press',
  'press de banca': 'barbell bench press',
  'press inclinado': 'incline bench press',
  'press declinado': 'decline bench press',
  'press militar': 'overhead press',
  'press hombro': 'shoulder press',
  'sentadilla': 'barbell squat',
  'sentadillas': 'barbell squat',
  'peso muerto': 'deadlift',
  'peso muerto rumano': 'romanian deadlift',
  'curl biceps': 'bicep curl',
  'curl bíceps': 'bicep curl',
  'curl martillo': 'hammer curl',
  'dominadas': 'pull up',
  'fondos': 'dip',
  'remo con barra': 'barbell row',
  'remo con mancuerna': 'dumbbell row',
  'jalón al pecho': 'lat pulldown',
  'jalon al pecho': 'lat pulldown',
  'extensión tríceps': 'tricep extension',
  'extension triceps': 'tricep extension',
  'elevaciones laterales': 'lateral raise',
  'elevacion lateral': 'lateral raise',
  'face pull': 'face pull',
  'hip thrust': 'hip thrust',
  'prensa': 'leg press',
  'prensa de piernas': 'leg press',
  'extensión de cuádriceps': 'leg extension',
  'extension de cuadriceps': 'leg extension',
  'curl femoral': 'leg curl',
  'curl de piernas': 'leg curl',
  'zancadas': 'lunge',
  'plancha': 'plank',
  'crunch': 'crunch',
  'abdominales': 'crunch',
  'press arnold': 'arnold press',
  'aperturas': 'chest fly',
  'apertura con mancuernas': 'dumbbell fly',
  'pájaros': 'reverse fly',
  'pajaros': 'reverse fly',
  'encogimientos': 'shrug',
  'encogimiento de hombros': 'barbell shrug',
  'gemelos': 'calf raise',
  'elevación de gemelos': 'calf raise',
  'curl predicador': 'preacher curl',
  'curl concentrado': 'concentration curl',
  'press francés': 'skull crusher',
  'press frances': 'skull crusher',
  'pullover': 'pullover',
  'remo en polea': 'cable row',
  'jalón en polea': 'cable pulldown',
};

function getSearchTerm(exerciseName: string): string {
  const lower = exerciseName.toLowerCase().trim();
  
  // Direct match
  if (nameMapping[lower]) return nameMapping[lower];
  
  // Partial match
  for (const [key, value] of Object.entries(nameMapping)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }
  
  // Return original (might be in English already)
  return exerciseName;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();
    
    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Exercise name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchTerm = getSearchTerm(name);
    const searchUrl = `${EXERCISEDB_BASE}/search?q=${encodeURIComponent(searchTerm)}&limit=1`;
    
    console.log(`Searching ExerciseDB for: "${searchTerm}" (original: "${name}")`);
    
    const response = await fetch(searchUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`ExerciseDB API error: ${response.status}`);
      return new Response(
        JSON.stringify({ gifUrl: null, error: 'API unavailable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const exercises = data?.data || data || [];
    
    if (exercises.length > 0) {
      const exercise = exercises[0];
      return new Response(
        JSON.stringify({ 
          gifUrl: exercise.gifUrl || exercise.gif_url || null,
          name: exercise.name,
          target: exercise.target,
          bodyPart: exercise.bodyPart || exercise.body_part,
          equipment: exercise.equipment,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ gifUrl: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, gifUrl: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
