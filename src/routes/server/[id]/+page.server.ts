import { authGuard } from '../../authGuardInstance.js';

export const load = (data) => {
	authGuard(data, (prevAuth) => {
		if (!prevAuth.user || data.params.id === 'idBlocked') {
			return '/server/idAllowed';
		}
		return undefined;
	});

	return {
		routeParam: data.params.id
	};
};
