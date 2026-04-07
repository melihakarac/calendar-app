import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import { parseMutationError } from './api-error.utils';
import type { ApiError } from '../types';

function axiosErr(status: number, data?: ApiError) {
  const err = new AxiosError('Request failed');
  Object.assign(err, { response: { status, data } });
  return err;
}

describe('parseMutationError', () => {
  it('returns conflict when 409 with conflictingEvents', () => {
    const conflicts = [{ id: '1', title: 'A', startUtc: '', endUtc: '' }];
    const parsed = parseMutationError(
      axiosErr(409, { statusCode: 409, message: 'Conflict', conflictingEvents: conflicts }),
    );
    expect(parsed).toEqual({ kind: 'conflict', conflicts });
  });

  it('returns message for 409 without conflicts', () => {
    const parsed = parseMutationError(axiosErr(409, { statusCode: 409, message: 'Nope' }));
    expect(parsed).toEqual({ kind: 'message', message: 'Nope' });
  });

  it('prefers API message for other errors', () => {
    const parsed = parseMutationError(
      axiosErr(400, { statusCode: 400, message: 'Bad input' }),
    );
    expect(parsed).toEqual({ kind: 'message', message: 'Bad input' });
  });

  it('handles non-Axios Error', () => {
    expect(parseMutationError(new Error('fail'))).toEqual({
      kind: 'message',
      message: 'fail',
    });
  });

  it('handles unknown values', () => {
    expect(parseMutationError(null)).toEqual({
      kind: 'message',
      message: 'An unexpected error occurred',
    });
  });
});
