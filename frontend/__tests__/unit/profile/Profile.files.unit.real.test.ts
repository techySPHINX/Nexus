import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const files = [
  'src/services/profileService.ts',
  'src/contexts/ProfileContext.tsx',
  'src/pages/Profile.tsx',
  'src/utils/ProfileNameLink.tsx',
];

describe('unit profile: every file', () => {
  it.each(files)('%s exists and is non-empty', (relativePath) => {
    const filePath = path.resolve(process.cwd(), relativePath);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.statSync(filePath).size).toBeGreaterThan(0);
  });
});
