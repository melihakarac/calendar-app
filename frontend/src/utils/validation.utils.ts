export interface EventFormErrors {
  title?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

export function validateEventForm(fields: {
  title: string;
  startLocal: string;
  endLocal: string;
  timezone: string;
}): EventFormErrors {
  const errors: EventFormErrors = {};

  if (!fields.title.trim()) {
    errors.title = 'Title is required';
  } else if (fields.title.trim().length > 255) {
    errors.title = 'Title must be 255 characters or less';
  }

  if (!fields.startLocal) {
    errors.startTime = 'Start time is required';
  }

  if (!fields.endLocal) {
    errors.endTime = 'End time is required';
  }

  if (fields.startLocal && fields.endLocal) {
    const start = new Date(fields.startLocal);
    const end = new Date(fields.endLocal);
    if (end <= start) {
      errors.endTime = 'End time must be after start time';
    }
  }

  if (!fields.timezone) {
    errors.timezone = 'Timezone is required';
  }

  return errors;
}

export function hasErrors(errors: EventFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
