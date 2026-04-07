import { z } from 'zod';

function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(255, 'Title must be 255 characters or less');

const datetimeSchema = z.iso.datetime({ error: 'Must be a valid ISO 8601 UTC datetime' });

const timezoneSchema = z.string().refine(isValidIANATimezone, {
  message: 'Must be a valid IANA timezone',
});

const endAfterStartRefine = <T extends { startUtc: string; endUtc: string }>(
  data: T,
) => new Date(data.endUtc) > new Date(data.startUtc);

export const createEventSchema = z
  .object({
    title: titleSchema,
    startUtc: datetimeSchema,
    endUtc: datetimeSchema,
    timezone: timezoneSchema,
  })
  .refine(endAfterStartRefine, {
    message: 'End time must be after start time',
    path: ['endUtc'],
  });

export const updateEventSchema = z
  .object({
    title: titleSchema.optional(),
    startUtc: datetimeSchema.optional(),
    endUtc: datetimeSchema.optional(),
    timezone: timezoneSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startUtc && data.endUtc) {
        return endAfterStartRefine({ startUtc: data.startUtc, endUtc: data.endUtc });
      }
      return true;
    },
    { message: 'End time must be after start time', path: ['endUtc'] },
  );

export const queryEventsSchema = z
  .object({
    from: datetimeSchema,
    to: datetimeSchema,
  })
  .refine((data) => new Date(data.from) < new Date(data.to), {
    message: '"from" must be before "to"',
    path: ['from'],
  });

export type CreateEventDto = z.infer<typeof createEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
export type QueryEventsDto = z.infer<typeof queryEventsSchema>;
