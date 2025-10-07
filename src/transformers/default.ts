import type { Entity } from '../generated/prisma/client.js';

/**
 * Standard entity shape - output of base transformation
 * Does not include access information
 */
export type StandardEntity = {
  id: string;
  name: string;
  description: string;
  entityType: string;
  memberOf: string | null;
  rootCollection: string | null;
  metadataLicenseId: string;
  contentLicenseId: string;
};

/**
 * Access information for an entity
 */
type AccessInfo = {
  metadata: boolean;
  content: boolean;
  contentAuthorizationUrl?: string;
};

/**
 * Authorised entity - includes access information
 * This is the output of the access transformer
 */
export type AuthorisedEntity = StandardEntity & {
  access: AccessInfo;
};

/**
 * Base entity transformer - always applied first
 * Transforms raw database entity to standard entity shape (without access)
 */
export const baseEntityTransformer = (entity: Entity): StandardEntity => ({
  id: entity.rocrateId,
  name: entity.name,
  description: entity.description,
  entityType: entity.entityType,
  memberOf: entity.memberOf,
  rootCollection: entity.rootCollection,
  metadataLicenseId: entity.metadataLicenseId,
  contentLicenseId: entity.contentLicenseId,
});

/**
 * All Public Access Transformer - grants full access to metadata and content
 *
 * WARNING: This transformer makes ALL content publicly accessible without restrictions.
 * Only use this for fully public datasets where no access control is needed.
 *
 * For repositories with restricted content, implement a custom accessTransformer
 * that checks user permissions and licenses.
 *
 * @example
 * ```typescript
 * await server.register(arocapi, {
 *   prisma,
 *   opensearch,
 *   accessTransformer: AllPublicAccessTransformer, // Explicit choice for public data
 * });
 * ```
 */
export const AllPublicAccessTransformer = (entity: StandardEntity): AuthorisedEntity => ({
  ...entity,
  access: {
    metadata: true,
    content: true,
  },
});
