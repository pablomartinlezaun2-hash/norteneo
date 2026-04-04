
## Activar sesiones de microciclos como entrenamientos reales

### Problema
Los microciclos creados en la planificación no se pueden usar como entrenamientos activos. Solo existen como "plan" pero no se conectan con el sistema de ejecución (registro de series, peso, reps, RIR).

### Solución
Permitir que el usuario "active" un mesociclo/microciclo, lo que convertirá sus sesiones en un programa de entrenamiento real que aparecerá en la sección Gym para ejecutar.

### Implementación

**1. Botón "Activar" en cada mesociclo**
- Añadir botón en `MesocycleList` para activar un mesociclo
- Al activar, se crea un `training_program` + `workout_sessions` + `exercises` a partir de la estructura planificada
- El programa se marca como activo automáticamente

**2. Conversión de datos**
- Cada sesión del microciclo seleccionado → `workout_session`
- Cada ejercicio de la sesión → `exercise` (con series, reps del plan)
- Se vincula al `exercise_catalog` para obtener nombre, video, etc.

**3. Flujo del usuario**
1. Va a Entrenamientos → Microciclos
2. Ve sus mesociclos creados
3. Pulsa "Activar" en uno
4. Se genera el programa de entrenamiento
5. Aparece en la sección Gym listo para ejecutar
6. El usuario registra series, peso, reps como cualquier otro programa

**4. Lógica de activación**
- Hook `useActivateMesocycle` que:
  - Lee el mesociclo con sus microciclos/sesiones/ejercicios
  - Crea un `training_program` con nombre del mesociclo
  - Crea `workout_sessions` por cada sesión
  - Crea `exercises` por cada ejercicio planificado
  - Activa el programa y desactiva los demás
- Mostrar toast de confirmación

**5. UX adicional**
- Badge "Activo" en el mesociclo que está en uso
- Selector de qué microciclo activar si hay varios
