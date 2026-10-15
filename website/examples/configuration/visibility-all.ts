import { AllVisibleEntityFilter, AllVisibleSearchFilter, type Options } from 'arocapi';

const visibility: Pick<Options, 'entityVisibilityFilter' | 'searchVisibilityFilter'> = {
  entityVisibilityFilter: AllVisibleEntityFilter,
  searchVisibilityFilter: AllVisibleSearchFilter,
};
