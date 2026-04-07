import { EVENT_COLORS } from '../theme/theme';

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getEventColor(id: string): string {
  return EVENT_COLORS[hashCode(id) % EVENT_COLORS.length] ?? EVENT_COLORS[0]!;
}

export function hexToSolidTint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const blend = (c: number) => Math.round(c * opacity + 255 * (1 - opacity));
  return `rgb(${blend(r)}, ${blend(g)}, ${blend(b)})`;
}
