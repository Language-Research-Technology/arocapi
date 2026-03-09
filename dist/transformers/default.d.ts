import type { Entity, File, PrismaClient } from '../generated/prisma/client.js';
export type EntityReference = {
    id: string;
    name: string;
};
export type BaseEntity = {
    id: string;
    name: string;
    description: string;
    memberOf: string | null;
    rootCollection: string | null;
    metadataLicenseId: string;
    contentLicenseId: string;
} & ({
    entityType: string;
    fileId?: never;
} | {
    entityType: 'http://schema.org/MediaObject';
    fileId: string;
});
export type StandardEntity = {
    id: string;
    name: string;
    description: string;
    memberOf: EntityReference | null;
    rootCollection: EntityReference | null;
    metadataLicenseId: string;
    contentLicenseId: string;
} & ({
    entityType: string;
    fileId?: never;
} | {
    entityType: 'http://schema.org/MediaObject';
    fileId: string;
});
type AccessInfo = {
    metadata: boolean;
    content: boolean;
    contentAuthorizationUrl?: string;
};
export type AuthorisedEntity = StandardEntity & {
    access: AccessInfo;
};
type FileAccessInfo = {
    content: boolean;
    contentAuthorizationUrl?: string;
};
export type StandardFile = {
    id: string;
    filename: string;
    mediaType: string;
    size: number;
    memberOf: string;
    rootCollection: string;
    contentLicenseId: string;
};
export type AuthorisedFile = StandardFile & {
    access: FileAccessInfo;
};
export declare const baseEntityTransformer: (entity: Entity) => BaseEntity;
export declare const AllPublicAccessTransformer: (entity: StandardEntity) => AuthorisedEntity;
export declare const baseFileTransformer: (file: File) => StandardFile;
export declare const AllPublicFileAccessTransformer: (file: StandardFile) => AuthorisedFile;
export declare const resolveEntityReferences: (entities: Array<{
    memberOf: string | null;
    rootCollection: string | null;
}>, prisma: PrismaClient) => Promise<Map<string, EntityReference>>;
export {};
