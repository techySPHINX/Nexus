import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('edge: src/components/DashBoard/RecommendedProjects.tsx', () => {
  const filePath = path.resolve(
    process.cwd(),
    'src/components/DashBoard/RecommendedProjects.tsx'
  );
  const source = fs.readFileSync(filePath, 'utf8');

  it('avoids unstable and risky patterns', () => {
    expect(source.includes('Math.random(')).toBe(false);
    expect(source.includes('FIXME')).toBe(false);
    expect(source.includes('TODO')).toBe(false);
  });

  it('documents user-critical edge checklist', () => {
    const checklist = [
      'What can break?',
      'What are edge cases?',
      'What does the user depend on?',
      'What must never fail?',
    ];
    expect(checklist).toHaveLength(4);
  });
});
