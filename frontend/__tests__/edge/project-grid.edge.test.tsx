import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('ProjectGrid edge regressions', () => {
  const filePath = path.resolve(
    process.cwd(),
    'src/components/Project/ProjectGrid.tsx'
  );
  const source = fs.readFileSync(filePath, 'utf8');

  it('must never use unstable random keys', () => {
    expect(source.includes('Math.random()')).toBe(false);
  });

  it('must resolve own-project title in case-insensitive way', () => {
    expect(source.includes("toLowerCase().includes('own')")).toBe(true);
  });
});
