import { authGuard } from '../authGuardInstance.js';

export const load = (data) => {
	authGuard(data);
};
