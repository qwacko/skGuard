import { error, redirect, type Page, type RequestEvent, type LoadEvent } from '@sveltejs/kit';
import type { RouteConfigObjectType } from './authGuardTypes.js';
import { authGuardCore } from './authGuardCore.js';

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
		throw redirect(status, location);
	},
	errorFuncBackend = (status, body) => {
		throw error(status, body);
	},
	redirectFuncFrontend = (status, location) => {
		console.log('Redirect Function : ', { status, location });
	},
	errorFuncFrontend = (status, body) => {
		console.log('Error Function : ', { status, body });
	}
}: {
	routeConfig: T;
	validationBackend: VTypeBackend;
	allowList?: AllowList;
	blockList?: BlockList;
	defaultAllow?: boolean;
	defaultBlockTarget?: string;
	routeNotFoundMessage?: string;
	defaultAllowPOST?: boolean;
	postNotAllowedMessage?: string;
	redirectFuncBackend?(
		status: 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308,
		location: string | URL
	): any;
	errorFuncBackend?: (status: number, body: string | { message: string }) => any;
	redirectFuncFrontend?(
		status: 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308,
		location: string | URL
	): any;
	errorFuncFrontend?: (status: number, body: string | { message: string }) => any;
}) => {
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
