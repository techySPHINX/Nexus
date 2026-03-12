import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const files = [
  'src/services/subCommunityService.ts',
  'src/contexts/SubCommunityContext.tsx',
  'src/components/SubCommunity/ManageTypesDialog.tsx',
  'src/components/SubCommunity/SubCommunityEditBox.tsx',
  'src/components/SubCommunity/CreateSubCommunityDialog.tsx',
  'src/components/SubCommunity/SubCommunitySection.tsx',
  'src/components/SubCommunity/SubCommunityRequestDialog.tsx',
  'src/components/SubCommunity/SubCommunityCard.tsx',
  'src/pages/SubCommunity/MySubCommunityPage.tsx',
  'src/pages/SubCommunity/AdminSubCommunityModerationPage.tsx',
  'src/pages/SubCommunity/SubCommunityFeedPage.tsx',
  'src/pages/SubCommunity/SubCommunityPage.tsx',
  'src/pages/SubCommunity/SubCommunityJoinRequestModeration.tsx',
];

describe('edge subcommunity: every file', () => {
  it.each(files)('%s has no merge markers or random keys', (file) => {
    const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    expect(source.includes('<<<<<<<')).toBe(false);
    expect(source.includes('>>>>>>>')).toBe(false);
    expect(source.includes('Math.random()')).toBe(false);
  });
});
