import type { Entity, File } from '../generated/prisma/client.js';

/**
 * Standard entity shape - output of base transformation
 * Does not include access information
 */
export type StandardEntity = {
  id: string;
  name: string;
  description: string;
  memberOf: string | null;
  rootCollection: string | null;
  metadataLicenseId: string;
  contentLicenseId: string;
} & ({ entityType: string; fileId?: never } | { entityType: 'http://schema.org/MediaObject'; fileId: string });

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
 * Access information for a file
 * Files only control content access - metadata is always accessible
 */
type FileAccessInfo = {
  content: boolean;
  contentAuthorizationUrl?: string;
};

/**
 * Standard file shape - output of base file transformation
 * Does not include access information
 * Files only have contentLicenseId (no metadataLicenseId)
 */
export type StandardFile = {
  id: string;
  filename: string;
  mediaType: string;
  size: number;
  memberOf: string;
  rootCollection: string;
  contentLicenseId: string;
};

/**
 * Authorised file - includes access information
 * This is the output of the file access transformer
 * File metadata is always accessible - only content access is controlled
 */
export type AuthorisedFile = StandardFile & {
  access: FileAccessInfo;
};

/**
 * Base entity transformer - always applied first
 * Transforms raw database entity to standard entity shape (without access)
 */
export const baseEntityTransformer = (entity: Entity): StandardEntity => {
  const base: StandardEntity = {
    id: entity.rocrateId,
    name: entity.name,
    description: entity.description,
    entityType: entity.entityType,
    memberOf: entity.memberOf,
    rootCollection: entity.rootCollection,
    metadataLicenseId: entity.metadataLicenseId,
    contentLicenseId: entity.contentLicenseId,
  };

  if (base.entityType === ('http://schema.org/MediaObject' as const)) {
    if (!entity.fileId) {
      return base;
    }

    return {
      ...base,
      entityType: base.entityType,
      fileId: entity.fileId,
    };
  }

  return base;
};

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

/**
 * Base file transformer - always applied first
 * Transforms raw database file to standard file shape (without access)
 */
export const baseFileTransformer = (file: File): StandardFile => ({
  id: file.fileId,
  filename: file.filename,
  mediaType: file.mediaType,
  size: Number(file.size),
  memberOf: file.memberOf,
  rootCollection: file.rootCollection,
  contentLicenseId: file.contentLicenseId,
});

/**
 * All Public File Access Transformer - grants full access to file content
 *
 * WARNING: This transformer makes ALL file content publicly accessible without restrictions.
 * Only use this for fully public datasets where no access control is needed.
 *
 * For repositories with restricted content, implement a custom fileAccessTransformer
 * that checks user permissions and licenses.
 *
 * Note: File metadata (filename, size, mediaType, etc.) is always accessible.
 * This transformer only controls content access.
 *
 * @example
 * ```typescript
 * await server.register(arocapi, {
 *   prisma,
 *   opensearch,
 *   accessTransformer: AllPublicAccessTransformer,
 *   fileAccessTransformer: AllPublicFileAccessTransformer, // Explicit choice for public data
 * });
 * ```
 */
export const AllPublicFileAccessTransformer = (file: StandardFile): AuthorisedFile => ({
  ...file,
  access: {
    content: true,
  },
});
