
# Plan: Mostrar Programas Predefinidos en "Mis Entrenamientos"

## Resumen

Se integraran los programas predefinidos (Push-Legs-Pull-Legs 2 y Rutina Torso-Pierna) en la seccion "Entrenamientos guardados" del desplegable de Gimnasio dentro de "Mis Entrenamientos". Los usuarios podran ver y cargar estos programas desde esa ubicacion.

---

## Cambios a Realizar

### 1. Modificar MyWorkoutsSection.tsx

**Objetivo:** Reemplazar el mensaje de "Proximamente" en la seccion de "Entrenamientos guardados" por los programas predefinidos importables.

**Cambios especificos:**

- Importar el hook `useProgramImport` y `ALL_PROGRAMS` de los archivos existentes
- Agregar estado para manejar la importacion (loading, exito)
- En la seccion "Entrenamientos guardados" de Gimnasio, mostrar los dos programas predefinidos:
  - Push-Legs-Pull-Legs 2
  - Rutina Torso-Pierna
- Cada programa mostrara:
  - Nombre del programa
  - Descripcion
  - Numero de sesiones y ejercicios
  - Boton "Cargar" para importar el programa

**Flujo de carga:**
1. Usuario expande "Mis Entrenamientos"
2. Expande la categoria "Gimnasio"
3. Expande "Entrenamientos guardados"
4. Ve los 2 programas predefinidos con boton "Cargar"
5. Al pulsar "Cargar", se importa el programa usando `useProgramImport`
6. Se muestra feedback de exito y se refresca la lista

---

## Detalles Tecnicos

```text
src/components/MyWorkoutsSection.tsx
+--------------------------------------------+
|  - Import useProgramImport                 |
|  - Import ALL_PROGRAMS, ProgramTemplate    |
|  - Add importing state                     |
|  - Replace "Proximamente" placeholder      |
|  - Add program cards with:                 |
|    * Program name                          |
|    * Description                           |
|    * Sessions/exercises count              |
|    * "Cargar" button                       |
|  - Handle import with toast feedback       |
|  - Refresh workouts after import           |
+--------------------------------------------+
```

### Estructura Visual

```text
Mis Entrenamientos
|
+-- Gimnasio (desplegable)
|   |
|   +-- Entrenamientos guardados (desplegable)
|   |   |
|   |   +-- [Push-Legs-Pull-Legs 2] [Cargar]
|   |   |   "4 sesiones - 24 ejercicios"
|   |   |
|   |   +-- [Rutina Torso-Pierna] [Cargar]
|   |       "5 sesiones - 37 ejercicios"
|   |
|   +-- Entrenamientos disenados (desplegable)
|       |
|       +-- (rutinas creadas por el usuario)
|
+-- Natacion (desplegable)
|   +-- (proximamente)
|
+-- Running (desplegable)
    +-- (proximamente)
```

---

## Archivos a Modificar

| Archivo | Accion |
|---------|--------|
| `src/components/MyWorkoutsSection.tsx` | Modificar para agregar programas predefinidos |

---

## Resultado Esperado

- Los usuarios veran "Push-Legs-Pull-Legs 2" y "Rutina Torso-Pierna" en Gimnasio > Entrenamientos guardados
- Al pulsar "Cargar", el programa se importa a la base de datos del usuario
- Se muestra mensaje de confirmacion
- El programa aparece automaticamente en "Entrenamientos disenados" como activo
- La lista se actualiza para reflejar el nuevo programa

