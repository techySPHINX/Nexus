import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const checks: Array<{ file: string; mustContain: string[] }> = [
  {
    file: 'src/services/EventService.ts',
    mustContain: ['/events', 'getUpcoming', 'remove:'],
  },
  {
    file: 'src/contexts/eventContext.tsx',
    mustContain: ['EventProvider', 'useEventContext', 'fetchEvents'],
  },
  {
    file: 'src/components/Events/EventCard.tsx',
    mustContain: ['EventCard'],
  },
  {
    file: 'src/components/DashBoard/UpcomingEvents.tsx',
    mustContain: ['UpcomingEvents'],
  },
  {
    file: 'src/pages/Events/EventDetailPage.tsx',
    mustContain: ['EventDetailPage'],
  },
  {
    file: 'src/pages/Events/EventsPage.tsx',
    mustContain: ['EventsPage', 'fetchEvents'],
  },
  {
    file: 'src/pages/Admin/CreateEventPage.tsx',
    mustContain: ['CreateEventPage'],
  },
];

describe('behavior events: every file', () => {
  it.each(checks)(
    '$file contains key domain symbols',
    ({ file, mustContain }) => {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      mustContain.forEach((token) => {
        expect(source.includes(token)).toBe(true);
      });
    }
  );
});
