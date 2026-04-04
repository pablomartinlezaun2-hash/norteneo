## Mesocycle Planning System Rebuild

### Phase 1: Database Migration
Create new tables for the proper hierarchy:
- `planning_mesocycles` — name, duration_weeks, microcycle_count, user_id
- `planning_microcycles` — mesocycle_id, name, order_index
- `planning_sessions` — microcycle_id, name, order_index
- `planning_session_exercises` — session_id, exercise_catalog_id, sets, rep_range_min, rep_range_max, order_index
- All with proper RLS policies

### Phase 2: Data Hook
- `usePlanningMesocycles` hook with full CRUD for the hierarchy
- Load mesocycle with nested microcycles → sessions → exercises
- Save entire mesocycle tree in one operation

### Phase 3: UI Components
1. **MesocycleList** — list of existing mesocycles with cards
2. **MesocycleWizard** — step-by-step creation flow:
   - Step 1: Name + duration + microcycle count
   - Step 2: Define sessions per microcycle (name each day)
   - Step 3: Add exercises to each session from library
   - Step 4: Review and save
3. **MesocycleEditor** — edit existing mesocycle (reuses wizard steps)
4. **SessionEditor** — add/configure exercises within a session
5. Reuse existing `ExerciseSelectorModal` for picking exercises

### Phase 4: Integration
- Replace current MicrocyclesSection in WorkoutsHub with new MesocycleList
- Fix numeric inputs to accept single digits properly

### Key Decisions
- Keep existing `custom_microcycles` tables untouched (different feature)
- New `planning_*` tables for the mesocycle hierarchy
- Wizard uses local state, saves to DB only on final step
- Numeric inputs use proper `inputMode="numeric"` with no min-length constraints
