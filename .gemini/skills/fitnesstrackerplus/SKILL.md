---
name: fitnesstrackerplus
description: >
  Development guide and rules for the FitnessTrackerPlus project — a React/TypeScript
  web app that connects to Bluetooth sensors (HR monitors, treadmills) and records
  fitness activity data as GPX files. Activate this skill whenever working on any code
  in the fitnesstrackerplus workspace.
---

# FitnessTrackerPlus — Project Skill

## 1. Project Overview

FitnessTrackerPlus is a browser-based fitness tracking app built with:

- **React 18** (functional components with hooks)
- **TypeScript** (strict mode)
- **Material UI 5** for component library
- **Web Bluetooth API** for sensor connectivity
- **Create React App** as the build toolchain

### What It Does

1. Connects to Bluetooth LE sensors (heart rate monitors, treadmills, etc.)
2. Displays live sensor data on screen (HR, speed, pace, inclination)
3. Records timestamped data points during an activity session
4. Exports recorded activities as GPX files

### Architecture Layers

```
src/
├── domain/          # Interfaces, models, enums — zero dependencies
│   ├── ISensor.ts
│   ├── IRecorder.ts
│   ├── IGpxExporter.ts
│   └── models.ts
├── services/        # Business logic implementations
│   ├── ActivityRecorder.ts
│   ├── GpxExporter.ts
│   └── TimeFormatter.ts
├── sensors/         # Bluetooth + virtual sensor implementations
│   ├── SensorManager.ts
│   ├── VirtualSensors.ts
│   └── bluetooth/
├── hooks/           # React hooks wrapping services
│   ├── useRecorder.ts
│   └── useHeartRateSensor.ts
├── components/      # Presentational React components
└── App.tsx          # Root shell — thin composition layer
```

---

## 2. Workflow Rules

### 2.1 — Always Plan Before Coding

> **Before writing any code, discuss the implementation plan with the user.**

- Outline what files will be created or modified
- Describe the approach and any trade-offs
- Wait for user agreement before proceeding
- For non-trivial changes, create an artifact with the plan

### 2.2 — No Commits, No Pushes

> **Never run `git commit`, `git push`, or any git write operations.**

- The user manages their own git workflow (staging, committing, branching)
- You may use `git status`, `git diff`, `git log` for read-only inspection
- You may suggest what to commit, but do not execute it

### 2.3 — Incremental Delivery

- Implement changes in small, reviewable increments
- After each logical unit of work, confirm with the user before continuing
- Prefer working code at every step over big-bang rewrites

---

## 3. Coding Standards

### 3.1 — SOLID Principles

These are **mandatory** for all code in this project:

**Single Responsibility**
- Each class/module does one thing. A recorder records. An exporter exports.
  A component renders. A hook manages state.

**Open/Closed**
- Design for extension. New sensor types (treadmill, power meter) should be
  addable without modifying existing sensor code — just implement `ISensor<T>`.

**Liskov Substitution**
- Any implementation of `ISensor<T>`, `IRecorder`, or `IGpxExporter` must be
  swappable without breaking consumers. Virtual sensors must behave identically
  to real Bluetooth sensors from the consumer's perspective.

**Interface Segregation**
- Keep interfaces focused. `ISensor<T>` doesn't know about recording.
  `IRecorder` doesn't know about Bluetooth. `IGpxExporter` doesn't know about
  the UI.

**Dependency Inversion**
- High-level modules depend on abstractions (interfaces), not concrete classes.
- Pass dependencies via constructor injection or hook parameters.
- This enables mocking for tests and swapping implementations.

### 3.2 — TypeScript Conventions

- **Strict mode** — no `any` types unless absolutely necessary (e.g., library
  interop). If `any` is used, add a comment explaining why.
- **Interfaces for contracts** — prefix with `I` (e.g., `ISensor`, `IRecorder`)
- **Enums for state** — use TypeScript enums for recording states, connection
  states, etc.
- **Readonly where possible** — mark properties that shouldn't change after
  construction
- **No magic strings** — use constants or enums

### 3.3 — React Conventions

- **Functional components only** — no class components
- **Custom hooks** for non-trivial state logic
- **Props interfaces** — every component defines its props as an interface
- **No business logic in components** — components call hooks, hooks call
  services

### 3.4 — Styling

- Use MUI's `ThemeProvider` and `sx` prop for theming
- CSS classes for layout and custom styling in `App.css`
- Dark theme is the default and only theme
- Green accent palette: `#2f5c05` → `#91a47d`

---

## 4. Testing Strategy

### 4.1 — What to Test

| Layer | What to test | How |
|-------|-------------|-----|
| Domain models | Construction, validation | Unit tests |
| Services | State machines, data transformations, GPX output | Unit tests with plain instantiation |
| Sensors | Behavior via interface | Unit tests with mock implementations |
| Hooks | State transitions, side effects | React Testing Library + `renderHook` |
| Components | Rendering, user interactions | React Testing Library |

### 4.2 — Mocking Through Interfaces

Because services depend on **interfaces**, not concrete classes, tests can
inject mock implementations:

```typescript
// Example: testing the recorder with a fake clock
const recorder = new ActivityRecorder();
recorder.start();
recorder.addDataPoint({ timestamp: new Date('2025-01-01T00:00:00Z'), hr: 72 });
recorder.addDataPoint({ timestamp: new Date('2025-01-01T00:00:01Z'), hr: 75 });
const points = recorder.getTrackPoints();
expect(points).toHaveLength(2);
```

```typescript
// Example: testing GPX export in isolation
const exporter = new GpxExporter();
const gpx = exporter.export([
  { timestamp: new Date('2025-01-01T00:00:00Z'), hr: 72 }
]);
expect(gpx).toContain('<trkpt');
expect(gpx).toContain('<gpxtpx:hr>72</gpxtpx:hr>');
```

### 4.3 — Virtual Sensors for Development

`VirtualSensors` provides fake sensor data for development without Bluetooth
hardware. Use `SensorManager.UseVirtualSensors = true` in development or tests.

---

## 5. Domain Knowledge

### 5.1 — GPX Format

GPX 1.1 is the export format. Key structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="FitnessTrackerPlus">
  <trk>
    <name>Activity 2025-01-01</name>
    <trkseg>
      <trkpt lat="0" lon="0">
        <time>2025-01-01T00:00:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>72</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
```

When no GPS data is available (e.g., treadmill), `lat` and `lon` are `0`.

### 5.2 — Bluetooth LE Services

| Sensor | BLE Service UUID | Key Characteristic |
|--------|-----------------|-------------------|
| Heart Rate | `heart_rate` | `heart_rate_measurement` |
| Treadmill | `fitness_machine` | TBD — to be reverse-engineered |

### 5.3 — Recording State Machine

```
IDLE → (start) → RECORDING → (pause) → PAUSED → (resume) → RECORDING
                           → (stop)  → STOPPED
                  PAUSED   → (stop)  → STOPPED
```

Data points are only collected in `RECORDING` state.

---

## 6. File Naming Conventions

- **Interfaces**: `I<Name>.ts` (e.g., `ISensor.ts`, `IRecorder.ts`)
- **Implementations**: `<Name>.ts` (e.g., `ActivityRecorder.ts`, `GpxExporter.ts`)
- **React components**: `<Name>.tsx` (PascalCase)
- **Hooks**: `use<Name>.ts` (camelCase with `use` prefix)
- **Tests**: `<Name>.test.ts` or `<Name>.test.tsx` (co-located in `__tests__/` dirs)
- **Models/Enums**: `models.ts` within the relevant directory
