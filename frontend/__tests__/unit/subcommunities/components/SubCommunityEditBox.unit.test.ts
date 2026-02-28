import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('subcommunities components file: src/components/SubCommunity/SubCommunityEditBox.tsx', () => {
  const filePath = path.resolve(
    process.cwd(),
    'src/components/SubCommunity/SubCommunityEditBox.tsx'
  );

  it('exists in source tree', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('is non-empty source file', () => {
    const stat = fs.statSync(filePath);
    expect(stat.size).toBeGreaterThan(0);
  });
});
