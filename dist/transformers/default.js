export const baseEntityTransformer = (entity) => {
    const base = {
        id: entity.rocrateId,
        name: entity.name,
        description: entity.description,
        entityType: entity.entityType,
        memberOf: entity.memberOf,
        rootCollection: entity.rootCollection,
        metadataLicenseId: entity.metadataLicenseId,
        contentLicenseId: entity.contentLicenseId,
    };
    if (base.entityType === 'http://schema.org/MediaObject') {
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
export const AllPublicAccessTransformer = (entity) => ({
    ...entity,
    access: {
        metadata: true,
        content: true,
    },
});
export const baseFileTransformer = (file) => ({
    id: file.fileId,
    filename: file.filename,
    mediaType: file.mediaType,
    size: Number(file.size),
    memberOf: file.memberOf,
    rootCollection: file.rootCollection,
    contentLicenseId: file.contentLicenseId,
});
export const AllPublicFileAccessTransformer = (file) => ({
    ...file,
    access: {
        content: true,
    },
});
export const resolveEntityReferences = async (entities, prisma) => {
    const refIds = new Set();
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
        where: { rocrateId: { in: [...refIds] } },
        select: { rocrateId: true, name: true },
    });
    return new Map(refs.map((r) => [r.rocrateId, { id: r.rocrateId, name: r.name }]));
};
//# sourceMappingURL=default.js.map