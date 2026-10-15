import type { QueryBuilderOptions } from 'arocapi';

const fields = ['inLanguage', 'mediaType', 'communicationMode', 'entityType'];

export const queryBuilderOptions: QueryBuilderOptions = {
  aggregations: Object.fromEntries(fields.map((field) => [field, { terms: { field, size: 20 } }])),
};
