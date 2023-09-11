import { authGuardCore } from './authGuardCore.js';
import { expect, describe, it } from 'vitest';

describe('authGuardCore', () => {
	// Base configuration for tests
	const baseConfig = {
		allowList: [],
		blockList: [],
		defaultAllow: true,
		defaultAllowPOST: true,
		defaultBlockTarget: '/default',
		routeNotFoundMessage: 'Route not found',
		postNotAllowedMessage: 'POST not allowed',
		isPOST: false,
		routeId: 'testRoute',
		urlSearch: undefined,
		validation: {},
		routeConfig: {},
		customValidation: () => undefined
	};

	it('should return authorised when routeId is in allowList', () => {
		const result = authGuardCore({
			...baseConfig,
			allowList: ['testRoute']
		});
		expect(result).toEqual({ type: 'authorised' });
	});

	it('should redirect when routeId is in blockList and not a POST request', () => {
		const result = authGuardCore({
			...baseConfig,
			blockList: ['testRoute']
		});
		expect(result).toEqual({ type: 'redirect', redirectAddress: '/default' });
	});

	it('should return error when routeId is in blockList and is a POST request', () => {
		const result = authGuardCore({
			...baseConfig,
			blockList: ['testRoute'],
			isPOST: true
		});
		expect(result).toEqual({ type: 'error', errorMessage: 'Route not found' });
	});

	it('should return authorised when currentRouteConfig is missing and defaultAllow is true', () => {
		const result = authGuardCore(baseConfig);
		expect(result).toEqual({ type: 'authorised' });
	});

	it('should redirect when currentRouteConfig is missing, defaultAllow is false, and not a POST request', () => {
		const result = authGuardCore({
			...baseConfig,
			defaultAllow: false
		});
		expect(result).toEqual({ type: 'redirect', redirectAddress: '/default' });
	});

	it('should return error when currentRouteConfig is missing, defaultAllow is false, and is a POST request', () => {
		const result = authGuardCore({
			...baseConfig,
			defaultAllow: false,
			isPOST: true
		});
		expect(result).toEqual({ type: 'error', errorMessage: 'Route not found' });
	});

	// Assuming a mock routeConfig for the next tests
	const mockRouteConfig = {
		testRoute: {
			check: () => '/redirectFromCheck',
			POSTCheck: {
				default: () => 'POST error message'
			}
		}
	};

	it('should redirect to redirectTarget when it exists and not a POST request', () => {
		const result = authGuardCore({
			...baseConfig,
			routeConfig: mockRouteConfig
		});
		expect(result).toEqual({ type: 'redirect', redirectAddress: '/redirectFromCheck' });
	});

	it('should redirect to customValidationResult when it exists and not a POST request', () => {
		const result = authGuardCore({
			...baseConfig,
			routeConfig: mockRouteConfig,
			customValidation: () => '/redirectFromCustomValidation'
		});
		expect(result).toEqual({ type: 'redirect', redirectAddress: '/redirectFromCustomValidation' });
	});

	it('should return error from postCheckResult when isPOST is true', () => {
		const result = authGuardCore({
			...baseConfig,
			routeConfig: mockRouteConfig,
			isPOST: true
		});
		expect(result).toEqual({ type: 'error', errorMessage: 'POST error message' });
	});
});
