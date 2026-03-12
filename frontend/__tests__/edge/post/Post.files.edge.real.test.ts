import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const files = [
  'src/services/PostService.ts',
  'src/contexts/PostContext.tsx',
  'src/pages/Posts/FeedPage.tsx',
  'src/pages/Posts/PostDetailPage.tsx',
  'src/pages/Posts/UserPostsPage.tsx',
  'src/pages/Posts/SearchResultsPage.tsx',
  'src/pages/Posts/AdminModerationPage.tsx',
  'src/components/Post/Post.tsx',
  'src/components/Post/CreatePostForm.tsx',
  'src/components/Post/CommentSection.tsx',
  'src/components/Post/PostImage.tsx',
  'src/components/Post/SubCommunityBadge.tsx',
];

describe('edge post: every file', () => {
  it.each(files)('%s has no merge markers or random keys', (file) => {
    const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    expect(source.includes('<<<<<<<')).toBe(false);
    expect(source.includes('>>>>>>>')).toBe(false);
    expect(source.includes('Math.random()')).toBe(false);
  });

  it('FeedPage keeps dedupe guard constants to avoid duplicate initial fetch', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/Posts/FeedPage.tsx'),
      'utf8'
    );
    expect(source.includes('FEED_FETCH_DEDUP_TTL_MS')).toBe(true);
    expect(source.includes('inFlightFeedFetches')).toBe(true);
    expect(source.includes('recentFeedFetches')).toBe(true);
  });
});
