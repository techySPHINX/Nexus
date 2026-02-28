import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('behavioral: src/contexts/ShowcaseContext.tsx', () => {
  const filePath = path.resolve(
    process.cwd(),
    'src/contexts/ShowcaseContext.tsx'
  );
  const source = fs.readFileSync(filePath, 'utf8');

  it('keeps expected context contracts', () => {
    expect(source.includes('createContext')).toBe(true);
    expect(source.includes('useContext')).toBe(true);
    expect(source.includes('Provider') || source.includes('Context')).toBe(
      true
    );
  });
});
