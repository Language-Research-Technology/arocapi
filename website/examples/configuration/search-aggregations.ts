import type { QueryBuilderOptions } from 'arocapi';

const aggregations = {
  inLanguage: { terms: { field: 'inLanguage', size: 50 } },
  entityType: { terms: { field: 'entityType', size: 10 } },
};

export const queryBuilderOptions: QueryBuilderOptions = { aggregations };
