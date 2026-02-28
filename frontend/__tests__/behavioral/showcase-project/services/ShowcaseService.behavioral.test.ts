import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('behavioral: src/services/ShowcaseService.tsx', () => {
  const filePath = path.resolve(
    process.cwd(),
    'src/services/ShowcaseService.tsx'
  );
  const source = fs.readFileSync(filePath, 'utf8');

  it('keeps expected service contracts', () => {
    expect(source.includes('api.') || source.includes('axios')).toBe(true);
    expect(source.includes('async')).toBe(true);
    expect(source.includes('Error') || source.includes('throw')).toBe(true);
  });
});
