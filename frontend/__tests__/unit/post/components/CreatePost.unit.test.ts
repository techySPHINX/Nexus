import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('post components file: src/components/CreatePost.tsx', () => {
  const filePath = path.resolve(process.cwd(), 'src/components/CreatePost.tsx');

  it('exists in source tree', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('is non-empty source file', () => {
    const stat = fs.statSync(filePath);
    expect(stat.size).toBeGreaterThan(0);
  });
});
