# Calendar App — Frontend

React single-page application for a calendar scheduling app with daily, weekly, and monthly views, timezone support, and overlap prevention.

## Architecture

```
src/
├── main.tsx                         # App entry point
├── App.tsx                          # Root component
├── theme/
│   └── theme.ts                     # MUI theme (palette, typography, component overrides)
├── components/
│   ├── calendar/
│   │   ├── CalendarApp.tsx          # Main layout, view switching, loading state
│   │   ├── CalendarHeader.tsx       # Navigation, view tabs, create button
│   │   ├── DayView.tsx             # Single-day time grid
│   │   ├── WeekView.tsx            # 7-column week layout + day headers
│   │   ├── MonthView.tsx           # Monthly grid with event pills
│   │   ├── TimeGrid.tsx            # 24-hour grid, event positioning, drag-to-create
│   │   ├── EventBlock.tsx          # Individual event rendering
│   │   ├── EventFormModal.tsx      # Create/edit form with overlap handling
│   │   ├── CurrentTimeIndicator.tsx # Live time line
│   │   └── TimezoneSelector.tsx    # Searchable timezone dropdown
│   └── ui/
│       └── ErrorBoundary.tsx        # Error boundary wrapper
├── hooks/
│   ├── useEvents.ts                 # React Query hooks (list, detail, mutations)
│   └── useCalendarNavigation.ts     # Date range computation per view
├── stores/
│   └── calendarStore.ts             # Zustand: view mode, selected date, timezone, form state
├── api/
│   └── events.api.ts                # Axios API client
├── utils/
│   ├── date.utils.ts                # Timezone conversion, formatting, date math
│   └── validation.utils.ts          # Client-side form validation
├── types/
│   └── index.ts                     # TypeScript interfaces
├── lib/
│   └── query-client.ts              # React Query client configuration
├── routes/
│   └── index.tsx                    # TanStack Router config
└── test/
    └── setup.ts                     # Vitest setup
```

## State Management

State is split by source of truth:


| What                               | Where       | Why                                      |
| ---------------------------------- | ----------- | ---------------------------------------- |
| Event data (list, detail)          | React Query | Server state, cache, background refetch  |
| View mode, selected date, timezone | Zustand     | UI state, persists across navigation     |
| Form fields (title, times)         | Local state | Ephemeral, scoped to component lifecycle |


React Query is the **single source of truth** for event data. Zustand never duplicates server state.

### React Query Conventions

```typescript
// Query key factory
export const eventKeys = {
  all:    ['events'] as const,
  list:   (from: string, to: string) => ['events', 'list', { from, to }] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
};
```

- `placeholderData: keepPreviousData` prevents content flicker during date navigation
- Stale time: 30s for lists, 60s for individual events
- Mutations invalidate relevant queries
- Optimistic updates for delete (instant feedback with rollback)

## Component Patterns

### Calendar Views

All three views are **lazy-loaded** via `React.lazy` + `Suspense` for code splitting:

- **DayView**: Single column, delegates to `TimeGrid`
- **WeekView**: 7-column layout with clickable day headers, delegates to `TimeGrid`
- **MonthView**: CSS grid with event pills, "+N more" overflow

### TimeGrid

The core scheduling component:

- 24 hours × 60px per hour = 1440px total height
- Events are absolutely positioned: `top = minutes from midnight`, `height = duration in minutes`
- Overlapping events share column space via a layout algorithm
- **Click-and-drag** to create events with a 15-minute snap grid
- Clicking an existing event opens the edit form (doesn't start drag)

### EventFormModal

- Creates and edits events in a single modal
- Client-side validation before API call
- Overlap conflicts show a detailed amber panel listing all conflicting events with their time ranges
- Create/Update button disabled when conflicts exist or no changes detected
- Smooth close animation without UI glitches (title doesn't flash between "Edit" and "New")

### Timezone Handling

- **Viewing timezone** stored in Zustand (defaults to browser's `Intl` timezone)
- All rendering converts UTC → viewing timezone via `date-fns-tz`
- Event form has a searchable timezone selector with **300ms debounce**
- Events show a timezone badge when their original timezone differs from the viewing timezone
- Creating an event: user picks local time + timezone → frontend converts to UTC before API call

## Design System

Dribbble-inspired aesthetic with indigo/violet accent palette:

- **Font**: Inter (Google Fonts)
- **Colors**: Indigo/violet primary, warm grays, pastel event colors
- **Animations**: Smooth view transitions, animated pill-style tab switcher, spring-like modal enter
- **Loading**: Linear progress bar with 600ms minimum display, skeleton states for initial loads
- **Event blocks**: Solid pastel backgrounds with borders for contrast against the grid

The MUI theme (`src/theme/theme.ts`) overrides all default MUI styles. Ripple is disabled in favor of subtle opacity/scale transitions.

## Testing

```bash
npm test               # Run all tests
npm run test:watch     # Watch mode
```

### Test Coverage

**Date Utilities** (`date.utils.test.ts` — 29 tests):

- UTC ↔ local timezone conversions (New York, Tokyo, London, Los Angeles)
- Round-trip conversion accuracy
- Time formatting (12h format, AM/PM, midnight, noon)
- Hour label formatting (12 AM, 12 PM, edge cases)
- Minutes from midnight calculation
- Duration computation between ISO strings
- Safe ISO parsing (valid, invalid, empty)
- Round-to-nearest-15-minute snapping
- Date-with-time creation

**Form Validation** (`validation.utils.test.ts` — 15 tests):

- Title: required, whitespace-only, 255-char limit, exact boundary
- Times: required start/end, end-before-start, end-equals-start
- Timezone: required
- Multiple simultaneous errors
- Error presence detection

## Development

```bash
npm run dev            # Vite dev server on port 5173
npm run build          # Production build (TypeScript check + Vite)
npm run lint           # ESLint
npm run preview        # Preview production build
```

The dev server proxies `/api` requests to `http://localhost:3000` (backend).

## Performance

- **React.lazy**: View components are code-split and lazy-loaded
- **React.memo**: Applied to `EventBlock` and `TimeGrid` to avoid unnecessary re-renders
- **useMemo**: Derived calendar grid data, event-by-day mappings, sorted timezone lists
- **keepPreviousData**: Prevents skeleton flash during date navigation
- **Debounced search**: Timezone selector uses 300ms debounce for filtering

