import { addDays, addMonths } from 'date-fns';
import { create } from 'zustand';
import type { ViewMode } from '../types';

interface CalendarState {
  viewMode: ViewMode;
  selectedDate: Date;
  viewingTimezone: string;
  eventFormOpen: boolean;
  editingEventId: string | null;
  prefillStart: Date | null;
  prefillEnd: Date | null;

  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: Date) => void;
  setViewingTimezone: (tz: string) => void;
  navigateForward: () => void;
  navigateBackward: () => void;
  navigateToToday: () => void;
  openCreateForm: (start?: Date, end?: Date) => void;
  openEditForm: (eventId: string) => void;
  closeForm: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  viewMode: 'week',
  selectedDate: new Date(),
  viewingTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  eventFormOpen: false,
  editingEventId: null,
  prefillStart: null,
  prefillEnd: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewingTimezone: (tz) => set({ viewingTimezone: tz }),

  navigateForward: () => {
    const { viewMode, selectedDate } = get();
    const d =
      viewMode === 'day'
        ? addDays(selectedDate, 1)
        : viewMode === 'week'
          ? addDays(selectedDate, 7)
          : addMonths(selectedDate, 1);
    set({ selectedDate: d });
  },

  navigateBackward: () => {
    const { viewMode, selectedDate } = get();
    const d =
      viewMode === 'day'
        ? addDays(selectedDate, -1)
        : viewMode === 'week'
          ? addDays(selectedDate, -7)
          : addMonths(selectedDate, -1);
    set({ selectedDate: d });
  },

  navigateToToday: () => set({ selectedDate: new Date() }),

  openCreateForm: (start, end) =>
    set({
      eventFormOpen: true,
      editingEventId: null,
      prefillStart: start ?? null,
      prefillEnd: end ?? null,
    }),

  openEditForm: (eventId) =>
    set({
      eventFormOpen: true,
      editingEventId: eventId,
      prefillStart: null,
      prefillEnd: null,
    }),

  closeForm: () =>
    set({
      eventFormOpen: false,
      editingEventId: null,
      prefillStart: null,
      prefillEnd: null,
    }),
}));
