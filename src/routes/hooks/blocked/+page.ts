import { authGuardClientLoad } from '../../authGuardInstance.js';

export const load = (data) => {
	authGuardClientLoad(data);

	return {};
};
