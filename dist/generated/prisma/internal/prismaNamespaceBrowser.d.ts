import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.objectEnumValues.instances.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.objectEnumValues.instances.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.objectEnumValues.instances.AnyNull);
};
export declare const DbNull: {
    "__#private@#private": any;
    _getNamespace(): string;
    _getName(): string;
    toString(): string;
};
export declare const JsonNull: {
    "__#private@#private": any;
    _getNamespace(): string;
    _getName(): string;
    toString(): string;
};
export declare const AnyNull: {
    "__#private@#private": any;
    _getNamespace(): string;
    _getName(): string;
    toString(): string;
};
export declare const ModelName: {
    readonly Entity: "Entity";
    readonly File: "File";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const EntityScalarFieldEnum: {
    readonly id: "id";
    readonly rocrateId: "rocrateId";
    readonly name: "name";
    readonly description: "description";
    readonly entityType: "entityType";
    readonly memberOf: "memberOf";
    readonly rootCollection: "rootCollection";
    readonly metadataLicenseId: "metadataLicenseId";
    readonly contentLicenseId: "contentLicenseId";
    readonly fileId: "fileId";
    readonly meta: "meta";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type EntityScalarFieldEnum = (typeof EntityScalarFieldEnum)[keyof typeof EntityScalarFieldEnum];
export declare const FileScalarFieldEnum: {
    readonly id: "id";
    readonly fileId: "fileId";
    readonly filename: "filename";
    readonly mediaType: "mediaType";
    readonly size: "size";
    readonly memberOf: "memberOf";
    readonly rootCollection: "rootCollection";
    readonly contentLicenseId: "contentLicenseId";
    readonly meta: "meta";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type FileScalarFieldEnum = (typeof FileScalarFieldEnum)[keyof typeof FileScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: {
        "__#private@#private": any;
        _getNamespace(): string;
        _getName(): string;
        toString(): string;
    };
    readonly JsonNull: {
        "__#private@#private": any;
        _getNamespace(): string;
        _getName(): string;
        toString(): string;
    };
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const JsonNullValueFilter: {
    readonly DbNull: {
        "__#private@#private": any;
        _getNamespace(): string;
        _getName(): string;
        toString(): string;
    };
    readonly JsonNull: {
        "__#private@#private": any;
        _getNamespace(): string;
        _getName(): string;
        toString(): string;
    };
    readonly AnyNull: {
        "__#private@#private": any;
        _getNamespace(): string;
        _getName(): string;
        toString(): string;
    };
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const EntityOrderByRelevanceFieldEnum: {
    readonly rocrateId: "rocrateId";
    readonly name: "name";
    readonly description: "description";
    readonly entityType: "entityType";
    readonly memberOf: "memberOf";
    readonly rootCollection: "rootCollection";
    readonly metadataLicenseId: "metadataLicenseId";
    readonly contentLicenseId: "contentLicenseId";
    readonly fileId: "fileId";
};
export type EntityOrderByRelevanceFieldEnum = (typeof EntityOrderByRelevanceFieldEnum)[keyof typeof EntityOrderByRelevanceFieldEnum];
export declare const FileOrderByRelevanceFieldEnum: {
    readonly fileId: "fileId";
    readonly filename: "filename";
    readonly mediaType: "mediaType";
    readonly memberOf: "memberOf";
    readonly rootCollection: "rootCollection";
    readonly contentLicenseId: "contentLicenseId";
};
export type FileOrderByRelevanceFieldEnum = (typeof FileOrderByRelevanceFieldEnum)[keyof typeof FileOrderByRelevanceFieldEnum];
