import type { RouteConfigObjectType, CoreAuthResult } from './authGuardTypes.js';
import { AuthGuardErrorCode } from './authGuardTypes.js';

/**
 * Checks if a route is in the allow or block lists
 * @returns CoreAuthResult indicating if access is allowed, blocked, or needs further validation
 */
function checkAllowBlockLists(params: {
	routeId: string;
	allowList: string[];
	blockList: string[];
	defaultBlockTarget: string;
	isPOST: boolean;
	routeNotFoundMessage: string;
}): CoreAuthResult | null {
	const { routeId, allowList, blockList, defaultBlockTarget, isPOST, routeNotFoundMessage } =
		params;

	if (allowList?.includes(routeId)) {
		return { type: 'authorised' };
	}

	if (blockList?.includes(routeId)) {
		if (defaultBlockTarget && !isPOST) {
			return { type: 'redirect', redirectAddress: defaultBlockTarget };
		}
		return {
			type: 'error',
			errorMessage: routeNotFoundMessage,
			code: AuthGuardErrorCode.ACCESS_DENIED
		};
	}

	return null;
}

/**
 * Validates a route against its configuration
 * @returns CoreAuthResult indicating if access is allowed or denied
 */
function validateRoute<ValidType extends Record<string, boolean | string>>(params: {
	routeConfig: RouteConfigObjectType<ValidType>;
	routeId: string;
	validation: ValidType;
	customValidation?: (data: ValidType) => string | undefined | null;
	isPOST: boolean;
}): CoreAuthResult | null {
	const { routeConfig, routeId, validation, customValidation, isPOST } = params;
	const currentRouteConfig = routeConfig[routeId];

	if (!currentRouteConfig) {
		return null;
	}

	// Skip route validation for POST requests as they'll be handled separately
	if (isPOST) {
		return null;
	}

	const customValidationResult = customValidation?.(validation);
	if (customValidationResult) {
		return { type: 'redirect', redirectAddress: customValidationResult };
	}

	const redirectTarget = currentRouteConfig.check(validation);
	if (redirectTarget) {
		return { type: 'redirect', redirectAddress: redirectTarget };
	}

	return { type: 'authorised' };
}

/**
 * Handles POST request validation
 * @returns CoreAuthResult indicating if the POST request is allowed or denied
 */
function handlePostRequest<ValidType extends Record<string, boolean | string>>(params: {
	routeConfig: RouteConfigObjectType<ValidType>;
	routeId: string;
	validation: ValidType;
	urlSearch?: string;
	defaultAllowPOST: boolean;
	postNotAllowedMessage: string;
}): CoreAuthResult {
	const { routeConfig, routeId, validation, urlSearch, defaultAllowPOST, postNotAllowedMessage } =
		params;
	const currentRouteConfig = routeConfig[routeId];

	if (!currentRouteConfig?.POSTCheck) {
		return defaultAllowPOST
			? { type: 'authorised' }
			: {
					type: 'error',
					errorMessage: postNotAllowedMessage,
					code: AuthGuardErrorCode.POST_NOT_ALLOWED
				};
	}

	const postCheck = urlSearch
		? currentRouteConfig.POSTCheck[urlSearch.replace('?/', '')]
		: currentRouteConfig.POSTCheck['default'];

	const defaultPostCheck = currentRouteConfig.POSTCheck['default'];

	if (!postCheck && !defaultPostCheck) {
		return defaultAllowPOST
			? { type: 'authorised' }
			: {
					type: 'error',
					errorMessage: postNotAllowedMessage,
					code: AuthGuardErrorCode.POST_NOT_ALLOWED
				};
	}

	const postCheckResult = postCheck?.(validation) ?? defaultPostCheck?.(validation);

	if (postCheckResult) {
		return {
			type: 'error',
			errorMessage: postCheckResult,
			code: AuthGuardErrorCode.ACCESS_DENIED
		};
	}

	return { type: 'authorised' };
}

/**
 * Core authentication guard logic that validates routes and POST requests
 * @returns CoreAuthResult indicating if access is allowed, blocked, or needs redirection
 */
export const authGuardCore = <ValidType extends Record<string, boolean | string>>({
	allowList,
	blockList,
	defaultAllow,
	defaultBlockTarget,
	defaultAllowPOST,
	isPOST,
	routeId,
	urlSearch,
	validation,
	routeConfig,
	routeNotFoundMessage,
	postNotAllowedMessage,
	customValidation
}: {
	allowList: string[];
	blockList: string[];
	defaultAllow: boolean;
	defaultAllowPOST: boolean;
	defaultBlockTarget: string;
	routeNotFoundMessage: string;
	postNotAllowedMessage: string;
	isPOST: boolean;
	routeId: string;
	urlSearch: string | undefined;
	validation: ValidType;
	routeConfig: RouteConfigObjectType<ValidType>;
	customValidation?: (input: ValidType) => string | undefined;
}): CoreAuthResult => {
	// Check allow/block lists first
	const listResult = checkAllowBlockLists({
		routeId,
		allowList,
		blockList,
		defaultBlockTarget,
		isPOST,
		routeNotFoundMessage
	});
	if (listResult) return listResult;

	// Handle missing route configuration
	if (!routeConfig[routeId]) {
		if (defaultAllow) {
			return { type: 'authorised' };
		}
		return defaultBlockTarget && !isPOST
			? { type: 'redirect', redirectAddress: defaultBlockTarget }
			: {
					type: 'error',
					errorMessage: routeNotFoundMessage,
					code: AuthGuardErrorCode.ROUTE_NOT_FOUND
				};
	}

	// Handle POST requests first if it's a POST request
	if (isPOST) {
		return handlePostRequest({
			routeConfig,
			routeId,
			validation,
			urlSearch,
			defaultAllowPOST,
			postNotAllowedMessage
		});
	}

	// Validate route for non-POST requests
	const routeResult = validateRoute({
		routeConfig,
		routeId,
		validation,
		customValidation,
		isPOST
	});

	if (routeResult) return routeResult;

	return { type: 'authorised' };
};
