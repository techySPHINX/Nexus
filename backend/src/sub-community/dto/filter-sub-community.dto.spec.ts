import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FilterSubCommunityDto } from './filter-sub-community.dto';

describe('FilterSubCommunityDto', () => {
  it('should pass validation with no fields (all optional)', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with all valid fields', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, {
      q: 'test',
      page: '1',
      limit: '20',
      privacy: 'public',
      membership: 'joined',
      sort: 'popular',
      minMembers: '5',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with privacy=all', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, { privacy: 'all' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with privacy=private', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, { privacy: 'private' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid privacy value', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, {
      privacy: 'invalid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('privacy');
  });

  it('should fail with invalid membership value', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, {
      membership: 'invalid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('membership');
  });

  it('should fail with invalid sort value', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, { sort: 'invalid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('sort');
  });

  it('should pass with sort=recent', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, { sort: 'recent' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with sort=active', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, { sort: 'active' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with membership=all', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, { membership: 'all' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with non-numeric minMembers', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, {
      minMembers: 'abc',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('minMembers');
  });

  it('should pass with numeric string minMembers', async () => {
    const dto = plainToInstance(FilterSubCommunityDto, { minMembers: '10' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
