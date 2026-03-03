import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const files = [
  'src/services/EventService.ts',
  'src/contexts/eventContext.tsx',
  'src/components/Events/EventCard.tsx',
  'src/components/DashBoard/UpcomingEvents.tsx',
  'src/pages/Events/EventDetailPage.tsx',
  'src/pages/Events/EventsPage.tsx',
  'src/pages/Admin/CreateEventPage.tsx',
];

describe('edge events: every file', () => {
  it.each(files)('%s has no merge markers or random keys', (file) => {
    const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    expect(source.includes('<<<<<<<')).toBe(false);
    expect(source.includes('>>>>>>>')).toBe(false);
    expect(source.includes('Math.random()')).toBe(false);
  });
});
