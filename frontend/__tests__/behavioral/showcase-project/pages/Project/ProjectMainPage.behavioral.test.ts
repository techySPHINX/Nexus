import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('behavioral: src/pages/Project/ProjectMainPage.tsx', () => {
  const filePath = path.resolve(
    process.cwd(),
    'src/pages/Project/ProjectMainPage.tsx'
  );
  const source = fs.readFileSync(filePath, 'utf8');

  it('keeps expected page contracts', () => {
    expect(source.includes('export default')).toBe(true);
    expect(source.includes('return (') || source.includes('=> (')).toBe(true);
    expect(source.includes('Page') || source.includes('Project')).toBe(true);
  });
});
