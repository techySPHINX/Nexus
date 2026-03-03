import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const checks: Array<{ file: string; mustContain: string[] }> = [
  {
    file: 'src/services/subCommunityService.ts',
    mustContain: ['/sub-community', 'getAllSubCommunities'],
  },
  {
    file: 'src/contexts/SubCommunityContext.tsx',
    mustContain: ['SubCommunityProvider', 'useSubCommunity'],
  },
  {
    file: 'src/components/SubCommunity/ManageTypesDialog.tsx',
    mustContain: ['ManageTypesDialog'],
  },
  {
    file: 'src/components/SubCommunity/SubCommunityEditBox.tsx',
    mustContain: ['SubCommunityEditBox'],
  },
  {
    file: 'src/components/SubCommunity/CreateSubCommunityDialog.tsx',
    mustContain: ['CreateSubCommunityDialog'],
  },
  {
    file: 'src/components/SubCommunity/SubCommunitySection.tsx',
    mustContain: ['SubCommunitySection'],
  },
  {
    file: 'src/components/SubCommunity/SubCommunityRequestDialog.tsx',
    mustContain: ['SubCommunityRequestDialog'],
  },
  {
    file: 'src/components/SubCommunity/SubCommunityCard.tsx',
    mustContain: ['SubCommunityCard'],
  },
  {
    file: 'src/pages/SubCommunity/MySubCommunityPage.tsx',
    mustContain: ['MySubCommunityPage'],
  },
  {
    file: 'src/pages/SubCommunity/AdminSubCommunityModerationPage.tsx',
    mustContain: ['AdminSubCommunityModerationPage'],
  },
  {
    file: 'src/pages/SubCommunity/SubCommunityFeedPage.tsx',
    mustContain: ['SubCommunityFeedPage'],
  },
  {
    file: 'src/pages/SubCommunity/SubCommunityPage.tsx',
    mustContain: ['SubCommunityPage'],
  },
  {
    file: 'src/pages/SubCommunity/SubCommunityJoinRequestModeration.tsx',
    mustContain: ['SubCommunityJoinRequestModeration'],
  },
];

describe('behavior subcommunity: every file', () => {
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
