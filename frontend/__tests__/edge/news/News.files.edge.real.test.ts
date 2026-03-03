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

describe('edge news: every file', () => {
  it.each(files)('%s has no merge markers or random keys', (file) => {
    const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    expect(source.includes('<<<<<<<')).toBe(false);
    expect(source.includes('>>>>>>>')).toBe(false);
    expect(source.includes('Math.random()')).toBe(false);
  });
});
