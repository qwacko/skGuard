import {
	error,
	redirect,
	type Page,
	type RequestEvent,
	type LoadEvent,
	type NumericRange
} from '@sveltejs/kit';
import type { RouteConfigObjectType } from './authGuardTypes.js';
import { authGuardCore } from './authGuardCore.js';

/**
 * Creates an authentication guard for SvelteKit applications.
 *
 * @template VTypeBackend - Type of the backend validation function
 * @template VReturn - Return type of the validation function
 * @template AllowList - Array of route paths that are always allowed
 * @template BlockList - Array of route paths that are always blocked
 * @template T - Route configuration object type
 * @template U - Union of route paths and allowed/blocked paths
 *
 * @example
 * ```typescript
 * const { backend, frontend, clientLoad } = skGuard({
 *   routeConfig: {
 *     '/protected': {
 *       check: ({user}) => user ? undefined : '/login',
 *       POSTCheck: {
 *         'create': ({user}) => user.isAdmin ? undefined : 'Admin only'
 *       }
 *     }
 *   },
 *   validationBackend: (event) => ({
 *     user: event.locals.user
 *   }),
 *   allowList: ['/login', '/public'],
 *   defaultBlockTarget: '/login'
 * });
 * ```
 */
export const skGuard = <
	VTypeBackend extends (
		data: RequestEvent<Partial<Record<string, string>>, U>
	) => Record<string, string | boolean>,
	VReturn extends ReturnType<VTypeBackend>,
	AllowList extends string[],
	BlockList extends string[],
	T extends RouteConfigObjectType<VReturn>,
	U extends (keyof T & string) | AllowList[0] | BlockList[0]
>({
	routeConfig,
	validationBackend,
	allowList,
	blockList,
	defaultAllow = false,
	defaultBlockTarget,
	routeNotFoundMessage = 'No route config found for this route.',
	defaultAllowPOST = false,
	postNotAllowedMessage = 'POST not allowed for this request.',
	redirectFuncBackend = (status, location) => {
		redirect(status, location);
	},
	errorFuncBackend = (status, body) => {
		error(status, body);
	},
	redirectFuncFrontend = (status, location) => {
		console.log('Redirect Function : ', { status, location });
	},
	errorFuncFrontend = (status, body) => {
		console.log('Error Function : ', { status, body });
	}
}: {
	/** Configuration object defining checks for each route */
	routeConfig: T;
	/** Function to produce validation data from request events */
	validationBackend: VTypeBackend;
	/** List of routes that should always be allowed */
	allowList?: AllowList;
	/** List of routes that should always be blocked */
	blockList?: BlockList;
	/** Default behavior when a route is not found in config */
	defaultAllow?: boolean;
	/** Default redirect target when route is blocked */
	defaultBlockTarget?: string;
	/** Error message when route is not found in config */
	routeNotFoundMessage?: string;
	/** Default behavior for POST requests */
	defaultAllowPOST?: boolean;
	/** Error message for disallowed POST requests */
	postNotAllowedMessage?: string;
	/** Custom redirect function for backend */
	redirectFuncBackend?(status: NumericRange<300, 308>, location: string | URL): any;
	/** Custom error function for backend */
	errorFuncBackend?(status: NumericRange<400, 599>, body: string | { message: string }): any;
	/** Custom redirect function for frontend */
	redirectFuncFrontend?(status: number, location: string | URL): any;
	/** Custom error function for frontend */
	errorFuncFrontend?(status: number, body: string | { message: string }): any;
}) => {
	/**
	 * Frontend validation function for use in +layout.svelte or +page.svelte
	 * @param page - SvelteKit page object
	 * @param validation - Validation data for the current request
	 * @param customValidation - Optional custom validation function
	 */
	const FrontendValidation = (
		page: Page<Record<string, string>, null | string>,
		validation: VReturn,
		customValidation?: (data: VReturn) => string | undefined | null
	) => {
		const validationResults = authGuardCore({
			allowList,
			blockList,
			defaultAllow,
			defaultBlockTarget,
			isPOST: false,
			routeConfig,
			routeId: page.route.id,
			validation,
			routeNotFoundMessage,
			customValidation,
			urlSearch: page.url?.search,
			defaultAllowPOST,
			postNotAllowedMessage
		});

		if (validationResults.type === 'authorised') return page;
		else if (validationResults.type === 'error') {
			errorFuncFrontend(400, validationResults.errorMessage);
		} else if (validationResults.type === 'redirect') {
			redirectFuncFrontend(302, validationResults.redirectAddress);
		}

		return page;
	};

	/**
	 * Backend validation function for use in hooks.server.ts or +page.server.ts
	 * @param requestData - SvelteKit request event
	 * @param customValidation - Optional custom validation function
	 */
	const BackendValidation = <S extends RequestEvent<Partial<Record<string, string>>, U>>(
		requestData: S,
		customValidation?: (data: VReturn) => string | undefined | null
	) => {
		const validationResults = authGuardCore({
			allowList,
			blockList,
			defaultAllow,
			defaultBlockTarget,
			isPOST: requestData.request.method === 'POST',
			routeConfig,
			routeId: requestData.route.id,
			validation: validationBackend(requestData) as VReturn,
			routeNotFoundMessage,
			customValidation,
			urlSearch: requestData.url?.search,
			defaultAllowPOST,
			postNotAllowedMessage
		});

		if (validationResults.type === 'authorised') return requestData;
		else if (validationResults.type === 'error') {
			errorFuncBackend(400, validationResults.errorMessage);
		} else if (validationResults.type === 'redirect') {
			redirectFuncBackend(302, validationResults.redirectAddress);
		}

		return requestData;
	};

	/**
	 * Client-side load function validation for use in +page.ts
	 * @param requestData - SvelteKit load event
	 * @param validation - Validation data for the current request
	 * @param customValidation - Optional custom validation function
	 */
	const ClientLoadValidation = <
		S extends LoadEvent<Record<string, string>, Record<string, unknown>, Record<string, unknown>, U>
	>(
		requestData: S,
		validation: VReturn,
		customValidation?: (data: VReturn) => string | undefined | null
	) => {
		const validationResults = authGuardCore({
			allowList,
			blockList,
			defaultAllow,
			defaultBlockTarget,
			isPOST: false,
			routeConfig,
			routeId: requestData.route.id,
			validation,
			routeNotFoundMessage,
			customValidation,
			urlSearch: requestData.url?.search,
			defaultAllowPOST,
			postNotAllowedMessage
		});

		if (validationResults.type === 'authorised') return requestData;
		else if (validationResults.type === 'error') {
			errorFuncBackend(400, validationResults.errorMessage);
		} else if (validationResults.type === 'redirect') {
			redirectFuncBackend(302, validationResults.redirectAddress);
		}

		return requestData;
	};

	return {
		backend: BackendValidation,
		frontend: FrontendValidation,
		clientLoad: ClientLoadValidation
	};
};
