import axios from 'axios';
import type {
  CalendarEvent,
  CreateEventPayload,
  UpdateEventPayload,
  ApiResponse,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchEvents(from: string, to: string): Promise<CalendarEvent[]> {
  const { data } = await api.get<ApiResponse<CalendarEvent[]>>('/events', {
    params: { from, to },
  });
  return data.data;
}

export async function fetchEvent(id: string): Promise<CalendarEvent> {
  const { data } = await api.get<ApiResponse<CalendarEvent>>(`/events/${id}`);
  return data.data;
}

export async function createEvent(payload: CreateEventPayload): Promise<CalendarEvent> {
  const { data } = await api.post<ApiResponse<CalendarEvent>>('/events', payload);
  return data.data;
}

export async function updateEvent(
  id: string,
  payload: UpdateEventPayload,
): Promise<CalendarEvent> {
  const { data } = await api.patch<ApiResponse<CalendarEvent>>(`/events/${id}`, payload);
  return data.data;
}

export async function deleteEvent(id: string): Promise<CalendarEvent> {
  const { data } = await api.delete<ApiResponse<CalendarEvent>>(`/events/${id}`);
  return data.data;
}
