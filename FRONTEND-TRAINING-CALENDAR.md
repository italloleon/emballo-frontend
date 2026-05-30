# Frontend Implementation — Training Calendar

> **Stack:** React + TypeScript + Tailwind  
> **Base URL:** `/api/v1`  
> **Auth:** Bearer token in `Authorization` header

---

## 1. Overview

Two surfaces to build:

| Surface | Who sees it | What it does |
|---------|------------|--------------|
| **Instructor Calendar** | Admin + Instructor | Pick a student → pick a plan → click/select days → save |
| **Student Calendar** | Student | View monthly calendar → click a day → see the full training plan |

The backend enforces one training plan per student per day (UNIQUE constraint). Calling the assign endpoint on a date that already has a plan **replaces** it (upsert) — no duplicate check needed from the frontend.

---

## 2. API Reference

### 2.1 Assign plan to dates (Instructor / Admin)

```
POST /students/{studentId}/schedule
Role: admin | instructor
```

**Body:**
```json
{
  "training_plan_id": "uuid",   // nullable — omit or null for a rest day marker
  "dates": ["2026-06-02", "2026-06-04", "2026-06-06"],
  "notes": "Foco na execução, sem aumentar carga ainda"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `training_plan_id` | uuid \| null | ❌ | Must belong to the same academy. Null = rest day |
| `dates` | string[] | ✅ | `YYYY-MM-DD` format, 1–60 dates, max 1 year ahead |
| `notes` | string | ❌ | Note shown on every assigned date, max 500 chars |

**Response `201`:** Array of created/updated schedule entries:
```json
[
  {
    "id": "uuid",
    "student_id": "uuid",
    "training_plan_id": "uuid",
    "scheduled_date": "2026-06-02T00:00:00.000000Z",
    "notes": "Foco na execução",
    "completed_at": null,
    "training_plan": {
      "id": "uuid",
      "name": "Treino A - Hipertrofia",
      "goal": "hypertrophy",
      "description": "..."
    }
  }
]
```

---

### 2.2 Get student's schedule (Instructor / Admin)

```
GET /students/{studentId}/schedule?month=YYYY-MM
Role: admin | instructor
```

Returns only days that have a schedule entry. Default month = current month if `month` param is omitted.

---

### 2.3 Delete a schedule entry (Instructor / Admin)

```
DELETE /training-schedules/{scheduleId}
Role: admin | instructor
```

Response `204`.

---

### 2.4 Mark complete (Instructor / Admin)

```
POST /training-schedules/{scheduleId}/complete
Role: admin | instructor
```

Sets `completed_at` to now. Response: updated schedule entry.

---

### 2.5 Student: view own calendar

```
GET /me/schedule?month=YYYY-MM
Role: any authenticated
```

Same response shape as 2.2, scoped to the authenticated student.

---

### 2.6 Student: view training for a specific day

```
GET /me/schedule/{date}
Role: any authenticated
date format: YYYY-MM-DD
```

Returns the full schedule entry with the complete training plan and all exercises:

```json
{
  "id": "uuid",
  "scheduled_date": "2026-06-02T00:00:00.000000Z",
  "completed_at": null,
  "notes": "Foco na execução",
  "training_plan": {
    "id": "uuid",
    "name": "Treino A - Hipertrofia",
    "goal": "hypertrophy",
    "description": "...",
    "exercises": [
      {
        "id": "uuid",
        "order": 0,
        "sets": 4,
        "reps": "8-12",
        "rest_seconds": 90,
        "notes": "Manter escápulas retraídas",
        "exercise": {
          "id": "uuid",
          "name": "Supino Reto com Barra",
          "description": "...",
          "muscle_groups": ["chest", "triceps"],
          "machine": {
            "name": "Barra Olímpica",
            "category": "free_weights"
          }
        }
      }
    ]
  }
}
```

Returns `404` if no training is scheduled for that date.

---

### 2.7 Student: mark day as complete

```
POST /me/schedule/{scheduleId}/complete
Role: any authenticated
```

---

## 3. Data shape helpers (TypeScript)

```typescript
// api/schedule.ts

export interface ScheduleEntry {
  id: string
  student_id: string
  training_plan_id: string | null
  scheduled_date: string          // "2026-06-02T00:00:00.000000Z"
  notes: string | null
  completed_at: string | null     // null = pending
  training_plan: ScheduledPlan | null
}

export interface ScheduledPlan {
  id: string
  name: string
  goal: string | null
  description: string | null
  exercises?: TrainingExercise[]  // only present in myDay response
}

export interface BulkSchedulePayload {
  training_plan_id?: string | null
  dates: string[]                 // "YYYY-MM-DD"
  notes?: string
}

// Helpers
export const isCompleted = (e: ScheduleEntry) => e.completed_at !== null

// Map entries to a date→entry dictionary for O(1) calendar lookups
export const indexByDate = (entries: ScheduleEntry[]) =>
  Object.fromEntries(
    entries.map(e => [e.scheduled_date.slice(0, 10), e])
  )
```

---

## 4. Instructor Calendar page

### Route suggestion
`/instructor/students/:studentId/calendar`  
`/admin/students/:studentId/calendar`

### Component breakdown

```
StudentCalendar
├── StudentHeader (name, avatar, goal)
├── CalendarGrid (month view)
│   ├── MonthNav (← June 2026 →)
│   └── DayCell × 42 (6 weeks)
│       ├── day number
│       ├── plan chip (colored by goal)
│       └── ✓ badge if completed
├── BulkAssignPanel (appears when days are selected)
│   ├── selected days summary
│   ├── PlanPicker (select from student's active plans)
│   ├── Notes textarea
│   └── [Salvar] / [Cancelar]
└── DayDetailModal (appears when a single day is clicked)
    ├── plan name + goal badge
    ├── exercise list (condensed)
    ├── notes
    └── [Remover agendamento] button
```

### Interaction model

1. **Navigate months** — `?month=2026-06` fetched on change
2. **Single click on empty day** → enters selection mode, that day is selected
3. **Click more days** → adds to multi-selection (highlight)
4. **Click already-selected day** → deselects it
5. **Click assigned day** (not in selection mode) → opens `DayDetailModal`
6. **BulkAssignPanel** appears whenever `selectedDays.length > 0`
7. **Save** → `POST /students/{id}/schedule` → merge new entries into local state
8. **Delete from modal** → `DELETE /training-schedules/{id}` → remove from local state

### DayCell colour coding by goal

```typescript
const GOAL_COLORS: Record<string, string> = {
  hypertrophy: 'bg-ember/20 text-ember border-ember/30',
  strength:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  endurance:   'bg-green-500/20 text-green-400 border-green-500/30',
  weight_loss: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  flexibility: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  general:     'bg-bg-600 text-txt-dim border-bg-500',
}
```

### Calendar grid generation

```typescript
function buildCalendarGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()   // 0 = Sunday
  const endPad = 6 - lastDay.getDay()
  
  const days: Date[] = []
  for (let i = startPad; i > 0; i--)
    days.push(new Date(year, month, 1 - i))   // previous month overflow
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push(new Date(year, month, d))
  for (let i = 1; i <= endPad; i++)
    days.push(new Date(year, month + 1, i))   // next month overflow
  
  return days
}

const toDateKey = (d: Date) => d.toISOString().slice(0, 10) // "2026-06-02"
```

---

## 5. Student Calendar page

### Route suggestion
`/student/calendar`

### Component breakdown

```
StudentCalendarPage
├── CalendarGrid (same grid, read-only)
│   └── DayCell
│       ├── plan chip
│       └── ✓ if completed, 🔥 if today
└── TrainingOfTheDayDrawer (slides up from bottom on mobile, modal on desktop)
    ├── plan name + goal
    ├── notes from instructor
    ├── ExerciseCard × N
    │   ├── exercise name + muscle groups
    │   ├── machine name (if any)
    │   └── sets × reps — rest Xs
    └── [Marcar como concluído] button → POST /me/schedule/{id}/complete
```

### Navigation
- Clicking a day with a plan → `GET /me/schedule/2026-06-02` → open drawer
- "Today" button → scrolls to current date and highlights it
- Month navigation → `?month=YYYY-MM` refetch

### Completed state
After `POST /me/schedule/{id}/complete`:
- Update local entry `completed_at = new Date().toISOString()`
- Show ✓ on the DayCell
- Show success toast "Treino do dia concluído! 💪"

---

## 6. Suggested API module

```typescript
// src/api/schedule.ts
import api from './client'

export const getStudentSchedule = (studentId: string, month?: string) =>
  api.get<ScheduleEntry[]>(`/students/${studentId}/schedule`, {
    params: month ? { month } : {},
  })

export const bulkAssignSchedule = (studentId: string, payload: BulkSchedulePayload) =>
  api.post<ScheduleEntry[]>(`/students/${studentId}/schedule`, payload)

export const deleteScheduleEntry = (scheduleId: string) =>
  api.delete(`/training-schedules/${scheduleId}`)

export const completeScheduleEntry = (scheduleId: string) =>
  api.post<ScheduleEntry>(`/training-schedules/${scheduleId}/complete`)

// Student self-service
export const getMySchedule = (month?: string) =>
  api.get<ScheduleEntry[]>('/me/schedule', { params: month ? { month } : {} })

export const getMyDaySchedule = (date: string) =>   // date = "YYYY-MM-DD"
  api.get<ScheduleEntry>(`/me/schedule/${date}`)

export const completeMySchedule = (scheduleId: string) =>
  api.post<ScheduleEntry>(`/me/schedule/${scheduleId}/complete`)
```

---

## 7. Key UX notes

- **Date format:** always use `YYYY-MM-DD` when sending to the API. The response sends ISO timestamps (`2026-06-02T00:00:00.000000Z`) — use `.slice(0, 10)` to get the date key.
- **Upsert behaviour:** Saving to an already-assigned day replaces the plan silently — no need to confirm.
- **Rest days:** Submit with `training_plan_id: null` to mark a day as rest/off. The calendar can show a different chip for null-plan entries.
- **Instructor scope:** An instructor can only assign schedules for students in their own group. The API returns 403 for cross-group attempts.
- **Empty months:** The API returns only days that have a schedule entry (not all 30 days). Index by date key and treat missing keys as unscheduled.
- **Month boundary:** When the user navigates to a new month, re-fetch with `?month=YYYY-MM`. Cache in component state keyed by month string to avoid re-fetching on back-navigation within the session.
