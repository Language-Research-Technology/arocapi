import * as runtime from "@prisma/client/runtime/index-browser";
export const Decimal = runtime.Decimal;
export const NullTypes = {
    DbNull: runtime.objectEnumValues.classes.DbNull,
    JsonNull: runtime.objectEnumValues.classes.JsonNull,
    AnyNull: runtime.objectEnumValues.classes.AnyNull,
};
export const DbNull = runtime.objectEnumValues.instances.DbNull;
export const JsonNull = runtime.objectEnumValues.instances.JsonNull;
export const AnyNull = runtime.objectEnumValues.instances.AnyNull;
export const ModelName = {
    Entity: 'Entity',
    File: 'File'
};
export const TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
export const EntityScalarFieldEnum = {
    id: 'id',
    rocrateId: 'rocrateId',
    name: 'name',
    description: 'description',
    entityType: 'entityType',
    memberOf: 'memberOf',
    rootCollection: 'rootCollection',
    metadataLicenseId: 'metadataLicenseId',
    contentLicenseId: 'contentLicenseId',
    fileId: 'fileId',
    meta: 'meta',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const FileScalarFieldEnum = {
    id: 'id',
    fileId: 'fileId',
    filename: 'filename',
    mediaType: 'mediaType',
    size: 'size',
    memberOf: 'memberOf',
    rootCollection: 'rootCollection',
    contentLicenseId: 'contentLicenseId',
    meta: 'meta',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
export const NullableJsonNullValueInput = {
    DbNull: DbNull,
    JsonNull: JsonNull
};
export const JsonNullValueFilter = {
    DbNull: DbNull,
    JsonNull: JsonNull,
    AnyNull: AnyNull
};
export const QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
export const NullsOrder = {
    first: 'first',
    last: 'last'
};
export const EntityOrderByRelevanceFieldEnum = {
    rocrateId: 'rocrateId',
    name: 'name',
    description: 'description',
    entityType: 'entityType',
    memberOf: 'memberOf',
    rootCollection: 'rootCollection',
    metadataLicenseId: 'metadataLicenseId',
    contentLicenseId: 'contentLicenseId',
    fileId: 'fileId'
};
export const FileOrderByRelevanceFieldEnum = {
    fileId: 'fileId',
    filename: 'filename',
    mediaType: 'mediaType',
    memberOf: 'memberOf',
    rootCollection: 'rootCollection',
    contentLicenseId: 'contentLicenseId'
};
//# sourceMappingURL=prismaNamespaceBrowser.js.map