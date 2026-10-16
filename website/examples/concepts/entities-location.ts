import type { AuthorisedEntity } from 'arocapi';

export const location = (entity: AuthorisedEntity) => (entity.memberOf ? `In ${entity.memberOf.name}` : 'Top level');
