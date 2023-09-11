import { goto } from '$app/navigation';
import { skGuard } from '$lib/authGuard.js';

export const {
	backend: authGuard,
	frontend: authGuardFrontend,
	clientLoad: authGuardClientLoad
} = skGuard({
	routeConfig: {
		'/': {
			check: () => undefined
		},

		'/clientLoad/blocked': {
			check: () => '/clientLoad'
		},
		'/clientLoad': {
			check: () => undefined
		},
		'/clientLoad/home': {
			check: () => undefined
		},
		'/layout/blocked': {
			check: () => '/layout'
		},
		'/layout': {
			check: () => undefined
		},
		'/layout/home': {
			check: () => undefined
		},
		'/hooks/blocked': {
			check: () => '/hooks'
		},
		'/hooks': {
			check: () => undefined
		},
		'/hooks/home': {
			check: () => undefined
		},
		'/server/blocked': {
			check: () => '/server'
		},
		'/server': {
			check: () => undefined
		},
		'/server/home': {
			check: () => undefined
		},
		'/server/[id]': {
			check: () => undefined
		}
	},
	validationBackend: () => ({ user: true }),
	redirectFuncFrontend: (status, location) => goto(location),
	errorFuncFrontend: (status, body) => console.log('Auth Error : ', { status, body })
});
