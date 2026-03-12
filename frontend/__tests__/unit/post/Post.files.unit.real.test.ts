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

describe('unit post: every file', () => {
  it.each(files)('%s exists and is non-empty', (relativePath) => {
    const filePath = path.resolve(process.cwd(), relativePath);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.statSync(filePath).size).toBeGreaterThan(0);
  });
});
