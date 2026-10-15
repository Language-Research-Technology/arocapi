import { AllPublicAccess, AllVisibleEntityFilter, AllVisibleSearchFilter, type Options } from 'arocapi';

export const guards = {
  entityVisibilityFilter: AllVisibleEntityFilter,
  searchVisibilityFilter: AllVisibleSearchFilter,
  access: AllPublicAccess,
} satisfies Partial<Options>;
