import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const files = [
  'src/services/DashBoardService.tsx',
  'src/contexts/DashBoardContext.tsx',
  'src/pages/Dashboard.tsx',
  'src/components/DashBoard/HeroWelcomeCard.tsx',
  'src/components/DashBoard/NetworkOverview.tsx',
  'src/components/DashBoard/RecentPosts.tsx',
  'src/components/DashBoard/RecommendedProjects.tsx',
  'src/components/DashBoard/RecommendedConnection.tsx',
  'src/components/DashBoard/QuickAccessMenu.tsx',
  'src/components/DashBoard/ProfileStrength.tsx',
  'src/components/DashBoard/LeaderBoard.tsx',
  'src/components/DashBoard/UpcomingEvents.tsx',
];

describe('edge dashboard: every file', () => {
  it.each(files)('%s has no merge markers or random keys', (file) => {
    const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    expect(source.includes('<<<<<<<')).toBe(false);
    expect(source.includes('>>>>>>>')).toBe(false);
    expect(source.includes('Math.random()')).toBe(false);
  });
});
