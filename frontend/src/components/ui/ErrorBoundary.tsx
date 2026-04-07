import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { palette } from '../../theme/theme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            px: 4,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 17, fontWeight: 500, color: palette.primary, mb: 1 }}>
            {this.props.fallbackMessage || 'Something went wrong'}
          </Typography>
          <Typography sx={{ fontSize: 14, color: palette.secondary, mb: 3, maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
