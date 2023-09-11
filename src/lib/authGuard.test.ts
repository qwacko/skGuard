import { describe, it, expect } from 'vitest';
import { skGuard } from './authGuard.js';
import type { RequestEvent } from '@sveltejs/kit';

const defaultRequest: Request = {
	method: 'GET',
	cache: 'default',
	credentials: 'include',
	destination: '',
	headers: undefined,
	integrity: '',
	keepalive: false,
	mode: 'same-origin',
	redirect: 'error',
	referrer: '',
	referrerPolicy: '',
	signal: undefined,
	url: '',
	clone: function (): Request {
		throw new Error('Function not implemented.');
	},
	body: undefined,
	bodyUsed: false,
	arrayBuffer: function (): Promise<ArrayBuffer> {
		throw new Error('Function not implemented.');
	},
	blob: function (): Promise<Blob> {
		throw new Error('Function not implemented.');
	},
	formData: function (): Promise<FormData> {
		throw new Error('Function not implemented.');
	},
	json: function (): Promise<any> {
		throw new Error('Function not implemented.');
	},
	text: function (): Promise<string> {
		throw new Error('Function not implemented.');
	}
};

const defaultRequestEvent: RequestEvent = {
	cookies: undefined,
	fetch: undefined,
	getClientAddress: function (): string {
		throw new Error('Function not implemented.');
	},
	locals: undefined,
	params: undefined,
	platform: undefined,
	request: defaultRequest,
	route: {
		id: ''
	},
	setHeaders: function (headers: Record<string, string>): void {
		throw new Error('Function not implemented.');
	},
	url: undefined,
	isDataRequest: false,
	isSubRequest: false
};

type ValidationReturn = {
	admin: boolean;
	user: boolean;
};

const skGuardConfig = {
	routeConfig: {
		'/': {
			check: () => undefined
		},
		'/admin': {
			check: (data: ValidationReturn) => (data.admin ? undefined : data.user ? '/user' : '/login'),
			POSTCheck: {
				default: (data: ValidationReturn) =>
					data.admin ? undefined : 'Cannot access /admin?/default endpoint'
			}
		},
		'/user': {
			check: (data: ValidationReturn) => (data.admin || data.user ? undefined : '/login'),
			POSTCheck: {
				update: (data: ValidationReturn) =>
					data.admin || data.user ? undefined : 'Cannot access /user?/update endpoint',
				remove: (data: ValidationReturn) =>
					data.admin ? undefined : 'Cannot access /user/?remove endpoint'
			}
		},
		'/login': {
			check: (data: ValidationReturn) => (data.admin ? '/admin' : undefined)
		},
		'/loginOpen': {
			check: (data: ValidationReturn) => '/admin'
		},
		'/openBlocked': {
			check: (data: ValidationReturn) => undefined
		}
	},
	allowList: ['/open', '/loginOpen'],
	blockList: ['/closed', '/openBlocked'],

	validation: (): ValidationReturn => ({ admin: true, user: false }),
	redirectFunc: (
		status: 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308,
		location: string | URL
	) => {
		throw new Error(`redirectFunc - ${status} - ${location}`);
	},
	errorFunc: (status: number, body: string | { message: string }) => {
		throw new Error(`errorFunc - ${status} - ${body}`);
	}
};

const skGuardWithRoutesAndNoUser = skGuard({
	...skGuardConfig,
	validation: () => ({ admin: false, user: false })
});
const skGuardWithRoutesAndAdmin = skGuard({
	...skGuardConfig,
	validation: () => ({ admin: true, user: true })
});
const skGuardWithRoutesAndUser = skGuard({
	...skGuardConfig,
	validation: () => ({ admin: false, user: true })
});
const skGuardWithRoutesAndAllowed = skGuard({ ...skGuardConfig, defaultAllow: true });

describe('Auth Guard Testing', () => {
	it("Throws Error If Route Doesn't Exist", () => {
		expect(() =>
			skGuardWithRoutesAndAdmin({ ...defaultRequestEvent, route: { id: '/notPresent' } })
		).toThrowError('errorFunc');
	});
	it("With Default Allow, Allow Result If Route Doesn't Exist", () => {
		expect(() =>
			skGuardWithRoutesAndAllowed({ ...defaultRequestEvent, route: { id: '/notPresent' } })
		).not.toThrowError();
	});
	it('Admin can access /admin ', () => {
		expect(() =>
			skGuardWithRoutesAndAdmin({ ...defaultRequestEvent, route: { id: '/admin' } })
		).not.toThrowError();
	});
	it('Admin can access /user ', () => {
		expect(() =>
			skGuardWithRoutesAndAdmin({ ...defaultRequestEvent, route: { id: '/user' } })
		).not.toThrowError();
	});
	it('User can access /user ', () => {
		expect(() =>
			skGuardWithRoutesAndUser({ ...defaultRequestEvent, route: { id: '/user' } })
		).not.toThrowError();
	});
	it('Admin redirects from /login to /admin ', () => {
		expect(() =>
			skGuardWithRoutesAndAdmin({ ...defaultRequestEvent, route: { id: '/login' } })
		).toThrowError('redirectFunc - 302 - /admin');
	});
	it('User redirects from /admin to /user ', () => {
		expect(() =>
			skGuardWithRoutesAndUser({ ...defaultRequestEvent, route: { id: '/admin' } })
		).toThrowError('redirectFunc - 302 - /user');
	});
	it('Logged Out redirects from /admin to /login ', () => {
		expect(() =>
			skGuardWithRoutesAndNoUser({ ...defaultRequestEvent, route: { id: '/admin' } })
		).toThrowError('redirectFunc - 302 - /login');
	});
	it('Logged Out can access /login ', () => {
		expect(() =>
			skGuardWithRoutesAndNoUser({ ...defaultRequestEvent, route: { id: '/login' } })
		).not.toThrowError();
	});
	it('All Users Are Blocked From Accessing openBlocked through blockedList (even through allows by route config)', () => {
		expect(() =>
			skGuardWithRoutesAndUser({ ...defaultRequestEvent, route: { id: '/openBlocked' } })
		).toThrowError('errorFunc');
		expect(() =>
			skGuardWithRoutesAndAdmin({ ...defaultRequestEvent, route: { id: '/openBlocked' } })
		).toThrowError('errorFunc');
		expect(() =>
			skGuardWithRoutesAndNoUser({ ...defaultRequestEvent, route: { id: '/openBlocked' } })
		).toThrowError('errorFunc');
	});
	it('All Users Are Allowed to Access loginOpen through allowList (even though blocked by route config)', () => {
		expect(() =>
			skGuardWithRoutesAndUser({ ...defaultRequestEvent, route: { id: '/loginOpen' } })
		).not.toThrowError();
		expect(() =>
			skGuardWithRoutesAndAdmin({ ...defaultRequestEvent, route: { id: '/loginOpen' } })
		).not.toThrowError();
		expect(() =>
			skGuardWithRoutesAndNoUser({ ...defaultRequestEvent, route: { id: '/loginOpen' } })
		).not.toThrowError();
	});
	it('All Users Are Allowed to Access /open and /', () => {
		expect(() =>
			skGuardWithRoutesAndUser({ ...defaultRequestEvent, route: { id: '/' } })
		).not.toThrowError();
		expect(() =>
			skGuardWithRoutesAndAdmin({ ...defaultRequestEvent, route: { id: '/' } })
		).not.toThrowError();
		expect(() =>
			skGuardWithRoutesAndNoUser({ ...defaultRequestEvent, route: { id: '/' } })
		).not.toThrowError();
		expect(() =>
			skGuardWithRoutesAndUser({ ...defaultRequestEvent, route: { id: '/open' } })
		).not.toThrowError();
		expect(() =>
			skGuardWithRoutesAndAdmin({ ...defaultRequestEvent, route: { id: '/open' } })
		).not.toThrowError();
		expect(() =>
			skGuardWithRoutesAndNoUser({ ...defaultRequestEvent, route: { id: '/open' } })
		).not.toThrowError();
	});
});

describe('Auth Guard Testing (POST)', () => {
	it('Admin User Can Access /admin - default enpoint', () => {
		expect(() =>
			skGuardWithRoutesAndAdmin({
				...defaultRequestEvent,
				route: { id: '/admin' },
				request: { ...defaultRequestEvent.request, method: 'POST' },
				url: { ...defaultRequestEvent.url, search: '?/anything' }
			})
		).not.toThrowError();
	});
	it('Admin User Can Access /admin - default enpoint regardless of search terms', () => {
		expect(() =>
			skGuardWithRoutesAndAdmin({
				...defaultRequestEvent,
				route: { id: '/admin' },
				request: { ...defaultRequestEvent.request, method: 'POST' },
				url: { ...defaultRequestEvent.url, search: '?/anything&this=1' }
			})
		).not.toThrowError();
		expect(() =>
			skGuardWithRoutesAndAdmin({
				...defaultRequestEvent,
				route: { id: '/admin' },
				request: { ...defaultRequestEvent.request, method: 'POST' },
				url: { ...defaultRequestEvent.url, search: '' }
			})
		).not.toThrowError();
	});
	it('User Cannot Access /admin - default enpoint', () => {
		expect(() =>
			skGuardWithRoutesAndUser({
				...defaultRequestEvent,
				route: { id: '/admin' },
				request: { ...defaultRequestEvent.request, method: 'POST' },
				url: { ...defaultRequestEvent.url, search: '?/anything' }
			})
		).toThrowError('Cannot access /admin?/default endpoint');
	});
	it('User Can Access /user?/update endpoint', () => {
		expect(() =>
			skGuardWithRoutesAndUser({
				...defaultRequestEvent,
				route: { id: '/user' },
				request: { ...defaultRequestEvent.request, method: 'POST' },
				url: { ...defaultRequestEvent.url, search: '?/update' }
			})
		).not.toThrowError();
	});
	it('User Cannot Access /user?/remove endpoint', () => {
		expect(() =>
			skGuardWithRoutesAndUser({
				...defaultRequestEvent,
				route: { id: '/user' },
				request: { ...defaultRequestEvent.request, method: 'POST' },
				url: { ...defaultRequestEvent.url, search: '?/remove' }
			})
		).toThrowError('Cannot access /user/?remove endpoint');
	});
	it('Admin Can Access all  /user endpoints that exist', () => {
		expect(() =>
			skGuardWithRoutesAndAdmin({
				...defaultRequestEvent,
				route: { id: '/user' },
				request: { ...defaultRequestEvent.request, method: 'POST' },
				url: { ...defaultRequestEvent.url, search: '?/remove' }
			})
		).not.toThrowError();
		expect(() =>
			skGuardWithRoutesAndAdmin({
				...defaultRequestEvent,
				route: { id: '/user' },
				request: { ...defaultRequestEvent.request, method: 'POST' },
				url: { ...defaultRequestEvent.url, search: '?/update' }
			})
		).not.toThrowError();
	});
	it('Admin Cannot Access a nonexistent endpoint', () => {
		expect(() =>
			skGuardWithRoutesAndAdmin({
				...defaultRequestEvent,
				route: { id: '/user' },
				request: { ...defaultRequestEvent.request, method: 'POST' },
				url: { ...defaultRequestEvent.url, search: '?/removed' }
			})
		).toThrowError('POST not allowed for this request');
	});
});
