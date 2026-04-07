import type { SxProps, Theme } from '@mui/material/styles';
import { palette, transitions } from './theme';

export const calendarDialogPaperSx: SxProps<Theme> = {
  borderRadius: '16px',
  backgroundColor: palette.surfaceBg,
  border: `1px solid ${palette.divider}`,
  boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
  '@keyframes calendarModalEnter': {
    from: { opacity: 0, transform: 'scale(0.96) translateY(8px)' },
    to: { opacity: 1, transform: 'scale(1) translateY(0)' },
  },
};

export function calendarDialogPaperSxAnimated(open: boolean): SxProps<Theme> {
  return {
    ...calendarDialogPaperSx,
    animation: open ? `calendarModalEnter ${transitions.spring}` : undefined,
  };
}
