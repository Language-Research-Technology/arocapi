import type { EntityTransformer, Options } from 'arocapi';

const addShortId: EntityTransformer = (entity) => ({ ...entity, shortId: entity.id.split('/').pop() });

export const entityTransformers: Options['entityTransformers'] = [addShortId];
