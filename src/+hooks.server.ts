import type { Handle } from '@sveltejs/kit';
import { authGuard } from './routes/authGuardInstance.js';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.route.id.startsWith('/hooks')) {
		authGuard(event as Parameters<typeof authGuard>[0]);
	}

	return await resolve(event);
};
