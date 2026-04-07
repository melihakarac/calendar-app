import { Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import { palette, transitions } from '../../theme/theme';

export interface EventRecurrenceSectionProps {
  isRecurring: boolean;
  onRecurringChange: (checked: boolean) => void;
  recurrenceEndLocal: string;
  onRecurrenceEndChange: (value: string) => void;
  onClearConflicts: () => void;
}

export function EventRecurrenceSection({
  isRecurring,
  onRecurringChange,
  recurrenceEndLocal,
  onRecurrenceEndChange,
  onClearConflicts,
}: EventRecurrenceSectionProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        borderRadius: '12px',
        backgroundColor: isRecurring ? '#F0F0FF' : palette.hoverBg,
        border: `1px solid ${isRecurring ? '#C7D2FE' : palette.divider}`,
        p: 2,
        transition: transitions.normal,
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={isRecurring}
            onChange={(_, checked) => onRecurringChange(checked)}
            size="small"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <RepeatRoundedIcon
              sx={{ fontSize: 16, color: isRecurring ? palette.accent : palette.tertiary }}
            />
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: isRecurring ? palette.accent : palette.secondary,
              }}
            >
              Repeat weekly
            </Typography>
          </Box>
        }
      />

      {isRecurring && (
        <TextField
          label="Repeat until"
          type="datetime-local"
          value={recurrenceEndLocal}
          onChange={(e) => {
            onRecurrenceEndChange(e.target.value);
            onClearConflicts();
          }}
          fullWidth
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )}
    </Box>
  );
}
