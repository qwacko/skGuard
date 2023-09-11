import { error, redirect, type Page, type RequestEvent } from '@sveltejs/kit';
import type { RouteConfigObjectType } from './authGuardTypes.js';
import { authGuardCore } from './authGuardCore.js';

export const skGuardFrontEnd = <
	VType extends (data: Page<Record<string, string>, string>) => Record<string, string | boolean>,
	VReturn extends ReturnType<VType>,
	AllowList extends string[],
	BlockList extends string[],
	T extends RouteConfigObjectType<VReturn>
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
	const FrontendValidation = <S extends Page<Record<string, string>, string>>(
		requestData: S,
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
	return FrontendValidation;
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
		const validationResults = authGuardCore({
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
