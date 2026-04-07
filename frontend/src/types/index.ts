export type ViewMode = 'day' | 'week' | 'month';

export interface CalendarEvent {
  id: string;
  title: string;
  startUtc: string;
  endUtc: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  title: string;
  startUtc: string;
  endUtc: string;
  timezone: string;
}

export interface UpdateEventPayload {
  title?: string;
  startUtc?: string;
  endUtc?: string;
  timezone?: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ConflictingEvent {
  id: string;
  title: string;
  startUtc: string;
  endUtc: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  conflictingEvents?: ConflictingEvent[];
}
