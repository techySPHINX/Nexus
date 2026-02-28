import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const files = [
  'src/services/newsService.ts',
  'src/contexts/NewsContext.tsx',
  'src/components/News/NewsDetail.tsx',
  'src/components/News/NewsList.tsx',
  'src/components/News/RecentNews.tsx',
  'src/components/landing/NewsSection.tsx',
  'src/pages/NewsPage.tsx',
  'src/pages/AdminNews.tsx',
];

describe('unit news: every file', () => {
  it.each(files)('%s exists and is non-empty', (relativePath) => {
    const filePath = path.resolve(process.cwd(), relativePath);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.statSync(filePath).size).toBeGreaterThan(0);
  });
});
