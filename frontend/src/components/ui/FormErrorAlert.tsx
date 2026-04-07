import { Alert } from '@mui/material';
import { palette } from '../../theme/theme';

export interface FormErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

export function FormErrorAlert({ message, onDismiss }: FormErrorAlertProps) {
  return (
    <Alert
      severity="error"
      onClose={onDismiss}
      sx={{
        borderRadius: '10px',
        backgroundColor: '#FEF2F2',
        border: '1px solid #FECACA',
        '& .MuiAlert-icon': { color: palette.error },
        fontSize: 13,
      }}
    >
      {message}
    </Alert>
  );
}
