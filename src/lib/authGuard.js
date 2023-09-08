const { error, redirect } = require('@sveltejs/kit');

/**
 * @typedef {import('@sveltejs/kit').RequestEvent} RequestEvent
 */

/**
 * @template UserValidationOutput
 * @typedef {Object} RouteConfig
 * @property {(data: UserValidationOutput) => (string | undefined | null)} check
 * @property {Object.<string, (data: UserValidationOutput) => (string | undefined | null)>} [POSTCheck]
 */

/**
 * @template VReturn
 * @typedef {Object.<string, RouteConfig<VReturn>>} RouteConfigObjectType
 */

/**
 *  The `skGuard` function provides a mechanism to guard routes based on custom validation logic.
 * It takes in a configuration object that defines route-specific checks, a validation function, and other optional parameters.
 * The function returns another function that, when invoked with a request event, determines if access should be granted or denied.
 * If access is denied, it can either redirect the user to another route or throw an error.
 *
 * @template VType
 * @template VReturn
 * @template AllowList
 * @template BlockList
 * @template T
 * @template U
 * @param {Object} params
 * @param {T} params.routeConfig
 * @param {VType} params.validation
 * @param {AllowList} [params.allowList]
 * @param {BlockList} [params.blockList]
 * @param {boolean} [params.defaultAllow=false]
 * @param {string} [params.defaultBlockTarget]
 * @param {string} [params.routeNotFoundMessage='No route config found for this route.']
 * @param {boolean} [params.defaultAllowPOST=false]
 * @param {string} [params.postNotAllowedMessage='POST not allowed for this request.']
 * @returns {(requestData: RequestEvent<Partial<Record<string, string>>, U>, customValidation?: (data: VReturn) => string | undefined | null) => any}
 */
const skGuard = ({
	routeConfig,
	validation,
	allowList,
	blockList,
	defaultAllow = false,
	defaultBlockTarget,
	routeNotFoundMessage = 'No route config found for this route.',
	defaultAllowPOST = false,
	postNotAllowedMessage = 'POST not allowed for this request.'
}) => {
	const R = (requestData, customValidation) => {
		if (allowList && allowList.includes(requestData.route.id)) {
			return requestData;
		}

		if (blockList && blockList.includes(requestData.route.id)) {
			if (defaultBlockTarget) {
				throw redirect(302, defaultBlockTarget);
			} else {
				throw error(400, routeNotFoundMessage);
			}
		}

		const currentRouteConfig = routeConfig[requestData.route.id];

		if (!currentRouteConfig) {
			if (defaultAllow) {
				return requestData;
			} else if (!defaultBlockTarget) {
				throw error(400, routeNotFoundMessage);
			} else {
				throw redirect(302, defaultBlockTarget);
			}
		}

		const validationResult = validation(requestData);

		const redirectTarget = currentRouteConfig.check(validationResult);
		const customValidationResult = customValidation
			? customValidation(validationResult)
			: undefined;

		if (redirectTarget) {
			throw redirect(302, redirectTarget);
		}

		if (customValidationResult) {
			throw redirect(302, customValidationResult);
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
					throw error(400, postNotAllowedMessage);
				}
			}

			const postCheckResult = postCheck
				? postCheck(validationResult)
				: defaultPostCheck
				? defaultPostCheck(validationResult)
				: undefined;

			if (postCheckResult) {
				throw error(400, postCheckResult);
			}
		}

		return requestData;
	};
	return R;
};

export default skGuard;
