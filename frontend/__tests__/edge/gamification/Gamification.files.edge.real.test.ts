import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const files = [
  'src/services/gamificationService.ts',
  'src/contexts/GamificationContext.tsx',
  'src/pages/Gamification.tsx',
  'src/components/DashBoard/LeaderBoard.tsx',
];

describe('edge gamification: every file', () => {
  it.each(files)('%s has no merge markers or random keys', (file) => {
    const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    expect(source.includes('<<<<<<<')).toBe(false);
    expect(source.includes('>>>>>>>')).toBe(false);
    expect(source.includes('Math.random()')).toBe(false);
  });
});
