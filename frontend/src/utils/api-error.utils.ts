import { isAxiosError } from 'axios';
import type { ApiError, ConflictingEvent } from '../types';

export type ParsedMutationError =
  | { kind: 'conflict'; conflicts: ConflictingEvent[] }
  | { kind: 'message'; message: string };

/**
 * Normalizes Axios / API error payloads from mutation catch blocks.
 */
export function parseMutationError(error: unknown): ParsedMutationError {
  if (isAxiosError(error) && error.response) {
    const status = error.response.status;
    const data = error.response.data as ApiError | undefined;
    if (status === 409 && data?.conflictingEvents?.length) {
      return { kind: 'conflict', conflicts: data.conflictingEvents };
    }
    const message =
      (typeof data?.message === 'string' && data.message) ||
      (typeof error.message === 'string' && error.message) ||
      'Request failed';
    return { kind: 'message', message };
  }
  if (error instanceof Error) {
    return { kind: 'message', message: error.message };
  }
  return { kind: 'message', message: 'An unexpected error occurred' };
}
