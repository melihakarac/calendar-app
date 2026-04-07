import { createFileRoute } from '@tanstack/react-router';
import { CalendarApp } from '../components/calendar/CalendarApp';

export const Route = createFileRoute('/')({
  component: CalendarApp,
});
