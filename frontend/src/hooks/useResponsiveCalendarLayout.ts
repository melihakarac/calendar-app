import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export interface ResponsiveCalendarLayout {
  isMobile: boolean;
  isTablet: boolean;
  gutterWidth: number;
  hourHeight: number;
}

export function useResponsiveCalendarLayout(): ResponsiveCalendarLayout {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md')) && !isMobile;

  return {
    isMobile,
    isTablet,
    gutterWidth: isMobile ? 40 : isTablet ? 52 : 64,
    hourHeight: isMobile ? 48 : isTablet ? 54 : 60,
  };
}
