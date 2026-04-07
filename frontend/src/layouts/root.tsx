import { Outlet } from '@tanstack/react-router';
import { Box } from '@mui/material';

export function RootLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Outlet />
    </Box>
  );
}
