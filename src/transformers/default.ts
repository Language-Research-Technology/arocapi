import type { Entity, File, PrismaClient } from '../generated/prisma/client.js';

type EntityWithFile = Entity & { file?: { id: string } | null };

/**
 * Entity reference - used for memberOf and rootCollection
 */
type EntityReference = {
  id: string;
  name: string;
};

/**
 * Base entity shape - output of base transformation with unresolved references
 * Used internally before reference resolution
 */
export type BaseEntity = {
  id: string;
  entityType: string;
  name: string;
  description: string;
  memberOf: string | null;
  rootCollection: string | null;
  metadataLicenseId: string;
  contentLicenseId: string;
};

/**
 * Standard entity shape - with resolved references
 * Does not include access information
 */
export type StandardEntity = {
  id: string;
  entityType: string;
  name: string;
  description: string;
  memberOf: EntityReference | null;
  rootCollection: EntityReference | null;
  metadataLicenseId: string;
  contentLicenseId: string;
};

/**
 * Access information for an entity
 */
type AccessInfo = {
  metadata: boolean;
  content: boolean;
  metadataAuthorizationUrl?: string;
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
 */
export type StandardFile = {
  id: string;
  filename: string;
  mediaType: string;
  size: number;
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
 * Transforms raw database entity to base entity shape with unresolved references
 * Accepts Entity with optional file relation included
 */
export const baseEntityTransformer = (entity: EntityWithFile): BaseEntity => {
  const base: BaseEntity = {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    entityType: entity.entityType,
    memberOf: entity.memberOf,
    rootCollection: entity.rootCollection,
    metadataLicenseId: entity.metadataLicenseId,
    contentLicenseId: entity.contentLicenseId,
  };

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
  id: file.id,
  filename: file.filename,
  mediaType: file.mediaType,
  size: Number(file.size),
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

/**
 * Resolve entity references (memberOf/rootCollection) to objects with id and name
 * Batch-fetches all referenced entities in a single query for performance
 *
 * @param entities - Array of entities with memberOf/rootCollection string IDs
 * @param prisma - Prisma client instance
 * @returns Map of entity ID to EntityReference object
 */
export const resolveEntityReferences = async (
  entities: Array<{ memberOf: string | null; rootCollection: string | null }>,
  prisma: PrismaClient,
): Promise<Map<string, EntityReference>> => {
  const refIds = new Set<string>();

  entities.forEach((e) => {
    if (e.memberOf) {
      refIds.add(e.memberOf);
    }

    if (e.rootCollection) {
      refIds.add(e.rootCollection);
    }
  });

  if (refIds.size === 0) {
    return new Map();
  }

  const refs = await prisma.entity.findMany({
    where: { id: { in: [...refIds] } },
    select: { id: true, name: true },
  });

  return new Map(refs.map((r) => [r.id, { id: r.id, name: r.name }]));
};
