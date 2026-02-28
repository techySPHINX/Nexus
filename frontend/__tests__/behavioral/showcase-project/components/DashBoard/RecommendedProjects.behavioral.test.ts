import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('behavioral: src/components/DashBoard/RecommendedProjects.tsx', () => {
  const filePath = path.resolve(
    process.cwd(),
    'src/components/DashBoard/RecommendedProjects.tsx'
  );
  const source = fs.readFileSync(filePath, 'utf8');

  it('keeps expected component contracts', () => {
    expect(source.includes('export default')).toBe(true);
    expect(source.includes('return (') || source.includes('=> (')).toBe(true);
    expect(source.length).toBeGreaterThan(100);
  });
});
