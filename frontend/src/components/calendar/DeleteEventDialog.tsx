import { useState, useEffect, useCallback } from 'react';
import { Button, Typography, Alert, Box } from '@mui/material';
import { CalendarDialogFrame } from '../ui/CalendarDialogFrame';
import { palette } from '../../theme/theme';

export interface DeleteEventDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  eventTitle: string;
  isRecurring: boolean;
}

export function DeleteEventDialog({
  open,
  onClose,
  onConfirm,
  isDeleting,
  eventTitle,
  isRecurring,
}: DeleteEventDialogProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  const handleConfirm = useCallback(async () => {
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError('Failed to delete event. Please try again.');
    }
  }, [onConfirm]);

  return (
    <CalendarDialogFrame
      open={open}
      onClose={onClose}
      title="Delete event?"
      maxWidth="xs"
      interactionLocked={isDeleting}
      actions={
        <>
          <Button onClick={onClose} disabled={isDeleting} sx={{ color: palette.secondary }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ fontSize: 13 }}>
            {error}
          </Alert>
        )}

        <Typography sx={{ fontSize: 14, color: palette.secondary, lineHeight: 1.5 }}>
          {isRecurring ? (
            <>
              This will remove the recurring series <strong>{eventTitle}</strong> and all future
              occurrences stored for it.
            </>
          ) : (
            <>
              Are you sure you want to delete <strong>{eventTitle}</strong>? This cannot be undone.
            </>
          )}
        </Typography>
      </Box>
    </CalendarDialogFrame>
  );
}
