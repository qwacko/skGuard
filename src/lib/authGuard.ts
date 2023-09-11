import { error, redirect, type RequestEvent } from '@sveltejs/kit';

export type allowedFunction<UserValidationOutput extends Record<string, boolean | string>> = (
	data: UserValidationOutput
) => string | undefined | null;

export type RouteConfig<UserValidationOutput extends Record<string, boolean | string>> = {
	check: allowedFunction<UserValidationOutput>;
	POSTCheck?: Record<string, allowedFunction<UserValidationOutput>>;
};

export type RouteConfigObjectType<UserValidationOutput extends Record<string, boolean | string>> = {
	[key: string]: RouteConfig<UserValidationOutput>;
};

type CoreReturnType =
	| { type: 'redirect'; redirectAddress: string }
	| { type: 'error'; errorMessage: string }
	| { type: 'authorised' };

const skGuardCore = <ValidType extends Record<string, boolean | string>>({
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

	if (redirectTarget && !isPOST) {
		return { type: 'redirect', redirectAddress: redirectTarget };
	}

	if (customValidationResult && !isPOST) {
		return { type: 'redirect', redirectAddress: customValidationResult };
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

export const skGuard = <
	VType extends (
		data: RequestEvent<Partial<Record<string, string>>, U>
	) => Record<string, string | boolean>,
	VReturn extends ReturnType<VType>,
	AllowList extends string[],
	BlockList extends string[],
	T extends RouteConfigObjectType<VReturn>,
	U extends (keyof T & string) | AllowList[0] | BlockList[0]
>({
	routeConfig,
	validation,
	allowList,
	blockList,
	defaultAllow = false,
	defaultBlockTarget,
	routeNotFoundMessage = 'No route config found for this route.',
	defaultAllowPOST = false,
	postNotAllowedMessage = 'POST not allowed for this request.',
	redirectFunc = (status, location) => {
		throw redirect(status, location);
	},
	errorFunc = (status, body) => {
		throw error(status, body);
	}
}: {
	routeConfig: T;
	validation: VType;
	allowList?: AllowList;
	blockList?: BlockList;
	defaultAllow?: boolean;
	defaultBlockTarget?: string;
	routeNotFoundMessage?: string;
	defaultAllowPOST?: boolean;
	postNotAllowedMessage?: string;
	redirectFunc?(
		status: 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308,
		location: string | URL
	): any;
	errorFunc?: (status: number, body: string | { message: string }) => any;
}) => {
	const BackendValidation = <S extends RequestEvent<Partial<Record<string, string>>, U>>(
		requestData: S,
		customValidation?: (data: VReturn) => string | undefined | null
	) => {
		const validationResults = skGuardCore({
			allowList,
			blockList,
			defaultAllow,
			defaultBlockTarget,
			isPOST: requestData.request.method === 'POST',
			routeConfig,
			routeId: requestData.route.id,
			validation: validation(requestData) as VReturn,
			routeNotFoundMessage,
			customValidation,
			urlSearch: requestData.url?.search,
			defaultAllowPOST,
			postNotAllowedMessage
		});

		if (validationResults.type === 'authorised') return requestData;
		else if (validationResults.type === 'error') {
			errorFunc(400, validationResults.errorMessage);
		} else if (validationResults.type === 'redirect') {
			redirectFunc(302, validationResults.redirectAddress);
		}

		return requestData;
	};
	return BackendValidation;
};
