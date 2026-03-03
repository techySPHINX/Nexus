import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const checks: Array<{ file: string; mustContain: string[] }> = [
  { file: 'src/services/newsService.ts', mustContain: ['/news', 'list:'] },
  {
    file: 'src/contexts/NewsContext.tsx',
    mustContain: ['NewsProvider', 'useNews', 'loadNews'],
  },
  {
    file: 'src/components/News/NewsDetail.tsx',
    mustContain: ['NewsDetail', 'useNews'],
  },
  {
    file: 'src/components/News/NewsList.tsx',
    mustContain: ['NewsList', 'loadNews'],
  },
  {
    file: 'src/components/News/RecentNews.tsx',
    mustContain: ['RecentNews'],
  },
  {
    file: 'src/components/landing/NewsSection.tsx',
    mustContain: ['NewsSection'],
  },
  { file: 'src/pages/NewsPage.tsx', mustContain: ['NewsPage'] },
  { file: 'src/pages/AdminNews.tsx', mustContain: ['AdminNews'] },
];

describe('behavior news: every file', () => {
  it.each(checks)(
    '$file contains key domain symbols',
    ({ file, mustContain }) => {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      mustContain.forEach((token) => {
        expect(source.includes(token)).toBe(true);
      });
    }
  );
});
