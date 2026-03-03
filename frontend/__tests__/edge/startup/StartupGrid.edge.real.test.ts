import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('edge startup: StartupGrid', () => {
  it('must not use unstable random keys for startup cards', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/Startup/StartupGrid.tsx'
    );
    const source = fs.readFileSync(filePath, 'utf8');

    expect(source.includes('Math.random()')).toBe(false);
  });
});
