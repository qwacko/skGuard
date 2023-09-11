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
		}
	},
	validationBackend: () => ({ user: true }),
	validationClientLoad: () => ({ user: true }),
	redirectFuncFrontend: (status, location) => goto(location)
});
