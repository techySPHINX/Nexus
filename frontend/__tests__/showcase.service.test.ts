import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '@/services/api';
import { ShowcaseService } from '@/services/ShowcaseService';
import { status } from '@/types/ShowcaseType';

const mockedApi = vi.mocked(api, true);

describe('ShowcaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a project using the expected endpoint', async () => {
    const payload = {
      title: 'Nexus Project',
      description: 'A showcase project',
      skills: ['TypeScript'],
      tags: ['web'],
      status: status.IN_PROGRESS,
    };
    const apiResponse = { id: 'project-1', ...payload };

    mockedApi.post.mockResolvedValueOnce({ data: apiResponse } as never);

    const result = await ShowcaseService.createProject(payload);

    expect(mockedApi.post).toHaveBeenCalledWith('/showcase/project', payload);
    expect(result).toEqual(apiResponse);
  });

  it('fetches projects with filters as query params', async () => {
    const response = {
      data: [],
      pagination: { nextCursor: undefined, hasNext: false },
    };

    mockedApi.get.mockResolvedValueOnce({ data: response } as never);

    const result = await ShowcaseService.getAllProjects({
      search: 'nexus',
      pageSize: 12,
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/showcase/project', {
      params: { search: 'nexus', pageSize: 12 },
    });
    expect(result).toEqual(response);
  });

  it('updates a project and returns updatedProject payload', async () => {
    const updatePayload = { title: 'Updated title' };
    const updatedProject = { id: 'project-1', title: 'Updated title' };

    mockedApi.put.mockResolvedValueOnce({ data: { updatedProject } } as never);

    const result = await ShowcaseService.updateProject(
      'project-1',
      updatePayload
    );

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/showcase/project/project-1',
      updatePayload
    );
    expect(result).toEqual(updatedProject);
  });

  it('requests paginated comments for a project', async () => {
    const commentsResponse = {
      comments: [],
      pagination: {
        page: 2,
        pageSize: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: true,
      },
    };

    mockedApi.get.mockResolvedValueOnce({ data: commentsResponse } as never);

    const result = await ShowcaseService.getComments('project-1', 2);

    expect(mockedApi.get).toHaveBeenCalledWith('/showcase/project-1/comments', {
      params: { page: 2 },
    });
    expect(result).toEqual(commentsResponse);
  });

  it('throws a normalized error when support call fails', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('Network down'));

    await expect(ShowcaseService.supportProject('project-1')).rejects.toThrow(
      'Failed to support project with error'
    );

    expect(mockedApi.post).toHaveBeenCalledWith('/showcase/project-1/support');
  });
});
