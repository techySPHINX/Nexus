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

describe('unit events: every file', () => {
  it.each(files)('%s exists and is non-empty', (relativePath) => {
    const filePath = path.resolve(process.cwd(), relativePath);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.statSync(filePath).size).toBeGreaterThan(0);
  });
});
