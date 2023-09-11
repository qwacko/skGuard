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
	const R = <S extends RequestEvent<Partial<Record<string, string>>, U>>(
		requestData: S,
		customValidation?: (data: VReturn) => string | undefined | null
	) => {
		const isPOST = requestData.request.method === 'POST';

		if (allowList && allowList.includes(requestData.route.id)) {
			return requestData;
		}

		if (blockList && blockList.includes(requestData.route.id)) {
			if (defaultBlockTarget && !isPOST) {
				redirectFunc(302, defaultBlockTarget);
				return requestData;
			} else {
				errorFunc(400, routeNotFoundMessage);
				return requestData;
			}
		}

		const currentRouteConfig = routeConfig[requestData.route.id];

		if (!currentRouteConfig) {
			if (defaultAllow) {
				return requestData;
			} else if (!defaultBlockTarget || isPOST) {
				errorFunc(400, routeNotFoundMessage);
				return requestData;
			} else {
				redirectFunc(302, defaultBlockTarget);
				return requestData;
			}
		}

		const validationResult = validation(requestData) as VReturn;

		const redirectTarget = currentRouteConfig.check(validationResult);
		const customValidationResult = customValidation
			? customValidation(validationResult)
			: undefined;

		if (redirectTarget && !isPOST) {
			redirectFunc(302, redirectTarget);
			return requestData;
		}

		if (customValidationResult && !isPOST) {
			redirectFunc(302, customValidationResult);
			return requestData;
		}

		if (requestData.request.method === 'POST') {
			const postCheck = currentRouteConfig.POSTCheck
				? requestData.url.search
					? currentRouteConfig.POSTCheck[requestData.url.search.replace('?/', '')]
					: currentRouteConfig.POSTCheck['default']
				: undefined;

			const defaultPostCheck = currentRouteConfig.POSTCheck
				? currentRouteConfig.POSTCheck['default']
				: undefined;

			if (!postCheck && !defaultPostCheck) {
				if (defaultAllowPOST) {
					return requestData;
				} else {
					errorFunc(400, postNotAllowedMessage);
					return requestData;
				}
			}

			const postCheckResult = postCheck
				? postCheck(validationResult)
				: defaultPostCheck
				? defaultPostCheck(validationResult)
				: undefined;

			if (postCheckResult) {
				errorFunc(400, postCheckResult);
				return requestData;
			}
		}

		return requestData;
	};
	return R;
};
