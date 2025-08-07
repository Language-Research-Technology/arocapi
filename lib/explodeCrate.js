// TODO: ADd support for checking conformsTo
function explodeCrate(crate, types=[{"@type":"RepositoryCollection", "conformsTo": "https://w3id.org/ldac/profile#Collection"},{"@type":"RepositoryObject", "conformsTo": "https://w3id.org/ldac/profile#Object"},{"@type":"File"}]) {
    const exploded = [];
    for (const entity of crate.entities()) {
       // Check it the entity matched @type in types
        if (types.some(type => entity['@type'].includes(type['@type']))) { // TODO: Check conformsTo
            const prunedEntity = crate.getTree({ 
                root: entity.id, 
                depth: 2, 
                allowCycle: false 
            });
            exploded.push(prunedEntity);
        }
    }
    return exploded;
}

export default explodeCrate;