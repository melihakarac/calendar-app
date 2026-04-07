import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Box, CircularProgress, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { addWeeks, parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { useCalendarStore } from '../../stores/calendarStore';
import { roundToNearest15, formatDatetimeLocal } from '../../utils/date.utils';
import { useSortedTimezones } from '../../utils/timezone.utils';
import { useCreateEvent, useUpdateEvent, useDeleteEvent, useEventDetail } from '../../hooks/useEvents';
import { validateEventForm, hasErrors } from '../../utils/validation.utils';
import { CalendarDialogFrame } from '../ui/CalendarDialogFrame';
import { FormErrorAlert } from '../ui/FormErrorAlert';
import { palette } from '../../theme/theme';
import { EventConflictPanel } from './EventConflictPanel';
import { EventFormFields } from './EventFormFields';
import { EventRecurrenceSection } from './EventRecurrenceSection';
import { DeleteEventDialog } from './DeleteEventDialog';
import type { ConflictingEvent } from '../../types';
import { parseMutationError } from '../../utils/api-error.utils';

export function EventFormModal() {
  const { eventFormOpen, editingEventId, prefillStart, prefillEnd, viewingTimezone, closeForm } =
    useCalendarStore();

  const lastEditingId = useRef<string | null>(null);
  useEffect(() => {
    if (editingEventId) {
      lastEditingId.current = editingEventId;
    }
  }, [editingEventId]);
  const activeEditId = editingEventId ?? lastEditingId.current;
  const { data: existingEvent, isLoading: loadingEvent } = useEventDetail(activeEditId);

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const timezoneOptions = useSortedTimezones();

  const [title, setTitle] = useState('');
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');
  const [timezone, setTimezone] = useState(viewingTimezone);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceEndLocal, setRecurrenceEndLocal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictingEvent[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogRecurring, setDeleteDialogRecurring] = useState(false);

  const initialValues = useRef({
    title: '',
    startLocal: '',
    endLocal: '',
    timezone: '',
    isRecurring: false,
    recurrenceEndLocal: '',
  });

  const clearConflicts = useCallback(() => setConflicts([]), []);

  const resetForm = useCallback(() => {
    setTitle('');
    setStartLocal('');
    setEndLocal('');
    setTimezone(viewingTimezone);
    setIsRecurring(false);
    setRecurrenceEndLocal('');
    setError(null);
    setConflicts([]);
    setDeleteDialogOpen(false);
    setDeleteDialogRecurring(false);
    initialValues.current = {
      title: '',
      startLocal: '',
      endLocal: '',
      timezone: '',
      isRecurring: false,
      recurrenceEndLocal: '',
    };
    lastEditingId.current = null;
  }, [viewingTimezone]);

  useEffect(() => {
    if (!eventFormOpen) return;

    if (editingEventId && existingEvent) {
      const tz = existingEvent.timezone;
      const start = formatDatetimeLocal(toZonedTime(parseISO(existingEvent.startUtc), tz));
      const end = formatDatetimeLocal(toZonedTime(parseISO(existingEvent.endUtc), tz));
      const recurring = existingEvent.isRecurring;
      const recEnd = existingEvent.recurrenceEndUtc
        ? formatDatetimeLocal(toZonedTime(parseISO(existingEvent.recurrenceEndUtc), tz))
        : '';
      setTitle(existingEvent.title);
      setTimezone(tz);
      setStartLocal(start);
      setEndLocal(end);
      setIsRecurring(recurring);
      setRecurrenceEndLocal(recEnd);
      initialValues.current = {
        title: existingEvent.title,
        startLocal: start,
        endLocal: end,
        timezone: tz,
        isRecurring: recurring,
        recurrenceEndLocal: recEnd,
      };
    } else if (!editingEventId) {
      setTimezone(viewingTimezone);
      if (prefillStart && prefillEnd) {
        setStartLocal(formatDatetimeLocal(prefillStart));
        setEndLocal(formatDatetimeLocal(prefillEnd));
      } else {
        const now = roundToNearest15(new Date());
        const end = new Date(now.getTime() + 3600000);
        setStartLocal(formatDatetimeLocal(now));
        setEndLocal(formatDatetimeLocal(end));
      }
    }
  }, [eventFormOpen, editingEventId, existingEvent, prefillStart, prefillEnd, viewingTimezone]);

  const isEditMode = !!activeEditId;
  const hasChanges =
    !isEditMode ||
    title !== initialValues.current.title ||
    startLocal !== initialValues.current.startLocal ||
    endLocal !== initialValues.current.endLocal ||
    timezone !== initialValues.current.timezone ||
    isRecurring !== initialValues.current.isRecurring ||
    recurrenceEndLocal !== initialValues.current.recurrenceEndLocal;

  const handleRecurringChange = useCallback(
    (checked: boolean) => {
      setIsRecurring(checked);
      setConflicts([]);
      if (checked && !recurrenceEndLocal && endLocal) {
        setRecurrenceEndLocal(formatDatetimeLocal(addWeeks(new Date(endLocal), 4)));
      }
      if (!checked) {
        setRecurrenceEndLocal('');
      }
    },
    [recurrenceEndLocal, endLocal],
  );

  const handleSubmit = useCallback(async () => {
    setError(null);

    const validationErrors = validateEventForm({ title, startLocal, endLocal, timezone });
    if (hasErrors(validationErrors)) {
      setError(Object.values(validationErrors).filter(Boolean).join('. '));
      return;
    }

    if (isRecurring && !recurrenceEndLocal) {
      setError('Recurrence end date is required for recurring events');
      return;
    }

    if (isRecurring && recurrenceEndLocal) {
      const recEnd = new Date(recurrenceEndLocal);
      const end = new Date(endLocal);
      if (recEnd <= end) {
        setError('Recurrence end date must be after the event end time');
        return;
      }
    }

    const startDate = new Date(startLocal);
    const endDate = new Date(endLocal);

    const startUtc = fromZonedTime(startDate, timezone).toISOString();
    const endUtc = fromZonedTime(endDate, timezone).toISOString();
    const recurrenceEndUtc =
      isRecurring && recurrenceEndLocal
        ? fromZonedTime(new Date(recurrenceEndLocal), timezone).toISOString()
        : undefined;

    try {
      if (isEditMode && activeEditId) {
        await updateMutation.mutateAsync({
          id: activeEditId,
          payload: {
            title: title.trim(),
            startUtc,
            endUtc,
            timezone,
            isRecurring,
            recurrenceEndUtc: isRecurring && recurrenceEndUtc ? recurrenceEndUtc : null,
          },
        });
      } else {
        const payload = {
          title: title.trim(),
          startUtc,
          endUtc,
          timezone,
          isRecurring,
          ...(isRecurring && recurrenceEndUtc && { recurrenceEndUtc }),
        };
        await createMutation.mutateAsync(payload);
      }
      closeForm();
    } catch (err) {
      const parsed = parseMutationError(err);
      if (parsed.kind === 'conflict') {
        setConflicts(parsed.conflicts);
        setError(null);
      } else {
        setError(parsed.message);
      }
    }
  }, [
    title,
    startLocal,
    endLocal,
    timezone,
    isRecurring,
    recurrenceEndLocal,
    isEditMode,
    activeEditId,
    updateMutation,
    createMutation,
    closeForm,
  ]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeEditId) return;
    try {
      await deleteMutation.mutateAsync(activeEditId);
      setDeleteDialogOpen(false);
      closeForm();
    } catch (err) {
      setDeleteDialogOpen(false);
      const parsed = parseMutationError(err);
      if (parsed.kind === 'conflict') {
        setConflicts(parsed.conflicts);
        setError(null);
      } else {
        setError(parsed.message);
      }
    }
  }, [activeEditId, deleteMutation, closeForm]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const formTitle = isEditMode ? 'Edit Event' : 'New Event';

  return (
    <>
      <CalendarDialogFrame
        open={eventFormOpen}
        onClose={closeForm}
        title={formTitle}
        TransitionProps={{ onExited: resetForm }}
        interactionLocked={isSaving || isDeleting || deleteDialogOpen}
        actions={
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: isEditMode ? 'space-between' : 'flex-end',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {isEditMode && (
              <IconButton
                onClick={() => {
                  setDeleteDialogRecurring(Boolean(existingEvent?.isRecurring));
                  setDeleteDialogOpen(true);
                }}
                sx={{ color: palette.error }}
                aria-label="Delete event"
                disabled={isSaving || loadingEvent || isDeleting}
              >
                <DeleteOutlineIcon />
              </IconButton>
            )}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                onClick={closeForm}
                disabled={isSaving || isDeleting}
                sx={{ color: palette.secondary }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={
                  isSaving ||
                  loadingEvent ||
                  !hasChanges ||
                  conflicts.length > 0 ||
                  deleteDialogOpen
                }
              >
                {isSaving ? 'Saving…' : isEditMode ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Box>
        }
      >
        {loadingEvent && isEditMode && !deleteDialogOpen ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: palette.accent }} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              mt: 1,
              ...(deleteDialogOpen && { pointerEvents: 'none', opacity: 0.92 }),
            }}
            aria-hidden={deleteDialogOpen}
          >
            {error && <FormErrorAlert message={error} onDismiss={() => setError(null)} />}
            <EventConflictPanel conflicts={conflicts} />

            <EventFormFields
              title={title}
              onTitleChange={setTitle}
              startLocal={startLocal}
              endLocal={endLocal}
              onStartChange={setStartLocal}
              onEndChange={setEndLocal}
              timezone={timezone}
              onTimezoneChange={setTimezone}
              timezoneOptions={timezoneOptions}
              onClearConflicts={clearConflicts}
              autoFocusTitle
            />

            <EventRecurrenceSection
              isRecurring={isRecurring}
              onRecurringChange={handleRecurringChange}
              recurrenceEndLocal={recurrenceEndLocal}
              onRecurrenceEndChange={setRecurrenceEndLocal}
              onClearConflicts={clearConflicts}
            />
          </Box>
        )}
      </CalendarDialogFrame>

      <DeleteEventDialog
        open={deleteDialogOpen && eventFormOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        eventTitle={title.trim() || 'this event'}
        isRecurring={deleteDialogRecurring}
      />
    </>
  );
}
