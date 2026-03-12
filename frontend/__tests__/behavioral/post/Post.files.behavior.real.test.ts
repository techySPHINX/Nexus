import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const checks: Array<{ file: string; mustContain: string[] }> = [
  {
    file: 'src/services/PostService.ts',
    mustContain: [
      'getFeedService',
      'getCommunityFeedService',
      'createPostService',
    ],
  },
  {
    file: 'src/contexts/PostContext.tsx',
    mustContain: ['PostProvider', 'getFeed', 'getCommunityFeed'],
  },
  {
    file: 'src/pages/Posts/FeedPage.tsx',
    mustContain: ['FeedPage', 'activeTab', 'getCommunityFeed', 'getFeed'],
  },
  {
    file: 'src/components/Post/Post.tsx',
    mustContain: ['Post'],
  },
];

describe('behavior post: key files', () => {
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
