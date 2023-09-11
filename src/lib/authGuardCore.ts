import type { RouteConfigObjectType } from './authGuardTypes.js';

type CoreReturnType =
	| { type: 'redirect'; redirectAddress: string }
	| { type: 'error'; errorMessage: string }
	| { type: 'authorised' };

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
	customValidation: (input: ValidType) => string | undefined;
}): CoreReturnType => {
	if (allowList && allowList.includes(routeId)) {
		return { type: 'authorised' };
	}

	if (blockList && blockList.includes(routeId)) {
		if (defaultBlockTarget && !isPOST) {
			return { type: 'redirect', redirectAddress: defaultBlockTarget };
		} else {
			return { type: 'error', errorMessage: routeNotFoundMessage };
		}
	}

	const currentRouteConfig = routeConfig[routeId];

	if (!currentRouteConfig) {
		if (defaultAllow) {
			return { type: 'authorised' };
		} else if (!defaultBlockTarget || isPOST) {
			return { type: 'error', errorMessage: routeNotFoundMessage };
		} else {
			return { type: 'redirect', redirectAddress: defaultBlockTarget };
		}
	}

	const validationResult = validation;

	const redirectTarget = currentRouteConfig.check(validationResult);
	const customValidationResult = customValidation ? customValidation(validationResult) : undefined;

	if (customValidationResult && !isPOST) {
		return { type: 'redirect', redirectAddress: customValidationResult };
	}

	if (redirectTarget && !isPOST) {
		return { type: 'redirect', redirectAddress: redirectTarget };
	}

	if (isPOST) {
		const postCheck = currentRouteConfig.POSTCheck
			? urlSearch
				? currentRouteConfig.POSTCheck[urlSearch.replace('?/', '')]
				: currentRouteConfig.POSTCheck['default']
			: undefined;

		const defaultPostCheck = currentRouteConfig.POSTCheck
			? currentRouteConfig.POSTCheck['default']
			: undefined;

		if (!postCheck && !defaultPostCheck) {
			if (defaultAllowPOST) {
				return { type: 'authorised' };
			} else {
				return { type: 'error', errorMessage: postNotAllowedMessage };
			}
		}

		const postCheckResult = postCheck
			? postCheck(validationResult)
			: defaultPostCheck
			? defaultPostCheck(validationResult)
			: undefined;

		if (postCheckResult) {
			return { type: 'error', errorMessage: postCheckResult };
		}
	}

	return { type: 'authorised' };
};
