import { describe, it, expect } from 'vitest';
import { validateEventForm, hasErrors } from './validation.utils';

describe('validateEventForm', () => {
  const validFields = {
    title: 'Team Meeting',
    startLocal: '2026-06-15T10:00',
    endLocal: '2026-06-15T11:00',
    timezone: 'America/New_York',
  };

  it('returns no errors for valid input', () => {
    const errors = validateEventForm(validFields);
    expect(hasErrors(errors)).toBe(false);
  });

  describe('title validation', () => {
    it('returns error when title is empty', () => {
      const errors = validateEventForm({ ...validFields, title: '' });
      expect(errors.title).toBe('Title is required');
    });

    it('returns error when title is only whitespace', () => {
      const errors = validateEventForm({ ...validFields, title: '   ' });
      expect(errors.title).toBe('Title is required');
    });

    it('returns error when title exceeds 255 characters', () => {
      const errors = validateEventForm({ ...validFields, title: 'a'.repeat(256) });
      expect(errors.title).toBe('Title must be 255 characters or less');
    });

    it('accepts title at exactly 255 characters', () => {
      const errors = validateEventForm({ ...validFields, title: 'a'.repeat(255) });
      expect(errors.title).toBeUndefined();
    });
  });

  describe('time validation', () => {
    it('returns error when start time is empty', () => {
      const errors = validateEventForm({ ...validFields, startLocal: '' });
      expect(errors.startTime).toBe('Start time is required');
    });

    it('returns error when end time is empty', () => {
      const errors = validateEventForm({ ...validFields, endLocal: '' });
      expect(errors.endTime).toBe('End time is required');
    });

    it('returns error when end time equals start time', () => {
      const errors = validateEventForm({
        ...validFields,
        startLocal: '2026-06-15T10:00',
        endLocal: '2026-06-15T10:00',
      });
      expect(errors.endTime).toBe('End time must be after start time');
    });

    it('returns error when end time is before start time', () => {
      const errors = validateEventForm({
        ...validFields,
        startLocal: '2026-06-15T12:00',
        endLocal: '2026-06-15T10:00',
      });
      expect(errors.endTime).toBe('End time must be after start time');
    });

    it('accepts when end time is after start time', () => {
      const errors = validateEventForm({
        ...validFields,
        startLocal: '2026-06-15T10:00',
        endLocal: '2026-06-15T10:15',
      });
      expect(errors.endTime).toBeUndefined();
    });
  });

  describe('timezone validation', () => {
    it('returns error when timezone is empty', () => {
      const errors = validateEventForm({ ...validFields, timezone: '' });
      expect(errors.timezone).toBe('Timezone is required');
    });

    it('accepts a valid timezone string', () => {
      const errors = validateEventForm({ ...validFields, timezone: 'Europe/London' });
      expect(errors.timezone).toBeUndefined();
    });
  });

  describe('multiple errors', () => {
    it('returns multiple errors at once', () => {
      const errors = validateEventForm({
        title: '',
        startLocal: '',
        endLocal: '',
        timezone: '',
      });
      expect(errors.title).toBeDefined();
      expect(errors.startTime).toBeDefined();
      expect(errors.endTime).toBeDefined();
      expect(errors.timezone).toBeDefined();
      expect(hasErrors(errors)).toBe(true);
    });
  });
});

describe('hasErrors', () => {
  it('returns false for empty errors object', () => {
    expect(hasErrors({})).toBe(false);
  });

  it('returns true when there is at least one error', () => {
    expect(hasErrors({ title: 'Required' })).toBe(true);
  });
});
