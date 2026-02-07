import { API_TAG_METADATA } from '../constants';

/**
 * OpenAPI tag for this controller. All routes on the controller will show under this tag in the docs.
 * @ApiTag('Auth') or @ApiTag('Auth', 'Users') for multiple tags.
 */
export function ApiTag(...tags: string[]): ClassDecorator {
	return (target: object) => {
		Reflect.defineMetadata(API_TAG_METADATA, tags, target);
	};
}
