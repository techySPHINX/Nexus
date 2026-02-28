import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const checks: Array<{ file: string; mustContain: string[] }> = [
  {
    file: 'src/services/profileService.ts',
    mustContain: ['fetchProfileDataService', 'updateProfileService'],
  },
  {
    file: 'src/contexts/ProfileContext.tsx',
    mustContain: ['ProfileProvider', 'useProfile'],
  },
  { file: 'src/pages/Profile.tsx', mustContain: ['Profile'] },
];

describe('behavior profile: key files', () => {
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
