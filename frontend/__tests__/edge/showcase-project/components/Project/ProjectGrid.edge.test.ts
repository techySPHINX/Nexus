import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProjectGrid from '@/components/Project/ProjectGrid';

describe('edge: src/components/Project/ProjectGrid.tsx', () => {
  it('shows create icon even when action label uses lowercase create', () => {
    render(
      React.createElement(ProjectGrid, {
        projects: [],
        tab: 0,
        loading: false,
        error: null,
        isProjectOwner: () => false,
        user: { id: 'u1' },
        emptyMessage: {
          title: 'No projects yet',
          description: 'Create your first project',
          action: vi.fn(),
          actionText: 'create project',
        },
        onSupport: vi.fn(),
        onFollow: vi.fn(),
        onCollaborate: vi.fn(),
        onViewDetails: vi.fn(),
      })
    );

    expect(
      screen.getByRole('button', { name: /create project/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
  });
});
