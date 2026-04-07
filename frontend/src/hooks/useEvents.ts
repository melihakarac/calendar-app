import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchEvents,
  fetchEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../api/events.api';
import type { CreateEventPayload, UpdateEventPayload, CalendarEvent } from '../types';

export const eventKeys = {
  all: ['events'] as const,
  list: (from: string, to: string) => ['events', 'list', { from, to }] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
};

export function useEventsList(from: string, to: string) {
  return useQuery({
    queryKey: eventKeys.list(from, to),
    queryFn: () => fetchEvents(from, to),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useEventDetail(id: string | null) {
  return useQuery({
    queryKey: eventKeys.detail(id!),
    queryFn: () => fetchEvent(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEventPayload }) =>
      updateEvent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.all });
      queryClient.removeQueries({ queryKey: eventKeys.detail(id) });
      const queries = queryClient.getQueriesData<CalendarEvent[]>({
        queryKey: ['events', 'list'],
      });
      const snapshot = new Map(queries);
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData(
            key,
            data.filter((e) => e.id !== id),
          );
        }
      }
      return { snapshot };
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        for (const [key, data] of context.snapshot) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events', 'list'] });
    },
  });
}
