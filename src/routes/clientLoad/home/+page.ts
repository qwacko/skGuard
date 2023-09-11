import { authGuardClientLoad } from '../../authGuardInstance.js';

export const load = (data) => {
	authGuardClientLoad(data, { user: true });

	return {};
};
