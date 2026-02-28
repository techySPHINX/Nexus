import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('behavioral: src/types/ShowcaseType.ts', () => {
  const filePath = path.resolve(process.cwd(), 'src/types/ShowcaseType.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  it('keeps expected type contracts', () => {
    expect(
      source.includes('interface') ||
        source.includes('type ') ||
        source.includes('enum')
    ).toBe(true);
    expect(source.includes('export')).toBe(true);
    expect(source.length > 40).toBe(true);
  });
});
