import type { BaseEntity } from '../transformers/default.js';
import type { RequestContext } from './context.js';

/**
 * What a request may read of a visible entity: its Metadata and, for files, its Content
 * Authorisation URLs point to where access can be requested and are only meaningful when the flag is false
 */
export type AccessInfo = {
  metadata: boolean;
  content: boolean;
  metadataAuthorizationUrl?: string;
  contentAuthorizationUrl?: string;
};

/**
 * Access function - required
 * Decides access to an entity for this request. A file's access is its file entity's access.
 * The library attaches the result to responses and enforces it on the Metadata and Content routes.
 */
export type AccessFunction = (entity: BaseEntity, context: RequestContext) => Promise<AccessInfo> | AccessInfo;
