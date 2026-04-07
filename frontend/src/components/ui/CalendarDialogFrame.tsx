import type { ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { DialogProps } from '@mui/material/Dialog';
import { palette, transitions } from '../../theme/theme';
import { calendarDialogPaperSx, calendarDialogPaperSxAnimated } from '../../theme/dialogStyles';

export interface CalendarDialogFrameProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: boolean;
  TransitionProps?: DialogProps['TransitionProps'];
  hideCloseButton?: boolean;
  /** When true, backdrop, escape, and header close are disabled (e.g. during async submit). */
  interactionLocked?: boolean;
}

export function CalendarDialogFrame({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  TransitionProps,
  hideCloseButton = false,
  interactionLocked = false,
}: CalendarDialogFrameProps) {
  const theme = useTheme();
  const fullScreenMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (interactionLocked) return;
        onClose();
      }}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreenMobile}
      TransitionProps={TransitionProps}
      disableEscapeKeyDown={interactionLocked}
      PaperProps={{
        sx: fullScreenMobile
          ? {
              ...calendarDialogPaperSx,
              m: 0,
              maxHeight: '100%',
              height: '100%',
              borderRadius: 0,
              border: 'none',
              boxShadow: 'none',
              backgroundColor: palette.surfaceBg,
              animation: open ? `calendarModalEnter ${transitions.spring}` : undefined,
              pt: 'env(safe-area-inset-top, 0px)',
            }
          : calendarDialogPaperSxAnimated(open),
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          px: { xs: 2, sm: 3 },
          pt: fullScreenMobile ? 1 : 3,
        }}
      >
        {typeof title === 'string' ? (
          <Typography
            component="span"
            sx={{ fontSize: 18, fontWeight: 600, color: palette.primary, letterSpacing: '-0.2px' }}
          >
            {title}
          </Typography>
        ) : (
          <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
            {title}
          </Box>
        )}
        {!hideCloseButton && (
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close dialog"
            disabled={interactionLocked}
            sx={{
              backgroundColor: palette.hoverBg,
              width: 32,
              height: 32,
              ml: 1,
              flexShrink: 0,
              '&:hover': { backgroundColor: palette.activeBg },
            }}
          >
            <CloseIcon sx={{ fontSize: 16, color: palette.secondary }} />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent
        sx={{
          px: { xs: 2, sm: 3 },
          pt: 1,
          pb:
            fullScreenMobile && !actions
              ? 'max(16px, env(safe-area-inset-bottom, 0px))'
              : undefined,
        }}
      >
        {children}
      </DialogContent>

      {actions ? (
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            pb: fullScreenMobile ? 'max(16px, env(safe-area-inset-bottom, 0px))' : 3,
            pt: 1,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {actions}
        </DialogActions>
      ) : null}
    </Dialog>
  );
}
