import { describe, expect, it } from 'vitest';
import { StartupStatus } from '@/types/StartupType';

describe('unit startup: StartupType enum contract', () => {
  it('keeps stable startup status values', () => {
    expect(StartupStatus.IDEA).toBe('IDEA');
    expect(StartupStatus.PROTOTYPING).toBe('PROTOTYPING');
    expect(StartupStatus.BETA).toBe('BETA');
    expect(StartupStatus.LAUNCHED).toBe('LAUNCHED');
  });
});
