import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Package scripts edge guard', () => {
  it('must include edge/behavioral/unit test scripts', () => {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(packageJson.scripts['test:edge']).toBeDefined();
    expect(packageJson.scripts['test:behavioral']).toBeDefined();
    expect(packageJson.scripts['test:unit:generated']).toBeDefined();
  });
});
