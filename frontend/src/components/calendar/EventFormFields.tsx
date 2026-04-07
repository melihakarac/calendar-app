import { TextField, Autocomplete } from '@mui/material';
import { formatTimezoneLabel } from '../../utils/timezone.utils';

export interface EventFormFieldsProps {
  title: string;
  onTitleChange: (value: string) => void;
  startLocal: string;
  endLocal: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  timezone: string;
  onTimezoneChange: (value: string) => void;
  timezoneOptions: string[];
  onClearConflicts: () => void;
  autoFocusTitle?: boolean;
}

const autocompletePaperSx = {
  fontSize: 14,
  borderRadius: 2,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export function EventFormFields({
  title,
  onTitleChange,
  startLocal,
  endLocal,
  onStartChange,
  onEndChange,
  timezone,
  onTimezoneChange,
  timezoneOptions,
  onClearConflicts,
  autoFocusTitle = true,
}: EventFormFieldsProps) {
  return (
    <>
      <TextField
        label="Title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        fullWidth
        autoFocus={autoFocusTitle}
        placeholder="Event title"
        inputProps={{ maxLength: 255 }}
      />

      <TextField
        label="Start"
        type="datetime-local"
        value={startLocal}
        onChange={(e) => {
          onStartChange(e.target.value);
          onClearConflicts();
        }}
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <TextField
        label="End"
        type="datetime-local"
        value={endLocal}
        onChange={(e) => {
          onEndChange(e.target.value);
          onClearConflicts();
        }}
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Autocomplete
        value={timezone}
        onChange={(_, val) => {
          if (val) {
            onTimezoneChange(val);
            onClearConflicts();
          }
        }}
        options={timezoneOptions}
        getOptionLabel={formatTimezoneLabel}
        disableClearable
        renderInput={(params) => <TextField {...params} label="Timezone" />}
        slotProps={{
          paper: { sx: autocompletePaperSx },
        }}
      />
    </>
  );
}
