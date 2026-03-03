import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const checks: Array<{ file: string; mustContain: string[] }> = [
  {
    file: 'src/services/DashBoardService.tsx',
    mustContain: ['getConnectionStats', 'getSuggestedConnections'],
  },
  {
    file: 'src/contexts/DashBoardContext.tsx',
    mustContain: ['DashBoardProvider', 'useDashBoard'],
  },
  { file: 'src/pages/Dashboard.tsx', mustContain: ['Dashboard'] },
];

describe('behavior dashboard: key files', () => {
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
