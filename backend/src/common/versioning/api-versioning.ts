/**
 * API Versioning Strategy Documentation
 *
 * This document outlines the versioning strategy for the Nexus API
 * to ensure backward compatibility and smooth upgrades.
 */

/**
 * Version 1 (v1) - Current Stable Version
 *
 * Base URL: /api/v1
 * Status: Stable
 * Deprecation Date: TBD
 *
 * All existing endpoints use this version by default.
 * No breaking changes will be introduced in v1.
 */

/**
 * How to version your controllers:
 *
 * ```typescript
 * import { Controller, VERSION_NEUTRAL } from '@nestjs/common';
 *
 * @Controller({
 *   path: 'users',
 *   version: '1', // or VERSION_NEUTRAL for unversioned endpoints
 * })
 * export class UsersController {
 *   // Your endpoints here
 * }
 * ```
 */

/**
 * Version Migration Guide:
 *
 * When introducing breaking changes:
 *
 * 1. Create a new version (v2)
 * 2. Maintain v1 for at least 6 months
 * 3. Add deprecation warnings to v1
 * 4. Document migration path
 * 5. Update client SDKs
 *
 * Example breaking changes:
 * - Removing fields from response
 * - Changing field types
 * - Changing endpoint URLs
 * - Modifying required parameters
 */

/**
 * Non-breaking changes (can be added to current version):
 * - Adding new endpoints
 * - Adding optional parameters
 * - Adding new fields to responses
 * - Deprecating (but not removing) fields
 */

export const API_VERSION = {
  V1: '1',
  V2: '2', // Reserved for future use
} as const;

export type ApiVersion = (typeof API_VERSION)[keyof typeof API_VERSION];

/**
 * Versioning configuration for main.ts
 *
 * ```typescript
 * import { VersioningType } from '@nestjs/common';
 *
 * app.enableVersioning({
 *   type: VersioningType.URI,
 *   defaultVersion: API_VERSION.V1,
 *   prefix: 'api/v',
 * });
 * ```
 */
