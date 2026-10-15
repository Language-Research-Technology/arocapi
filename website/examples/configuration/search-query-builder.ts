import { OpensearchQueryBuilder, type Options, type SearchCapability } from 'arocapi';

class LabelledQueryBuilder extends OpensearchQueryBuilder {
  searchCapabilities(): SearchCapability {
    return {
      filters: { inLanguage: { type: 'string', label: 'Language' } },
      facets: { inLanguage: { label: 'Language' } },
    };
  }
}

const queryBuilderClass: Options['queryBuilderClass'] = LabelledQueryBuilder;
