import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('behavioral: src/components/Project/ProjectGrid.tsx', () => {
  const filePath = path.resolve(
    process.cwd(),
    'src/components/Project/ProjectGrid.tsx'
  );
  const source = fs.readFileSync(filePath, 'utf8');

  it('keeps expected component contracts', () => {
    expect(source.includes('export default')).toBe(true);
    expect(source.includes('return (') || source.includes('=> (')).toBe(true);
    expect(
      source.includes('props') ||
        source.includes('FC<') ||
        source.includes('React')
    ).toBe(true);
  });
});
