import { OpensearchQueryBuilder, type Options } from 'arocapi';

class ArchiveQueryBuilder extends OpensearchQueryBuilder {
  override buildQuery(...args: Parameters<OpensearchQueryBuilder['buildQuery']>) {
    const { bool } = super.buildQuery(...args);

    return {
      bool: {
        ...bool,
        should: [{ term: { entityType: { value: 'http://pcdm.org/models#Collection', boost: 2 } } }],
      },
    };
  }

  override buildSort(...args: Parameters<OpensearchQueryBuilder['buildSort']>) {
    const sort = super.buildSort(...args);

    return sort && [...sort, { id: 'asc' as const }];
  }

  override searchCapabilities() {
    const capabilities = super.searchCapabilities();
    capabilities.facets.entityType = { label: 'Type' };
    capabilities.facets.inLanguage = { label: 'Language' };

    return capabilities;
  }
}

export const searchOptions: Pick<Options, 'queryBuilderClass' | 'queryBuilderOptions'> = {
  queryBuilderClass: ArchiveQueryBuilder,
};
