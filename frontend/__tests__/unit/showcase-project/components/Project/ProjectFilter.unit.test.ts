import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('unit: src/components/Project/ProjectFilter.tsx', () => {
  const filePath = path.resolve(
    process.cwd(),
    'src/components/Project/ProjectFilter.tsx'
  );

  it('exists and is readable', () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(() => fs.readFileSync(filePath, 'utf8')).not.toThrow();
  });

  it('is not empty', () => {
    const source = fs.readFileSync(filePath, 'utf8');
    expect(source.trim().length).toBeGreaterThan(0);
  });
});
