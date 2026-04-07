import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Autocomplete,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { format, parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import { useCalendarStore } from '../../stores/calendarStore';
import { roundToNearest15, formatDatetimeLocal } from '../../utils/date.utils';
import { formatTimezoneLabel, useSortedTimezones } from '../../utils/timezone.utils';
import { useCreateEvent, useUpdateEvent, useDeleteEvent, useEventDetail } from '../../hooks/useEvents';
import { validateEventForm, hasErrors } from '../../utils/validation.utils';
import { palette, transitions } from '../../theme/theme';
import type { ApiError, ConflictingEvent } from '../../types';
import { AxiosError } from 'axios';

export function EventFormModal() {
  const { eventFormOpen, editingEventId, prefillStart, prefillEnd, viewingTimezone, closeForm } =
    useCalendarStore();

  const lastEditingId = useRef<string | null>(null);
  if (editingEventId) {
    lastEditingId.current = editingEventId;
  }
  const activeEditId = editingEventId ?? lastEditingId.current;
  const { data: existingEvent, isLoading: loadingEvent } = useEventDetail(activeEditId);

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const allTimezones = useSortedTimezones();

  const [title, setTitle] = useState('');
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');
  const [timezone, setTimezone] = useState(viewingTimezone);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictingEvent[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const initialValues = useRef({ title: '', startLocal: '', endLocal: '', timezone: '' });

  const resetForm = useCallback(() => {
    setTitle('');
    setStartLocal('');
    setEndLocal('');
    setTimezone(viewingTimezone);
    setError(null);
    setConflicts([]);
    setShowDeleteConfirm(false);
    initialValues.current = { title: '', startLocal: '', endLocal: '', timezone: '' };
    lastEditingId.current = null;
  }, [viewingTimezone]);

  useEffect(() => {
    if (!eventFormOpen) return;

    if (editingEventId && existingEvent) {
      const tz = existingEvent.timezone;
      const start = formatDatetimeLocal(toZonedTime(parseISO(existingEvent.startUtc), tz));
      const end = formatDatetimeLocal(toZonedTime(parseISO(existingEvent.endUtc), tz));
      setTitle(existingEvent.title);
      setTimezone(tz);
      setStartLocal(start);
      setEndLocal(end);
      initialValues.current = { title: existingEvent.title, startLocal: start, endLocal: end, timezone: tz };
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
  const hasChanges = !isEditMode || (
    title !== initialValues.current.title ||
    startLocal !== initialValues.current.startLocal ||
    endLocal !== initialValues.current.endLocal ||
    timezone !== initialValues.current.timezone
  );

  const handleSubmit = useCallback(async () => {
    setError(null);

    const validationErrors = validateEventForm({ title, startLocal, endLocal, timezone });
    if (hasErrors(validationErrors)) {
      setError(Object.values(validationErrors).filter(Boolean).join('. '));
      return;
    }

    const startDate = new Date(startLocal);
    const endDate = new Date(endLocal);

    const startUtc = fromZonedTime(startDate, timezone).toISOString();
    const endUtc = fromZonedTime(endDate, timezone).toISOString();

    try {
      if (isEditMode && activeEditId) {
        await updateMutation.mutateAsync({
          id: activeEditId,
          payload: { title: title.trim(), startUtc, endUtc, timezone },
        });
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          startUtc,
          endUtc,
          timezone,
        });
      }
      closeForm();
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiErr = err.response?.data as ApiError | undefined;
        if (err.response?.status === 409 && apiErr?.conflictingEvents?.length) {
          setConflicts(apiErr.conflictingEvents);
          setError(null);
        } else {
          setError(apiErr?.message || 'Failed to save event');
        }
      } else {
        setError('An unexpected error occurred');
      }
    }
  }, [title, startLocal, endLocal, timezone, isEditMode, activeEditId, updateMutation, createMutation, closeForm]);

  const handleDelete = useCallback(async () => {
    if (!activeEditId) return;
    try {
      await deleteMutation.mutateAsync(activeEditId);
      closeForm();
    } catch {
      setError('Failed to delete event');
    }
  }, [activeEditId, deleteMutation, closeForm]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <Dialog
      open={eventFormOpen}
      onClose={closeForm}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onExited: resetForm }}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          backgroundColor: palette.surfaceBg,
          border: `1px solid ${palette.divider}`,
          boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
          animation: eventFormOpen ? `modalEnter ${transitions.spring}` : undefined,
          '@keyframes modalEnter': {
            from: { opacity: 0, transform: 'scale(0.96) translateY(8px)' },
            to: { opacity: 1, transform: 'scale(1) translateY(0)' },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          px: 3,
          pt: 3,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: palette.primary, letterSpacing: '-0.2px' }}>
          {isEditMode ? 'Edit Event' : 'New Event'}
        </Typography>
        <IconButton
          onClick={closeForm}
          size="small"
          aria-label="Close"
          sx={{
            backgroundColor: palette.hoverBg,
            width: 32,
            height: 32,
            '&:hover': { backgroundColor: palette.activeBg },
          }}
        >
          <CloseIcon sx={{ fontSize: 16, color: palette.secondary }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1 }}>
        {loadingEvent && isEditMode ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: palette.accent }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {error && (
              <Alert
                severity="error"
                onClose={() => setError(null)}
                sx={{
                  borderRadius: '10px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  '& .MuiAlert-icon': { color: palette.error },
                  fontSize: 13,
                }}
              >
                {error}
              </Alert>
            )}

            {conflicts.length > 0 && (
              <Box
                sx={{
                  borderRadius: '12px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  p: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <EventBusyRoundedIcon sx={{ fontSize: 18, color: '#D97706' }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
                    Time conflicts with {conflicts.length === 1 ? 'an existing event' : `${conflicts.length} existing events`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {conflicts.map((c) => (
                    <Box
                      key={c.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#FEF3C7',
                        borderRadius: '8px',
                        px: 1.5,
                        py: 0.75,
                      }}
                    >
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#78350F' }}>
                        {c.title}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#92400E', whiteSpace: 'nowrap', ml: 1.5 }}>
                        {format(parseISO(c.startUtc), 'h:mm a')} – {format(parseISO(c.endUtc), 'h:mm a')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Typography sx={{ fontSize: 12, color: '#A16207', mt: 1.5 }}>
                  Adjust the start or end time to avoid overlaps.
                </Typography>
              </Box>
            )}

            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              autoFocus
              placeholder="Event title"
              inputProps={{ maxLength: 255 }}
            />

            <TextField
              label="Start"
              type="datetime-local"
              value={startLocal}
              onChange={(e) => { setStartLocal(e.target.value); setConflicts([]); }}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="End"
              type="datetime-local"
              value={endLocal}
              onChange={(e) => { setEndLocal(e.target.value); setConflicts([]); }}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Autocomplete
              value={timezone}
              onChange={(_, val) => { if (val) { setTimezone(val); setConflicts([]); } }}
              options={allTimezones}
              getOptionLabel={formatTimezoneLabel}
              disableClearable
              renderInput={(params) => <TextField {...params} label="Timezone" />}
              slotProps={{
                paper: {
                  sx: {
                    fontSize: 14,
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  },
                },
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1,
          justifyContent: isEditMode ? 'space-between' : 'flex-end',
        }}
      >
        {isEditMode && (
          <Box>
            {showDeleteConfirm ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 13, color: palette.error }}>Delete?</Typography>
                <Button
                  size="small"
                  color="error"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, delete'}
                </Button>
                <Button size="small" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </Box>
            ) : (
              <IconButton
                onClick={() => setShowDeleteConfirm(true)}
                sx={{ color: palette.error }}
                aria-label="Delete event"
              >
                <DeleteOutlineIcon />
              </IconButton>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={closeForm} sx={{ color: palette.secondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSaving || loadingEvent || !hasChanges || conflicts.length > 0}
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
