import type { AuthorisedEntity } from 'arocapi';

const location = (entity: AuthorisedEntity) => (entity.memberOf ? `In ${entity.memberOf.name}` : 'Top level');
