import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const checks: Array<{ file: string; mustContain: string[] }> = [
  {
    file: 'src/services/gamificationService.ts',
    mustContain: ['getLeaderboard', 'awardPoints'],
  },
  {
    file: 'src/contexts/GamificationContext.tsx',
    mustContain: ['GamificationProvider', 'useGamification'],
  },
  { file: 'src/pages/Gamification.tsx', mustContain: ['Gamification'] },
];

describe('behavior gamification: key files', () => {
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
