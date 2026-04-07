import { useState, useMemo, useCallback, useRef } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useCalendarStore } from '../../stores/calendarStore';
import { palette } from '../../theme/theme';
import { formatTimezoneLabel, useSortedTimezones } from '../../utils/timezone.utils';

export function TimezoneSelector() {
  const { viewingTimezone, setViewingTimezone } = useCalendarStore();
  const [inputValue, setInputValue] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = useCallback((_: unknown, val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedInput(val), 300);
  }, []);

  const sortedTimezones = useSortedTimezones();

  const filteredTimezones = useMemo(() => {
    if (!debouncedInput) return sortedTimezones;
    const lower = debouncedInput.toLowerCase();
    return sortedTimezones.filter(
      (tz) =>
        tz.toLowerCase().includes(lower) ||
        formatTimezoneLabel(tz).toLowerCase().includes(lower),
    );
  }, [sortedTimezones, debouncedInput]);

  return (
    <Autocomplete
      value={viewingTimezone}
      onChange={(_, val) => val && setViewingTimezone(val)}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={filteredTimezones}
      filterOptions={(x) => x}
      getOptionLabel={formatTimezoneLabel}
      size="small"
      disableClearable
      sx={{
        width: { xs: '100%', sm: 220, md: 260 },
        minWidth: { xs: 0, sm: 200 },
        flex: { xs: '1 1 100%', md: '0 0 auto' },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Timezone"
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: 13,
              py: 0,
              backgroundColor: palette.pageBg,
              '& fieldset': { borderColor: palette.divider },
              '&:hover fieldset': { borderColor: palette.border },
            },
          }}
        />
      )}
      slotProps={{
        paper: {
          sx: {
            fontSize: 13,
            borderRadius: '10px',
            border: `1px solid ${palette.divider}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          },
        },
      }}
    />
  );
}
